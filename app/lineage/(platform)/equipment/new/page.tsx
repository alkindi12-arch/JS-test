import { redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import formStyles from '@/components/domain/EntityForm.module.css';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { createEquipmentAction } from '@/lib/data/hierarchy-writes';
import { listUnits } from '@/lib/data/plant';

export default async function NewEquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string }>;
}) {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) redirect('/lineage/equipment');

  const { unitId: presetUnitId } = await searchParams;
  const units = await listUnits();
  const defaultUnit =
    presetUnitId && units.some((u) => u.id === presetUnitId)
      ? presetUnitId
      : (units[0]?.id ?? '');

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Hierarchy"
        title="New equipment"
        description="Register a tag under a unit. Activities attach to this equipment."
        breadcrumbs={[
          { label: 'Equipment', href: '/lineage/equipment' },
          { label: 'New' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${formStyles.form}`}>
        <ActionForm
          action={createEquipmentAction}
          submitLabel="Create equipment"
          className={formStyles.fields}
        >
          <label className={formStyles.field}>
            <span>Unit</span>
            <select name="unitId" required defaultValue={defaultUnit}>
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
              placeholder="e.g. 120P-002A"
            />
          </label>
          <label className={formStyles.field}>
            <span>Description</span>
            <input
              name="description"
              required
              maxLength={255}
              placeholder="e.g. Crude Charge Pump C"
            />
          </label>
          <div className={formStyles.row}>
            <label className={formStyles.field}>
              <span>Criticality</span>
              <select name="criticality" defaultValue="medium" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className={formStyles.field}>
              <span>Status</span>
              <select name="status" defaultValue="running" required>
                <option value="running">Running</option>
                <option value="standby">Standby</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
          </div>
          <div className={formStyles.row}>
            <label className={formStyles.field}>
              <span>Make</span>
              <input name="make" maxLength={120} placeholder="Optional" />
            </label>
            <label className={formStyles.field}>
              <span>Model</span>
              <input name="model" maxLength={120} placeholder="Optional" />
            </label>
          </div>
          <Text size="sm" tone="mute">
            Equipment id defaults to EQ-{'{tag}'} (e.g. EQ-120P-002A).
          </Text>
          <div className={formStyles.actionsRow}>
            <Button
              variant="secondary"
              href={defaultUnit ? `/lineage/units/${defaultUnit}` : '/lineage/equipment'}
            >
              Cancel
            </Button>
          </div>
        </ActionForm>
      </Surface>
    </Stack>
  );
}
