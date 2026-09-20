# Hostinger deployment — alkinda.com

## Domain model

| URL | What |
|-----|------|
| `https://alkinda.com/` | **Alkinda** personal app platform |
| `https://alkinda.com/lineage/...` | **Lineage** (first app) |
| `https://alkinda.com/api/health` | Health + DB status |

Hosting: **Hostinger Node.js Web App** on `alkinda.com` (single Next.js deploy).

## Database naming

Prefer Hostinger-prefixed names when the panel requires them:

| Role | Suggested |
|------|-----------|
| Database | `uXXXX_lineage` (whatever prefix Hostinger assigns + `_lineage`) |
| User | same as database name |
| Host | Remote MySQL hostname (`srv….hstgr.io`) — **not** `localhost` |
| Port | `3306` |

Import schema from `db/schema.mysql.sql` via phpMyAdmin after create.

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
