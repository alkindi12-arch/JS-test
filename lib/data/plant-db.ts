import { getPool } from '@/lib/db/mysql';
import {
  mapActivity,
  mapArea,
  mapAttachment,
  mapDailyUpdate,
  mapEquipment,
  mapEquipmentStatusHistory,
  mapRca,
  mapUnit,
  mapWorkOrder,
  type AttachmentMeta,
} from '@/lib/data/mappers';
import type {
  Activity,
  Area,
  DailyUpdate,
  Equipment,
  EquipmentStatusHistoryEntry,
  RootCauseAnalysis,
  Unit,
  WorkOrder,
} from '@/lib/types/domain';

type Row = Record<string, unknown>;

const ACTIVE_STATUSES = `('open', 'in_progress', 'waiting_parts')`;
/** Soft-deleted activities are hidden from lists, KPIs, and reports. */
const NOT_DELETED = `act.deleted_at IS NULL`;

export async function dbListAreas(): Promise<Area[]> {
  const [rows] = await getPool().query(`
    SELECT
      a.id,
      a.name,
      a.description,
      (SELECT COUNT(*) FROM units u WHERE u.area_id = a.id) AS unit_count,
      (
        SELECT COUNT(*)
        FROM activities act
        JOIN equipment e ON e.id = act.equipment_id
        JOIN units u ON u.id = e.unit_id
        WHERE u.area_id = a.id
          AND ${NOT_DELETED}
          AND act.status IN ${ACTIVE_STATUSES}
      ) AS active_issues,
      (
        SELECT COUNT(*)
        FROM activities act
        JOIN equipment e ON e.id = act.equipment_id
        JOIN units u ON u.id = e.unit_id
        WHERE u.area_id = a.id
          AND ${NOT_DELETED}
          AND act.status IN ${ACTIVE_STATUSES}
          AND act.priority IN ('high', 'emergency')
      ) AS critical_alerts
    FROM areas a
    ORDER BY a.id
  `);
  return (rows as Row[]).map(mapArea);
}

export async function dbGetArea(id: string): Promise<Area | null> {
  const areas = await dbListAreas();
  return areas.find((a) => a.id === id) ?? null;
}

export async function dbUnitsForArea(areaId: string): Promise<Unit[]> {
  const [rows] = await getPool().query(
    `
    SELECT
      u.id,
      u.area_id,
      u.name,
      u.type,
      u.description,
      (SELECT COUNT(*) FROM equipment e WHERE e.unit_id = u.id) AS equipment_count,
      (
        SELECT COUNT(*)
        FROM activities act
        JOIN equipment e ON e.id = act.equipment_id
        WHERE e.unit_id = u.id
          AND ${NOT_DELETED}
          AND act.status IN ${ACTIVE_STATUSES}
      ) AS active_activities
    FROM units u
    WHERE u.area_id = :areaId
    ORDER BY u.id
    `,
    { areaId },
  );
  return (rows as Row[]).map(mapUnit);
}

export async function dbGetUnit(id: string): Promise<Unit | null> {
  const [rows] = await getPool().query(
    `
    SELECT
      u.id,
      u.area_id,
      u.name,
      u.type,
      u.description,
      (SELECT COUNT(*) FROM equipment e WHERE e.unit_id = u.id) AS equipment_count,
      (
        SELECT COUNT(*)
        FROM activities act
        JOIN equipment e ON e.id = act.equipment_id
        WHERE e.unit_id = u.id
          AND ${NOT_DELETED}
          AND act.status IN ${ACTIVE_STATUSES}
      ) AS active_activities
    FROM units u
    WHERE u.id = :id
    LIMIT 1
    `,
    { id },
  );
  const list = rows as Row[];
  return list[0] ? mapUnit(list[0]) : null;
}

