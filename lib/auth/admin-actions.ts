'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hashPassword } from '@/lib/auth/password';
import { requirePermission } from '@/lib/auth/permissions';
import { ROTATING_TEAM_ID } from '@/lib/auth/rotating';
import { getPool, isDatabaseConfigured } from '@/lib/db/mysql';
import { lineagePath } from '@/lib/lineage/paths';

export type AdminActionState = {
  ok: boolean;
  error?: string;
};

function requireDb(): AdminActionState | null {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: 'Database is not configured on this environment.' };
  }
  return null;
}

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function roleExists(roleId: number): Promise<boolean> {
  const [rows] = await getPool().query(
    `SELECT id FROM roles WHERE id = :id LIMIT 1`,
    { id: roleId },
  );
  return (rows as Array<{ id: number }>).length > 0;
}

export async function createUserAction(
  _prev: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const name = str(form, 'name');
  const email = str(form, 'email').toLowerCase();
  const phone = str(form, 'phone') || null;
  const password = String(form.get('password') ?? '');
  const roleId = Number(str(form, 'roleId'));
  const teamId = ROTATING_TEAM_ID;

  if (!name) return { ok: false, error: 'Name is required.' };
  if (!email || !isValidEmail(email)) return { ok: false, error: 'Valid email is required.' };
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }
  if (!roleId || !(await roleExists(roleId))) {
    return { ok: false, error: 'Select a valid role.' };
  }

  const passwordHash = await hashPassword(password);
  try {
    await getPool().query(
      `
      INSERT INTO users (name, email, phone, password_hash, team_id, role_id, is_active)
      VALUES (:name, :email, :phone, :passwordHash, :teamId, :roleId, 1)
      `,
      { name, email, phone, passwordHash, teamId, roleId },
    );
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return { ok: false, error: 'A user with that email already exists.' };
    }
    throw err;
  }

  revalidatePath(lineagePath('/admin'));
  redirect(lineagePath('/admin'));
}

export async function updateUserAction(
  _prev: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;
  const { session } = auth;

  const userId = Number(str(form, 'userId'));
  const name = str(form, 'name');
  const email = str(form, 'email').toLowerCase();
  const phone = str(form, 'phone') || null;
  const password = String(form.get('password') ?? '');
  const roleId = Number(str(form, 'roleId'));
  const teamId = ROTATING_TEAM_ID;
  const isActive = str(form, 'isActive') === '1';

  if (!userId) return { ok: false, error: 'User id missing.' };
  if (!name) return { ok: false, error: 'Name is required.' };
  if (!email || !isValidEmail(email)) return { ok: false, error: 'Valid email is required.' };
  if (password && password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }
  if (!roleId || !(await roleExists(roleId))) {
    return { ok: false, error: 'Select a valid role.' };
  }

  // Prevent self lock-out: cannot deactivate or demote own admin account away from Admin
  if (userId === session.id) {
    if (!isActive) {
      return { ok: false, error: 'You cannot deactivate your own account.' };
    }
    const [roleRows] = await getPool().query(
      `SELECT name FROM roles WHERE id = :id LIMIT 1`,
      { id: roleId },
    );
    const roleName = (roleRows as Array<{ name: string }>)[0]?.name;
    if (roleName !== 'Admin') {
      return { ok: false, error: 'You cannot remove Admin from your own account.' };
    }
  }

  const pool = getPool();
  const [existing] = await pool.query(
    `SELECT id FROM users WHERE id = :id LIMIT 1`,
    { id: userId },
  );
  if (!(existing as Array<{ id: number }>).length) {
    return { ok: false, error: 'User not found.' };
  }

  try {
    if (password) {
      const passwordHash = await hashPassword(password);
      await pool.query(
        `
        UPDATE users
        SET name = :name, email = :email, phone = :phone,
            team_id = :teamId, role_id = :roleId, is_active = :isActive,
            password_hash = :passwordHash
        WHERE id = :id
        `,
        {
          id: userId,
          name,
          email,
          phone,
          teamId,
          roleId,
          isActive: isActive ? 1 : 0,
          passwordHash,
        },
      );
    } else {
      await pool.query(
        `
        UPDATE users
        SET name = :name, email = :email, phone = :phone,
            team_id = :teamId, role_id = :roleId, is_active = :isActive
        WHERE id = :id
        `,
        {
          id: userId,
          name,
          email,
          phone,
          teamId,
          roleId,
          isActive: isActive ? 1 : 0,
        },
      );
    }
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return { ok: false, error: 'A user with that email already exists.' };
    }
    throw err;
  }

  revalidatePath(lineagePath('/admin'));
  revalidatePath(lineagePath(`/admin/users/${userId}`));
  redirect(lineagePath('/admin'));
}

export async function deactivateUserAction(
  _prev: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;
  const { session } = auth;

  const userId = Number(str(form, 'userId'));
  if (!userId) return { ok: false, error: 'User id missing.' };
  if (userId === session.id) {
    return { ok: false, error: 'You cannot remove your own account.' };
  }

  const [result] = await getPool().query(
    `UPDATE users SET is_active = 0 WHERE id = :id`,
    { id: userId },
  );
  const affected = Number((result as { affectedRows?: number }).affectedRows ?? 0);
  if (!affected) return { ok: false, error: 'User not found.' };

  revalidatePath(lineagePath('/admin'));
  revalidatePath(lineagePath(`/admin/users/${userId}`));
  redirect(lineagePath('/admin'));
}

export async function reactivateUserAction(
  _prev: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;

  const userId = Number(str(form, 'userId'));
  if (!userId) return { ok: false, error: 'User id missing.' };

  const [result] = await getPool().query(
    `UPDATE users SET is_active = 1 WHERE id = :id`,
    { id: userId },
  );
  const affected = Number((result as { affectedRows?: number }).affectedRows ?? 0);
  if (!affected) return { ok: false, error: 'User not found.' };

  revalidatePath(lineagePath('/admin'));
  revalidatePath(lineagePath(`/admin/users/${userId}`));
  redirect(lineagePath('/admin'));
}

export async function assignRoleAction(
  _prev: AdminActionState,
  form: FormData,
): Promise<AdminActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const auth = await requirePermission('admin');
  if (!auth.ok) return auth;
  const { session } = auth;

  const userId = Number(str(form, 'userId'));
  const roleId = Number(str(form, 'roleId'));
  if (!userId) return { ok: false, error: 'User id missing.' };
  if (!roleId || !(await roleExists(roleId))) {
    return { ok: false, error: 'Select a valid role.' };
  }

  if (userId === session.id) {
    const [roleRows] = await getPool().query(
      `SELECT name FROM roles WHERE id = :id LIMIT 1`,
      { id: roleId },
    );
    const roleName = (roleRows as Array<{ name: string }>)[0]?.name;
    if (roleName !== 'Admin') {
      return { ok: false, error: 'You cannot remove Admin from your own account.' };
    }
  }

  const [result] = await getPool().query(
    `UPDATE users SET role_id = :roleId, team_id = :teamId WHERE id = :id`,
    { id: userId, roleId, teamId: ROTATING_TEAM_ID },
  );
  const affected = Number((result as { affectedRows?: number }).affectedRows ?? 0);
  if (!affected) return { ok: false, error: 'User not found.' };

  revalidatePath(lineagePath('/admin'));
  revalidatePath(lineagePath(`/admin/users/${userId}`));
  redirect(lineagePath('/admin'));
}
