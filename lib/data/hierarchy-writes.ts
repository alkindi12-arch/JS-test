'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth/permissions';
import { getPool, isDatabaseConfigured } from '@/lib/db/mysql';
import { lineagePath } from '@/lib/lineage/paths';
import type { Criticality, EquipmentStatus, UnitType } from '@/lib/types/domain';

export type HierarchyActionState = {
  ok: boolean;
  error?: string;
};

function requireDb(): HierarchyActionState | null {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: 'Database is not configured on this environment.' };
  }
  return null;
}

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

const UNIT_TYPES = new Set(['process', 'utilities', 'offsites', 'other']);
const CRITICALITIES = new Set(['low', 'medium', 'high']);
const EQUIPMENT_STATUSES = new Set(['running', 'standby', 'offline', 'maintenance']);

/** Plant codes: A01, CDU, STM — short uppercase alphanumerics */
function normalizePlantCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function isValidPlantCode(code: string): boolean {
  return /^[A-Z][A-Z0-9_-]{0,30}$/.test(code);
}

function normalizeTag(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function equipmentIdFromTag(tag: string): string {
  const bare = tag.replace(/^EQ-/i, '');
  return `EQ-${bare}`;
}

function revalidateHierarchy(paths: string[]) {
  for (const p of paths) revalidatePath(lineagePath(p));
}

// —— Areas ——

export async function createAreaAction(
  _prev: HierarchyActionState,
  form: FormData,
): Promise<HierarchyActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const id = normalizePlantCode(str(form, 'id'));
  const name = str(form, 'name');
  const description = str(form, 'description') || null;

  if (!isValidPlantCode(id)) {
    return { ok: false, error: 'Area id must start with a letter (e.g. A04).' };
  }
  if (!name) return { ok: false, error: 'Name is required.' };

  try {
    await getPool().query(
      `
      INSERT INTO areas (id, name, description, created_by, updated_by)
      VALUES (:id, :name, :description, :by, :by)
      `,
      { id, name, description, by: auth.session.name },
    );
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return { ok: false, error: 'An area with that id already exists.' };
    }
    throw err;
  }

  revalidateHierarchy(['/areas', '/dashboard', `/areas/${id}`]);
  redirect(lineagePath(`/areas/${id}`));
}

export async function updateAreaAction(
  _prev: HierarchyActionState,
  form: FormData,
): Promise<HierarchyActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const id = normalizePlantCode(str(form, 'id'));
  const name = str(form, 'name');
  const description = str(form, 'description') || null;

  if (!id) return { ok: false, error: 'Area id missing.' };
  if (!name) return { ok: false, error: 'Name is required.' };

  const [result] = await getPool().query(
    `
    UPDATE areas
    SET name = :name, description = :description, updated_by = :by
    WHERE id = :id
    `,
    { id, name, description, by: auth.session.name },
  );
  const affected = Number((result as { affectedRows?: number }).affectedRows ?? 0);
  if (!affected) return { ok: false, error: 'Area not found.' };

  revalidateHierarchy(['/areas', '/dashboard', `/areas/${id}`]);
  redirect(lineagePath(`/areas/${id}`));
}

export async function deleteAreaAction(
  _prev: HierarchyActionState,
  form: FormData,
): Promise<HierarchyActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const id = normalizePlantCode(str(form, 'id'));
  if (!id) return { ok: false, error: 'Area id missing.' };

  const pool = getPool();
  const [childRows] = await pool.query(
    `SELECT COUNT(*) AS n FROM units WHERE area_id = :id`,
    { id },
  );
  const children = Number((childRows as Array<{ n: number }>)[0]?.n ?? 0);
  if (children > 0) {
    return {
      ok: false,
      error: `Cannot remove area while it has ${children} unit(s). Remove units first.`,
    };
  }

  try {
    const [result] = await pool.query(`DELETE FROM areas WHERE id = :id`, { id });
    const affected = Number((result as { affectedRows?: number }).affectedRows ?? 0);
    if (!affected) return { ok: false, error: 'Area not found.' };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') {
      return { ok: false, error: 'Cannot remove area while it still has units.' };
    }
    throw err;
  }

  revalidateHierarchy(['/areas', '/dashboard']);
  redirect(lineagePath('/areas'));
}

// —— Units ——

