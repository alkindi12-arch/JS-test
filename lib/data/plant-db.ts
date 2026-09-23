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
} from '@/lib/types/domain';

type Row = Record<string, unknown>;

const ACTIVE_STATUSES = `('open', 'in_progress', 'waiting_parts')`;

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
          AND act.status IN ${ACTIVE_STATUSES}
      ) AS active_issues,
      (
        SELECT COUNT(*)
        FROM activities act
        JOIN equipment e ON e.id = act.equipment_id
        JOIN units u ON u.id = e.unit_id
        WHERE u.area_id = a.id
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
      (SELECT COUNT(*) FROM equipment e WHERE e.unit_id = u.id) AS equipment_count,
      (
        SELECT COUNT(*)
        FROM activities act
        JOIN equipment e ON e.id = act.equipment_id
        WHERE e.unit_id = u.id
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
      (SELECT COUNT(*) FROM equipment e WHERE e.unit_id = u.id) AS equipment_count,
      (
        SELECT COUNT(*)
        FROM activities act
        JOIN equipment e ON e.id = act.equipment_id
        WHERE e.unit_id = u.id
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
    ORDER BY act.start_date DESC, act.id DESC
  `);
  return (rows as Row[]).map(mapActivity);
}

export async function dbGetActivity(id: string): Promise<Activity | null> {
  const [rows] = await getPool().query(
    `
    ${ACTIVITY_SELECT}
    WHERE act.id = :id
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
    WHERE act.equipment_id = :equipmentId
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
    SELECT id, activity_id, file_name, file_type, file_url
    FROM attachments
    WHERE activity_id = :activityId
    ORDER BY uploaded_at ASC
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

export type KpiSummary = {
  activeTasks: number;
  criticalTasks: number;
  delayedTasks: number;
  completedToday: number;
  byDiscipline: Array<{ team: string; count: number }>;
};

export async function dbKpiSummary(): Promise<KpiSummary> {
  const pool = getPool();

  async function count(sql: string): Promise<number> {
    const [rows] = await pool.query(sql);
    const first = (rows as Row[])[0];
    return Number(first?.n ?? 0);
  }

  const [activeTasks, criticalTasks, delayedTasks, completedToday] = await Promise.all([
    count(`SELECT COUNT(*) AS n FROM activities WHERE status IN ${ACTIVE_STATUSES}`),
    count(
      `SELECT COUNT(*) AS n FROM activities
       WHERE status IN ${ACTIVE_STATUSES} AND priority IN ('high', 'emergency')`,
    ),
    count(
      `
      SELECT COUNT(*) AS n FROM activities act
      WHERE act.status IN ${ACTIVE_STATUSES}
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
      SELECT COUNT(*) AS n FROM activities
      WHERE status IN ('completed', 'closed')
        AND DATE(COALESCE(closed_at, updated_at)) = CURDATE()
      `,
    ),
  ]);

  const [disciplineRows] = await pool.query(
    `
    SELECT COALESCE(t.name, act.assigned_team) AS team, COUNT(*) AS count
    FROM activities act
    LEFT JOIN teams t ON t.id = act.assigned_team_id
    WHERE act.status IN ${ACTIVE_STATUSES}
    GROUP BY COALESCE(t.name, act.assigned_team)
    ORDER BY count DESC
    `,
  );

  return {
    activeTasks,
    criticalTasks,
    delayedTasks,
    completedToday,
    byDiscipline: (disciplineRows as Row[]).map((r) => ({
      team: String(r.team),
      count: Number(r.count),
    })),
  };
}
