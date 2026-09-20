import type { NavItem } from '@/lib/types/domain';

/** Layout breakpoints — keep in sync with styles/tokens.css */
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const primaryNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/areas', label: 'Areas', icon: 'areas' },
  { href: '/activities', label: 'Activities', icon: 'activities' },
  { href: '/equipment', label: 'Equipment', icon: 'equipment' },
  { href: '/reports', label: 'Reports', icon: 'reports' },
];

export const adminNav: NavItem[] = [
  { href: '/admin', label: 'Admin', icon: 'admin' },
];
