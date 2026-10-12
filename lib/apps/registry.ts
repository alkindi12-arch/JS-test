export type AppStatus = 'live' | 'draft' | 'planned';

export interface HostedApp {
  id: string;
  name: string;
  tagline: string;
  href: string;
  status: AppStatus;
  accent: string;
}

/**
 * Apps on alkinda.com (Hostinger Node.js).
 * Lineage is the first; append more entries as you ship them.
 */
export const hostedApps: HostedApp[] = [
  {
    id: 'lineage',
    name: 'Lineage',
    tagline: 'Equipment history & activity tracking — Area → Unit → Equipment → Activities.',
    href: '/lineage/dashboard',
    status: 'draft',
    accent: '#0f6e6a',
  },
];

export const portalConfig = {
  name: process.env.NEXT_PUBLIC_PORTAL_NAME ?? 'Alkinda',
  domainHint: process.env.NEXT_PUBLIC_PORTAL_DOMAIN ?? 'alkinda.com',
};