export async function dbListUnits(): Promise<Unit[]> {
  const [rows] = await getPool().query(
    `
    SELECT
      u.id,
      u.area_id,
      u.name,
      u.type,
      u.description,
      (SELECT COUNT(*) FROM equipment e WHERE e.unit_id = u.id) AS equipment_count,
      (
        SELECT COUNT(*)
        FROM activities act
        JOIN equipment e ON e.id = act.equipment_id
        WHERE e.unit_id = u.id
          AND ${NOT_DELETED}
          AND act.status IN ${ACTIVE_STATUSES}
      ) AS active_activities
    FROM units u
    ORDER BY u.id
    `,
  );
  return (rows as Row[]).map(mapUnit);
}

export async function dbListEquipment(): Promise<Equipment[]> {
  const [rows] = await getPool().query(`
    SELECT id, unit_id, tag_number, description, criticality, status, make, model
    FROM equipment
    ORDER BY tag_number
  `);
  return (rows as Row[]).map(mapEquipment);
}

export async function dbEquipmentForUnit(unitId: string): Promise<Equipment[]> {
  const [rows] = await getPool().query(
    `
    SELECT id, unit_id, tag_number, description, criticality, status, make, model
    FROM equipment
    WHERE unit_id = :unitId
    ORDER BY tag_number
    `,
    { unitId },
  );
  return (rows as Row[]).map(mapEquipment);
}

export async function dbGetEquipment(id: string): Promise<Equipment | null> {
  const [rows] = await getPool().query(
    `
    SELECT id, unit_id, tag_number, description, criticality, status, make, model
    FROM equipment
    WHERE id = :id
    LIMIT 1
    `,
    { id },
  );
  const list = rows as Row[];
  return list[0] ? mapEquipment(list[0]) : null;
}

const ACTIVITY_SELECT = `
  SELECT
    act.id,
    act.equipment_id,
    act.title,
    act.activity_type,
    act.priority,
    act.status,
    act.assigned_team,
    act.assigned_team_id,
    act.opened_by_user_id,
    act.opened_at,
    act.closed_at,
    t.discipline AS team_discipline,
    act.start_date,
    COALESCE(
      (SELECT MAX(du.update_date) FROM daily_updates du WHERE du.activity_id = act.id),
      DATE(act.updated_at),
      act.start_date
    ) AS last_update,
    CASE
      WHEN act.status = 'waiting_parts' THEN 1
      WHEN act.status IN ${ACTIVE_STATUSES}
        AND DATEDIFF(
          CURDATE(),
          COALESCE(
            (SELECT MAX(du.update_date) FROM daily_updates du WHERE du.activity_id = act.id),
            act.start_date
          )
        ) > 3
      THEN 1
      ELSE 0
    END AS is_delayed
  FROM activities act
  LEFT JOIN teams t ON t.id = act.assigned_team_id
`;

export async function dbListActivities(): Promise<Activity[]> {
  const [rows] = await getPool().query(`
    ${ACTIVITY_SELECT}
    WHERE ${NOT_DELETED}
    ORDER BY act.start_date DESC, act.id DESC
  `);
  return (rows as Row[]).map(mapActivity);
}

export async function dbGetActivity(id: string): Promise<Activity | null> {
  const [rows] = await getPool().query(
    `
    ${ACTIVITY_SELECT}
    WHERE act.id = :id AND ${NOT_DELETED}
    LIMIT 1
    `,
    { id },
  );
  const list = rows as Row[];
  return list[0] ? mapActivity(list[0]) : null;
}

export async function dbActivitiesForEquipment(equipmentId: string): Promise<Activity[]> {
  const [rows] = await getPool().query(
    `
    ${ACTIVITY_SELECT}
    WHERE act.equipment_id = :equipmentId AND ${NOT_DELETED}
    ORDER BY act.start_date DESC, act.id DESC
    `,
    { equipmentId },
  );
  return (rows as Row[]).map(mapActivity);
}

