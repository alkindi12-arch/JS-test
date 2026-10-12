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

/** Safe default PDF filename (browser Save as PDF uses document.title). */
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
