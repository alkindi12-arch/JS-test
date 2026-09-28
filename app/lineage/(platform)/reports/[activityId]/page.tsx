import { notFound } from 'next/navigation';
import { Badge, Button, Stack, Text } from '@/components/design-system';
import { PrintReportButton } from '@/components/domain/PrintReportButton';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  labelActivityStatus,
  labelActivityType,
  labelEquipmentStatus,
  labelWorkOrderStatus,
} from '@/lib/format';
import { isImageAttachment } from '@/lib/data/mappers';
import { getActivityReportPack } from '@/lib/data/plant';
import styles from './page.module.css';

export default async function ActivityReportPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const pack = await getActivityReportPack(activityId);
  if (!pack) notFound();

  const { activity, equipment, updates, attachments, rca, workOrders } = pack;
  const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

  return (
    <Stack gap={6}>
      <div className={styles.noPrint}>
        <PageHeader
          eyebrow="Report pack"
          title={activity.title}
          description={`${activity.id} · Print or Save as PDF from your browser`}
          breadcrumbs={[
            { label: 'Reports', href: '/lineage/reports' },
            { label: activity.id },
          ]}
          actions={
            <>
              <Button href={`/lineage/activities/${activity.id}`} variant="secondary">
                Open activity
              </Button>
              <PrintReportButton />
            </>
          }
        />
      </div>

      <article className={`animate-fade-up ${styles.report}`}>
        <header className={styles.reportHeader}>
          <Text as="h1" display size="2xl">
            Lineage activity report
          </Text>
          <Text size="sm" tone="mute">
            Generated {generatedAt} · Alkinda / Lineage
          </Text>
        </header>

        <section className={styles.section}>
          <Text as="h2" display size="xl">
            1. Equipment
          </Text>
          <dl className={styles.grid}>
            <div>
              <dt>Tag</dt>
              <dd>{equipment.tagNumber}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{equipment.description}</dd>
            </div>
            <div>
              <dt>Area / Unit</dt>
              <dd>
                {pack.areaName} ({pack.areaId}) · {pack.unitName} ({pack.unitId})
              </dd>
            </div>
            <div>
              <dt>Criticality / Status</dt>
              <dd>
                {equipment.criticality} · {labelEquipmentStatus(equipment.status)}
              </dd>
            </div>
            <div>
              <dt>Make / Model</dt>
              <dd>
                {equipment.make ?? '—'} {equipment.model ? `· ${equipment.model}` : ''}
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl">
            2. Activity
          </Text>
          <dl className={styles.grid}>
            <div>
              <dt>ID / Title</dt>
              <dd>
                {activity.id} — {activity.title}
              </dd>
            </div>
            <div>
              <dt>Type / Priority / Status</dt>
              <dd>
                {labelActivityType(activity.type)} · {activity.priority} ·{' '}
                {labelActivityStatus(activity.status)}
              </dd>
            </div>
            <div>
              <dt>Team</dt>
              <dd>{activity.team}</dd>
            </div>
            <div>
              <dt>Opened / Closed</dt>
              <dd>
                {activity.openedAt ?? activity.startDate}
                {' → '}
                {activity.closedAt ?? '—'}
              </dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>
                {pack.durationDays == null ? '—' : `${pack.durationDays} day(s)`}
              </dd>
            </div>
          </dl>
          <div className={styles.badges}>
            <Badge tone="accent">{labelActivityStatus(activity.status)}</Badge>
            <Badge>{labelActivityType(activity.type)}</Badge>
            <Badge
              tone={
                activity.priority === 'high' || activity.priority === 'emergency'
                  ? 'danger'
                  : 'signal'
              }
            >
              {activity.priority}
            </Badge>
          </div>
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl">
            3. Daily updates
          </Text>
          {updates.length === 0 ? (
            <Text size="sm" tone="mute">
              No updates recorded.
            </Text>
          ) : (
            <ol className={styles.timeline}>
              {updates.map((u) => (
                <li key={u.id}>
                  <Text size="xs" tone="mute">
                    {u.date} · {u.author}
                    {u.progressPct != null ? ` · ${u.progressPct}%` : ''}
                  </Text>
                  <Text size="sm">{u.notes}</Text>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl">
            4. Photos & attachments
          </Text>
          {attachments.length === 0 ? (
            <Text size="sm" tone="mute">
              No attachments.
            </Text>
          ) : (
            <>
              {attachments.some((f) => isImageAttachment(f) && f.fileUrl && f.fileUrl !== '#') ? (
                <div className={styles.photoGrid}>
                  {attachments
                    .filter((f) => isImageAttachment(f) && f.fileUrl && f.fileUrl !== '#')
                    .map((f) => (
                      <figure key={f.id} className={styles.photoCard}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={f.fileUrl}
                          alt={f.comment || f.fileName}
                          className={styles.photo}
                        />
                        <figcaption className={styles.photoCaption}>
                          <Text size="xs" tone="mute">
                            {f.fileName}
                            {f.uploadedBy ? ` · ${f.uploadedBy}` : ''}
                          </Text>
                          <Text size="sm">
                            {f.comment?.trim() ? f.comment : 'No comment'}
                          </Text>
                        </figcaption>
                      </figure>
                    ))}
                </div>
              ) : null}

              {attachments.some((f) => !isImageAttachment(f) || !f.fileUrl || f.fileUrl === '#') ? (
                <ul className={styles.files}>
                  {attachments
                    .filter((f) => !isImageAttachment(f) || !f.fileUrl || f.fileUrl === '#')
                    .map((f) => (
                      <li key={f.id}>
                        {f.fileUrl && f.fileUrl !== '#' ? (
                          <a href={f.fileUrl}>{f.fileName}</a>
                        ) : (
                          <span>
                            {f.fileName}
                            {!f.fileUrl || f.fileUrl === '#' ? ' (placeholder)' : ''}
                          </span>
                        )}
                        {f.comment?.trim() ? (
                          <div className={styles.fileComment}>{f.comment}</div>
                        ) : null}
                        {f.fileSize != null ? (
                          <span className={styles.fileMeta}> · {f.fileSize} bytes</span>
                        ) : null}
                      </li>
                    ))}
                </ul>
              ) : null}
            </>
          )}
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl">
            5. Work orders
          </Text>
          {workOrders.length === 0 ? (
            <Text size="sm" tone="mute">
              No work orders linked.
            </Text>
          ) : (
            <ul className={styles.files}>
              {workOrders.map((wo) => (
                <li key={wo.id}>
                  <strong>{wo.externalRef}</strong>
                  {' · '}
                  {labelWorkOrderStatus(wo.status)}
                  {wo.title ? ` · ${wo.title}` : ''}
                  {(wo.plannedStart || wo.plannedFinish) &&
                    ` · ${wo.plannedStart ?? '—'} → ${wo.plannedFinish ?? '—'}`}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl">
            6. Root cause analysis
          </Text>
          {rca ? (
            <dl className={styles.grid}>
              <div>
                <dt>Failure mode</dt>
                <dd>{rca.failureMode || '—'}</dd>
              </div>
              <div>
                <dt>Root cause</dt>
                <dd>{rca.rootCause || '—'}</dd>
              </div>
              <div>
                <dt>Corrective action</dt>
                <dd>{rca.correctiveAction || '—'}</dd>
              </div>
              <div>
                <dt>Verified</dt>
                <dd>
                  {rca.verifiedAt
                    ? `${rca.verifiedAt}${rca.verifiedByName ? ` by ${rca.verifiedByName}` : ''}`
                    : 'Not verified'}
                </dd>
              </div>
            </dl>
          ) : (
            <Text size="sm" tone="mute">
              No RCA recorded for this activity.
            </Text>
          )}
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl">
            7. Approval
          </Text>
          <div className={styles.signature}>
            <div>
              <Text size="sm" tone="mute">
                Supervisor / Admin
              </Text>
              <Text size="md">{rca?.verifiedByName ?? '________________'}</Text>
            </div>
            <div>
              <Text size="sm" tone="mute">
                Timestamp
              </Text>
              <Text size="md">{rca?.verifiedAt ?? '________________'}</Text>
            </div>
          </div>
        </section>
      </article>
    </Stack>
  );
}
