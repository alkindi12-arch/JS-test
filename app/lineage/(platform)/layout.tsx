import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Lineage',
    template: '%s · Lineage',
  },
  description: 'Equipment history and activity tracking.',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export default async function LineagePlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <AppShell
      user={
        session
          ? {
              name: session.name,
              role: session.role,
              initials: initials(session.name),
            }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
