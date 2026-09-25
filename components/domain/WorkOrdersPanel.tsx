'use client';

import { ActionForm } from '@/components/domain/ActionForm';
import { Badge, Text } from '@/components/design-system';
import {
  attachWorkOrderAction,
  updateWorkOrderStatusAction,
} from '@/lib/data/plant-writes';
import { labelWorkOrderStatus } from '@/lib/format';
import type { WorkOrder } from '@/lib/types/domain';
import styles from './WorkOrdersPanel.module.css';

export function WorkOrdersPanel({
  activityId,
  workOrders,
  canEdit,
}: {
  activityId: string;
  workOrders: WorkOrder[];
  canEdit: boolean;
}) {
  return (
    <div className={styles.panel}>
      <Text as="h2" display size="lg">
        Work orders
      </Text>
      <Text size="sm" tone="mute">
        Link CMMS / external WO numbers to this activity.
      </Text>

      {workOrders.length === 0 ? (
        <Text size="sm" tone="mute">
          No work orders linked yet.
        </Text>
      ) : (
        <ul className={styles.list}>
          {workOrders.map((wo) => (
            <li key={wo.id} className={styles.item}>
              <div className={styles.itemHead}>
                <Text size="sm" weight="bold">
                  {wo.externalRef}
                </Text>
                <Badge tone={wo.status === 'cancelled' ? 'danger' : 'accent'}>
                  {labelWorkOrderStatus(wo.status)}
                </Badge>
              </div>
              {wo.title ? (
                <Text size="sm" tone="mute">
                  {wo.title}
                </Text>
              ) : null}
              {(wo.plannedStart || wo.plannedFinish) && (
                <Text size="xs" tone="faint">
                  Planned {wo.plannedStart ?? '—'} → {wo.plannedFinish ?? '—'}
                </Text>
              )}
              {canEdit ? (
                <ActionForm
                  action={updateWorkOrderStatusAction}
                  submitLabel="Update"
                  className={styles.statusForm}
                >
                  <input type="hidden" name="workOrderId" value={wo.id} />
                  <input type="hidden" name="activityId" value={activityId} />
                  <label className={styles.fieldInline}>
                    <span className={styles.srOnly}>Status</span>
                    <select name="status" defaultValue={wo.status}>
                      <option value="planned">Planned</option>
                      <option value="released">Released</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                </ActionForm>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <ActionForm
          action={attachWorkOrderAction}
          submitLabel="Attach WO"
          className={styles.fields}
        >
          <input type="hidden" name="activityId" value={activityId} />
          <label className={styles.field}>
            <span>External ref *</span>
            <input
              name="externalRef"
              required
              placeholder="e.g. WO-2026-8841"
              maxLength={64}
            />
          </label>
          <label className={styles.field}>
            <span>Title</span>
            <input name="title" placeholder="Optional CMMS title" />
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>Status</span>
              <select name="status" defaultValue="planned">
                <option value="planned">Planned</option>
                <option value="released">Released</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Planned start</span>
              <input name="plannedStart" type="date" />
            </label>
            <label className={styles.field}>
              <span>Planned finish</span>
              <input name="plannedFinish" type="date" />
            </label>
          </div>
          <label className={styles.field}>
            <span>Notes</span>
            <input name="notes" placeholder="Optional" />
          </label>
        </ActionForm>
      ) : null}
    </div>
  );
}
