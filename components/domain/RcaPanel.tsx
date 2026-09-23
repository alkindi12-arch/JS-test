'use client';

import { ActionForm } from '@/components/domain/ActionForm';
import { Text } from '@/components/design-system';
import { closeActivityAction, saveRcaAction } from '@/lib/data/plant-writes';
import type { RootCauseAnalysis } from '@/lib/types/domain';
import styles from './RcaPanel.module.css';

export function RcaPanel({
  activityId,
  rca,
  canEdit,
  canClose,
}: {
  activityId: string;
  rca: RootCauseAnalysis | null;
  canEdit: boolean;
  canClose: boolean;
}) {
  const verifiedLabel =
    rca?.verifiedAt && rca.verifiedByName
      ? `Verified ${rca.verifiedAt} by ${rca.verifiedByName}`
      : rca?.verifiedAt
        ? `Verified ${rca.verifiedAt}`
        : null;

  return (
    <div className={styles.panel}>
      <Text as="h2" display size="lg">
        Root cause analysis
      </Text>
      <Text size="sm" tone="mute">
        Capture failure mode, root cause, and corrective action before closing.
      </Text>

      {verifiedLabel ? (
        <Text size="xs" tone="faint">
          {verifiedLabel}
        </Text>
      ) : null}

      {canEdit ? (
        <ActionForm
          action={canClose ? closeActivityAction : saveRcaAction}
          submitLabel={canClose ? 'Close with RCA' : 'Save RCA'}
          className={styles.fields}
        >
          <input type="hidden" name="activityId" value={activityId} />
          {canClose ? null : <input type="hidden" name="verify" value="0" />}
          <label className={styles.field}>
            <span>Failure mode</span>
            <input
              name="failureMode"
              defaultValue={rca?.failureMode ?? ''}
              placeholder="e.g. Bearing wear"
            />
          </label>
          <label className={styles.field}>
            <span>Root cause{canClose ? ' *' : ''}</span>
            <textarea
              name="rootCause"
              rows={3}
              required={canClose}
              defaultValue={rca?.rootCause ?? ''}
              placeholder="Why did this fail?"
            />
          </label>
          <label className={styles.field}>
            <span>Corrective action{canClose ? ' *' : ''}</span>
            <textarea
              name="correctiveAction"
              rows={3}
              required={canClose}
              defaultValue={rca?.correctiveAction ?? ''}
              placeholder="What prevents recurrence?"
            />
          </label>
          {canClose ? (
            <label className={styles.field}>
              <span>Closing notes</span>
              <textarea
                name="closingNotes"
                rows={2}
                placeholder="Optional summary for the timeline"
              />
            </label>
          ) : null}
        </ActionForm>
      ) : (
        <dl className={styles.readout}>
          <div>
            <dt>Failure mode</dt>
            <dd>{rca?.failureMode || '—'}</dd>
          </div>
          <div>
            <dt>Root cause</dt>
            <dd>{rca?.rootCause || '—'}</dd>
          </div>
          <div>
            <dt>Corrective action</dt>
            <dd>{rca?.correctiveAction || '—'}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
