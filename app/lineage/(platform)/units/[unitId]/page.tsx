import { notFound } from 'next/navigation';
import { Button, Grid, KpiMetric, Stack, Surface, Text } from '@/components/design-system';
import { EquipmentListItem } from '@/components/domain/EquipmentListItem';
import { PageHeader } from '@/components/layout/PageHeader';
import { equipmentForUnit, getArea, getUnit } from '@/lib/data/plant';

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const unit = await getUnit(unitId);
  if (!unit) notFound();
  const [area, items] = await Promise.all([
    getArea(unit.areaId),
    equipmentForUnit(unit.id),
  ]);

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow={`Unit · ${unit.type}`}
        title={unit.name}
        description={`Equipment catalogue for ${unit.id}.`}
        breadcrumbs={[
          { label: 'Areas', href: '/lineage/areas' },
          { label: area?.name ?? unit.areaId, href: `/lineage/areas/${unit.areaId}` },
          { label: unit.id },
        ]}
        actions={<Button href="/lineage/activities/new">New activity</Button>}
      />

      <Grid columns={3} gap={4} className="animate-fade-up">
        <Surface pad={5}>
          <KpiMetric label="Equipment" value={unit.equipmentCount} />
        </Surface>
        <Surface pad={5}>
          <KpiMetric label="Active activities" value={unit.activeActivities} tone="accent" />
        </Surface>
        <Surface pad={5}>
          <KpiMetric label="Listed tags" value={items.length} />
        </Surface>
      </Grid>

      <Surface pad={0} className="animate-fade-up stagger-2">
        <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-2)' }}>
          <Text as="h2" display size="xl">
            Equipment
          </Text>
        </div>
        {items.map((item) => (
          <EquipmentListItem key={item.id} item={item} />
        ))}
        {items.length === 0 ? (
          <div style={{ padding: 'var(--space-5)' }}>
            <Text tone="mute">No equipment for this unit yet.</Text>
          </div>
        ) : null}
      </Surface>
    </Stack>
  );
}
