import { notFound } from 'next/navigation';
import { Badge, Button, Stack, Surface, Text } from '@/components/design-system';
import { MarkCompletedButton } from '@/components/domain/MarkCompletedButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { labelActivityStatus, labelActivityType } from '@/lib/format';
import {
  attachmentsForActivity,
  getActivity,
  getEquipment,
  updatesForActivity,
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

  const [eq, updates, attachments] = await Promise.all([
    getEquipment(activity.equipmentId),
    updatesForActivity(activity.id),
    attachmentsForActivity(activity.id),
  ]);

  const canComplete =
    activity.status !== 'completed' && activity.status !== 'closed';

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow={labelActivityType(activity.type)}
        title={activity.title}
        description={`${activity.id} · Started ${activity.startDate}`}
        breadcrumbs={[
          { label: 'Activities', href: '/lineage/activities' },
          { label: activity.id },
        ]}
        actions={
          <>
            <Button href={`/lineage/equipment/${activity.equipmentId}`} variant="secondary">
              {eq?.tagNumber ?? 'Equipment'}
            </Button>
            <Button href={`/lineage/activities/${activity.id}/update`}>Add update</Button>
          </>
        }
      />

      <div className={`animate-fade-up ${styles.metaRow}`}>
        <Badge tone="accent" dot>
          {labelActivityStatus(activity.status)}
        </Badge>
        <Badge
          tone={
            activity.severity === 'high' || activity.severity === 'emergency'
              ? 'danger'
              : 'signal'
          }
        >
          {activity.severity}
        </Badge>
        <Badge>{activity.team}</Badge>
        {activity.delayed ? <Badge tone="danger">Delayed</Badge> : null}
      </div>

      <div className={styles.split}>
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
                      </Text>
                      <Text size="sm">{u.notes}</Text>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Stack>
        </Surface>

        <Surface pad={5} className={`animate-fade-up stagger-2 ${styles.side}`}>
          <Stack gap={4}>
            <Text as="h2" display size="lg">
              Attachments
            </Text>
            {attachments.length === 0 ? (
              <Text size="sm" tone="mute">
                No files linked yet.
              </Text>
            ) : (
              <ul className={styles.files}>
                {attachments.map((f) => (
                  <li key={f.id}>{f.fileName}</li>
                ))}
              </ul>
            )}
            <Text as="h2" display size="lg">
              Next status
            </Text>
            <Text size="sm" tone="mute">
              Open → In Progress → Waiting Parts → Completed → Closed
            </Text>
            <MarkCompletedButton activityId={activity.id} disabled={!canComplete} />
          </Stack>
        </Surface>
      </div>
    </Stack>
  );
}
