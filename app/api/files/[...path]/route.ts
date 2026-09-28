import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

/** Serve files from public/uploads via API (reliable under next start / Hostinger). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params;
  if (!parts?.length) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Reject path traversal and absolute segments.
  if (parts.some((p) => !p || p === '.' || p === '..' || p.includes('\0'))) {
    return new NextResponse('Not found', { status: 404 });
  }

  const absPath = path.resolve(UPLOAD_ROOT, ...parts);
  const rootResolved = path.resolve(UPLOAD_ROOT) + path.sep;
  if (!absPath.startsWith(rootResolved)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const info = await stat(absPath);
    if (!info.isFile()) {
      return new NextResponse('Not found', { status: 404 });
    }

    const nodeStream = createReadStream(absPath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentTypeFor(absPath),
        'Content-Length': String(info.size),
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return new NextResponse('Not found', { status: 404 });
    }
    console.error('[api/files] read failed', err);
    return new NextResponse('Server error', { status: 500 });
  }
}
