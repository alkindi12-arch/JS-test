import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActivityRow } from '@/components/domain/ActivityRow';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import {
  activitiesByWorkOrderRef,
  listActivities,
  listEquipment,
} from '@/lib/data/plant';
import styles from './page.module.css';

function matchesTag(
  equipmentId: string,
  tagMap: Record<string, string>,
  needle: string,
): boolean {
  if (!needle) return true;
  const tag = (tagMap[equipmentId] ?? '').toUpperCase();
  const id = equipmentId.toUpperCase();
  const q = needle.toUpperCase();
  return tag.includes(q) || id.includes(q);
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ wo?: string; tag?: string }>;
}) {
  const { wo, tag } = await searchParams;
  const woFilter = wo?.trim() ?? '';
  const tagFilter = tag?.trim() ?? '';
  const hasFilters = Boolean(woFilter || tagFilter);

  const [rawActivities, equipment, caps] = await Promise.all([
    woFilter ? activitiesByWorkOrderRef(woFilter) : listActivities(),
    listEquipment(),
    getSessionCapabilities(),
  ]);
  const tagMap = Object.fromEntries(equipment.map((e) => [e.id, e.tagNumber]));
  const activities = tagFilter
    ? rawActivities.filter((a) => matchesTag(a.equipmentId, tagMap, tagFilter))
    : rawActivities;

  const filterBits = [
    woFilter ? `WO “${woFilter}”` : null,
    tagFilter ? `tag “${tagFilter}”` : null,
  ].filter(Boolean);

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Work stream"
        title="Activities"
        description="Cross-hierarchy list with status, priority, and discipline. Filter by equipment tag or CMMS work order ref."
        breadcrumbs={[
          { label: 'Dashboard', href: '/lineage/dashboard' },
          { label: 'Activities' },
        ]}
        actions={
          caps.canCreate ? (
            <Button href="/lineage/activities/new">New activity</Button>
          ) : undefined
        }
      />

      <Surface pad={4} className={`animate-fade-up ${styles.filter}`}>
        <form method="get" className={styles.filterForm}>
          <label className={styles.filterField}>
            <span>Equipment tag</span>
            <input
              name="tag"
              defaultValue={tagFilter}
              placeholder="e.g. 120P-001A"
              autoComplete="off"
            />
          </label>
          <label className={styles.filterField}>
            <span>Work order ref</span>
            <input
              name="wo"
              defaultValue={woFilter}
              placeholder="e.g. WO-2026-8841"
              autoComplete="off"
            />
          </label>
          <div className={styles.filterActions}>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
            {hasFilters ? (
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
            {filterBits.length ? ` matching ${filterBits.join(' · ')}` : ''}
            {caps.session ? ` · signed in as ${caps.session.role}` : ''}
          </Text>
          {activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              tag={tagMap[activity.equipmentId]}
            />
          ))}
          {activities.length === 0 ? (
            <Text tone="mute">
              {hasFilters
                ? 'No activities match this filter.'
                : 'No activities yet.'}
            </Text>
          ) : null}
        </Stack>
      </Surface>
    </Stack>
  );
}
