'use client';

import { ActionForm } from '@/components/domain/ActionForm';
import { Text } from '@/components/design-system';
import type { AttachmentMeta } from '@/lib/data/mappers';
import { uploadAttachmentAction } from '@/lib/data/plant-writes';
import styles from './AttachmentsPanel.module.css';

function formatBytes(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isRealUrl(url: string) {
  return Boolean(url) && url !== '#';
}

export function AttachmentsPanel({
  activityId,
  attachments,
  canUpload,
}: {
  activityId: string;
  attachments: AttachmentMeta[];
  canUpload: boolean;
}) {
  return (
    <div className={styles.panel}>
      <Text as="h2" display size="lg">
        Attachments
      </Text>
      <Text size="sm" tone="mute">
        Photos, permits, and videos stored under public/uploads (10 MB/file).
      </Text>

      {attachments.length === 0 ? (
        <Text size="sm" tone="mute">
          No files linked yet.
        </Text>
      ) : (
        <ul className={styles.files}>
          {attachments.map((f) => {
            const size = formatBytes(f.fileSize);
            const meta = [size, f.uploadedBy, f.uploadedAt].filter(Boolean).join(' · ');
            return (
              <li key={f.id} className={styles.fileItem}>
                {isRealUrl(f.fileUrl) ? (
                  <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    {f.fileName}
                  </a>
                ) : (
                  <span className={styles.placeholder} title="Placeholder — file not stored">
                    {f.fileName}
                  </span>
                )}
                {meta ? (
                  <Text size="xs" tone="faint">
                    {meta}
                    {!isRealUrl(f.fileUrl) ? ' · seed placeholder' : ''}
                  </Text>
                ) : !isRealUrl(f.fileUrl) ? (
                  <Text size="xs" tone="faint">
                    Seed placeholder (no file on disk)
                  </Text>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canUpload ? (
        <ActionForm
          action={uploadAttachmentAction}
          submitLabel="Upload file"
          className={styles.fields}
        >
          <input type="hidden" name="activityId" value={activityId} />
          <label className={styles.field}>
            <span>File</span>
            <input
              name="file"
              type="file"
              required
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,text/plain,.jpg,.jpeg,.png,.webp,.gif,.pdf,.mp4,.txt"
            />
          </label>
          <Text size="xs" tone="faint">
            Allowed: JPEG, PNG, WebP, GIF, PDF, MP4, TXT · max 10 MB
          </Text>
        </ActionForm>
      ) : null}
    </div>
  );
}
