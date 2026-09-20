import {
  Button,
  Grid,
  KpiMetric,
  Stack,
  Surface,
  Text,
} from '@/components/design-system';
import { ActivityRow } from '@/components/domain/ActivityRow';
import { PageHeader } from '@/components/layout/PageHeader';
import { activities, areas, equipment, kpiSummary } from '@/lib/mock/plant';
import styles from './page.module.css';

export default function DashboardPage() {
  const recent = activities.filter((a) => a.status !== 'closed').slice(0, 4);
  const tagMap = Object.fromEntries(equipment.map((e) => [e.id, e.tagNumber]));

  return (
    <Stack gap={8}>
      <PageHeader
        eyebrow="Plant overview"
        title="Lineage"
        description="Track work from area down to the daily activity timeline — one hierarchy, every screen size."
        actions={
          <>
            <Button href="/activities" variant="secondary">
              View activities
            </Button>
            <Button href="/activities/new">
              New activity
            </Button>
          </>
        }
      />

      <section className={`animate-fade-up stagger-1 ${styles.kpiSection}`} aria-label="Key metrics">
        <Grid columns={4} gap={4}>
          <Surface pad={5}>
            <KpiMetric label="Active tasks" value={kpiSummary.activeTasks} hint="Across all areas" />
          </Surface>
          <Surface pad={5}>
            <KpiMetric
              label="Critical"
              value={kpiSummary.criticalTasks}
              tone="danger"
              hint="High / emergency"
            />
          </Surface>
          <Surface pad={5}>
            <KpiMetric
              label="Delayed"
              value={kpiSummary.delayedTasks}
              tone="signal"
              hint="Past SLA / stale updates"
            />
          </Surface>
          <Surface pad={5}>
            <KpiMetric
              label="Completed today"
              value={kpiSummary.completedToday}
              tone="ok"
            />
          </Surface>
        </Grid>
      </section>

      <section className="animate-fade-up stagger-2" aria-label="Areas">
        <Stack gap={4}>
          <Stack direction="horizontal" justify="between" align="center" wrap gap={3}>
            <Text as="h2" display size="xl">
              Areas
            </Text>
            <Button href="/areas" variant="ghost" size="sm">
              All areas
            </Button>
          </Stack>
          <Grid columns={3} gap={4}>
            {areas.map((area) => (
              <Surface key={area.id} href={`/areas/${area.id}`} pad={5}>
                <Stack gap={3}>
                  <Text mono size="xs" tone="mute">
                    {area.id}
                  </Text>
                  <Text as="h3" display size="lg">
                    {area.name}
                  </Text>
                  <Text size="sm" tone="mute">
                    {area.description}
                  </Text>
                  <div className={styles.areaStats}>
                    <span>
                      <strong>{area.unitCount}</strong> units
                    </span>
                    <span>
                      <strong>{area.activeIssues}</strong> active
                    </span>
                    <span className={area.criticalAlerts ? styles.critical : undefined}>
                      <strong>{area.criticalAlerts}</strong> critical
                    </span>
                  </div>
                </Stack>
              </Surface>
            ))}
          </Grid>
        </Stack>
      </section>

      <section className="animate-fade-up stagger-3" aria-label="Discipline load">
        <Surface pad={5}>
          <Stack gap={4}>
            <Text as="h2" display size="xl">
              Work by discipline
            </Text>
            <div className={styles.disciplineBars}>
              {kpiSummary.byDiscipline.map((d) => (
                <div key={d.team} className={styles.disciplineRow}>
                  <Text size="sm" weight="medium">
                    {d.team}
                  </Text>
                  <div className={styles.barTrack} aria-hidden>
                    <div
                      className={styles.barFill}
                      style={{ width: `${(d.count / 9) * 100}%` }}
                    />
                  </div>
                  <Text size="sm" mono tone="mute">
                    {d.count}
                  </Text>
                </div>
              ))}
            </div>
          </Stack>
        </Surface>
      </section>

      <section className="animate-fade-up stagger-4" aria-label="Open activities">
        <Surface pad={5}>
          <Stack gap={2}>
            <Text as="h2" display size="xl">
              Open activity stream
            </Text>
            <Text size="sm" tone="mute">
              Drill into any item for the daily progress timeline.
            </Text>
            <div className={styles.stream}>
              {recent.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  tag={tagMap[activity.equipmentId]}
                />
              ))}
            </div>
          </Stack>
        </Surface>
      </section>
    </Stack>
  );
}
