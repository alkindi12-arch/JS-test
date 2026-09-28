import { notFound } from 'next/navigation';
import { Button, Grid, KpiMetric, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { deleteAreaAction } from '@/lib/data/hierarchy-writes';
import { getArea, unitsForArea } from '@/lib/data/plant';

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = await params;
  const [area, caps] = await Promise.all([getArea(areaId), getSessionCapabilities()]);
  if (!area) notFound();
  const units = await unitsForArea(area.id);
  const canDelete = caps.canAdmin && area.unitCount === 0;

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
        actions={
          caps.canAdmin ? (
            <>
              <Button variant="secondary" href={`/lineage/areas/${area.id}/edit`}>
                Edit area
              </Button>
              <Button href={`/lineage/units/new?areaId=${encodeURIComponent(area.id)}`}>
                Add unit
              </Button>
            </>
          ) : undefined
        }
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
          {units.length === 0 ? (
            <Text tone="mute">No units in this area yet.</Text>
          ) : null}
        </Stack>
      </section>

      {caps.canAdmin ? (
        <Surface pad={5} className="animate-fade-up stagger-3">
          <Stack gap={3}>
            <Text as="h2" display size="lg">
              Remove area
            </Text>
            <Text size="sm" tone="mute">
              {canDelete
                ? 'Permanently delete this area. This cannot be undone.'
                : `Delete blocked — remove ${area.unitCount} unit(s) first (and their equipment).`}
            </Text>
            {canDelete ? (
              <ActionForm
                action={deleteAreaAction}
                submitLabel="Delete area"
                submitVariant="danger"
                pendingLabel="Deleting…"
              >
                <input type="hidden" name="id" value={area.id} />
              </ActionForm>
            ) : (
              <Button
                variant="secondary"
                href={`/lineage/areas/${area.id}/edit`}
              >
                Open edit to manage
              </Button>
            )}
          </Stack>
        </Surface>
      ) : null}
    </Stack>
  );
}