export async function createUnitAction(
  _prev: HierarchyActionState,
  form: FormData,
): Promise<HierarchyActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const id = normalizePlantCode(str(form, 'id'));
  const areaId = normalizePlantCode(str(form, 'areaId'));
  const name = str(form, 'name');
  const type = str(form, 'type') || 'process';
  const description = str(form, 'description') || null;

  if (!isValidPlantCode(id)) {
    return { ok: false, error: 'Unit id must start with a letter (e.g. CDU).' };
  }
  if (!areaId) return { ok: false, error: 'Area is required.' };
  if (!name) return { ok: false, error: 'Name is required.' };
  if (!UNIT_TYPES.has(type)) return { ok: false, error: 'Invalid unit type.' };

  const pool = getPool();
  const [areaRows] = await pool.query(
    `SELECT id FROM areas WHERE id = :id LIMIT 1`,
    { id: areaId },
  );
  if (!(areaRows as Array<{ id: string }>).length) {
    return { ok: false, error: 'Selected area was not found.' };
  }

  try {
    await pool.query(
      `
      INSERT INTO units (id, area_id, name, type, description)
      VALUES (:id, :areaId, :name, :type, :description)
      `,
      { id, areaId, name, type: type as UnitType, description },
    );
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return { ok: false, error: 'A unit with that id already exists.' };
    }
    throw err;
  }

  revalidateHierarchy(['/areas', `/areas/${areaId}`, `/units/${id}`, '/dashboard']);
  redirect(lineagePath(`/units/${id}`));
}

export async function updateUnitAction(
  _prev: HierarchyActionState,
  form: FormData,
): Promise<HierarchyActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const id = normalizePlantCode(str(form, 'id'));
  const areaId = normalizePlantCode(str(form, 'areaId'));
  const name = str(form, 'name');
  const type = str(form, 'type') || 'process';
  const description = str(form, 'description') || null;

  if (!id) return { ok: false, error: 'Unit id missing.' };
  if (!areaId) return { ok: false, error: 'Area is required.' };
  if (!name) return { ok: false, error: 'Name is required.' };
  if (!UNIT_TYPES.has(type)) return { ok: false, error: 'Invalid unit type.' };

  const pool = getPool();
  const [areaRows] = await pool.query(
    `SELECT id FROM areas WHERE id = :id LIMIT 1`,
    { id: areaId },
  );
  if (!(areaRows as Array<{ id: string }>).length) {
    return { ok: false, error: 'Selected area was not found.' };
  }

  const [result] = await pool.query(
    `
    UPDATE units
    SET area_id = :areaId, name = :name, type = :type, description = :description
    WHERE id = :id
    `,
    { id, areaId, name, type: type as UnitType, description },
  );
  const affected = Number((result as { affectedRows?: number }).affectedRows ?? 0);
  if (!affected) return { ok: false, error: 'Unit not found.' };

  revalidateHierarchy(['/areas', `/areas/${areaId}`, `/units/${id}`, '/dashboard']);
  redirect(lineagePath(`/units/${id}`));
}

export async function deleteUnitAction(
  _prev: HierarchyActionState,
  form: FormData,
): Promise<HierarchyActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const id = normalizePlantCode(str(form, 'id'));
  if (!id) return { ok: false, error: 'Unit id missing.' };

  const pool = getPool();
  const [unitRows] = await pool.query(
    `SELECT id, area_id FROM units WHERE id = :id LIMIT 1`,
    { id },
  );
  const unit = (unitRows as Array<{ id: string; area_id: string }>)[0];
  if (!unit) return { ok: false, error: 'Unit not found.' };

  const [childRows] = await pool.query(
    `SELECT COUNT(*) AS n FROM equipment WHERE unit_id = :id`,
    { id },
  );
  const children = Number((childRows as Array<{ n: number }>)[0]?.n ?? 0);
  if (children > 0) {
    return {
      ok: false,
      error: `Cannot remove unit while it has ${children} equipment tag(s). Remove equipment first.`,
    };
  }

  try {
    await pool.query(`DELETE FROM units WHERE id = :id`, { id });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') {
      return { ok: false, error: 'Cannot remove unit while it still has equipment.' };
    }
    throw err;
  }

  revalidateHierarchy(['/areas', `/areas/${unit.area_id}`, '/dashboard']);
  redirect(lineagePath(`/areas/${unit.area_id}`));
}

// —— Equipment ——

