import { notFound, redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import formStyles from '@/components/domain/EntityForm.module.css';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import {
  deleteEquipmentAction,
  updateEquipmentAction,
} from '@/lib/data/hierarchy-writes';
import { activitiesForEquipment, getEquipment, listUnits } from '@/lib/data/plant';

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) redirect('/lineage/equipment');

  const { equipmentId } = await params;
  const [item, units, activities] = await Promise.all([
    getEquipment(equipmentId),
    listUnits(),
    activitiesForEquipment(equipmentId),
  ]);
  if (!item) notFound();

  const canDelete = activities.length === 0;

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Hierarchy"
        title={`Edit ${item.tagNumber}`}
        description={item.description}
        breadcrumbs={[
          { label: 'Equipment', href: '/lineage/equipment' },
          { label: item.tagNumber, href: `/lineage/equipment/${item.id}` },
          { label: 'Edit' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${formStyles.form}`}>
        <ActionForm
          action={updateEquipmentAction}
          submitLabel="Save equipment"
          className={formStyles.fields}
        >
          <input type="hidden" name="id" value={item.id} />
          <label className={formStyles.field}>
            <span>Equipment id</span>
            <input value={item.id} disabled readOnly />
          </label>
          <label className={formStyles.field}>
            <span>Unit</span>
            <select name="unitId" required defaultValue={item.unitId}>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id} — {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className={formStyles.field}>
            <span>Tag number</span>
            <input
              name="tagNumber"
              required
              maxLength={64}
              defaultValue={item.tagNumber}
            />
          </label>
          <label className={formStyles.field}>
            <span>Description</span>
            <input
              name="description"
              required
              maxLength={255}
              defaultValue={item.description}
            />
          </label>
          <label className={formStyles.field}>
            <span>Criticality</span>
            <select name="criticality" defaultValue={item.criticality} required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <div className={formStyles.row}>
            <label className={formStyles.field}>
              <span>Make</span>
              <input name="make" maxLength={120} defaultValue={item.make ?? ''} />
            </label>
            <label className={formStyles.field}>
              <span>Model</span>
              <input name="model" maxLength={120} defaultValue={item.model ?? ''} />
            </label>
          </div>
          <Text size="sm" tone="mute">
            Change running status from the equipment profile (status timeline).
          </Text>
          <div className={formStyles.actionsRow}>
            <Button variant="secondary" href={`/lineage/equipment/${item.id}`}>
              Cancel
            </Button>
          </div>
        </ActionForm>

        <div className={formStyles.dangerZone}>
          <Stack gap={3}>
            <Text size="sm" tone="mute">
              {canDelete
                ? 'Remove this equipment tag. This cannot be undone.'
                : `Remove blocked — ${activities.length} activity record(s) exist.`}
            </Text>
            {canDelete ? (
              <ActionForm
                action={deleteEquipmentAction}
                submitLabel="Remove equipment"
                submitVariant="danger"
                pendingLabel="Removing…"
              >
                <input type="hidden" name="id" value={item.id} />
              </ActionForm>
            ) : null}
          </Stack>
        </div>
      </Surface>
    </Stack>
  );
}
