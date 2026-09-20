import type { Activity, Area, Equipment, Unit } from '@/lib/types/domain';

/** Seed plant data — replace with API clients later without changing UI contracts */

export const areas: Area[] = [
  {
    id: 'A01',
    name: 'Heavy Oil Complex',
    description: 'Crude and vacuum distillation cluster',
    unitCount: 4,
    activeIssues: 12,
    criticalAlerts: 3,
  },
  {
    id: 'A02',
    name: 'Conversion Block',
    description: 'Hydrocracker and delayed coker',
    unitCount: 3,
    activeIssues: 8,
    criticalAlerts: 1,
  },
  {
    id: 'A03',
    name: 'Utilities & Offsites',
    description: 'Steam, power, tankage',
    unitCount: 5,
    activeIssues: 5,
    criticalAlerts: 0,
  },
];

export const units: Unit[] = [
  {
    id: 'CDU',
    areaId: 'A01',
    name: 'Crude Distillation',
    type: 'process',
    equipmentCount: 86,
    activeActivities: 7,
  },
  {
    id: 'VDU',
    areaId: 'A01',
    name: 'Vacuum Distillation',
    type: 'process',
    equipmentCount: 54,
    activeActivities: 3,
  },
  {
    id: 'HCU',
    areaId: 'A02',
    name: 'Hydrocracker',
    type: 'process',
    equipmentCount: 72,
    activeActivities: 5,
  },
  {
    id: 'DCU',
    areaId: 'A02',
    name: 'Delayed Coker',
    type: 'process',
    equipmentCount: 61,
    activeActivities: 3,
  },
  {
    id: 'STM',
    areaId: 'A03',
    name: 'Steam Generation',
    type: 'utilities',
    equipmentCount: 40,
    activeActivities: 2,
  },
];

export const equipment: Equipment[] = [
  {
    id: 'EQ-120P-001A',
    unitId: 'CDU',
    tagNumber: '120P-001A',
    description: 'Crude Charge Pump A',
    criticality: 'high',
    status: 'maintenance',
    make: 'Flowserve',
    model: 'HPX-8x10',
  },
  {
    id: 'EQ-120P-001B',
    unitId: 'CDU',
    tagNumber: '120P-001B',
    description: 'Crude Charge Pump B',
    criticality: 'high',
    status: 'running',
    make: 'Flowserve',
    model: 'HPX-8x10',
  },
  {
    id: 'EQ-130E-012',
    unitId: 'CDU',
    tagNumber: '130E-012',
    description: 'Crude / Resid Exchanger',
    criticality: 'medium',
    status: 'running',
  },
  {
    id: 'EQ-210C-003',
    unitId: 'HCU',
    tagNumber: '210C-003',
    description: 'Recycle Gas Compressor',
    criticality: 'high',
    status: 'standby',
  },
];

export const activities: Activity[] = [
  {
    id: 'ACT-1042',
    equipmentId: 'EQ-120P-001A',
    title: 'Pump vibration high — drive end',
    type: 'breakdown',
    severity: 'high',
    status: 'in_progress',
    team: 'rotating',
    startDate: '2026-09-18',
    lastUpdate: '2026-09-20',
    delayed: false,
  },
  {
    id: 'ACT-1038',
    equipmentId: 'EQ-130E-012',
    title: 'Bundle inspection — fouling check',
    type: 'inspection',
    severity: 'medium',
    status: 'waiting_parts',
    team: 'static',
    startDate: '2026-09-12',
    lastUpdate: '2026-09-19',
    delayed: true,
  },
  {
    id: 'ACT-1021',
    equipmentId: 'EQ-210C-003',
    title: 'Monthly vibration survey',
    type: 'pm',
    severity: 'low',
    status: 'open',
    team: 'rotating',
    startDate: '2026-09-20',
    lastUpdate: '2026-09-20',
  },
  {
    id: 'ACT-1015',
    equipmentId: 'EQ-120P-001B',
    title: 'Seal flush line check',
    type: 'routine',
    severity: 'low',
    status: 'completed',
    team: 'ops',
    startDate: '2026-09-17',
    lastUpdate: '2026-09-19',
  },
  {
    id: 'ACT-1009',
    equipmentId: 'EQ-120P-001A',
    title: 'Motor insulation test',
    type: 'inspection',
    severity: 'medium',
    status: 'closed',
    team: 'electrical',
    startDate: '2026-09-01',
    lastUpdate: '2026-09-05',
  },
];

export const kpiSummary = {
  activeTasks: 25,
  criticalTasks: 4,
  delayedTasks: 6,
  completedToday: 3,
  byDiscipline: [
    { team: 'Rotating', count: 9 },
    { team: 'Electrical', count: 4 },
    { team: 'Instrument', count: 5 },
    { team: 'Static', count: 4 },
    { team: 'Ops', count: 3 },
  ],
};

export function getArea(id: string) {
  return areas.find((a) => a.id === id);
}

export function getUnit(id: string) {
  return units.find((u) => u.id === id);
}

export function getEquipment(id: string) {
  return equipment.find((e) => e.id === id);
}

export function getActivity(id: string) {
  return activities.find((a) => a.id === id);
}

export function unitsForArea(areaId: string) {
  return units.filter((u) => u.areaId === areaId);
}

export function equipmentForUnit(unitId: string) {
  return equipment.filter((e) => e.unitId === unitId);
}

export function activitiesForEquipment(equipmentId: string) {
  return activities.filter((a) => a.equipmentId === equipmentId);
}
