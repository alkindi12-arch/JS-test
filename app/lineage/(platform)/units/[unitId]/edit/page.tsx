import { notFound, redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import formStyles from '@/components/domain/EntityForm.module.css';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { deleteUnitAction, updateUnitAction } from '@/lib/data/hierarchy-writes';
import { getUnit, listAreas } from '@/lib/data/plant';

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) redirect('/lineage/areas');

  const { unitId } = await params;
  const [unit, areas] = await Promise.all([getUnit(unitId), listAreas()]);
  if (!unit) notFound();

  const canDelete = unit.equipmentCount === 0;

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Hierarchy"
        title={`Edit ${unit.name}`}
        description={`Unit ${unit.id}`}
        breadcrumbs={[
          { label: 'Areas', href: '/lineage/areas' },
          { label: unit.areaId, href: `/lineage/areas/${unit.areaId}` },
          { label: unit.id, href: `/lineage/units/${unit.id}` },
          { label: 'Edit' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${formStyles.form}`}>
        <ActionForm
          action={updateUnitAction}
          submitLabel="Save unit"
          className={formStyles.fields}
        >
          <input type="hidden" name="id" value={unit.id} />
          <label className={formStyles.field}>
            <span>Unit id</span>
            <input value={unit.id} disabled readOnly />
          </label>
          <label className={formStyles.field}>
            <span>Area</span>
            <select name="areaId" required defaultValue={unit.areaId}>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className={formStyles.field}>
            <span>Name</span>
            <input name="name" required maxLength={120} defaultValue={unit.name} />
          </label>
          <label className={formStyles.field}>
            <span>Type</span>
            <select name="type" defaultValue={unit.type} required>
              <option value="process">Process</option>
              <option value="utilities">Utilities</option>
              <option value="offsites">Offsites</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className={formStyles.field}>
            <span>Description</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Optional"
              defaultValue={unit.description ?? ''}
            />
          </label>
          <div className={formStyles.actionsRow}>
            <Button variant="secondary" href={`/lineage/units/${unit.id}`}>
              Cancel
            </Button>
          </div>
        </ActionForm>

        <div className={formStyles.dangerZone}>
          <Stack gap={3}>
            <Text size="sm" tone="mute">
              {canDelete
                ? 'Remove this unit. This cannot be undone.'
                : `Remove blocked — ${unit.equipmentCount} equipment tag(s) still assigned.`}
            </Text>
            {canDelete ? (
              <ActionForm
                action={deleteUnitAction}
                submitLabel="Remove unit"
                submitVariant="danger"
                pendingLabel="Removing…"
              >
                <input type="hidden" name="id" value={unit.id} />
              </ActionForm>
            ) : null}
          </Stack>
        </div>
      </Surface>
    </Stack>
  );
}
