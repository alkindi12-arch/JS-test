import { Badge, Button, Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  labelActivityStatus,
  labelActivityType,
} from '@/lib/format';
import { listReportableActivities } from '@/lib/data/plant';
import styles from './page.module.css';

export default async function ReportsPage() {
  const reports = await listReportableActivities();

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Reports"
        title="Activity report packs"
        description="Print-ready packs with equipment, timeline, attachments, duration, RCA, and work orders. Use Print / Save PDF in the browser."
        breadcrumbs={[
          { label: 'Dashboard', href: '/lineage/dashboard' },
          { label: 'Reports' },
        ]}
        actions={
          <Button href="/api/reports/activities.csv" variant="secondary">
            Export CSV
          </Button>
        }
      />

      <Surface pad={5} className="animate-fade-up">
        <Stack gap={3}>
          <Text size="sm" tone="mute">
            Showing {reports.length} completed/closed activities (newest first).
          </Text>
          {reports.length === 0 ? (
            <Text tone="mute">
              No completed or closed activities yet. Close an activity with RCA to generate a
              report pack.
            </Text>
          ) : (
            <ul className={styles.list}>
              {reports.map((r) => (
                <li key={r.activityId} className={styles.item}>
                  <div className={styles.itemMain}>
                    <Text mono size="xs" tone="mute">
                      {r.activityId} · {r.equipmentTag} · {r.areaName}
                    </Text>
                    <Text as="h2" display size="lg">
                      {r.title}
                    </Text>
                    <div className={styles.meta}>
                      <Badge tone="accent">{labelActivityStatus(r.status)}</Badge>
                      <Badge>{labelActivityType(r.type)}</Badge>
                      <Badge
                        tone={
                          r.priority === 'high' || r.priority === 'emergency'
                            ? 'danger'
                            : 'signal'
                        }
                      >
                        {r.priority}
                      </Badge>
                      {r.hasRca ? <Badge tone="ok">RCA</Badge> : null}
                      {r.workOrderCount > 0 ? (
                        <Badge tone="ok">{r.workOrderCount} WO</Badge>
                      ) : null}
                    </div>
                    <Text size="xs" tone="faint">
                      Started {r.startDate}
                      {r.closedAt ? ` · Closed ${r.closedAt}` : ''}
                    </Text>
                  </div>
                  <Button href={`/lineage/reports/${r.activityId}`}>Open pack</Button>
                </li>
              ))}
            </ul>
          )}
        </Stack>
      </Surface>
    </Stack>
  );
}
