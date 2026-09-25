import { mkdir, readdir, stat, writeFile } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

/** Max single file size (bytes). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Max total bytes stored under one activity. */
export const MAX_ACTIVITY_BYTES = 50 * 1024 * 1024;
/** Max total bytes under public/uploads. */
export const MAX_TOTAL_UPLOAD_BYTES = 500 * 1024 * 1024;

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
  'text/plain',
]);

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

function safeExt(fileName: string, mime: string): string {
  const fromName = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (fromName && fromName.length <= 8) return fromName;
  const byMime: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
    'text/plain': '.txt',
  };
  return byMime[mime] ?? '.bin';
}

async function dirSize(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) total += await dirSize(full);
      else if (entry.isFile()) total += (await stat(full)).size;
    }
    return total;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return 0;
    throw err;
  }
}

export type SaveUploadResult =
  | { ok: true; relativeUrl: string; storedName: string; bytes: number }
  | { ok: false; error: string };

export async function saveUploadedFile(opts: {
  activityId: string;
  file: File;
}): Promise<SaveUploadResult> {
  const { activityId, file } = opts;
  const mime = file.type || 'application/octet-stream';
  const bytes = file.size;

  if (!bytes) return { ok: false, error: 'Empty file.' };
  if (bytes > MAX_FILE_BYTES) {
    return { ok: false, error: `File exceeds ${MAX_FILE_BYTES / (1024 * 1024)} MB limit.` };
  }
  if (!ALLOWED_MIME.has(mime)) {
    return {
      ok: false,
      error: 'File type not allowed. Use JPEG, PNG, WebP, GIF, PDF, MP4, or TXT.',
    };
  }

  const activityDir = path.join(UPLOAD_ROOT, activityId);
  const [activityUsed, totalUsed] = await Promise.all([
    dirSize(activityDir),
    dirSize(UPLOAD_ROOT),
  ]);

  if (activityUsed + bytes > MAX_ACTIVITY_BYTES) {
    return {
      ok: false,
      error: `Activity attachment quota exceeded (${MAX_ACTIVITY_BYTES / (1024 * 1024)} MB).`,
    };
  }
  if (totalUsed + bytes > MAX_TOTAL_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `Plant upload quota exceeded (${MAX_TOTAL_UPLOAD_BYTES / (1024 * 1024)} MB).`,
    };
  }

  await mkdir(activityDir, { recursive: true });
  const storedName = `${Date.now()}-${randomBytes(4).toString('hex')}${safeExt(file.name, mime)}`;
  const absPath = path.join(activityDir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  return {
    ok: true,
    relativeUrl: `/uploads/${activityId}/${storedName}`,
    storedName,
    bytes,
  };
}
