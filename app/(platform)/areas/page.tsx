import { Grid, Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';
import { areas } from '@/lib/mock/plant';

export default function AreasPage() {
  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Hierarchy"
        title="Areas"
        description="Plant sections. Drill into units, then equipment, then activities."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Areas' }]}
      />
      <Grid columns={3} gap={4} className="animate-fade-up">
        {areas.map((area) => (
          <Surface key={area.id} href={`/areas/${area.id}`} pad={5}>
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
