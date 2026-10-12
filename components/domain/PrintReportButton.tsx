'use client';

import { useEffect } from 'react';
import { Button } from '@/components/design-system';

function sanitizeFilePart(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    // Path separators → dash so WO refs like 40/641/362 stay readable
    .replace(/[\\/]+/g, '-')
    .replace(/[:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Make a safe default PDF filename (browser uses document.title for Save as PDF). */
export function buildReportFileName(parts: {
  tagNumber?: string | null;
  description?: string | null;
  workOrderRef?: string | null;
}): string {
  const tag = sanitizeFilePart(parts.tagNumber ?? '');
  const desc = sanitizeFilePart(parts.description ?? '').slice(0, 60).trim();
  const wo = sanitizeFilePart(parts.workOrderRef ?? '');

  const chunks = [tag, desc, wo].filter(Boolean);
  const joined = chunks.join(' ').replace(/\s+/g, ' ').trim();
  return (joined || 'Lineage activity report').slice(0, 140);
}

export function PrintReportButton({ fileName }: { fileName: string }) {
  // Also set title on mount so Ctrl/Cmd+P uses the same name.
  useEffect(() => {
    if (!fileName) return;
    const previous = document.title;
    document.title = fileName;
    return () => {
      document.title = previous;
    };
  }, [fileName]);

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        const previous = document.title;
        if (fileName) document.title = fileName;
        const restore = () => {
          document.title = previous;
          window.removeEventListener('afterprint', restore);
        };
        window.addEventListener('afterprint', restore);
        window.print();
        // Fallback if afterprint is delayed/skipped
        window.setTimeout(restore, 2000);
      }}
    >
      Print / Save PDF
    </Button>
  );
}