export async function dbUpdatesForActivity(activityId: string): Promise<DailyUpdate[]> {
  const [rows] = await getPool().query(
    `
    SELECT
      du.id,
      du.activity_id,
      du.update_date,
      du.author,
      du.progress_notes,
      du.findings,
      du.condition_check,
      du.progress_pct,
      du.created_at,
      u.name AS user_name
    FROM daily_updates du
    LEFT JOIN users u ON u.id = du.updated_by_user_id
    WHERE du.activity_id = :activityId
    ORDER BY du.update_date ASC, du.created_at ASC
    `,
    { activityId },
  );
  return (rows as Row[]).map(mapDailyUpdate);
}

export async function dbAttachmentsForActivity(activityId: string): Promise<AttachmentMeta[]> {
  const [rows] = await getPool().query(
    `
    SELECT
      a.id,
      a.activity_id,
      a.file_name,
      a.file_type,
      a.file_size,
      a.file_url,
      a.uploaded_by,
      a.uploaded_at,
      u.name AS uploader_name
    FROM attachments a
    LEFT JOIN users u ON u.id = a.uploaded_by_user_id
    WHERE a.activity_id = :activityId
    ORDER BY a.uploaded_at ASC
    `,
    { activityId },
  );
  return (rows as Row[]).map(mapAttachment);
}

export async function dbGetRca(activityId: string): Promise<RootCauseAnalysis | null> {
  const [rows] = await getPool().query(
    `
    SELECT
      rca.id,
      rca.activity_id,
      rca.failure_mode,
      rca.root_cause,
      rca.corrective_action,
      rca.verified_by_user_id,
      rca.verified_at,
      u.name AS verified_by_name
    FROM root_cause_analysis rca
    LEFT JOIN users u ON u.id = rca.verified_by_user_id
    WHERE rca.activity_id = :activityId
    LIMIT 1
    `,
    { activityId },
  );
  const list = rows as Row[];
  return list[0] ? mapRca(list[0]) : null;
}

export async function dbStatusHistoryForEquipment(
  equipmentId: string,
): Promise<EquipmentStatusHistoryEntry[]> {
  const [rows] = await getPool().query(
    `
    SELECT
      h.id,
      h.equipment_id,
      h.status,
      h.previous_status,
      h.reason,
      h.notes,
      h.activity_id,
      h.changed_by_user_id,
      h.changed_at,
      u.name AS changed_by_name
    FROM equipment_status_history h
    LEFT JOIN users u ON u.id = h.changed_by_user_id
    WHERE h.equipment_id = :equipmentId
    ORDER BY h.changed_at DESC, h.id DESC
    `,
    { equipmentId },
  );
  return (rows as Row[]).map(mapEquipmentStatusHistory);
}

export async function dbWorkOrdersForActivity(activityId: string): Promise<WorkOrder[]> {
  const [rows] = await getPool().query(
    `
    SELECT
      wo.id,
      wo.activity_id,
      wo.external_ref,
      wo.title,
      wo.status,
      wo.planned_start,
      wo.planned_finish,
      wo.notes,
      wo.created_by_user_id,
      wo.created_at,
      u.name AS created_by_name
    FROM work_orders wo
    LEFT JOIN users u ON u.id = wo.created_by_user_id
    WHERE wo.activity_id = :activityId
    ORDER BY wo.created_at DESC, wo.id DESC
    `,
    { activityId },
  );
  return (rows as Row[]).map(mapWorkOrder);
}

export async function dbActivitiesByWorkOrderRef(externalRef: string): Promise<Activity[]> {
  const ref = externalRef.trim();
  if (!ref) return [];
  const [rows] = await getPool().query(
    `
    ${ACTIVITY_SELECT}
    WHERE ${NOT_DELETED}
      AND act.id IN (
      SELECT wo.activity_id FROM work_orders wo
      WHERE wo.external_ref = :ref
         OR wo.external_ref LIKE :like
    )
    ORDER BY act.start_date DESC, act.id DESC
    `,
    { ref, like: `%${ref}%` },
  );
  return (rows as Row[]).map(mapActivity);
}

