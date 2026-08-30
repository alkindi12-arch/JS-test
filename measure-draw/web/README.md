# Measure Draw — Web app

Phone-friendly web MVP: **upload/take a photo → calibrate with a reference → measure edges → export a dimensioned drawing**.

## Run locally

```bash
cd web
npm install
npm run dev
```

Open the printed URL on your computer, or on your phone if the phone is on the same network (use the Network URL Vite prints).

## Production preview

```bash
cd web
npm run build
npm run preview
```

## Phone use

1. Open the deployed or preview link in **Safari / Chrome** on your phone.
2. Optional: Share → **Add to Home Screen** (PWA).
3. Put a credit card or ruler in the photo for calibration.
4. Calibrate → Measure → Export PNG.

## Not in this MVP

- Live AR / LiDAR (needs a native iOS app + TestFlight later)
- Perspective-plane correction (fronto-parallel references work best today)
- Cloud sync

See `/docs` in the repo root for product brainstorming.
