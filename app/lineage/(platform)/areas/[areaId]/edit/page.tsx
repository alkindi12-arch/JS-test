import { notFound, redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import formStyles from '@/components/domain/EntityForm.module.css';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { deleteAreaAction, updateAreaAction } from '@/lib/data/hierarchy-writes';
import { getArea } from '@/lib/data/plant';

export default async function EditAreaPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) redirect('/lineage/areas');

  const { areaId } = await params;
  const area = await getArea(areaId);
  if (!area) notFound();

  const canDelete = area.unitCount === 0;

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Hierarchy"
        title={`Edit ${area.name}`}
        description={`Area ${area.id}`}
        breadcrumbs={[
          { label: 'Areas', href: '/lineage/areas' },
          { label: area.name, href: `/lineage/areas/${area.id}` },
          { label: 'Edit' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${formStyles.form}`}>
        <ActionForm
          action={updateAreaAction}
          submitLabel="Save area"
          className={formStyles.fields}
        >
          <input type="hidden" name="id" value={area.id} />
          <label className={formStyles.field}>
            <span>Area id</span>
            <input value={area.id} disabled readOnly />
          </label>
          <label className={formStyles.field}>
            <span>Name</span>
            <input name="name" required maxLength={120} defaultValue={area.name} />
          </label>
          <label className={formStyles.field}>
            <span>Description</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={area.description ?? ''}
            />
          </label>
          <div className={formStyles.actionsRow}>
            <Button variant="secondary" href={`/lineage/areas/${area.id}`}>
              Cancel
            </Button>
          </div>
        </ActionForm>

        <div className={formStyles.dangerZone}>
          <Stack gap={3}>
            <Text size="sm" tone="mute">
              {canDelete
                ? 'Remove this area. This cannot be undone.'
                : `Remove blocked — ${area.unitCount} unit(s) still assigned.`}
            </Text>
            {canDelete ? (
              <ActionForm
                action={deleteAreaAction}
                submitLabel="Remove area"
                submitVariant="danger"
                pendingLabel="Removing…"
              >
                <input type="hidden" name="id" value={area.id} />
              </ActionForm>
            ) : null}
          </Stack>
        </div>
      </Surface>
    </Stack>
  );
}
