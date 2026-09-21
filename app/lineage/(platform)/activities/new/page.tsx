import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { listEquipment } from '@/lib/data/plant';
import { createActivityAction } from '@/lib/data/plant-writes';
import styles from './page.module.css';

export default async function NewActivityPage() {
  const equipment = await listEquipment();

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Create"
        title="New activity"
        description="Saves to Hostinger MySQL as status Open. Description becomes the first timeline entry."
        breadcrumbs={[
          { label: 'Activities', href: '/lineage/activities' },
          { label: 'New' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${styles.form}`}>
        <ActionForm
          action={createActivityAction}
          submitLabel="Save as open"
          className={styles.fields}
        >
          <label className={styles.field}>
            <span>Equipment</span>
            <select name="equipmentId" required defaultValue="">
              <option value="" disabled>
                Select tag…
              </option>
              {equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.tagNumber} — {e.description}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Title</span>
            <input name="title" required placeholder="e.g. Pump vibration high" />
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>Type</span>
              <select name="type" defaultValue="breakdown">
                <option value="breakdown">Breakdown</option>
                <option value="pm">PM</option>
                <option value="inspection">Inspection</option>
                <option value="routine">Routine</option>
                <option value="project">Project</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Severity</span>
              <select name="severity" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <span>Assigned team</span>
            <select name="team" defaultValue="rotating">
              <option value="rotating">Rotating</option>
              <option value="electrical">Electrical</option>
              <option value="instrument">Instrument</option>
              <option value="static">Static</option>
              <option value="ops">Ops</option>
              <option value="vendor">Vendor</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Reported by</span>
            <input name="author" placeholder="Your name" defaultValue="Operator" />
          </label>
          <label className={styles.field}>
            <span>Description</span>
            <textarea
              name="description"
              rows={4}
              placeholder="Issue details, symptoms, location…"
            />
          </label>
          <div className={styles.actionsRow}>
            <Button variant="secondary" href="/lineage/activities">
              Cancel
            </Button>
          </div>
        </ActionForm>
      </Surface>
    </Stack>
  );
}
