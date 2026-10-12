import { notFound, redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { getActivity } from '@/lib/data/plant';
import { addDailyUpdateAction } from '@/lib/data/plant-writes';
import styles from './page.module.css';

export default async function AddUpdatePage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const [activity, caps] = await Promise.all([
    getActivity(activityId),
    getSessionCapabilities(),
  ]);
  if (!activity) notFound();
  if (!caps.canUpdate) redirect(`/lineage/activities/${activityId}`);

  const session = caps.session!;

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow={activityId}
        title="Add daily update"
        description={`Posted as ${session.name} (${session.role}). Open activities move to In Progress automatically.`}
        breadcrumbs={[
          { label: 'Activities', href: '/lineage/activities' },
          { label: activityId, href: `/lineage/activities/${activityId}` },
          { label: 'Update' },
        ]}
      />
      <Surface pad={5} className={`animate-fade-up ${styles.form}`}>
        <ActionForm
          action={addDailyUpdateAction}
          submitLabel="Post update"
          className={styles.fields}
        >
          <input type="hidden" name="activityId" value={activityId} />
          <label className={styles.field}>
            <span>Progress notes</span>
            <textarea name="notes" rows={4} required placeholder="What was done this shift?" />
          </label>
          <label className={styles.field}>
            <span>Findings</span>
            <textarea name="findings" rows={3} placeholder="Observations, measurements…" />
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>Equipment condition</span>
              <select name="condition" defaultValue="unchanged">
                <option value="improved">Improved</option>
                <option value="unchanged">Unchanged</option>
                <option value="worsened">Worsened</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Progress %</span>
              <input name="progressPct" type="number" min={0} max={100} placeholder="e.g. 40" />
            </label>
          </div>
          <label className={styles.field}>
            <span>Also set status</span>
            <select name="setStatus" defaultValue="">
              <option value="">Auto (Open → In Progress)</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_parts">Waiting Parts</option>
              {caps.canComplete ? (
                <option value="completed">Completed</option>
              ) : null}
            </select>
          </label>
          {!caps.canComplete ? (
            <Text size="xs" tone="faint">
              Marking Completed requires Supervisor/Admin.
            </Text>
          ) : null}
          <Text size="xs" tone="faint">
            Attach files from the activity detail page after posting notes.
          </Text>
          <div className={styles.actionsRow}>
            <Button variant="secondary" href={`/lineage/activities/${activityId}`}>
              Cancel
            </Button>
          </div>
        </ActionForm>
      </Surface>
    </Stack>
  );
}
