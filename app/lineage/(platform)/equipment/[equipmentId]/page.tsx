import { notFound } from 'next/navigation';
import { Badge, Button, Grid, Stack, Surface, Text } from '@/components/design-system';
import { ActivityRow } from '@/components/domain/ActivityRow';
import { PageHeader } from '@/components/layout/PageHeader';
import { labelEquipmentStatus } from '@/lib/format';
import {
  activitiesForEquipment,
  getEquipment,
  getUnit,
} from '@/lib/mock/plant';

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;
  const item = getEquipment(equipmentId);
  if (!item) notFound();
  const unit = getUnit(item.unitId);
  const history = activitiesForEquipment(item.id);

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Equipment profile"
        title={item.tagNumber}
        description={item.description}
        breadcrumbs={[
          { label: 'Equipment', href: '/lineage/equipment' },
          ...(unit
            ? [{ label: unit.id, href: `/lineage/units/${unit.id}` }]
            : []),
          { label: item.tagNumber },
        ]}
        actions={
          <Button href="/lineage/activities/new">Create activity</Button>
        }
      />

      <Grid columns={3} gap={4} className="animate-fade-up">
        <Surface pad={5}>
          <Stack gap={2}>
            <Text size="sm" tone="mute">
              Status
            </Text>
            <Badge
              tone={item.status === 'maintenance' ? 'danger' : 'ok'}
              dot
            >
              {labelEquipmentStatus(item.status)}
            </Badge>
          </Stack>
        </Surface>
        <Surface pad={5}>
          <Stack gap={2}>
            <Text size="sm" tone="mute">
              Criticality
            </Text>
            <Text display size="lg" weight="bold">
              {item.criticality}
            </Text>
          </Stack>
        </Surface>
        <Surface pad={5}>
          <Stack gap={2}>
            <Text size="sm" tone="mute">
              Make / model
            </Text>
            <Text size="md">
              {item.make ?? '—'} {item.model ? `· ${item.model}` : ''}
            </Text>
          </Stack>
        </Surface>
      </Grid>

      <Surface pad={5} className="animate-fade-up stagger-2">
        <Stack gap={3}>
          <Text as="h2" display size="xl">
            Activity history
          </Text>
          {history.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
          {history.length === 0 ? (
            <Text tone="mute">No activities recorded yet.</Text>
          ) : null}
        </Stack>
      </Surface>
    </Stack>
  );
}
