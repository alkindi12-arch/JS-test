import { notFound } from 'next/navigation';
import { Grid, KpiMetric, Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';
import { getArea, unitsForArea } from '@/lib/data/plant';

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = await params;
  const area = await getArea(areaId);
  if (!area) notFound();
  const units = await unitsForArea(area.id);

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow={area.id}
        title={area.name}
        description={area.description}
        breadcrumbs={[
          { label: 'Areas', href: '/lineage/areas' },
          { label: area.name },
        ]}
      />

      <Grid columns={3} gap={4} className="animate-fade-up">
        <Surface pad={5}>
          <KpiMetric label="Units" value={area.unitCount} />
        </Surface>
        <Surface pad={5}>
          <KpiMetric label="Active issues" value={area.activeIssues} tone="signal" />
        </Surface>
        <Surface pad={5}>
          <KpiMetric label="Critical alerts" value={area.criticalAlerts} tone="danger" />
        </Surface>
      </Grid>

      <section className="animate-fade-up stagger-2">
        <Stack gap={4}>
          <Text as="h2" display size="xl">
            Units
          </Text>
          <Grid columns={2} gap={4}>
            {units.map((unit) => (
              <Surface key={unit.id} href={`/lineage/units/${unit.id}`} pad={5}>
                <Stack gap={2}>
                  <Text mono size="xs" tone="mute">
                    {unit.id} · {unit.type}
                  </Text>
                  <Text as="h3" display size="lg">
                    {unit.name}
                  </Text>
                  <Text size="sm" tone="mute">
                    {unit.equipmentCount} equipment · {unit.activeActivities} active
                  </Text>
                </Stack>
              </Surface>
            ))}
          </Grid>
        </Stack>
      </section>
    </Stack>
  );
}