export async function createEquipmentAction(
  _prev: HierarchyActionState,
  form: FormData,
): Promise<HierarchyActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const unitId = normalizePlantCode(str(form, 'unitId'));
  const tagNumber = normalizeTag(str(form, 'tagNumber'));
  const description = str(form, 'description');
  const criticality = str(form, 'criticality') || 'medium';
  const status = str(form, 'status') || 'running';
  const make = str(form, 'make') || null;
  const model = str(form, 'model') || null;
  const idRaw = str(form, 'id');
  const id = idRaw ? normalizePlantCode(idRaw) : equipmentIdFromTag(tagNumber);

  if (!unitId) return { ok: false, error: 'Unit is required.' };
  if (!tagNumber) return { ok: false, error: 'Tag number is required.' };
  if (!description) return { ok: false, error: 'Description is required.' };
  if (!CRITICALITIES.has(criticality)) return { ok: false, error: 'Invalid criticality.' };
  if (!EQUIPMENT_STATUSES.has(status)) return { ok: false, error: 'Invalid status.' };
  if (!isValidPlantCode(id) && !/^EQ-[A-Z0-9_-]+$/.test(id)) {
    return { ok: false, error: 'Invalid equipment id.' };
  }

  const pool = getPool();
  const [unitRows] = await pool.query(
    `SELECT id FROM units WHERE id = :id LIMIT 1`,
    { id: unitId },
  );
  if (!(unitRows as Array<{ id: string }>).length) {
    return { ok: false, error: 'Selected unit was not found.' };
  }

  try {
    await pool.query(
      `
      INSERT INTO equipment (
        id, unit_id, tag_number, description, make, model, criticality, status
      ) VALUES (
        :id, :unitId, :tagNumber, :description, :make, :model, :criticality, :status
      )
      `,
      {
        id,
        unitId,
        tagNumber,
        description,
        make,
        model,
        criticality: criticality as Criticality,
        status: status as EquipmentStatus,
      },
    );

    await pool.query(
      `
      INSERT INTO equipment_status_history (
        equipment_id, status, previous_status, reason, notes,
        activity_id, changed_by_user_id, changed_at
      ) VALUES (
        :equipmentId, :status, NULL, 'baseline', 'Created',
        NULL, :userId, NOW()
      )
      `,
      { equipmentId: id, status, userId: auth.session.id },
    );
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return { ok: false, error: 'That equipment id or tag already exists.' };
    }
    throw err;
  }

  revalidateHierarchy([
    '/equipment',
    `/equipment/${id}`,
    `/units/${unitId}`,
    '/dashboard',
  ]);
  redirect(lineagePath(`/equipment/${id}`));
}

export async function updateEquipmentAction(
  _prev: HierarchyActionState,
  form: FormData,
): Promise<HierarchyActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const id = str(form, 'id').trim();
  const unitId = normalizePlantCode(str(form, 'unitId'));
  const tagNumber = normalizeTag(str(form, 'tagNumber'));
  const description = str(form, 'description');
  const criticality = str(form, 'criticality') || 'medium';
  const make = str(form, 'make') || null;
  const model = str(form, 'model') || null;

  if (!id) return { ok: false, error: 'Equipment id missing.' };
  if (!unitId) return { ok: false, error: 'Unit is required.' };
  if (!tagNumber) return { ok: false, error: 'Tag number is required.' };
  if (!description) return { ok: false, error: 'Description is required.' };
  if (!CRITICALITIES.has(criticality)) return { ok: false, error: 'Invalid criticality.' };

  const pool = getPool();
  const [unitRows] = await pool.query(
    `SELECT id FROM units WHERE id = :id LIMIT 1`,
    { id: unitId },
  );
  if (!(unitRows as Array<{ id: string }>).length) {
    return { ok: false, error: 'Selected unit was not found.' };
  }

  try {
    const [result] = await pool.query(
      `
      UPDATE equipment
      SET unit_id = :unitId, tag_number = :tagNumber, description = :description,
          make = :make, model = :model, criticality = :criticality
      WHERE id = :id
      `,
      {
        id,
        unitId,
        tagNumber,
        description,
        make,
        model,
        criticality: criticality as Criticality,
      },
    );
    const affected = Number((result as { affectedRows?: number }).affectedRows ?? 0);
    if (!affected) return { ok: false, error: 'Equipment not found.' };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return { ok: false, error: 'That tag number is already in use.' };
    }
    throw err;
  }

  revalidateHierarchy([
    '/equipment',
    `/equipment/${id}`,
    `/units/${unitId}`,
    '/dashboard',
  ]);
  redirect(lineagePath(`/equipment/${id}`));
}

export async function deleteEquipmentAction(
  _prev: HierarchyActionState,
  form: FormData,
): Promise<HierarchyActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const id = str(form, 'id').trim();
  if (!id) return { ok: false, error: 'Equipment id missing.' };

  const pool = getPool();
  const [eqRows] = await pool.query(
    `SELECT id, unit_id FROM equipment WHERE id = :id LIMIT 1`,
    { id },
  );
  const eq = (eqRows as Array<{ id: string; unit_id: string }>)[0];
  if (!eq) return { ok: false, error: 'Equipment not found.' };

  const [actRows] = await pool.query(
    `SELECT COUNT(*) AS n FROM activities WHERE equipment_id = :id`,
    { id },
  );
  const activities = Number((actRows as Array<{ n: number }>)[0]?.n ?? 0);
  if (activities > 0) {
    return {
      ok: false,
      error: `Cannot remove equipment with ${activities} activity record(s).`,
    };
  }

  try {
    await pool.query(`DELETE FROM equipment_status_history WHERE equipment_id = :id`, {
      id,
    });
    await pool.query(`DELETE FROM equipment WHERE id = :id`, { id });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') {
      return { ok: false, error: 'Cannot remove equipment while related records exist.' };
    }
    throw err;
  }

  revalidateHierarchy(['/equipment', `/units/${eq.unit_id}`, '/dashboard']);
  redirect(lineagePath(`/units/${eq.unit_id}`));
}
