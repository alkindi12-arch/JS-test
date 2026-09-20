import { Button, Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';
import styles from './page.module.css';

export default function NewActivityPage() {
  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Create"
        title="New activity"
        description="Concept form — wired to design-system inputs. API persistence comes in Phase 1."
        breadcrumbs={[
          { label: 'Activities', href: '/activities' },
          { label: 'New' },
        ]}
      />

      <Surface pad={5} className={`animate-fade-up ${styles.form}`}>
        <form className={styles.fields}>
          <label className={styles.field}>
            <span>Title</span>
            <input name="title" placeholder="e.g. Pump vibration high" />
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
            <span>Description</span>
            <textarea name="description" rows={4} placeholder="Issue details, symptoms, location…" />
          </label>
          <div className={styles.actions}>
            <Button variant="secondary" href="/activities">
              Cancel
            </Button>
            <Button type="button">Save as open</Button>
          </div>
        </form>
      </Surface>
    </Stack>
  );
}
