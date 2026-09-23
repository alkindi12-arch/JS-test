import { notFound } from 'next/navigation';
import { Badge, Button, Grid, Stack, Surface, Text } from '@/components/design-system';
import { ActivityRow } from '@/components/domain/ActivityRow';
import { EquipmentStatusForm } from '@/components/domain/EquipmentStatusForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { labelEquipmentStatus } from '@/lib/format';
import {
  activitiesForEquipment,
  getEquipment,
  getUnit,
  statusHistoryForEquipment,
} from '@/lib/data/plant';
import styles from './page.module.css';

function reasonLabel(reason: string | null | undefined) {
  const map: Record<string, string> = {
    baseline: 'Baseline',
    manual: 'Manual change',
    activity_opened: 'Activity opened',
    activity_closed: 'Activity closed',
  };
  return reason ? (map[reason] ?? reason) : 'Status change';
}

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;
  const item = await getEquipment(equipmentId);
  if (!item) notFound();
  const [unit, history, statusHistory] = await Promise.all([
    getUnit(item.unitId),
    activitiesForEquipment(item.id),
    statusHistoryForEquipment(item.id),
  ]);

  return (
    <Stack gap={6}>
      <PageHeader
        eyebrow="Equipment profile"
        title={item.tagNumber}
        description={item.description}
        breadcrumbs={[
          { label: 'Equipment', href: '/lineage/equipment' },
          ...(unit ? [{ label: unit.id, href: `/lineage/units/${unit.id}` }] : []),
          { label: item.tagNumber },
        ]}
        actions={<Button href="/lineage/activities/new">Create activity</Button>}
      />

      <Grid columns={3} gap={4} className="animate-fade-up">
        <Surface pad={5}>
          <Stack gap={2}>
            <Text size="sm" tone="mute">
              Status
            </Text>
            <Badge tone={item.status === 'maintenance' ? 'danger' : 'ok'} dot>
              {labelEquipmentStatus(item.status)}
            </Badge>
          </Stack>
        </Surface>
        <Surface pad={5}>
          <Stack gap={2}>
            <Text size="sm" tone="mute">
              Criticality
            </Text>
            <Text display size="lg" weight="bold">
              {item.criticality}
            </Text>
          </Stack>
        </Surface>
        <Surface pad={5}>
          <Stack gap={2}>
            <Text size="sm" tone="mute">
              Make / model
            </Text>
            <Text size="md">
              {item.make ?? '—'} {item.model ? `· ${item.model}` : ''}
            </Text>
          </Stack>
        </Surface>
      </Grid>

      <div className={styles.split}>
        <Surface pad={5} className="animate-fade-up stagger-1">
          <Stack gap={4}>
            <Text as="h2" display size="xl">
              Status timeline
            </Text>
            <Text size="sm" tone="mute">
              Auditable history from Hostinger MySQL — seeded at Phase C, updated on changes.
            </Text>
            {statusHistory.length === 0 ? (
              <Text size="sm" tone="mute">
                No status history yet.
              </Text>
            ) : (
              <ol className={styles.timeline}>
                {statusHistory.map((entry, i) => (
                  <li key={entry.id} className={styles.event}>
                    <span className={styles.rail} aria-hidden>
                      <span className={styles.dot} />
                      {i < statusHistory.length - 1 ? <span className={styles.line} /> : null}
                    </span>
                    <div className={styles.eventBody}>
                      <Text size="xs" tone="mute">
                        {entry.changedAt}
                        {entry.changedByName ? ` · ${entry.changedByName}` : ''}
                      </Text>
                      <Text size="sm">
                        {entry.previousStatus
                          ? `${labelEquipmentStatus(entry.previousStatus)} → `
                          : ''}
                        <strong>{labelEquipmentStatus(entry.status)}</strong>
                        {' · '}
                        {reasonLabel(entry.reason)}
                      </Text>
                      {entry.notes ? (
                        <Text size="sm" tone="mute">
                          {entry.notes}
                        </Text>
                      ) : null}
                      {entry.activityId ? (
                        <Text size="xs" tone="faint">
                          Linked activity {entry.activityId}
                        </Text>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Stack>
        </Surface>

        <Surface pad={5} className={`animate-fade-up stagger-2 ${styles.side}`}>
          <EquipmentStatusForm equipmentId={item.id} currentStatus={item.status} />
        </Surface>
      </div>

      <Surface pad={5} className="animate-fade-up stagger-2">
        <Stack gap={3}>
          <Text as="h2" display size="xl">
            Activity history
          </Text>
          {history.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
          {history.length === 0 ? (
            <Text tone="mute">No activities recorded yet.</Text>
          ) : null}
        </Stack>
      </Surface>
    </Stack>
  );
}
