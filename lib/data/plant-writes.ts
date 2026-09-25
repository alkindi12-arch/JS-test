'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isDatabaseConfigured, getPool } from '@/lib/db/mysql';
import { lineagePath } from '@/lib/lineage/paths';
import { saveUploadedFile } from '@/lib/uploads/storage';
import type {
  ActivityStatus,
  ActivityType,
  Discipline,
  EquipmentStatus,
  Priority,
} from '@/lib/types/domain';
import type { WorkOrderStatus } from '@/lib/types/domain';

export type ActionState = {
  ok: boolean;
  error?: string;
  activityId?: string;
};

function requireDb(): ActionState | null {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: 'Database is not configured on this environment.' };
  }
  return null;
}

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function newActivityId(): string {
  return `ACT-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function newUpdateId(activityId: string): string {
  return `UPD-${activityId}-${randomBytes(2).toString('hex').toUpperCase()}`;
}

function newAttachmentId(activityId: string): string {
  return `ATT-${activityId}-${randomBytes(2).toString('hex').toUpperCase()}`;
}

const TYPES = new Set(['breakdown', 'pm', 'inspection', 'routine', 'project']);
const PRIORITIES = new Set(['low', 'medium', 'high', 'emergency']);
const CONDITIONS = new Set(['improved', 'unchanged', 'worsened']);
const EQUIPMENT_STATUSES = new Set(['running', 'standby', 'offline', 'maintenance']);
const WO_STATUSES = new Set([
  'planned',
  'released',
  'in_progress',
  'completed',
  'cancelled',
]);
const ACTIVE_ACTIVITY_STATUSES = `('open', 'in_progress', 'waiting_parts')`;

async function resolveTeam(teamIdRaw: string): Promise<{ id: number; discipline: Discipline } | null> {
  const teamId = Number(teamIdRaw);
  if (!teamId) return null;
  const [rows] = await getPool().query(
    `SELECT id, discipline FROM teams WHERE id = :id LIMIT 1`,
    { id: teamId },
  );
  const row = (rows as Array<{ id: number; discipline: string }>)[0];
  if (!row) return null;
  return { id: Number(row.id), discipline: row.discipline as Discipline };
}

async function setEquipmentStatus(opts: {
  equipmentId: string;
  nextStatus: EquipmentStatus;
  reason: string;
  notes?: string | null;
  activityId?: string | null;
  userId?: number | null;
}): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, status FROM equipment WHERE id = :id LIMIT 1`,
    { id: opts.equipmentId },
  );
  const eq = (rows as Array<{ id: string; status: EquipmentStatus }>)[0];
  if (!eq) return false;
  if (eq.status === opts.nextStatus) return false;

  await pool.query(
    `UPDATE equipment SET status = :status WHERE id = :id`,
    { id: opts.equipmentId, status: opts.nextStatus },
  );

  await pool.query(
    `
    INSERT INTO equipment_status_history (
      equipment_id, status, previous_status, reason, notes,
      activity_id, changed_by_user_id, changed_at
    ) VALUES (
      :equipmentId, :status, :previousStatus, :reason, :notes,
      :activityId, :userId, NOW()
    )
    `,
    {
      equipmentId: opts.equipmentId,
      status: opts.nextStatus,
      previousStatus: eq.status,
      reason: opts.reason,
      notes: opts.notes ?? null,
      activityId: opts.activityId ?? null,
      userId: opts.userId ?? null,
    },
  );

  return true;
}

