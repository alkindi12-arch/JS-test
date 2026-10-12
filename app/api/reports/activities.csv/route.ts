import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { listReportableActivities } from '@/lib/data/plant';

export const dynamic = 'force-dynamic';

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', '/lineage/reports');
    return NextResponse.redirect(url);
  }

  const rows = await listReportableActivities();
  const header = [
    'activity_id',
    'title',
    'status',
    'type',
    'priority',
    'equipment_tag',
    'area',
    'unit_id',
    'start_date',
    'closed_at',
    'has_rca',
    'work_order_count',
  ];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.activityId,
        r.title,
        r.status,
        r.type,
        r.priority,
        r.equipmentTag,
        r.areaName,
        r.unitId,
        r.startDate,
        r.closedAt ?? '',
        r.hasRca ? '1' : '0',
        String(r.workOrderCount),
      ]
        .map((v) => csvEscape(String(v)))
        .join(','),
    ),
  ];

  return new NextResponse(`${lines.join('\n')}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lineage-activity-reports.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
