import { Button, Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';
import styles from './page.module.css';

export default async function AddUpdatePage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow={activityId}
        title="Add daily update"
        description="Progress, findings, condition check, and attachments."
        breadcrumbs={[
          { label: 'Activities', href: '/lineage/activities' },
          { label: activityId, href: `/lineage/activities/${activityId}` },
          { label: 'Update' },
        ]}
      />
      <Surface pad={5} className={`animate-fade-up ${styles.form}`}>
        <form className={styles.fields}>
          <label className={styles.field}>
            <span>Progress notes</span>
            <textarea rows={4} placeholder="What was done this shift?" />
          </label>
          <label className={styles.field}>
            <span>Findings</span>
            <textarea rows={3} placeholder="Observations, measurements…" />
          </label>
          <label className={styles.field}>
            <span>Equipment condition</span>
            <select defaultValue="unchanged">
              <option value="improved">Improved</option>
              <option value="unchanged">Unchanged</option>
              <option value="worsened">Worsened</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Attachments</span>
            <input type="file" multiple />
          </label>
          <div className={styles.actions}>
            <Button variant="secondary" href={`/lineage/activities/${activityId}`}>
              Cancel
            </Button>
            <Button type="button">Post update</Button>
          </div>
        </form>
      </Surface>
    </Stack>
  );
}
