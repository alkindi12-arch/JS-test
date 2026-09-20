import type { NavItem } from '@/lib/types/domain';
import { lineagePath } from '@/lib/lineage/paths';

/** Layout breakpoints — keep in sync with styles/tokens.css */
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const primaryNav: NavItem[] = [
  { href: lineagePath('/dashboard'), label: 'Dashboard', icon: 'dashboard' },
  { href: lineagePath('/areas'), label: 'Areas', icon: 'areas' },
  { href: lineagePath('/activities'), label: 'Activities', icon: 'activities' },
  { href: lineagePath('/equipment'), label: 'Equipment', icon: 'equipment' },
  { href: lineagePath('/reports'), label: 'Reports', icon: 'reports' },
];

export const adminNav: NavItem[] = [
  { href: lineagePath('/admin'), label: 'Admin', icon: 'admin' },
];
