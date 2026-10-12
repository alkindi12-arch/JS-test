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
  awaitingSupervisorClose = false,
}: {
  activityId: string;
  rca: RootCauseAnalysis | null;
  canEdit: boolean;
  canClose: boolean;
  awaitingSupervisorClose?: boolean;
}) {
  const verifiedLabel =
    rca?.verifiedAt && rca.verifiedByName
      ? `Verified ${rca.verifiedAt} by ${rca.verifiedByName}`
      : rca?.verifiedAt
        ? `Verified ${rca.verifiedAt}`
        : null;

  const showCloseForm = canClose;
  const showSaveForm = canEdit && !canClose && !awaitingSupervisorClose;

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

      {awaitingSupervisorClose ? (
        <Text size="sm" tone="mute">
          Completed — a Supervisor or Admin must close and verify RCA.
        </Text>
      ) : null}

      {showCloseForm || showSaveForm ? (
        <ActionForm
          action={showCloseForm ? closeActivityAction : saveRcaAction}
          submitLabel={showCloseForm ? 'Close with RCA' : 'Save RCA'}
          className={styles.fields}
        >
          <input type="hidden" name="activityId" value={activityId} />
          {showCloseForm ? null : <input type="hidden" name="verify" value="0" />}
          <label className={styles.field}>
            <span>Failure mode</span>
            <input
              name="failureMode"
              defaultValue={rca?.failureMode ?? ''}
              placeholder="e.g. Bearing wear"
            />
          </label>
          <label className={styles.field}>
            <span>Root cause{showCloseForm ? ' *' : ''}</span>
            <textarea
              name="rootCause"
              rows={3}
              required={showCloseForm}
              defaultValue={rca?.rootCause ?? ''}
              placeholder="Why did this fail?"
            />
          </label>
          <label className={styles.field}>
            <span>Corrective action{showCloseForm ? ' *' : ''}</span>
            <textarea
              name="correctiveAction"
              rows={3}
              required={showCloseForm}
              defaultValue={rca?.correctiveAction ?? ''}
              placeholder="What prevents recurrence?"
            />
          </label>
          {showCloseForm ? (
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
