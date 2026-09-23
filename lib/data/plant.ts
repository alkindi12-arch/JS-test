/**
 * Plant data facade — MySQL when configured, mock fallback for local UI work.
 * Screens import from here only (not from mock or plant-db directly).
 */

import { isDatabaseConfigured } from '@/lib/db/mysql';
import type { AttachmentMeta } from '@/lib/data/mappers';
import * as db from '@/lib/data/plant-db';
import type { KpiSummary } from '@/lib/data/plant-db';
import * as mock from '@/lib/mock/plant';
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

export type DataSource = 'mysql' | 'mock';

export async function getDataSource(): Promise<DataSource> {
  return isDatabaseConfigured() ? 'mysql' : 'mock';
}

export async function listAreas(): Promise<Area[]> {
  if (!isDatabaseConfigured()) return mock.areas;
  return db.dbListAreas();
}

export async function getArea(id: string): Promise<Area | null> {
  if (!isDatabaseConfigured()) return mock.getArea(id) ?? null;
  return db.dbGetArea(id);
}

export async function unitsForArea(areaId: string): Promise<Unit[]> {
  if (!isDatabaseConfigured()) return mock.unitsForArea(areaId);
  return db.dbUnitsForArea(areaId);
}

export async function getUnit(id: string): Promise<Unit | null> {
  if (!isDatabaseConfigured()) return mock.getUnit(id) ?? null;
  return db.dbGetUnit(id);
}

export async function listEquipment(): Promise<Equipment[]> {
  if (!isDatabaseConfigured()) return mock.equipment;
  return db.dbListEquipment();
}

export async function equipmentForUnit(unitId: string): Promise<Equipment[]> {
  if (!isDatabaseConfigured()) return mock.equipmentForUnit(unitId);
  return db.dbEquipmentForUnit(unitId);
}

export async function getEquipment(id: string): Promise<Equipment | null> {
  if (!isDatabaseConfigured()) return mock.getEquipment(id) ?? null;
  return db.dbGetEquipment(id);
}

export async function listActivities(): Promise<Activity[]> {
  if (!isDatabaseConfigured()) return mock.activities;
  return db.dbListActivities();
}

export async function getActivity(id: string): Promise<Activity | null> {
  if (!isDatabaseConfigured()) return mock.getActivity(id) ?? null;
  return db.dbGetActivity(id);
}

export async function activitiesForEquipment(equipmentId: string): Promise<Activity[]> {
  if (!isDatabaseConfigured()) return mock.activitiesForEquipment(equipmentId);
  return db.dbActivitiesForEquipment(equipmentId);
}

export async function updatesForActivity(activityId: string): Promise<DailyUpdate[]> {
  if (!isDatabaseConfigured()) {
    if (activityId !== 'ACT-1042') return [];
    return [
      {
        id: 'u1',
        activityId,
        date: '2026-09-18 · 09:40',
        author: 'Tech. Rahman',
        notes: 'Vibration confirmed on DE bearing. Peak 12.4 mm/s. Isolation requested.',
      },
      {
        id: 'u2',
        activityId,
        date: '2026-09-19 · 14:15',
        author: 'Tech. Rahman',
        notes: 'Bearing housing opened. Evidence of lubricant degradation. Parts indent raised.',
      },
      {
        id: 'u3',
        activityId,
        date: '2026-09-20 · 08:05',
        author: 'Superv. Khan',
        notes: 'Waiting seal kit ETA tomorrow. Continue standby on 120P-001B.',
      },
    ];
  }
  return db.dbUpdatesForActivity(activityId);
}

export async function attachmentsForActivity(activityId: string): Promise<AttachmentMeta[]> {
  if (!isDatabaseConfigured()) {
    if (activityId !== 'ACT-1042') return [];
    return [
      {
        id: 'f1',
        activityId,
        fileName: 'vibration_trend_0918.jpg',
        fileType: 'image/jpeg',
        fileUrl: '#',
      },
      {
        id: 'f2',
        activityId,
        fileName: 'permit_LOTO_1042.pdf',
        fileType: 'application/pdf',
        fileUrl: '#',
      },
      {
        id: 'f3',
        activityId,
        fileName: 'bearing_housing.mp4',
        fileType: 'video/mp4',
        fileUrl: '#',
      },
    ];
  }
  return db.dbAttachmentsForActivity(activityId);
}

export async function getRca(activityId: string): Promise<RootCauseAnalysis | null> {
  if (!isDatabaseConfigured()) {
    if (activityId !== 'ACT-1042') return null;
    return {
      id: 1,
      activityId,
      failureMode: 'Bearing wear',
      rootCause: 'Lubricant degradation under sustained high load',
      correctiveAction: 'Replace DE bearing + seal kit; revise lube interval',
      verifiedByUserId: null,
      verifiedByName: null,
      verifiedAt: null,
    };
  }
  return db.dbGetRca(activityId);
}

export async function statusHistoryForEquipment(
  equipmentId: string,
): Promise<EquipmentStatusHistoryEntry[]> {
  if (!isDatabaseConfigured()) {
    const eq = mock.getEquipment(equipmentId);
    if (!eq) return [];
    return [
      {
        id: 1,
        equipmentId,
        status: eq.status,
        previousStatus: null,
        reason: 'baseline',
        notes: 'Mock baseline status',
        activityId: null,
        changedByUserId: null,
        changedByName: null,
        changedAt: '2026-09-01 08:00:00',
      },
    ];
  }
  return db.dbStatusHistoryForEquipment(equipmentId);
}

export async function workOrdersForActivity(activityId: string): Promise<WorkOrder[]> {
  if (!isDatabaseConfigured()) {
    if (activityId !== 'ACT-1042') return [];
    return [
      {
        id: 1,
        activityId,
        externalRef: 'WO-DEMO-1042',
        title: 'Bearing replacement package',
        status: 'released',
        plannedStart: '2026-09-18',
        plannedFinish: '2026-09-22',
        notes: 'Mock CMMS work order',
        createdByUserId: null,
        createdByName: 'Mock Supervisor',
        createdAt: '2026-09-18 09:00:00',
      },
    ];
  }
  return db.dbWorkOrdersForActivity(activityId);
}

export async function activitiesByWorkOrderRef(externalRef: string): Promise<Activity[]> {
  if (!isDatabaseConfigured()) {
    if (!externalRef.trim()) return mock.activities;
    return mock.activities.filter((a) => a.id === 'ACT-1042');
  }
  return db.dbActivitiesByWorkOrderRef(externalRef);
}

export async function getKpiSummary(): Promise<KpiSummary> {
  if (!isDatabaseConfigured()) return mock.kpiSummary;
  return db.dbKpiSummary();
}
