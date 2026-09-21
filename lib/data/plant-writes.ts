'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isDatabaseConfigured, getPool } from '@/lib/db/mysql';
import { lineagePath } from '@/lib/lineage/paths';
import type {
  ActivityStatus,
  ActivityType,
  Discipline,
  Severity,
} from '@/lib/types/domain';

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

const TYPES = new Set(['breakdown', 'pm', 'inspection', 'routine', 'project']);
const SEVERITIES = new Set(['low', 'medium', 'high', 'emergency']);
const TEAMS = new Set(['rotating', 'electrical', 'instrument', 'static', 'ops', 'vendor']);
const CONDITIONS = new Set(['improved', 'unchanged', 'worsened']);

export async function createActivityAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const blocked = requireDb();
  if (blocked) return blocked;

  const title = str(form, 'title');
  const equipmentId = str(form, 'equipmentId');
  const type = str(form, 'type');
  const severity = str(form, 'severity');
  const team = str(form, 'team');
  const description = str(form, 'description');
  const author = str(form, 'author') || 'Operator';

  if (!title) return { ok: false, error: 'Title is required.' };
  if (!equipmentId) return { ok: false, error: 'Equipment is required.' };
  if (!TYPES.has(type)) return { ok: false, error: 'Invalid activity type.' };
  if (!SEVERITIES.has(severity)) return { ok: false, error: 'Invalid severity.' };
  if (!TEAMS.has(team)) return { ok: false, error: 'Invalid team.' };

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
      id, equipment_id, title, activity_type, severity, status, assigned_team,
      start_date, created_by
    ) VALUES (
      :id, :equipmentId, :title, :type, :severity, 'open', :team,
      :startDate, :author
    )
    `,
    {
      id,
      equipmentId,
      title,
      type: type as ActivityType,
      severity: severity as Severity,
      team: team as Discipline,
      startDate,
      author,
    },
  );

  if (description) {
    await pool.query(
      `
      INSERT INTO daily_updates (
        id, activity_id, update_date, author, progress_notes, findings, condition_check
      ) VALUES (
        :id, :activityId, :updateDate, :author, :notes, NULL, 'unchanged'
      )
      `,
      {
        id: newUpdateId(id),
        activityId: id,
        updateDate: startDate,
        author,
        notes: description,
      },
    );
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

  const activityId = str(form, 'activityId');
  const notes = str(form, 'notes');
  const findings = str(form, 'findings');
  const condition = str(form, 'condition') || 'unchanged';
  const author = str(form, 'author') || 'Technician';
  const setStatus = str(form, 'setStatus');

  if (!activityId) return { ok: false, error: 'Activity id missing.' };
  if (!notes) return { ok: false, error: 'Progress notes are required.' };
  if (!CONDITIONS.has(condition)) return { ok: false, error: 'Invalid condition.' };

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
      id, activity_id, update_date, author, progress_notes, findings, condition_check
    ) VALUES (
      :id, :activityId, :updateDate, :author, :notes, :findings, :condition
    )
    `,
    {
      id: newUpdateId(activityId),
      activityId,
      updateDate,
      author,
      notes,
      findings: findings || null,
      condition,
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
          end_date = IF(:setEnd = 1, :endDate, end_date)
      WHERE id = :id
      `,
      {
        status: nextStatus,
        setEnd: nextStatus === 'completed' ? 1 : 0,
        endDate: updateDate,
        id: activityId,
      },
    );
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
    SET status = 'completed', end_date = :endDate
    WHERE id = :id
    `,
    { id: activityId, endDate },
  );

  await pool.query(
    `
    INSERT INTO daily_updates (
      id, activity_id, update_date, author, progress_notes, findings, condition_check
    ) VALUES (
      :id, :activityId, :updateDate, :author, :notes, NULL, 'improved'
    )
    `,
    {
      id: newUpdateId(activityId),
      activityId,
      updateDate: endDate,
      author: 'Supervisor',
      notes: 'Marked completed.',
    },
  );

  revalidatePath(lineagePath('/dashboard'));
  revalidatePath(lineagePath('/activities'));
  revalidatePath(lineagePath(`/activities/${activityId}`));
  revalidatePath(lineagePath(`/equipment/${activity.equipment_id}`));

  redirect(lineagePath(`/activities/${activityId}`));
}
