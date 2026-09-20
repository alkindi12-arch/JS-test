import { Badge, Stack, Text } from '@/components/design-system';
import { labelActivityStatus, labelActivityType } from '@/lib/format';
import type { Activity, ActivityStatus, Severity } from '@/lib/types/domain';
import styles from './ActivityRow.module.css';
import Link from 'next/link';

function statusTone(status: ActivityStatus) {
  switch (status) {
    case 'open':
      return 'neutral' as const;
    case 'in_progress':
      return 'accent' as const;
    case 'waiting_parts':
      return 'signal' as const;
    case 'completed':
      return 'ok' as const;
    case 'closed':
      return 'neutral' as const;
  }
}

function severityTone(severity: Severity) {
  if (severity === 'emergency' || severity === 'high') return 'danger' as const;
  if (severity === 'medium') return 'signal' as const;
  return 'neutral' as const;
}

export function ActivityRow({ activity, tag }: { activity: Activity; tag?: string }) {
  return (
    <Link href={`/activities/${activity.id}`} className={styles.row}>
      <div className={styles.main}>
        <Stack direction="horizontal" gap={2} wrap>
          <Text mono size="xs" tone="mute">
            {activity.id}
          </Text>
          {tag ? (
            <Text mono size="xs" tone="accent" weight="semibold">
              {tag}
            </Text>
          ) : null}
          {activity.delayed ? (
            <Badge tone="danger" dot>
              Delayed
            </Badge>
          ) : null}
        </Stack>
        <Text weight="semibold" size="md">
          {activity.title}
        </Text>
        <Text size="sm" tone="mute">
          {labelActivityType(activity.type)} · {activity.team} · Updated {activity.lastUpdate}
        </Text>
      </div>
      <div className={styles.meta}>
        <Badge tone={severityTone(activity.severity)}>{activity.severity}</Badge>
        <Badge tone={statusTone(activity.status)} dot>
          {labelActivityStatus(activity.status)}
        </Badge>
      </div>
    </Link>
  );
}
