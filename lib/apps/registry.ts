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
 * Registry of apps hosted on this Hostinger domain.
 * Add a new entry when you ship another product under the same Node app.
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
  {
    id: 'placeholder-ops',
    name: 'Ops Board',
    tagline: 'Reserved slot for your next operations tool on this domain.',
    href: '#',
    status: 'planned',
    accent: '#3d5a5c',
  },
  {
    id: 'placeholder-docs',
    name: 'Plant Docs',
    tagline: 'Reserved slot for procedures and manuals.',
    href: '#',
    status: 'planned',
    accent: '#5a4a3a',
  },
];

export const portalConfig = {
  name: process.env.NEXT_PUBLIC_PORTAL_NAME ?? 'App Hub',
  domainHint: process.env.NEXT_PUBLIC_PORTAL_DOMAIN ?? 'your-domain.com',
};
