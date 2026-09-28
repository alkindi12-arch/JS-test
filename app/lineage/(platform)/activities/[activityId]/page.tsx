import { notFound } from 'next/navigation';
import { Badge, Button, Stack, Surface, Text } from '@/components/design-system';
import { AttachmentsPanel } from '@/components/domain/AttachmentsPanel';
import { MarkCompletedButton } from '@/components/domain/MarkCompletedButton';
import { RcaPanel } from '@/components/domain/RcaPanel';
import { WorkOrdersPanel } from '@/components/domain/WorkOrdersPanel';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { labelActivityStatus, labelActivityType } from '@/lib/format';
import {
  attachmentsForActivity,
  getActivity,
  getEquipment,
  getRca,
  updatesForActivity,
  workOrdersForActivity,
} from '@/lib/data/plant';
import styles from './page.module.css';

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const activity = await getActivity(activityId);
  if (!activity) notFound();

  const [eq, updates, attachments, rca, workOrders, caps] = await Promise.all([
    getEquipment(activity.equipmentId),
    updatesForActivity(activity.id),
    attachmentsForActivity(activity.id),
    getRca(activity.id),
    workOrdersForActivity(activity.id),
    getSessionCapabilities(),
  ]);

  const isClosed = activity.status === 'closed';
  const isCompleted = activity.status === 'completed';
  const canComplete = !isCompleted && !isClosed && caps.canComplete;
  const canClose = isCompleted && caps.canClose;
  const canEditRca = !isClosed && (caps.canUpdate || caps.canClose);
  const awaitingSupervisorClose = isCompleted && !caps.canClose;
  const canEditWo = !isClosed && caps.canUpdate;
  const canUpload = !isClosed && caps.canUpdate;

  const startedLabel = activity.openedAt
    ? `Opened ${activity.openedAt}`
    : `Started ${activity.startDate}`;
  const closedLabel = activity.closedAt ? ` · Closed ${activity.closedAt}` : '';

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow={labelActivityType(activity.type)}
        title={activity.title}
        description={`${activity.id} · ${startedLabel}${closedLabel}`}
        breadcrumbs={[
          { label: 'Activities', href: '/lineage/activities' },
          { label: activity.id },
        ]}
        actions={
          <>
            <Button href={`/lineage/equipment/${activity.equipmentId}`} variant="secondary">
              {eq?.tagNumber ?? 'Equipment'}
            </Button>
            {!isClosed && caps.canUpdate ? (
              <Button href={`/lineage/activities/${activity.id}/update`}>Add update</Button>
            ) : null}
          </>
        }
      />

      <div className={`animate-fade-up ${styles.metaRow}`}>
        <Badge tone="accent" dot>
          {labelActivityStatus(activity.status)}
        </Badge>
        <Badge
          tone={
            activity.priority === 'high' || activity.priority === 'emergency'
              ? 'danger'
              : 'signal'
          }
        >
          {activity.priority}
        </Badge>
        <Badge>{activity.team}</Badge>
        {activity.delayed ? <Badge tone="danger">Delayed</Badge> : null}
        {workOrders.map((wo) => (
          <Badge key={wo.id} tone="ok">
            {wo.externalRef}
          </Badge>
        ))}
      </div>

      <div className={styles.split}>
        <Stack gap={4}>
          <Surface pad={5} className="animate-fade-up stagger-1">
            <Stack gap={4}>
              <Text as="h2" display size="xl">
                Daily progress
              </Text>
              <Text size="sm" tone="mute">
                Timeline from Hostinger MySQL — expandable to unlimited updates.
              </Text>
              {updates.length === 0 ? (
                <Text size="sm" tone="mute">
                  No daily updates yet.
                </Text>
              ) : (
                <ol className={styles.timeline}>
                  {updates.map((u, i) => (
                    <li key={u.id} className={styles.event}>
                      <span className={styles.rail} aria-hidden>
                        <span className={styles.dot} />
                        {i < updates.length - 1 ? <span className={styles.line} /> : null}
                      </span>
                      <div className={styles.eventBody}>
                        <Text size="xs" tone="mute">
                          {u.date} · {u.author}
                          {u.progressPct != null ? ` · ${u.progressPct}%` : ''}
                        </Text>
                        <Text size="sm">{u.notes}</Text>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Stack>
          </Surface>

          <Surface pad={5} className="animate-fade-up stagger-2">
            <WorkOrdersPanel
              activityId={activity.id}
              workOrders={workOrders}
              canEdit={canEditWo}
            />
          </Surface>

          <Surface pad={5} className="animate-fade-up stagger-2">
            <RcaPanel
              activityId={activity.id}
              rca={rca}
              canEdit={canEditRca}
              canClose={canClose}
              awaitingSupervisorClose={awaitingSupervisorClose}
            />
          </Surface>
        </Stack>

        <Surface pad={5} className={`animate-fade-up stagger-2 ${styles.side}`}>
          <Stack gap={4}>
            <AttachmentsPanel
              activityId={activity.id}
              attachments={attachments}
              canUpload={canUpload}
            />
            <Text as="h2" display size="lg">
              Next status
            </Text>
            <Text size="sm" tone="mute">
              Open → In Progress → Waiting Parts → Completed → Closed
            </Text>
            {canComplete ? (
              <MarkCompletedButton activityId={activity.id} />
            ) : isClosed ? (
              <Text size="sm" tone="mute">
                Activity is closed.
              </Text>
            ) : isCompleted ? (
              <Text size="sm" tone="mute">
                {caps.canClose
                  ? 'Complete — use RCA panel to close.'
                  : 'Awaiting Supervisor/Admin to close with RCA.'}
              </Text>
            ) : !caps.canComplete ? (
              <Text size="sm" tone="mute">
                Your role ({caps.session?.role ?? 'none'}) cannot mark completed.
              </Text>
            ) : (
              <Text size="sm" tone="mute">
                Use Add update to progress this activity.
              </Text>
            )}
          </Stack>
        </Surface>
      </div>
    </Stack>
  );
}
