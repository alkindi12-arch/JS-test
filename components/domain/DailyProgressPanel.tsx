'use client';

import { useState } from 'react';
import { ActionForm } from '@/components/domain/ActionForm';
import { Button, Text } from '@/components/design-system';
import {
  deleteDailyUpdateAction,
  updateDailyUpdateAction,
} from '@/lib/data/plant-writes';
import type { DailyUpdate } from '@/lib/types/domain';
import styles from './DailyProgressPanel.module.css';

export function DailyProgressPanel({
  activityId,
  updates,
  canManage,
}: {
  activityId: string;
  updates: DailyUpdate[];
  canManage: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className={styles.panel}>
      <Text as="h2" display size="xl">
        Daily progress
      </Text>
      <Text size="sm" tone="mute">
        Timeline from Hostinger MySQL — edit or remove entries when needed.
      </Text>

      {updates.length === 0 ? (
        <Text size="sm" tone="mute">
          No daily updates yet.
        </Text>
      ) : (
        <ol className={styles.timeline}>
          {updates.map((u, i) => (
            <li key={u.id} className={styles.event}>
              <span className={styles.rail} aria-hidden>
                <span className={styles.dot} />
                {i < updates.length - 1 ? <span className={styles.line} /> : null}
              </span>
              <div className={styles.eventBody}>
                {editingId === u.id && canManage ? (
                  <ActionForm
                    action={updateDailyUpdateAction}
                    submitLabel="Save update"
                    className={styles.editForm}
                  >
                    <input type="hidden" name="updateId" value={u.id} />
                    <input type="hidden" name="activityId" value={activityId} />
                    <label className={styles.field}>
                      <span>Notes</span>
                      <textarea name="notes" rows={3} required defaultValue={u.notes} />
                    </label>
                    <label className={styles.field}>
                      <span>Findings</span>
                      <textarea
                        name="findings"
                        rows={2}
                        defaultValue={u.findings ?? ''}
                      />
                    </label>
                    <div className={styles.row}>
                      <label className={styles.field}>
                        <span>Condition</span>
                        <select
                          name="condition"
                          defaultValue={u.conditionCheck ?? 'unchanged'}
                        >
                          <option value="improved">Improved</option>
                          <option value="unchanged">Unchanged</option>
                          <option value="worsened">Worsened</option>
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span>Progress %</span>
                        <input
                          name="progressPct"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={u.progressPct ?? ''}
                        />
                      </label>
                    </div>
                    <div className={styles.inlineActions}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </ActionForm>
                ) : (
                  <>
                    <Text size="xs" tone="mute">
                      {u.date} · {u.author}
                      {u.progressPct != null ? ` · ${u.progressPct}%` : ''}
                    </Text>
                    <Text size="sm">{u.notes}</Text>
                    {u.findings ? (
                      <Text size="sm" tone="mute">
                        Findings: {u.findings}
                      </Text>
                    ) : null}
                    {canManage ? (
                      <div className={styles.inlineActions}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(u.id)}
                        >
                          Edit
                        </Button>
                        <ActionForm
                          action={deleteDailyUpdateAction}
                          submitLabel="Delete"
                          submitVariant="danger"
                          pendingLabel="Deleting…"
                          className={styles.deleteForm}
                        >
                          <input type="hidden" name="updateId" value={u.id} />
                          <input type="hidden" name="activityId" value={activityId} />
                        </ActionForm>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
