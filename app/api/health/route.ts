import { NextResponse } from 'next/server';
import { isDatabaseConfigured, pingDatabase } from '@/lib/db/mysql';

export async function GET() {
  const dbConfigured = isDatabaseConfigured();
  const db = dbConfigured ? await pingDatabase() : { ok: false, message: 'not_configured' };

  return NextResponse.json({
    ok: true,
    source: 'next-api-route',
    time: new Date().toISOString(),
    portal: process.env.NEXT_PUBLIC_PORTAL_NAME ?? 'App Hub',
    database: {
      configured: dbConfigured,
      status: db.message,
      connected: db.ok,
    },
  });
}
