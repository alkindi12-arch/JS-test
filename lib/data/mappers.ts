import type {
  Activity,
  ActivityStatus,
  ActivityType,
  Area,
  Criticality,
  DailyUpdate,
  Discipline,
  Equipment,
  EquipmentStatus,
  EquipmentStatusHistoryEntry,
  Priority,
  RootCauseAnalysis,
  Unit,
  UnitType,
} from '@/lib/types/domain';

function asDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
}

function asDateTimeString(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().replace('T', ' ').slice(0, 19);
  if (typeof value === 'string') return value.slice(0, 19).replace('T', ' ');
  return null;
}

export function mapArea(row: Record<string, unknown>): Area {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : undefined,
    unitCount: Number(row.unit_count ?? 0),
    activeIssues: Number(row.active_issues ?? 0),
    criticalAlerts: Number(row.critical_alerts ?? 0),
  };
}

export function mapUnit(row: Record<string, unknown>): Unit {
  return {
    id: String(row.id),
    areaId: String(row.area_id),
    name: String(row.name),
    type: String(row.type) as UnitType,
    equipmentCount: Number(row.equipment_count ?? 0),
    activeActivities: Number(row.active_activities ?? 0),
  };
}

export function mapEquipment(row: Record<string, unknown>): Equipment {
  return {
    id: String(row.id),
    unitId: String(row.unit_id),
    tagNumber: String(row.tag_number),
    description: String(row.description),
    criticality: String(row.criticality) as Criticality,
    status: String(row.status) as EquipmentStatus,
    make: row.make ? String(row.make) : undefined,
    model: row.model ? String(row.model) : undefined,
  };
}

export function mapActivity(row: Record<string, unknown>): Activity {
  const status = String(row.status) as ActivityStatus;
  const lastUpdate = asDateString(row.last_update ?? row.updated_at ?? row.start_date);
  const startDate = asDateString(row.start_date);
  const delayedFlag = Number(row.is_delayed ?? 0) === 1;
  const waiting = status === 'waiting_parts';
  const priorityRaw = row.priority ?? row.severity;

  return {
    id: String(row.id),
    equipmentId: String(row.equipment_id),
    title: String(row.title),
    type: String(row.activity_type) as ActivityType,
    priority: String(priorityRaw) as Priority,
    status,
    team: String(row.team_discipline ?? row.assigned_team) as Discipline,
    teamId: row.assigned_team_id == null ? null : Number(row.assigned_team_id),
    startDate,
    lastUpdate,
    delayed: delayedFlag || waiting,
    openedByUserId: row.opened_by_user_id == null ? null : Number(row.opened_by_user_id),
    openedAt: asDateTimeString(row.opened_at),
    closedAt: asDateTimeString(row.closed_at),
  };
}

export function mapEquipmentStatusHistory(
  row: Record<string, unknown>,
): EquipmentStatusHistoryEntry {
  return {
    id: Number(row.id),
    equipmentId: String(row.equipment_id),
    status: String(row.status) as EquipmentStatus,
    previousStatus: row.previous_status
      ? (String(row.previous_status) as EquipmentStatus)
      : null,
    reason: row.reason ? String(row.reason) : null,
    notes: row.notes ? String(row.notes) : null,
    activityId: row.activity_id ? String(row.activity_id) : null,
    changedByUserId:
      row.changed_by_user_id == null ? null : Number(row.changed_by_user_id),
    changedByName: row.changed_by_name ? String(row.changed_by_name) : null,
    changedAt: asDateTimeString(row.changed_at) ?? '',
  };
}

export function mapRca(row: Record<string, unknown>): RootCauseAnalysis {
  return {
    id: Number(row.id),
    activityId: String(row.activity_id),
    failureMode: row.failure_mode ? String(row.failure_mode) : null,
    rootCause: row.root_cause ? String(row.root_cause) : null,
    correctiveAction: row.corrective_action ? String(row.corrective_action) : null,
    verifiedByUserId: row.verified_by_user_id == null ? null : Number(row.verified_by_user_id),
    verifiedByName: row.verified_by_name ? String(row.verified_by_name) : null,
    verifiedAt: asDateTimeString(row.verified_at),
  };
}

export function mapDailyUpdate(row: Record<string, unknown>): DailyUpdate {
  const date = asDateString(row.update_date);
  const created =
    row.created_at instanceof Date ? row.created_at.toISOString().slice(11, 16) : '';
  const author =
    (row.user_name ? String(row.user_name) : null) ||
    (row.author ? String(row.author) : 'Unknown');
  return {
    id: String(row.id),
    activityId: String(row.activity_id),
    date: created ? `${date} · ${created}` : date,
    author,
    notes: String(row.progress_notes),
    progressPct: row.progress_pct == null ? null : Number(row.progress_pct),
  };
}

export type AttachmentMeta = {
  id: string;
  activityId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
};

export function mapAttachment(row: Record<string, unknown>): AttachmentMeta {
  return {
    id: String(row.id),
    activityId: String(row.activity_id),
    fileName: String(row.file_name),
    fileType: String(row.file_type),
    fileUrl: String(row.file_url),
  };
}
