import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { getSessionCapabilities } from '@/lib/auth/permissions';

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
  const caps = await getSessionCapabilities();
  return (
    <AppShell
      showAdmin={caps.canAdmin}
      user={
        caps.session
          ? {
              name: caps.session.name,
              role: caps.session.role,
              initials: initials(caps.session.name),
            }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