export type KpiSummary = {
  activeTasks: number;
  criticalTasks: number;
  delayedTasks: number;
  completedToday: number;
  openWorkOrders: number;
  equipmentMaintenance: number;
  closedThisWeek: number;
  byDiscipline: Array<{ team: string; count: number }>;
  byEquipmentStatus: Array<{ status: string; count: number }>;
};

export async function dbKpiSummary(): Promise<KpiSummary> {
  const pool = getPool();

  async function count(sql: string): Promise<number> {
    const [rows] = await pool.query(sql);
    const first = (rows as Row[])[0];
    return Number(first?.n ?? 0);
  }

  const [
    activeTasks,
    criticalTasks,
    delayedTasks,
    completedToday,
    openWorkOrders,
    equipmentMaintenance,
    closedThisWeek,
  ] = await Promise.all([
    count(
      `SELECT COUNT(*) AS n FROM activities act
       WHERE ${NOT_DELETED} AND act.status IN ${ACTIVE_STATUSES}`,
    ),
    count(
      `SELECT COUNT(*) AS n FROM activities act
       WHERE ${NOT_DELETED} AND act.status IN ${ACTIVE_STATUSES}
         AND act.priority IN ('high', 'emergency')`,
    ),
    count(
      `
      SELECT COUNT(*) AS n FROM activities act
      WHERE ${NOT_DELETED}
        AND act.status IN ${ACTIVE_STATUSES}
        AND (
          act.status = 'waiting_parts'
          OR DATEDIFF(
            CURDATE(),
            COALESCE(
              (SELECT MAX(du.update_date) FROM daily_updates du WHERE du.activity_id = act.id),
              act.start_date
            )
          ) > 3
        )
      `,
    ),
    count(
      `
      SELECT COUNT(*) AS n FROM activities act
      WHERE ${NOT_DELETED}
        AND act.status IN ('completed', 'closed')
        AND DATE(COALESCE(act.closed_at, act.updated_at)) = CURDATE()
      `,
    ),
    count(
      `SELECT COUNT(*) AS n FROM work_orders
       WHERE status IN ('planned', 'released', 'in_progress')`,
    ),
    count(`SELECT COUNT(*) AS n FROM equipment WHERE status = 'maintenance'`),
    count(
      `
      SELECT COUNT(*) AS n FROM activities act
      WHERE ${NOT_DELETED}
        AND act.status = 'closed'
        AND COALESCE(act.closed_at, act.updated_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
    ),
  ]);

  const [disciplineRows] = await pool.query(
    `
    SELECT COALESCE(t.name, act.assigned_team) AS team, COUNT(*) AS count
    FROM activities act
    LEFT JOIN teams t ON t.id = act.assigned_team_id
    WHERE ${NOT_DELETED} AND act.status IN ${ACTIVE_STATUSES}
    GROUP BY COALESCE(t.name, act.assigned_team)
    ORDER BY count DESC
    `,
  );

  const [eqStatusRows] = await pool.query(
    `
    SELECT status, COUNT(*) AS count
    FROM equipment
    GROUP BY status
    ORDER BY count DESC
    `,
  );

  return {
    activeTasks,
    criticalTasks,
    delayedTasks,
    completedToday,
    openWorkOrders,
    equipmentMaintenance,
    closedThisWeek,
    byDiscipline: (disciplineRows as Row[]).map((r) => ({
      team: String(r.team),
      count: Number(r.count),
    })),
    byEquipmentStatus: (eqStatusRows as Row[]).map((r) => ({
      status: String(r.status),
      count: Number(r.count),
    })),
  };
}

export type ReportListItem = {
  activityId: string;
  title: string;
  status: string;
  type: string;
  priority: string;
  equipmentTag: string;
  equipmentId: string;
  unitId: string;
  areaId: string;
  areaName: string;
  startDate: string;
  closedAt: string | null;
  hasRca: boolean;
  workOrderCount: number;
};

export async function dbListReportableActivities(): Promise<ReportListItem[]> {
  const [rows] = await getPool().query(
    `
    SELECT
      act.id AS activity_id,
      act.title,
      act.status,
      act.activity_type,
      act.priority,
      act.start_date,
      act.closed_at,
      e.id AS equipment_id,
      e.tag_number,
      u.id AS unit_id,
      a.id AS area_id,
      a.name AS area_name,
      EXISTS(
        SELECT 1 FROM root_cause_analysis rca WHERE rca.activity_id = act.id
      ) AS has_rca,
      (SELECT COUNT(*) FROM work_orders wo WHERE wo.activity_id = act.id) AS wo_count
    FROM activities act
    JOIN equipment e ON e.id = act.equipment_id
    JOIN units u ON u.id = e.unit_id
    JOIN areas a ON a.id = u.area_id
    WHERE ${NOT_DELETED}
      AND act.status IN ('completed', 'closed')
    ORDER BY COALESCE(act.closed_at, act.updated_at) DESC, act.id DESC
    LIMIT 100
    `,
  );

  return (rows as Row[]).map((r) => ({
    activityId: String(r.activity_id),
    title: String(r.title),
    status: String(r.status),
    type: String(r.activity_type),
    priority: String(r.priority),
    equipmentTag: String(r.tag_number),
    equipmentId: String(r.equipment_id),
    unitId: String(r.unit_id),
    areaId: String(r.area_id),
    areaName: String(r.area_name),
    startDate: asDateStringLocal(r.start_date),
    closedAt: r.closed_at ? asDateTimeStringLocal(r.closed_at) : null,
    hasRca: Number(r.has_rca) === 1,
    workOrderCount: Number(r.wo_count ?? 0),
  }));
}

function asDateStringLocal(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
}

function asDateTimeStringLocal(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().replace('T', ' ').slice(0, 19);
  if (typeof value === 'string') return value.slice(0, 19).replace('T', ' ');
  return null;
}

export type ActivityReportPack = {
  activity: Activity;
  equipment: Equipment;
  unitName: string;
  unitId: string;
  areaName: string;
  areaId: string;
  updates: DailyUpdate[];
  attachments: AttachmentMeta[];
  rca: RootCauseAnalysis | null;
  workOrders: WorkOrder[];
  durationDays: number | null;
};

export async function dbGetActivityReportPack(
  activityId: string,
): Promise<ActivityReportPack | null> {
  const activity = await dbGetActivity(activityId);
  if (!activity) return null;
  const equipment = await dbGetEquipment(activity.equipmentId);
  if (!equipment) return null;

  const [unitRows] = await getPool().query(
    `
    SELECT u.id AS unit_id, u.name AS unit_name, a.id AS area_id, a.name AS area_name
    FROM units u
    JOIN areas a ON a.id = u.area_id
    WHERE u.id = :unitId
    LIMIT 1
    `,
    { unitId: equipment.unitId },
  );
  const unit = (unitRows as Row[])[0];
  if (!unit) return null;

  const [updates, attachments, rca, workOrders] = await Promise.all([
    dbUpdatesForActivity(activityId),
    dbAttachmentsForActivity(activityId),
    dbGetRca(activityId),
    dbWorkOrdersForActivity(activityId),
  ]);

  let durationDays: number | null = null;
  if (activity.startDate) {
    const start = new Date(activity.startDate);
    const end = activity.closedAt ? new Date(activity.closedAt) : new Date();
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      durationDays = Math.max(
        0,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      );
    }
  }

  return {
    activity,
    equipment,
    unitName: String(unit.unit_name),
    unitId: String(unit.unit_id),
    areaName: String(unit.area_name),
    areaId: String(unit.area_id),
    updates,
    attachments,
    rca,
    workOrders,
    durationDays,
  };
}
