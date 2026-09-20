# Hostinger deployment — multi-app portal + Lineage + MySQL

## Hosting model (this repo)

One **Hostinger Node.js** app on **one domain**, serving many products as routes:

| URL | What |
|-----|------|
| `https://your-domain.com/` | **App Hub** portal (launcher for all apps) |
| `https://your-domain.com/lineage/...` | **Lineage** equipment history |
| `https://your-domain.com/api/health` | Health + DB status |
| Future | Add `/your-next-app/...` inside this same Next.js project |

This matches Hostinger’s typical **one Node process per domain** setup better than many separate Node apps on the same hostname.

## hPanel → Node.js settings

| Setting | Value |
|--------|--------|
| Install | `npm ci` or `npm install` |
| Build | `npm run build` |
| Start | `npm start` (or `npm run start -- -p $PORT` if required) |
| Root directory | `.` (or empty) — **not** `/` |
| Output directory | leave empty — **do not** set `.next` |
| Node | `22.x` |

Connect the GitHub repo and branch (e.g. `main` or this feature branch after merge).

## Environment variables

In **Node.js App → Environment variables**, import or paste from `.env.example`:

- `NEXT_PUBLIC_PORTAL_NAME` — portal brand (e.g. your company name)
- `NEXT_PUBLIC_PORTAL_DOMAIN` — display domain on the portal
- `DB_HOST` — MySQL hostname from **Databases → Remote MySQL** (e.g. `srvXXXX.hstgr.io`)
- `DB_PORT` — `3306`
- `DB_USER` / `DB_PASSWORD` / `DB_NAME`

**Important (Hostinger + Node):** do **not** use `localhost` as `DB_HOST` for Node. Use the Remote MySQL hostname. PHP can use localhost; Node cannot reliably.

Redeploy after changing env vars.

## Create the database (hPanel)

1. **Websites → Manage → Databases → MySQL Databases**
2. Create database, e.g. `uXXXX_lineage`
3. Create user and assign **All privileges** on that database
4. **Remote MySQL**: allow the hosting server IP (or temporarily Any Host `%` while testing)
5. Copy hostname shown on Remote MySQL page → `DB_HOST`
6. Open **phpMyAdmin** → select DB → Import / SQL → run `db/schema.mysql.sql`

Suggested names (adjust to Hostinger prefixes):

- Database: `…_lineage`
- User: `…_lineage`

## Verify after deploy

```bash
curl -I https://YOUR_DOMAIN/
curl -s https://YOUR_DOMAIN/api/health
curl -s https://YOUR_DOMAIN/api/ping
curl -I https://YOUR_DOMAIN/lineage/dashboard
```

**Pass**

- `/` shows App Hub portal
- `/lineage/dashboard` loads Lineage
- `/api/health` JSON includes `"source":"next-api-route"` and eventually `"database":{"connected":true}`
- `/api/ping` returns `NODE_OK`

## Adding another app later

1. Create routes under `app/my-app/...`
2. Register it in `lib/apps/registry.ts`
3. Optionally add tables in `db/` with a new SQL file
4. Redeploy — same domain, same Node app

## Optional: subdomain later

If you outgrow a single Node app, Hostinger can host `lineage.your-domain.com` as a separate Node app. Path-based multi-app (this repo) is the recommended start.
