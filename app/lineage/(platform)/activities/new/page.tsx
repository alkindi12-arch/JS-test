import { Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSession } from '@/lib/auth/session';
import { listTeams } from '@/lib/auth/users';
import { listEquipment } from '@/lib/data/plant';
import { createActivityAction } from '@/lib/data/plant-writes';
import styles from './page.module.css';

export default async function NewActivityPage() {
  const [equipment, teams, session] = await Promise.all([
    listEquipment(),
    listTeams(),
    getSession(),
  ]);

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
              <span>Priority</span>
              <select name="priority" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <span>Assigned team</span>
            <select
              name="teamId"
              required
              defaultValue={session?.teamId ? String(session.teamId) : '1'}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {!session ? (
            <label className={styles.field}>
              <span>Reported by</span>
              <input name="author" placeholder="Your name" defaultValue="Operator" />
            </label>
          ) : (
            <input type="hidden" name="author" value={session.name} />
          )}
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
