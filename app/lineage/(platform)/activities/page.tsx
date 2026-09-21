import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActivityRow } from '@/components/domain/ActivityRow';
import { PageHeader } from '@/components/layout/PageHeader';
import { listActivities, listEquipment } from '@/lib/data/plant';

export default async function ActivitiesPage() {
  const [activities, equipment] = await Promise.all([
    listActivities(),
    listEquipment(),
  ]);
  const tagMap = Object.fromEntries(equipment.map((e) => [e.id, e.tagNumber]));

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Work stream"
        title="Activities"
        description="Cross-hierarchy list with status, severity, and discipline."
        breadcrumbs={[
          { label: 'Dashboard', href: '/lineage/dashboard' },
          { label: 'Activities' },
        ]}
        actions={<Button href="/lineage/activities/new">New activity</Button>}
      />
      <Surface pad={5} className="animate-fade-up">
        <Stack gap={1}>
          <Text size="sm" tone="mute">
            Showing {activities.length} activities
          </Text>
          {activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              tag={tagMap[activity.equipmentId]}
            />
          ))}
        </Stack>
      </Surface>
    </Stack>
  );
}
