# Measure Draw

Phone-first app to **calibrate a photo**, **measure objects**, and **export a dimensioned drawing**.

> Status: **Web MVP is buildable** under [`web/`](web/). Native LiDAR/AR is planned later.

## Try it

```bash
cd web
npm install
npm run dev
```

Then open the URL on your phone (same Wi‑Fi → use Vite’s Network address), or use the public link once deployed.

## What’s in this repo

| Path | Purpose |
|------|---------|
| [web/](web/) | Working web/PWA application (MVP) |
| [docs/](docs/) | Product brainstorm, competitive research, MVP options |

## MVP capabilities (now)

1. Take / upload a photo  
2. Calibrate with presets (credit card, A4, Letter, quarter, ruler, custom)  
3. Measure edges by tapping  
4. Live dimensioned drawing preview  
5. Export annotated photo + drawing as PNG  
6. Installable PWA (Add to Home Screen)

## Not yet

- Live AR / iPhone LiDAR measuring (native app + TestFlight)  
- Full perspective-plane calibration  
- DXF / CAD export  

## Docs to read

- [docs/vision.md](docs/vision.md)  
- [docs/mvp-options.md](docs/mvp-options.md)  
- [docs/competitive-landscape.md](docs/competitive-landscape.md)  
- [docs/lidar-live-measure.md](docs/lidar-live-measure.md) — Live LiDAR edges / auto-measure plan  
- [docs/precise-point-placement.md](docs/precise-point-placement.md) — Plan to make point placement accurate on phones  
