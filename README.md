# App Hub + Lineage (Hostinger)

Multi-app portal on **one Hostinger domain** + **Hostinger MySQL**.

- `/` — App Hub (launcher)
- `/lineage/*` — Equipment History & Activity Tracking
- `/api/health` — Node + DB status

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # optional; mock UI works without DB
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docs

- [Hostinger deploy + MySQL](./docs/hostinger-deploy.md)
- [Architecture](./docs/architecture.md)
- [System concept & flows](./docs/equipment-history-system-plan.md)
- [MySQL schema](./db/schema.mysql.sql)

## Hostinger Node settings (summary)

| Setting | Value |
|--------|--------|
| Install | `npm ci` |
| Build | `npm run build` |
| Start | `npm start` |
| Root | `.` |
| Node | `22.x` |

Set `DB_*` and portal env vars in hPanel (see `.env.example`). For Node, `DB_HOST` must be the **Remote MySQL hostname**, not `localhost`.

## Stack

- Next.js 15 (App Router) — one deploy, many apps
- Design tokens + CSS Modules
- Hostinger MySQL via `mysql2` (`lib/db/mysql.ts`)
- Mock data until DB is wired to screens
