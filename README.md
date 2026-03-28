# Hostinger Node smoke test

Minimal Next.js 15 app to verify **Hostinger Node.js Web Apps** actually runs `next start` and serves API routes (not only LiteSpeed/static `public_html`).

**Standalone repo:** [github.com/alkindi12-arch/JS-test](https://github.com/alkindi12-arch/JS-test) — clone that and deploy with **Root directory** `.` or empty.

**Inside `KDR-app` monorepo:** this folder also exists at `hostinger-node-smoke-test/`; use **Root directory** `hostinger-node-smoke-test`.

## Local check

```bash
git clone https://github.com/alkindi12-arch/JS-test.git
cd JS-test
npm install
npm run build
npm run start
```

Open http://localhost:3000 — you should see **Hostinger Node Test** and JSON from `/api/health`.

## Hostinger hPanel settings

Use **Websites → Add Website → Node.js Apps → Import Git Repository** (or your existing Node app’s **Settings and redeploy**).

| Setting | Value |
|--------|--------|
| Install | `npm ci` or `npm install` |
| Build | `npm run build` |
| Start | `npm start` **or** `npm run start -- -p $PORT` (if your panel documents `$PORT`) |
| Root directory | **empty** or `.` — **not** `/`. If this app lives inside a monorepo (e.g. under `hostinger-node-smoke-test/` in `KDR-app`), set Root directory to **`hostinger-node-smoke-test`** so `package.json` is found. |
| Output directory | **empty / default** — **do not** set `.next` |
| Node | `22.x` |

Optional env (optional label on home page):

- `NEXT_PUBLIC_LABEL=smoke-test`

Do **not** set `PORT` manually unless Hostinger docs require it; the platform usually injects it.

## After deploy — pass/fail

Run (replace domain):

```bash
curl -I https://YOUR_DOMAIN/
curl -s https://YOUR_DOMAIN/api/health
curl -s https://YOUR_DOMAIN/api/ping
```

**Pass**

- `/` returns **200** and HTML contains `Hostinger Node Test`.
- `/api/health` returns JSON with `"source":"next-api-route"`.
- `/api/ping` returns exactly `NODE_OK`.

**Fail (Hostinger routing, not this repo)**

- `403` / `404` from LiteSpeed only, or `/api/*` never returns JSON — Node runtime is not bound to the domain. Open Hostinger support with runtime logs and mention missing `~/domains/<domain>/nodejs` if SSH shows that path absent.

## SSH sanity (optional)

Per Hostinger docs, backend build output should live under `nodejs` (not only raw `.next` in `public_html`):

```bash
ls -la ~/domains/YOUR_DOMAIN/nodejs
```

If that directory does not exist after a successful deploy, the site is not in proper Node app mode.

## New GitHub repo

1. Create an empty repo, e.g. `hostinger-node-smoke-test`.
2. Copy this folder’s contents (not the parent monorepo) into the repo root, or push this subdirectory as the only content:

```bash
cd hostinger-node-smoke-test
git init
git add .
git commit -m "chore: add Hostinger Node smoke test"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

Then connect that repo in Hostinger and deploy.
