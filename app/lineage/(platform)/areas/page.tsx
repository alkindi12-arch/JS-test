import { Grid, Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';
import { listAreas } from '@/lib/data/plant';

export default async function AreasPage() {
  const areas = await listAreas();

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Hierarchy"
        title="Areas"
        description="Plant sections. Drill into units, then equipment, then activities."
        breadcrumbs={[{ label: 'Dashboard', href: '/lineage/dashboard' }, { label: 'Areas' }]}
      />
      <Grid columns={3} gap={4} className="animate-fade-up">
        {areas.map((area) => (
          <Surface key={area.id} href={`/lineage/areas/${area.id}`} pad={5}>
            <Stack gap={3}>
              <Text mono size="xs" tone="mute">
                {area.id}
              </Text>
              <Text as="h2" display size="xl">
                {area.name}
              </Text>
              <Text size="sm" tone="mute">
                {area.description}
              </Text>
              <Text size="sm">
                {area.unitCount} units · {area.activeIssues} active · {area.criticalAlerts}{' '}
                critical
              </Text>
            </Stack>
          </Surface>
        ))}
      </Grid>
    </Stack>
  );
}
