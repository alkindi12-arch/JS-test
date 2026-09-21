import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Lineage',
    template: '%s · Lineage',
  },
  description: 'Equipment history and activity tracking.',
};

export default function LineagePlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
