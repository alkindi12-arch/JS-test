/** All Lineage UI routes live under /lineage so the domain root stays a multi-app portal. */
export const LINEAGE_BASE = '/lineage';

export function lineagePath(path = ''): string {
  if (!path || path === '/') return LINEAGE_BASE;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${LINEAGE_BASE}${normalized}`;
}
