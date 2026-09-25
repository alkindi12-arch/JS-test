import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActivityRow } from '@/components/domain/ActivityRow';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  activitiesByWorkOrderRef,
  listActivities,
  listEquipment,
} from '@/lib/data/plant';
import styles from './page.module.css';

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ wo?: string }>;
}) {
  const { wo } = await searchParams;
  const woFilter = wo?.trim() ?? '';

  const [activities, equipment] = await Promise.all([
    woFilter ? activitiesByWorkOrderRef(woFilter) : listActivities(),
    listEquipment(),
  ]);
  const tagMap = Object.fromEntries(equipment.map((e) => [e.id, e.tagNumber]));

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Work stream"
        title="Activities"
        description="Cross-hierarchy list with status, priority, and discipline. Filter by CMMS work order ref."
        breadcrumbs={[
          { label: 'Dashboard', href: '/lineage/dashboard' },
          { label: 'Activities' },
        ]}
        actions={<Button href="/lineage/activities/new">New activity</Button>}
      />

      <Surface pad={4} className={`animate-fade-up ${styles.filter}`}>
        <form method="get" className={styles.filterForm}>
          <label className={styles.filterField}>
            <span>Work order ref</span>
            <input
              name="wo"
              defaultValue={woFilter}
              placeholder="e.g. WO-2026-8841"
            />
          </label>
          <div className={styles.filterActions}>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
            {woFilter ? (
              <Button href="/lineage/activities" variant="ghost">
                Clear
              </Button>
            ) : null}
          </div>
        </form>
      </Surface>

      <Surface pad={5} className="animate-fade-up">
        <Stack gap={1}>
          <Text size="sm" tone="mute">
            Showing {activities.length} activities
            {woFilter ? ` matching WO “${woFilter}”` : ''}
          </Text>
          {activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              tag={tagMap[activity.equipmentId]}
            />
          ))}
          {activities.length === 0 ? (
            <Text tone="mute">No activities match this work order filter.</Text>
          ) : null}
        </Stack>
      </Surface>
    </Stack>
  );
}
