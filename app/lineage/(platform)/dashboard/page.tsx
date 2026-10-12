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
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { labelEquipmentStatus } from '@/lib/format';
import {
  getDataSource,
  getKpiSummary,
  listActivities,
  listAreas,
  listEquipment,
} from '@/lib/data/plant';
import styles from './page.module.css';

export default async function DashboardPage() {
  const [areas, activities, equipment, kpiSummary, source, caps] = await Promise.all([
    listAreas(),
    listActivities(),
    listEquipment(),
    getKpiSummary(),
    getDataSource(),
    getSessionCapabilities(),
  ]);
  const recent = activities.filter((a) => a.status !== 'closed').slice(0, 4);
  const tagMap = Object.fromEntries(equipment.map((e) => [e.id, e.tagNumber]));
  const maxDiscipline = Math.max(1, ...kpiSummary.byDiscipline.map((d) => d.count));
  const maxEqStatus = Math.max(1, ...kpiSummary.byEquipmentStatus.map((d) => d.count));

  return (
    <Stack gap={8}>
      <PageHeader
        eyebrow="Plant overview"
        title="Lineage"
        description="Track work from area down to the daily activity timeline — one hierarchy, every screen size."
        actions={
          <>
            <Button href="/lineage/reports" variant="secondary">
              Reports
            </Button>
            <Button href="/lineage/activities" variant="secondary">
              View activities
            </Button>
            {caps.canCreate ? (
              <Button href="/lineage/activities/new">New activity</Button>
            ) : null}
          </>
        }
      />

      <Text size="xs" tone="faint">
        Data source: {source === 'mysql' ? 'Hostinger MySQL' : 'local mock'}
        {caps.session ? ` · ${caps.session.role}` : ''}
      </Text>

      <section className={`animate-fade-up stagger-1 ${styles.kpiSection}`} aria-label="Key metrics">
        <Grid columns={4} gap={4}>
          <Surface pad={5}>
            <KpiMetric label="Active tasks" value={kpiSummary.activeTasks} hint="Open / in progress / waiting" />
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
              hint="Waiting parts or stale > 3 days"
            />
          </Surface>
          <Surface pad={5}>
            <KpiMetric
              label="Completed today"
              value={kpiSummary.completedToday}
              tone="ok"
            />
          </Surface>
          <Surface pad={5}>
            <KpiMetric
              label="Open work orders"
              value={kpiSummary.openWorkOrders}
              hint="Planned / released / in progress"
            />
          </Surface>
          <Surface pad={5}>
            <KpiMetric
              label="Under maintenance"
              value={kpiSummary.equipmentMaintenance}
              tone="signal"
              hint="Equipment status"
            />
          </Surface>
          <Surface pad={5}>
            <KpiMetric
              label="Closed (7 days)"
              value={kpiSummary.closedThisWeek}
              tone="ok"
              hint="Final history"
            />
          </Surface>
          <Surface pad={5} href="/lineage/reports">
            <KpiMetric
              label="Reports"
              value={kpiSummary.closedThisWeek + kpiSummary.completedToday}
              hint="Open report pack library"
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
            <Button href="/lineage/areas" variant="ghost" size="sm">
              All areas
            </Button>
          </Stack>
          <Grid columns={3} gap={4}>
            {areas.map((area) => (
              <Surface key={area.id} href={`/lineage/areas/${area.id}`} pad={5}>
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

      <section className="animate-fade-up stagger-3" aria-label="Load charts">
        <Grid columns={2} gap={4}>
          <Surface pad={5}>
            <Stack gap={4}>
              <Text as="h2" display size="xl">
                Work by discipline
              </Text>
              {kpiSummary.byDiscipline.length === 0 ? (
                <Text size="sm" tone="mute">
                  No active activities yet.
                </Text>
              ) : (
                <div className={styles.disciplineBars}>
                  {kpiSummary.byDiscipline.map((d) => (
                    <div key={d.team} className={styles.disciplineRow}>
                      <Text size="sm" weight="medium">
                        {d.team}
                      </Text>
                      <div className={styles.barTrack} aria-hidden>
                        <div
                          className={styles.barFill}
                          style={{ width: `${(d.count / maxDiscipline) * 100}%` }}
                        />
                      </div>
                      <Text size="sm" mono tone="mute">
                        {d.count}
                      </Text>
                    </div>
                  ))}
                </div>
              )}
            </Stack>
          </Surface>

          <Surface pad={5}>
            <Stack gap={4}>
              <Text as="h2" display size="xl">
                Equipment status
              </Text>
              {kpiSummary.byEquipmentStatus.length === 0 ? (
                <Text size="sm" tone="mute">
                  No equipment loaded.
                </Text>
              ) : (
                <div className={styles.disciplineBars}>
                  {kpiSummary.byEquipmentStatus.map((d) => (
                    <div key={d.status} className={styles.disciplineRowWide}>
                      <Text size="sm" weight="medium">
                        {labelEquipmentStatus(d.status)}
                      </Text>
                      <div className={styles.barTrack} aria-hidden>
                        <div
                          className={styles.barFillAlt}
                          style={{ width: `${(d.count / maxEqStatus) * 100}%` }}
                        />
                      </div>
                      <Text size="sm" mono tone="mute">
                        {d.count}
                      </Text>
                    </div>
                  ))}
                </div>
              )}
            </Stack>
          </Surface>
        </Grid>
      </section>

      <section className="animate-fade-up stagger-4" aria-label="Open activities">
        <Surface pad={5}>
          <Stack gap={2}>
            <Text as="h2" display size="xl">
              Open activity stream
            </Text>
            <Text size="sm" tone="mute">
              Drill into any item for the daily progress timeline. Filter by WO on Activities.
            </Text>
            <div className={styles.stream}>
              {recent.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  tag={tagMap[activity.equipmentId]}
                />
              ))}
              {recent.length === 0 ? (
                <Text size="sm" tone="mute">
                  No open activities.
                </Text>
              ) : null}
            </div>
          </Stack>
        </Surface>
      </section>
    </Stack>
  );
}
