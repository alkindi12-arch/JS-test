import { notFound, redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import { EquipmentSearchSelect } from '@/components/domain/EquipmentSearchSelect';
import formStyles from '@/components/domain/EntityForm.module.css';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { updateActivityAction } from '@/lib/data/plant-writes';
import { getActivity, listEquipment } from '@/lib/data/plant';

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) redirect('/lineage/activities');

  const { activityId } = await params;
  const [activity, equipment] = await Promise.all([
    getActivity(activityId),
    listEquipment(),
  ]);
  if (!activity) notFound();

  const equipmentOptions = equipment.map((e) => ({
    id: e.id,
    tagNumber: e.tagNumber,
    description: e.description,
  }));

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Edit"
        title={`Edit ${activity.id}`}
        description="Change title, equipment, type, or priority. Status still follows the lifecycle."
        breadcrumbs={[
          { label: 'Activities', href: '/lineage/activities' },
          { label: activity.id, href: `/lineage/activities/${activity.id}` },
          { label: 'Edit' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${formStyles.form}`}>
        <ActionForm
          action={updateActivityAction}
          submitLabel="Save activity"
          className={formStyles.fields}
        >
          <input type="hidden" name="activityId" value={activity.id} />
          <label className={formStyles.field}>
            <span>Title</span>
            <input name="title" required maxLength={255} defaultValue={activity.title} />
          </label>
          <EquipmentSearchSelect
            equipment={equipmentOptions}
            defaultValue={activity.equipmentId}
            required
          />
          <div className={formStyles.row}>
            <label className={formStyles.field}>
              <span>Type</span>
              <select name="type" defaultValue={activity.type} required>
                <option value="breakdown">Breakdown</option>
                <option value="pm">PM</option>
                <option value="inspection">Inspection</option>
                <option value="routine">Routine</option>
                <option value="project">Project</option>
              </select>
            </label>
            <label className={formStyles.field}>
              <span>Priority</span>
              <select name="priority" defaultValue={activity.priority} required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </label>
          </div>
          <Text size="sm" tone="mute">
            Assigned to Rotating (fixed for this plant).
          </Text>
          <div className={formStyles.actionsRow}>
            <Button variant="secondary" href={`/lineage/activities/${activity.id}`}>
              Cancel
            </Button>
          </div>
        </ActionForm>
      </Surface>
    </Stack>
  );
}
