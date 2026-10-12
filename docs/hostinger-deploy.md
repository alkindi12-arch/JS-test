# Hostinger deployment — alkinda.com

## Domain model

| URL | What |
|-----|------|
| `https://alkinda.com/` | **Alkinda** personal app platform |
| `https://alkinda.com/lineage/...` | **Lineage** (first app) |
| `https://alkinda.com/api/health` | Health + DB status |

Hosting: **Hostinger Node.js Web App** on `alkinda.com` (single Next.js deploy).

## Database (already created)

Old WordPress site on alkinda.com was removed. Domain registration stays. kdcoffeelab.com was not changed.

| Role | Value |
|------|--------|
| Database | `u337841818_lineage` |
| User | `u337841818_lineage_user` |
| Host | `srv1764.hstgr.io` (not `localhost`) |
| Port | `3306` |
| Remote MySQL | Any host (`%`) so Node.js can connect |

Schema `db/schema.mysql.sql` is already imported. Tables: `areas`, `units`, `equipment`, `activities`, `daily_updates`, `attachments`. Seed areas A01–A03 are present. Remote MySQL from Node was verified against `srv1764.hstgr.io`.

## hPanel → Node.js settings

| Setting | Value |
|--------|--------|
| Install | `npm ci` or `npm install` |
| Build | `npm run build` |
| Start | `npm start` |
| Root directory | `.` (empty) |
| Output directory | empty |
| Node | `22.x` |

Env vars: see `.env.example` (`NEXT_PUBLIC_PORTAL_*`, `DB_*`).

## Verify

```bash
curl -I https://alkinda.com/
curl -s https://alkinda.com/api/health
curl -s https://alkinda.com/api/ping
curl -I https://alkinda.com/lineage/dashboard
```

### Live deploy (2026-09-21)

| Check | Result |
|-------|--------|
| `https://alkinda.com/` | Alkinda portal (200) |
| `https://alkinda.com/lineage/dashboard` | Lineage UI (200) |
| `https://alkinda.com/api/ping` | `NODE_OK` |
| `https://alkinda.com/api/health` | `database.connected: true` |
| Git branch | `cursor/equipment-history-plan-db65` |
| Node | 22.x · `npm ci` · `npm run build` · `npm start` |

Auto-deploy is enabled on that branch. **kdcoffeelab.com** was not modified.