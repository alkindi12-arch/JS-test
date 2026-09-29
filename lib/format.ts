export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function labelActivityStatus(status: string) {
  const map: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting_parts: 'Waiting Parts',
    completed: 'Completed',
    closed: 'Closed',
  };
  return map[status] ?? status;
}

export function labelActivityType(type: string) {
  const map: Record<string, string> = {
    breakdown: 'Breakdown',
    pm: 'PM',
    inspection: 'Inspection',
    routine: 'Routine',
    project: 'Project',
  };
  return map[type] ?? type;
}

export function labelEquipmentStatus(status: string) {
  const map: Record<string, string> = {
    running: 'Running',
    standby: 'Standby',
    offline: 'Offline',
    maintenance: 'Under Maintenance',
  };
  return map[status] ?? status;
}

export function labelWorkOrderStatus(status: string) {
  const map: Record<string, string> = {
    planned: 'Planned',
    released: 'Released',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status] ?? status;
}
