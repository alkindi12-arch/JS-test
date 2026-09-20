# Lineage — Equipment History (concept draft)

Cross-platform concept app for **Area → Unit → Equipment → Activities** with a token-based design system and responsive shell (phone, tablet, desktop/Windows).

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/dashboard`.

## Docs

- [System concept & process flows](./docs/equipment-history-system-plan.md)
- [Architecture & design system](./docs/architecture.md)

## Stack

- Next.js 15 (App Router)
- CSS Modules + design tokens (`styles/tokens.css`)
- Mock plant data (`lib/mock/plant.ts`) — swap for APIs later

## Health endpoints (retained)

- `/api/health` — JSON
- `/api/ping` — `NODE_OK`
