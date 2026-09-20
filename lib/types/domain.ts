/** Domain types — stable contracts for UI + future API layer */

export type Criticality = 'low' | 'medium' | 'high';
export type EquipmentStatus = 'running' | 'standby' | 'offline' | 'maintenance';
export type ActivityType = 'breakdown' | 'pm' | 'inspection' | 'routine' | 'project';
export type Severity = 'low' | 'medium' | 'high' | 'emergency';
export type ActivityStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_parts'
  | 'completed'
  | 'closed';
export type Discipline =
  | 'rotating'
  | 'electrical'
  | 'instrument'
  | 'static'
  | 'ops'
  | 'vendor';
export type UnitType = 'process' | 'utilities' | 'offsites' | 'other';

export interface Area {
  id: string;
  name: string;
  description?: string;
  unitCount: number;
  activeIssues: number;
  criticalAlerts: number;
}

export interface Unit {
  id: string;
  areaId: string;
  name: string;
  type: UnitType;
  equipmentCount: number;
  activeActivities: number;
}

export interface Equipment {
  id: string;
  unitId: string;
  tagNumber: string;
  description: string;
  criticality: Criticality;
  status: EquipmentStatus;
  make?: string;
  model?: string;
}

export interface Activity {
  id: string;
  equipmentId: string;
  title: string;
  type: ActivityType;
  severity: Severity;
  status: ActivityStatus;
  team: Discipline;
  startDate: string;
  lastUpdate: string;
  delayed?: boolean;
}

export interface DailyUpdate {
  id: string;
  activityId: string;
  date: string;
  author: string;
  notes: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: 'dashboard' | 'areas' | 'activities' | 'equipment' | 'reports' | 'admin';
}
