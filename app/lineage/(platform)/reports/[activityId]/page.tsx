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
import type { DailyUpdate } from '@/lib/types/domain';
import styles from './page.module.css';

/** System lifecycle notes — useful on the activity page, not in print reports. */
const SYSTEM_UPDATE_NOTES = new Set([
  'Reopened to In Progress.',
  'Marked completed.',
  'Activity closed with RCA verified.',
]);

function isSystemUpdate(u: DailyUpdate): boolean {
  const notes = (u.notes ?? '').trim();
  if (SYSTEM_UPDATE_NOTES.has(notes)) return true;
  if (/^Activity closed with RCA/i.test(notes)) return true;
  if (/^Reopened to In Progress/i.test(notes)) return true;
  if (/^Marked completed\.?$/i.test(notes)) return true;
  return false;
}

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

  const reportUpdates = updates.filter((u) => !isSystemUpdate(u));
  const findings = reportUpdates
    .map((u) => ({
      id: u.id,
      date: u.date,
      author: u.author,
      text: (u.findings ?? '').trim(),
    }))
    .filter((f) => f.text.length > 0);

  const photoAttachments = attachments.filter(
    (f) => isImageAttachment(f) && f.fileUrl && f.fileUrl !== '#',
  );
  const otherAttachments = attachments.filter(
    (f) => !isImageAttachment(f) || !f.fileUrl || f.fileUrl === '#',
  );

  const opened = activity.openedAt ?? activity.startDate;
  const closed = activity.closedAt ?? '—';

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
        <header className={styles.cover}>
          <div className={styles.coverBrand}>
            <Text size="xs" tone="mute" className={styles.eyebrow}>
              Alkinda · Lineage Equipment History
            </Text>
            <Text as="h1" display size="2xl" className={styles.coverTitle}>
              {activity.title}
            </Text>
            <Text size="sm" tone="mute">
              Activity report · {activity.id}
            </Text>
          </div>
          <div className={styles.coverMeta}>
            <div>
              <span className={styles.metaLabel}>Equipment</span>
              <span className={styles.metaValue}>
                {equipment.tagNumber}
                <span className={styles.metaSub}> · {equipment.description}</span>
              </span>
            </div>
            <div>
              <span className={styles.metaLabel}>Period</span>
              <span className={styles.metaValue}>
                {opened} → {closed}
              </span>
            </div>
            <div>
              <span className={styles.metaLabel}>Duration</span>
              <span className={styles.metaValue}>
                {pack.durationDays == null ? '—' : `${pack.durationDays} day(s)`}
              </span>
            </div>
            <div>
              <span className={styles.metaLabel}>Team</span>
              <span className={styles.metaValue}>{activity.team}</span>
            </div>
          </div>
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
        </header>

        <section className={styles.section}>
          <Text as="h2" display size="xl" className={styles.sectionTitle}>
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
                {equipment.make ?? '—'}
                {equipment.model ? ` · ${equipment.model}` : ''}
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl" className={styles.sectionTitle}>
            2. Activity summary
          </Text>
          <dl className={styles.grid}>
            <div>
              <dt>ID</dt>
              <dd>{activity.id}</dd>
            </div>
            <div>
              <dt>Type / Priority</dt>
              <dd>
                {labelActivityType(activity.type)} · {activity.priority}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{labelActivityStatus(activity.status)}</dd>
            </div>
            <div>
              <dt>Opened / Closed</dt>
              <dd>
                {opened} → {closed}
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl" className={styles.sectionTitle}>
            3. Findings
          </Text>
          {findings.length === 0 ? (
            <Text size="sm" tone="mute">
              No findings recorded.
            </Text>
          ) : (
            <ol className={styles.findings}>
              {findings.map((f, index) => (
                <li key={f.id}>
                  <div className={styles.findingHead}>
                    <span className={styles.findingIndex}>{index + 1}</span>
                    <Text size="xs" tone="mute">
                      {f.date}
                      {f.author ? ` · ${f.author}` : ''}
                    </Text>
                  </div>
                  <Text size="sm" className={styles.findingBody}>
                    {f.text}
                  </Text>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl" className={styles.sectionTitle}>
            4. Daily progress
          </Text>
          {reportUpdates.length === 0 ? (
            <Text size="sm" tone="mute">
              No progress updates recorded.
            </Text>
          ) : (
            <ol className={styles.timeline}>
              {reportUpdates.map((u) => (
                <li key={u.id} className={styles.timelineItem}>
                  <div className={styles.timelineMeta}>
                    <Text size="xs" tone="mute">
                      {u.date}
                      {u.author ? ` · ${u.author}` : ''}
                      {u.progressPct != null ? ` · ${u.progressPct}%` : ''}
                    </Text>
                  </div>
                  <Text size="sm" className={styles.timelineNotes}>
                    {u.notes}
                  </Text>
                  {u.findings?.trim() ? (
                    <div className={styles.inlineFinding}>
                      <span className={styles.inlineFindingLabel}>Finding</span>
                      <Text size="sm">{u.findings}</Text>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl" className={styles.sectionTitle}>
            5. Photos
          </Text>
          {photoAttachments.length === 0 ? (
            <Text size="sm" tone="mute">
              No photos attached.
            </Text>
          ) : (
            <div className={styles.photoGrid}>
              {photoAttachments.map((f) => (
                <figure key={f.id} className={styles.photoCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.fileUrl}
                    alt={f.comment?.trim() || 'Activity photo'}
                    className={styles.photo}
                  />
                  <figcaption className={styles.photoCaption}>
                    <Text size="sm" className={styles.photoComment}>
                      {f.comment?.trim() ? f.comment : '—'}
                    </Text>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {otherAttachments.length > 0 ? (
            <div className={styles.otherFiles}>
              <Text size="xs" tone="mute" className={styles.otherFilesLabel}>
                Other attachments
              </Text>
              <ul className={styles.files}>
                {otherAttachments.map((f) => (
                  <li key={f.id}>
                    {f.fileUrl && f.fileUrl !== '#' ? (
                      <a href={f.fileUrl}>{f.fileName}</a>
                    ) : (
                      <span>{f.fileName}</span>
                    )}
                    {f.comment?.trim() ? (
                      <div className={styles.fileComment}>{f.comment}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className={styles.section}>
          <Text as="h2" display size="xl" className={styles.sectionTitle}>
            6. Work orders
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
          <Text as="h2" display size="xl" className={styles.sectionTitle}>
            7. Root cause analysis
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
          <Text as="h2" display size="xl" className={styles.sectionTitle}>
            8. Approval
          </Text>
          <div className={styles.signature}>
            <div>
              <Text size="sm" tone="mute">
                Supervisor / Admin
              </Text>
              <Text size="md" className={styles.signatureLine}>
                {rca?.verifiedByName ?? '________________'}
              </Text>
            </div>
            <div>
              <Text size="sm" tone="mute">
                Timestamp
              </Text>
              <Text size="md" className={styles.signatureLine}>
                {rca?.verifiedAt ?? '________________'}
              </Text>
            </div>
          </div>
          <Text size="xs" tone="faint" className={styles.footerNote}>
            Generated {generatedAt} · Alkinda / Lineage
          </Text>
        </section>
      </article>
    </Stack>
  );
}
