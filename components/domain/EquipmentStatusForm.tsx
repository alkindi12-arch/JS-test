'use client';

import { ActionForm } from '@/components/domain/ActionForm';
import { Text } from '@/components/design-system';
import { setEquipmentStatusAction } from '@/lib/data/plant-writes';
import type { EquipmentStatus } from '@/lib/types/domain';
import styles from './EquipmentStatusForm.module.css';

const OPTIONS: Array<{ value: EquipmentStatus; label: string }> = [
  { value: 'running', label: 'Running' },
  { value: 'standby', label: 'Standby' },
  { value: 'offline', label: 'Offline' },
  { value: 'maintenance', label: 'Under Maintenance' },
];

export function EquipmentStatusForm({
  equipmentId,
  currentStatus,
}: {
  equipmentId: string;
  currentStatus: EquipmentStatus;
}) {
  return (
    <div className={styles.formBlock}>
      <Text as="h2" display size="lg">
        Change status
      </Text>
      <Text size="sm" tone="mute">
        Updates equipment.status and appends an auditable history row.
      </Text>
      <ActionForm
        action={setEquipmentStatusAction}
        submitLabel="Update status"
        className={styles.fields}
      >
        <input type="hidden" name="equipmentId" value={equipmentId} />
        <label className={styles.field}>
          <span>New status</span>
          <select name="status" defaultValue={currentStatus} required>
            {OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Notes</span>
          <input name="notes" placeholder="Optional reason for change" />
        </label>
      </ActionForm>
    </div>
  );
}
