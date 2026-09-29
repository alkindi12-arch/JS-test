import { redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import formStyles from '@/components/domain/EntityForm.module.css';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { createUnitAction } from '@/lib/data/hierarchy-writes';
import { listAreas } from '@/lib/data/plant';

export default async function NewUnitPage({
  searchParams,
}: {
  searchParams: Promise<{ areaId?: string }>;
}) {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) redirect('/lineage/areas');

  const { areaId: presetAreaId } = await searchParams;
  const areas = await listAreas();
  const defaultArea =
    presetAreaId && areas.some((a) => a.id === presetAreaId)
      ? presetAreaId
      : (areas[0]?.id ?? '');

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Hierarchy"
        title="New unit"
        description="Add a process or utilities unit under an area."
        breadcrumbs={[
          { label: 'Areas', href: '/lineage/areas' },
          { label: 'New unit' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${formStyles.form}`}>
        <ActionForm
          action={createUnitAction}
          submitLabel="Create unit"
          className={formStyles.fields}
        >
          <label className={formStyles.field}>
            <span>Unit id</span>
            <input
              name="id"
              required
              maxLength={32}
              placeholder="e.g. RFCC"
              pattern="[A-Za-z][A-Za-z0-9_-]*"
            />
          </label>
          <label className={formStyles.field}>
            <span>Area</span>
            <select name="areaId" required defaultValue={defaultArea}>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className={formStyles.field}>
            <span>Name</span>
            <input name="name" required maxLength={120} placeholder="e.g. FCC Complex" />
          </label>
          <label className={formStyles.field}>
            <span>Type</span>
            <select name="type" defaultValue="process" required>
              <option value="process">Process</option>
              <option value="utilities">Utilities</option>
              <option value="offsites">Offsites</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className={formStyles.field}>
            <span>Description</span>
            <textarea name="description" rows={3} placeholder="Optional" />
          </label>
          <Text size="sm" tone="mute">
            Unit id is used in URLs (/lineage/units/RFCC).
          </Text>
          <div className={formStyles.actionsRow}>
            <Button
              variant="secondary"
              href={defaultArea ? `/lineage/areas/${defaultArea}` : '/lineage/areas'}
            >
              Cancel
            </Button>
          </div>
        </ActionForm>
      </Surface>
    </Stack>
  );
}
