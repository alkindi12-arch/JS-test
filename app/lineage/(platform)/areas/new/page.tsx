import { redirect } from 'next/navigation';
import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import formStyles from '@/components/domain/EntityForm.module.css';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { createAreaAction } from '@/lib/data/hierarchy-writes';

export default async function NewAreaPage() {
  const caps = await getSessionCapabilities();
  if (!caps.canAdmin) redirect('/lineage/areas');

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Hierarchy"
        title="New area"
        description="Add a plant section. Units and equipment nest under the area."
        breadcrumbs={[
          { label: 'Areas', href: '/lineage/areas' },
          { label: 'New' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${formStyles.form}`}>
        <ActionForm
          action={createAreaAction}
          submitLabel="Create area"
          className={formStyles.fields}
        >
          <label className={formStyles.field}>
            <span>Area id</span>
            <input
              name="id"
              required
              maxLength={32}
              placeholder="e.g. A04"
              pattern="[A-Za-z][A-Za-z0-9_-]*"
            />
          </label>
          <label className={formStyles.field}>
            <span>Name</span>
            <input name="name" required maxLength={120} placeholder="e.g. Reforming Complex" />
          </label>
          <label className={formStyles.field}>
            <span>Description</span>
            <textarea name="description" rows={3} placeholder="Optional summary" />
          </label>
          <Text size="sm" tone="mute">
            Id becomes the URL segment (/lineage/areas/A04). Use a short plant code.
          </Text>
          <div className={formStyles.actionsRow}>
            <Button variant="secondary" href="/lineage/areas">
              Cancel
            </Button>
          </div>
        </ActionForm>
      </Surface>
    </Stack>
  );
}
