import { notFound } from 'next/navigation';
import { Badge, Button, Stack, Surface, Text } from '@/components/design-system';
import { ActionForm } from '@/components/domain/ActionForm';
import { AttachmentsPanel } from '@/components/domain/AttachmentsPanel';
import { DailyProgressPanel } from '@/components/domain/DailyProgressPanel';
import { MarkCompletedButton } from '@/components/domain/MarkCompletedButton';
import { RcaPanel } from '@/components/domain/RcaPanel';
import { WorkOrdersPanel } from '@/components/domain/WorkOrdersPanel';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSessionCapabilities } from '@/lib/auth/permissions';
import { labelActivityStatus, labelActivityType } from '@/lib/format';
import { deleteActivityAction } from '@/lib/data/plant-writes';
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
  const canEditRca = (!isClosed && (caps.canUpdate || caps.canClose)) || caps.canAdmin;
  const awaitingSupervisorClose = isCompleted && !caps.canClose;
  const canManageChildren = (!isClosed && caps.canUpdate) || caps.canAdmin;
  const canUpload = canManageChildren;
  const canEditWo = canManageChildren;

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
            {caps.canAdmin ? (
              <Button
                href={`/lineage/activities/${activity.id}/edit`}
                variant="secondary"
              >
                Edit activity
              </Button>
            ) : null}
            {(!isClosed && caps.canUpdate) || caps.canAdmin ? (
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
            <DailyProgressPanel
              activityId={activity.id}
              updates={updates}
              canManage={canManageChildren}
            />
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

          {caps.canAdmin ? (
            <Surface pad={5} className="animate-fade-up stagger-3">
              <Stack gap={3}>
                <Text as="h2" display size="lg">
                  Remove activity
                </Text>
                <Text size="sm" tone="mute">
                  Soft-deletes this activity from lists and reports. Related updates and
                  files stay in the database for audit.
                </Text>
                <ActionForm
                  action={deleteActivityAction}
                  submitLabel="Delete activity"
                  submitVariant="danger"
                  pendingLabel="Deleting…"
                >
                  <input type="hidden" name="activityId" value={activity.id} />
                </ActionForm>
              </Stack>
            </Surface>
          ) : null}
        </Stack>

        <Surface pad={5} className={`animate-fade-up stagger-2 ${styles.side}`}>
          <Stack gap={4}>
            <AttachmentsPanel
              activityId={activity.id}
              attachments={attachments}
              canUpload={canUpload}
              canDelete={canManageChildren}
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
