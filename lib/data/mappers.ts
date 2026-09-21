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
  Severity,
  Unit,
  UnitType,
} from '@/lib/types/domain';

function asDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
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

  return {
    id: String(row.id),
    equipmentId: String(row.equipment_id),
    title: String(row.title),
    type: String(row.activity_type) as ActivityType,
    severity: String(row.severity) as Severity,
    status,
    team: String(row.assigned_team) as Discipline,
    startDate,
    lastUpdate,
    delayed: delayedFlag || waiting,
  };
}

export function mapDailyUpdate(row: Record<string, unknown>): DailyUpdate {
  const date = asDateString(row.update_date);
  const created = row.created_at instanceof Date
    ? row.created_at.toISOString().slice(11, 16)
    : '';
  return {
    id: String(row.id),
    activityId: String(row.activity_id),
    date: created ? `${date} · ${created}` : date,
    author: String(row.author),
    notes: String(row.progress_notes),
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
