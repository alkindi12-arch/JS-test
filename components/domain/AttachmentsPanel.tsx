'use client';

import { useState } from 'react';
import { ActionForm } from '@/components/domain/ActionForm';
import { Button, Text } from '@/components/design-system';
import {
  isImageAttachment,
  type AttachmentMeta,
} from '@/lib/data/mappers';
import {
  deleteAttachmentAction,
  updateAttachmentCommentAction,
  uploadAttachmentAction,
} from '@/lib/data/plant-writes';
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
  canDelete,
}: {
  activityId: string;
  attachments: AttachmentMeta[];
  canUpload: boolean;
  canDelete?: boolean;
}) {
  const allowManage = canDelete ?? canUpload;
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className={styles.panel}>
      <Text as="h2" display size="lg">
        Attachments
      </Text>
      <Text size="sm" tone="mute">
        Photos, permits, and videos — add a comment; photos appear with comments on the
        report.
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
            const isImage = isImageAttachment(f);
            return (
              <li key={f.id} className={styles.fileItem}>
                {isImage && isRealUrl(f.fileUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.fileUrl}
                    alt={f.comment || f.fileName}
                    className={styles.thumb}
                  />
                ) : null}
                {isRealUrl(f.fileUrl) ? (
                  <a
                    href={f.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
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
                ) : null}

                {editingId === f.id && allowManage ? (
                  <ActionForm
                    action={updateAttachmentCommentAction}
                    submitLabel="Save comment"
                    className={styles.commentForm}
                  >
                    <input type="hidden" name="attachmentId" value={f.id} />
                    <input type="hidden" name="activityId" value={activityId} />
                    <label className={styles.field}>
                      <span>Comment</span>
                      <textarea
                        name="comment"
                        rows={2}
                        maxLength={2000}
                        defaultValue={f.comment ?? ''}
                        placeholder="Describe what this file shows…"
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </ActionForm>
                ) : (
                  <>
                    {f.comment ? (
                      <Text size="sm" className={styles.comment}>
                        {f.comment}
                      </Text>
                    ) : (
                      <Text size="xs" tone="faint">
                        No comment
                      </Text>
                    )}
                    {allowManage ? (
                      <div className={styles.rowActions}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(f.id)}
                        >
                          {f.comment ? 'Edit comment' : 'Add comment'}
                        </Button>
                        <ActionForm
                          action={deleteAttachmentAction}
                          submitLabel="Remove file"
                          submitVariant="danger"
                          pendingLabel="Removing…"
                          className={styles.deleteForm}
                        >
                          <input type="hidden" name="attachmentId" value={f.id} />
                          <input type="hidden" name="activityId" value={activityId} />
                        </ActionForm>
                      </div>
                    ) : null}
                  </>
                )}
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
          <label className={styles.field}>
            <span>Comment</span>
            <textarea
              name="comment"
              rows={2}
              maxLength={2000}
              placeholder="Optional — shown with photos on the report"
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