async function maybeReleaseEquipment(
  equipmentId: string,
  activityId: string,
  userId: number | null,
): Promise<void> {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS n FROM activities
    WHERE equipment_id = :equipmentId
      AND status IN ${ACTIVE_ACTIVITY_STATUSES}
      AND id <> :activityId
    `,
    { equipmentId, activityId },
  );
  const activeOthers = Number((rows as Array<{ n: number }>)[0]?.n ?? 0);
  if (activeOthers > 0) return;

  const [eqRows] = await pool.query(
    `SELECT status FROM equipment WHERE id = :id LIMIT 1`,
    { id: equipmentId },
  );
  const current = (eqRows as Array<{ status: EquipmentStatus }>)[0]?.status;
  if (current !== 'maintenance' && current !== 'offline') return;

  await setEquipmentStatus({
    equipmentId,
    nextStatus: 'running',
    reason: 'activity_closed',
    notes: `Released after ${activityId}`,
    activityId,
    userId,
  });
}

export async function createActivityAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const session = await getSession();
  const title = str(form, 'title');
  const equipmentId = str(form, 'equipmentId');
  const type = str(form, 'type');
  const priority = str(form, 'priority');
  const teamIdRaw = str(form, 'teamId');
  const description = str(form, 'description');
  const authorFallback = str(form, 'author') || session?.name || 'Operator';

  if (!title) return { ok: false, error: 'Title is required.' };
  if (!equipmentId) return { ok: false, error: 'Equipment is required.' };
  if (!TYPES.has(type)) return { ok: false, error: 'Invalid activity type.' };
  if (!PRIORITIES.has(priority)) return { ok: false, error: 'Invalid priority.' };

  const team = await resolveTeam(teamIdRaw);
  if (!team) return { ok: false, error: 'Assigned team is required.' };

  const pool = getPool();
  const [eqRows] = await pool.query(
    `SELECT id FROM equipment WHERE id = :id LIMIT 1`,
    { id: equipmentId },
  );
  if (!(eqRows as Array<{ id: string }>).length) {
    return { ok: false, error: 'Selected equipment was not found.' };
  }

  const id = newActivityId();
  const startDate = new Date().toISOString().slice(0, 10);

  await pool.query(
    `
    INSERT INTO activities (
      id, equipment_id, title, activity_type, priority, status,
      assigned_team, assigned_team_id, start_date, opened_at,
      created_by, opened_by_user_id
    ) VALUES (
      :id, :equipmentId, :title, :type, :priority, 'open',
      :teamDiscipline, :teamId, :startDate, NOW(),
      :author, :openedBy
    )
    `,
    {
      id,
      equipmentId,
      title,
      type: type as ActivityType,
      priority: priority as Priority,
      teamDiscipline: team.discipline,
      teamId: team.id,
      startDate,
      author: authorFallback,
      openedBy: session?.id ?? null,
    },
  );

  if (description) {
    await pool.query(
      `
      INSERT INTO daily_updates (
        id, activity_id, update_date, author, updated_by_user_id,
        progress_notes, findings, condition_check, progress_pct
      ) VALUES (
        :id, :activityId, :updateDate, :author, :userId,
        :notes, NULL, 'unchanged', NULL
      )
      `,
      {
        id: newUpdateId(id),
        activityId: id,
        updateDate: startDate,
        author: authorFallback,
        userId: session?.id ?? null,
        notes: description,
      },
    );
  }

  // Breakdown / active work moves equipment into maintenance when opening
  if (type === 'breakdown' || type === 'pm' || type === 'project') {
    await setEquipmentStatus({
      equipmentId,
      nextStatus: 'maintenance',
      reason: 'activity_opened',
      notes: `Opened ${id}: ${title}`,
      activityId: id,
      userId: session?.id ?? null,
    });
  }

  revalidatePath(lineagePath('/dashboard'));
  revalidatePath(lineagePath('/activities'));
  revalidatePath(lineagePath(`/equipment/${equipmentId}`));

  redirect(lineagePath(`/activities/${id}`));
}

export async function addDailyUpdateAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const session = await getSession();
  const activityId = str(form, 'activityId');
  const notes = str(form, 'notes');
  const findings = str(form, 'findings');
  const condition = str(form, 'condition') || 'unchanged';
  const authorFallback = str(form, 'author') || session?.name || 'Technician';
  const setStatus = str(form, 'setStatus');
  const progressRaw = str(form, 'progressPct');
  const progressPct = progressRaw === '' ? null : Number(progressRaw);

  if (!activityId) return { ok: false, error: 'Activity id missing.' };
  if (!notes) return { ok: false, error: 'Progress notes are required.' };
  if (!CONDITIONS.has(condition)) return { ok: false, error: 'Invalid condition.' };
  if (progressPct != null && (Number.isNaN(progressPct) || progressPct < 0 || progressPct > 100)) {
    return { ok: false, error: 'Progress must be 0–100.' };
  }

  const pool = getPool();
  const [actRows] = await pool.query(
    `SELECT id, equipment_id, status FROM activities WHERE id = :id LIMIT 1`,
    { id: activityId },
  );
  const activity = (actRows as Array<{ id: string; equipment_id: string; status: string }>)[0];
  if (!activity) return { ok: false, error: 'Activity not found.' };

  const updateDate = new Date().toISOString().slice(0, 10);
  await pool.query(
    `
    INSERT INTO daily_updates (
      id, activity_id, update_date, author, updated_by_user_id,
      progress_notes, findings, condition_check, progress_pct
    ) VALUES (
      :id, :activityId, :updateDate, :author, :userId,
      :notes, :findings, :condition, :progressPct
    )
    `,
    {
      id: newUpdateId(activityId),
      activityId,
      updateDate,
      author: authorFallback,
      userId: session?.id ?? null,
      notes,
      findings: findings || null,
      condition,
      progressPct,
    },
  );

  let nextStatus: ActivityStatus | null = null;
  if (setStatus === 'in_progress' && activity.status === 'open') {
    nextStatus = 'in_progress';
  } else if (setStatus === 'waiting_parts') {
    nextStatus = 'waiting_parts';
  } else if (setStatus === 'completed') {
    nextStatus = 'completed';
  } else if (activity.status === 'open') {
    nextStatus = 'in_progress';
  }

  if (nextStatus) {
    await pool.query(
      `
      UPDATE activities
      SET status = :status,
          end_date = IF(:setEnd = 1, :endDate, end_date),
          closed_at = IF(:setEnd = 1, COALESCE(closed_at, NOW()), closed_at)
      WHERE id = :id
      `,
      {
        status: nextStatus,
        setEnd: nextStatus === 'completed' ? 1 : 0,
        endDate: updateDate,
        id: activityId,
      },
    );

    if (nextStatus === 'completed') {
      await maybeReleaseEquipment(
        activity.equipment_id,
        activityId,
        session?.id ?? null,
      );
    }
  }

  revalidatePath(lineagePath('/dashboard'));
  revalidatePath(lineagePath('/activities'));
  revalidatePath(lineagePath(`/activities/${activityId}`));
  revalidatePath(lineagePath(`/equipment/${activity.equipment_id}`));

  redirect(lineagePath(`/activities/${activityId}`));
}

export async function markActivityCompletedAction(activityId: string): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;
  if (!activityId) return { ok: false, error: 'Activity id missing.' };

  const session = await getSession();
  const pool = getPool();
  const [actRows] = await pool.query(
    `SELECT id, equipment_id, status FROM activities WHERE id = :id LIMIT 1`,
    { id: activityId },
  );
  const activity = (actRows as Array<{ id: string; equipment_id: string; status: string }>)[0];
  if (!activity) return { ok: false, error: 'Activity not found.' };
  if (activity.status === 'closed') {
    return { ok: false, error: 'Activity is already closed.' };
  }

  const endDate = new Date().toISOString().slice(0, 10);
  await pool.query(
    `
    UPDATE activities
    SET status = 'completed',
        end_date = :endDate,
        closed_at = COALESCE(closed_at, NOW())
    WHERE id = :id
    `,
    { id: activityId, endDate },
  );

  await pool.query(
    `
    INSERT INTO daily_updates (
      id, activity_id, update_date, author, updated_by_user_id,
      progress_notes, findings, condition_check, progress_pct
    ) VALUES (
      :id, :activityId, :updateDate, :author, :userId,
      :notes, NULL, 'improved', 100
    )
    `,
    {
      id: newUpdateId(activityId),
      activityId,
      updateDate: endDate,
      author: session?.name ?? 'Supervisor',
      userId: session?.id ?? null,
      notes: 'Marked completed.',
    },
  );

  await maybeReleaseEquipment(
    activity.equipment_id,
    activityId,
    session?.id ?? null,
  );

  revalidatePath(lineagePath('/dashboard'));
  revalidatePath(lineagePath('/activities'));
  revalidatePath(lineagePath(`/activities/${activityId}`));
  revalidatePath(lineagePath(`/equipment/${activity.equipment_id}`));

  redirect(lineagePath(`/activities/${activityId}`));
}

async function upsertRca(
  activityId: string,
  fields: {
    failureMode: string | null;
    rootCause: string | null;
    correctiveAction: string | null;
    verifiedByUserId: number | null;
    verify: boolean;
  },
): Promise<void> {
  await getPool().query(
    `
    INSERT INTO root_cause_analysis (
      activity_id, failure_mode, root_cause, corrective_action,
      verified_by_user_id, verified_at
    ) VALUES (
      :activityId, :failureMode, :rootCause, :correctiveAction,
      :verifiedBy, IF(:verify = 1, NOW(), NULL)
    )
    ON DUPLICATE KEY UPDATE
      failure_mode = VALUES(failure_mode),
      root_cause = VALUES(root_cause),
      corrective_action = VALUES(corrective_action),
      verified_by_user_id = IF(:verify = 1, VALUES(verified_by_user_id), verified_by_user_id),
      verified_at = IF(:verify = 1, NOW(), verified_at)
    `,
    {
      activityId,
      failureMode: fields.failureMode,
      rootCause: fields.rootCause,
      correctiveAction: fields.correctiveAction,
      verifiedBy: fields.verifiedByUserId,
      verify: fields.verify ? 1 : 0,
    },
  );

  // Keep denormalized columns in sync for older readers / reports
  await getPool().query(
    `
    UPDATE activities
    SET root_cause = :rootCause,
        corrective_action = :correctiveAction
    WHERE id = :activityId
    `,
    {
      activityId,
      rootCause: fields.rootCause,
      correctiveAction: fields.correctiveAction,
    },
  );
}

export async function saveRcaAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const session = await getSession();
  const activityId = str(form, 'activityId');
  const failureMode = str(form, 'failureMode') || null;
  const rootCause = str(form, 'rootCause') || null;
  const correctiveAction = str(form, 'correctiveAction') || null;
  const verify = str(form, 'verify') === '1';

  if (!activityId) return { ok: false, error: 'Activity id missing.' };
  if (!failureMode && !rootCause && !correctiveAction) {
    return { ok: false, error: 'Enter at least one RCA field.' };
  }

  const pool = getPool();
  const [actRows] = await pool.query(
    `SELECT id, equipment_id FROM activities WHERE id = :id LIMIT 1`,
    { id: activityId },
  );
  const activity = (actRows as Array<{ id: string; equipment_id: string }>)[0];
  if (!activity) return { ok: false, error: 'Activity not found.' };

  await upsertRca(activityId, {
    failureMode,
    rootCause,
    correctiveAction,
    verifiedByUserId: verify ? (session?.id ?? null) : null,
    verify,
  });

  revalidatePath(lineagePath(`/activities/${activityId}`));
  revalidatePath(lineagePath(`/equipment/${activity.equipment_id}`));

  redirect(lineagePath(`/activities/${activityId}`));
}

export async function closeActivityAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const session = await getSession();
  const activityId = str(form, 'activityId');
  const failureMode = str(form, 'failureMode') || null;
  const rootCause = str(form, 'rootCause') || null;
  const correctiveAction = str(form, 'correctiveAction') || null;
  const closingNotes = str(form, 'closingNotes') || null;

  if (!activityId) return { ok: false, error: 'Activity id missing.' };
  if (!rootCause) return { ok: false, error: 'Root cause is required to close.' };
  if (!correctiveAction) {
    return { ok: false, error: 'Corrective action is required to close.' };
  }

  const pool = getPool();
  const [actRows] = await pool.query(
    `SELECT id, equipment_id, status FROM activities WHERE id = :id LIMIT 1`,
    { id: activityId },
  );
  const activity = (actRows as Array<{ id: string; equipment_id: string; status: string }>)[0];
  if (!activity) return { ok: false, error: 'Activity not found.' };
  if (activity.status === 'closed') {
    return { ok: false, error: 'Activity is already closed.' };
  }

  await upsertRca(activityId, {
    failureMode,
    rootCause,
    correctiveAction,
    verifiedByUserId: session?.id ?? null,
    verify: true,
  });

  const endDate = new Date().toISOString().slice(0, 10);
  await pool.query(
    `
    UPDATE activities
    SET status = 'closed',
        end_date = COALESCE(end_date, :endDate),
        closed_at = COALESCE(closed_at, NOW()),
        closing_notes = COALESCE(:closingNotes, closing_notes)
    WHERE id = :id
    `,
    { id: activityId, endDate, closingNotes },
  );

  await pool.query(
    `
    INSERT INTO daily_updates (
      id, activity_id, update_date, author, updated_by_user_id,
      progress_notes, findings, condition_check, progress_pct
    ) VALUES (
      :id, :activityId, :updateDate, :author, :userId,
      :notes, NULL, 'improved', 100
    )
    `,
    {
      id: newUpdateId(activityId),
      activityId,
      updateDate: endDate,
      author: session?.name ?? 'Supervisor',
      userId: session?.id ?? null,
      notes: closingNotes || 'Activity closed with RCA verified.',
    },
  );

  await maybeReleaseEquipment(
    activity.equipment_id,
    activityId,
    session?.id ?? null,
  );

  revalidatePath(lineagePath('/dashboard'));
  revalidatePath(lineagePath('/activities'));
  revalidatePath(lineagePath(`/activities/${activityId}`));
  revalidatePath(lineagePath(`/equipment/${activity.equipment_id}`));

  redirect(lineagePath(`/activities/${activityId}`));
}

export async function setEquipmentStatusAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const session = await getSession();
  const equipmentId = str(form, 'equipmentId');
  const nextStatus = str(form, 'status');
  const notes = str(form, 'notes') || null;

  if (!equipmentId) return { ok: false, error: 'Equipment id missing.' };
  if (!EQUIPMENT_STATUSES.has(nextStatus)) {
    return { ok: false, error: 'Invalid equipment status.' };
  }

  const changed = await setEquipmentStatus({
    equipmentId,
    nextStatus: nextStatus as EquipmentStatus,
    reason: 'manual',
    notes,
    activityId: null,
    userId: session?.id ?? null,
  });

  if (!changed) {
    return { ok: false, error: 'Status is already set to that value.' };
  }

  revalidatePath(lineagePath('/equipment'));
  revalidatePath(lineagePath(`/equipment/${equipmentId}`));
  revalidatePath(lineagePath('/dashboard'));

  redirect(lineagePath(`/equipment/${equipmentId}`));
}

export async function attachWorkOrderAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const session = await getSession();
  const activityId = str(form, 'activityId');
  const externalRef = str(form, 'externalRef');
  const title = str(form, 'title') || null;
  const status = str(form, 'status') || 'planned';
  const plannedStart = str(form, 'plannedStart') || null;
  const plannedFinish = str(form, 'plannedFinish') || null;
  const notes = str(form, 'notes') || null;

  if (!activityId) return { ok: false, error: 'Activity id missing.' };
  if (!externalRef) return { ok: false, error: 'External WO reference is required.' };
  if (externalRef.length > 64) return { ok: false, error: 'WO reference is too long.' };
  if (!WO_STATUSES.has(status)) return { ok: false, error: 'Invalid work order status.' };

  const pool = getPool();
  const [actRows] = await pool.query(
    `SELECT id, equipment_id FROM activities WHERE id = :id LIMIT 1`,
    { id: activityId },
  );
  const activity = (actRows as Array<{ id: string; equipment_id: string }>)[0];
  if (!activity) return { ok: false, error: 'Activity not found.' };

  try {
    await pool.query(
      `
      INSERT INTO work_orders (
        activity_id, external_ref, title, status,
        planned_start, planned_finish, notes, created_by_user_id
      ) VALUES (
        :activityId, :externalRef, :title, :status,
        :plannedStart, :plannedFinish, :notes, :userId
      )
      `,
      {
        activityId,
        externalRef,
        title,
        status: status as WorkOrderStatus,
        plannedStart,
        plannedFinish,
        notes,
        userId: session?.id ?? null,
      },
    );
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      return { ok: false, error: 'That WO reference is already linked.' };
    }
    throw err;
  }

  revalidatePath(lineagePath('/activities'));
  revalidatePath(lineagePath(`/activities/${activityId}`));
  revalidatePath(lineagePath('/dashboard'));

  redirect(lineagePath(`/activities/${activityId}`));
}

export async function updateWorkOrderStatusAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const workOrderId = Number(str(form, 'workOrderId'));
  const status = str(form, 'status');
  const activityId = str(form, 'activityId');

  if (!workOrderId) return { ok: false, error: 'Work order id missing.' };
  if (!WO_STATUSES.has(status)) return { ok: false, error: 'Invalid work order status.' };
  if (!activityId) return { ok: false, error: 'Activity id missing.' };

  const pool = getPool();
  const [result] = await pool.query(
    `
    UPDATE work_orders
    SET status = :status
    WHERE id = :id AND activity_id = :activityId
    `,
    { id: workOrderId, status, activityId },
  );
  const affected = Number((result as { affectedRows?: number }).affectedRows ?? 0);
  if (!affected) return { ok: false, error: 'Work order not found.' };

  revalidatePath(lineagePath(`/activities/${activityId}`));
  revalidatePath(lineagePath('/activities'));

  redirect(lineagePath(`/activities/${activityId}`));
}

export async function uploadAttachmentAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const session = await getSession();
  const activityId = str(form, 'activityId');
  const file = form.get('file');

  if (!activityId) return { ok: false, error: 'Activity id missing.' };
  if (!(file instanceof File)) return { ok: false, error: 'Choose a file to upload.' };

  const pool = getPool();
  const [actRows] = await pool.query(
    `SELECT id, equipment_id, status FROM activities WHERE id = :id LIMIT 1`,
    { id: activityId },
  );
  const activity = (actRows as Array<{ id: string; equipment_id: string; status: string }>)[0];
  if (!activity) return { ok: false, error: 'Activity not found.' };
  if (activity.status === 'closed') {
    return { ok: false, error: 'Cannot attach files to a closed activity.' };
  }

  const saved = await saveUploadedFile({ activityId, file });
  if (!saved.ok) return { ok: false, error: saved.error };

  const originalName = file.name.slice(0, 255) || saved.storedName;
  await pool.query(
    `
    INSERT INTO attachments (
      id, activity_id, update_id, file_name, file_type, file_size,
      file_url, uploaded_by, uploaded_by_user_id
    ) VALUES (
      :id, :activityId, NULL, :fileName, :fileType, :fileSize,
      :fileUrl, :uploadedBy, :userId
    )
    `,
    {
      id: newAttachmentId(activityId),
      activityId,
      fileName: originalName,
      fileType: file.type || 'application/octet-stream',
      fileSize: saved.bytes,
      fileUrl: saved.relativeUrl,
      uploadedBy: session?.name ?? 'Operator',
      userId: session?.id ?? null,
    },
  );

  revalidatePath(lineagePath(`/activities/${activityId}`));
  revalidatePath(lineagePath(`/equipment/${activity.equipment_id}`));

  redirect(lineagePath(`/activities/${activityId}`));
}
