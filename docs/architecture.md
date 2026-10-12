# Lineage — application architecture

## Goals

1. **Expandable design system** — tokens first; UI primitives; domain components compose primitives.
2. **Scalable structure** — route groups, typed domain contracts, mock → API swap without UI rewrites.
3. **Cross-platform viewing** — mobile-first CSS, responsive shell for phone / tablet / desktop / wide Windows displays.
4. **Hostinger multi-app domain** — one Node deploy; portal at `/`; products under `/lineage`, etc.; MySQL (not Postgres).

## Folder map

```
app/
  page.tsx                   # App Hub portal (multi-app launcher)
  layout.tsx                 # fonts, metadata, global atmosphere
  lineage/
    page.tsx                 # redirects → /lineage/dashboard
    (platform)/              # Lineage AppShell + screens
  api/                       # health / ping (Hostinger smoke checks)

components/
  design-system/
  layout/
  domain/

lib/
  apps/registry.ts           # hosted apps list for the portal
  lineage/paths.ts           # /lineage URL helper
  db/mysql.ts                # Hostinger MySQL pool (mysql2)
  types/domain.ts
  mock/plant.ts

db/
  schema.mysql.sql           # import in Hostinger phpMyAdmin

styles/
  tokens.css
  motion.css

docs/
  hostinger-deploy.md
  architecture.md
  equipment-history-system-plan.md
```

## Design system layers

| Layer | Responsibility | Upgrade path |
|-------|----------------|--------------|
| **Tokens** (`styles/tokens.css`) | Color, type, space, radius, z-index, motion | New theme = override variables / `data-theme` |
| **Primitives** (`components/design-system`) | Buttons, text, surfaces, grid, badges | Versioned API; no business logic |
| **Layout** (`components/layout`) | Shell, nav, page chrome | Add routes without restyling each page |
| **Domain** (`components/domain`) | Activity / equipment presentations | Swap data source; keep presentation |
| **Screens** (`app/(platform)/*`) | Compose layers + fetch/mock | Feature flags / new route groups |

**Rule:** screens never hardcode hex colors or font stacks — only tokens / primitives.

## Responsive shell strategy

| Viewport | Nav pattern |
|----------|-------------|
| **Phone** (&lt; 768px) | Top bar + hamburger drawer + bottom nav (4 primary) |
| **Tablet** (768–1023px) | Icon rail sidebar + sticky top search |
| **Desktop / Windows** (≥ 1024px) | Full labeled sidebar (260px) + content |
| **Wide** (≥ 1280px) | Same shell; content max-width + larger page padding |

Touch targets ≥ 44px. Safe-area padding on bottom nav. Fluid type via `clamp` for hero titles.

## Data scalability

- UI depends on `lib/types/domain.ts`, not on mock shapes.
- Replace `lib/mock/plant.ts` with `lib/api/*` later; keep function names (`getArea`, `activitiesForEquipment`, …).
- Future: React Server Components fetch from API; client islands only for shell interactivity (drawer, filters).

## Suggested next upgrades

1. Extract form controls into design-system `Field` / `Select` / `Textarea`.
2. Add `(auth)` route group for login.
3. Introduce theme toggle via `data-theme` on `<html>`.
4. Wire PWA manifest for installable tablet/phone use.
5. Add Playwright viewport tests (375 / 768 / 1280 / 1920).

## Brand direction (Lineage)

Industrial precision: cool paper atmosphere, viridian accent, steel sidebar, Syne + Figtree. Avoids generic purple gradients and cream/terracotta clichés so the product identity stays distinct as features grow.
