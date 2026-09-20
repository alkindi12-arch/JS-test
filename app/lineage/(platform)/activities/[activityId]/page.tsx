import { notFound } from 'next/navigation';
import { Badge, Button, Stack, Surface, Text } from '@/components/design-system';
import { PageHeader } from '@/components/layout/PageHeader';
import { labelActivityStatus, labelActivityType } from '@/lib/format';
import { getActivity, getEquipment } from '@/lib/mock/plant';
import styles from './page.module.css';

const sampleUpdates = [
  {
    id: 'u1',
    date: '2026-09-18 · 09:40',
    author: 'Tech. Rahman',
    notes: 'Vibration confirmed on DE bearing. Peak 12.4 mm/s. Isolation requested.',
  },
  {
    id: 'u2',
    date: '2026-09-19 · 14:15',
    author: 'Tech. Rahman',
    notes: 'Bearing housing opened. Evidence of lubricant degradation. Parts indent raised.',
  },
  {
    id: 'u3',
    date: '2026-09-20 · 08:05',
    author: 'Superv. Khan',
    notes: 'Waiting seal kit ETA tomorrow. Continue standby on 120P-001B.',
  },
];

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const activity = getActivity(activityId);
  if (!activity) notFound();
  const eq = getEquipment(activity.equipmentId);

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
        <Badge tone={activity.severity === 'high' ? 'danger' : 'signal'}>
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
              Timeline pattern — expandable to unlimited updates and attachments.
            </Text>
            <ol className={styles.timeline}>
              {sampleUpdates.map((u, i) => (
                <li key={u.id} className={styles.event}>
                  <span className={styles.rail} aria-hidden>
                    <span className={styles.dot} />
                    {i < sampleUpdates.length - 1 ? <span className={styles.line} /> : null}
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
          </Stack>
        </Surface>

        <Surface pad={5} className={`animate-fade-up stagger-2 ${styles.side}`}>
          <Stack gap={4}>
            <Text as="h2" display size="lg">
              Attachments
            </Text>
            <ul className={styles.files}>
              <li>vibration_trend_0918.jpg</li>
              <li>permit_LOTO_1042.pdf</li>
              <li>bearing_housing.mp4</li>
            </ul>
            <Text as="h2" display size="lg">
              Next status
            </Text>
            <Text size="sm" tone="mute">
              Open → In Progress → Waiting Parts → Completed → Closed
            </Text>
            <Button variant="secondary" block>
              Mark completed
            </Button>
          </Stack>
        </Surface>
      </div>
    </Stack>
  );
}
