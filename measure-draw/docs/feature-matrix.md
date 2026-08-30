# Feature matrix

Legend: **Y** = core / strong · **P** = partial / limited · **N** = not a focus · **?** = unclear from public listing

| Capability | Apple Measure | Ruler AR | ImageMeter | TapeAR | Polycam | magicplan | RoomScan Pro | Twindo/Canvas | Moasure | **Measure Draw (target)** |
|------------|---------------|----------|------------|--------|---------|-----------|--------------|---------------|---------|---------------------------|
| Live AR point-to-point | Y | Y | N | N | P | P | P | P | via device | Y |
| LiDAR depth assist | Y (Pro) | Y (Pro) | N | Y (required) | Y | Y | Y | Y | N (IMU device) | Y (optional) |
| Auto rectangle / bounding box | Y | P | P | Y (garment) | Y | P | P | P | P | Y |
| Photo upload measure | N | N | Y | P (capture) | P | N | N | upload plans | N | **Y** |
| Reference-object calibration | N | N | **Y** | implicit LiDAR | rescale tools | N | N | N | N | **Y** |
| Perspective plane correction | N | N | **Y** | N | mesh-based | N | N | CAD service | N | Y (phase 2) |
| Room / floor plan | P (Room Plan) | Y | PDF import | N | Y | **Y** | **Y** | Y | outdoor/area | Maybe later |
| Object 3D mesh scan | N | N | N | N | **Y** | N | P | Y | N | Maybe later |
| **Draw while measuring** | N | P | annotate photo | overlay dims | annotate scan | **Y** (plans) | **Y** | post-process CAD | **Y** | **Y (core)** |
| Editable dimensioned sketch | N | P | P | N | P | Y | Y | via CAD | Y | **Y** |
| Export PDF | P | Y | Y | image | Y | Y | Y | reports | Y | Y |
| Export DXF/CAD | N | N | N | N | Y | Y | Y | **Y** (service) | Y | Optional later |
| Works without LiDAR | Y (ARKit) | Y | Y | **N** | photogrammetry | Y | Y | limited | needs device | **Y** |
| Consumer / DIY simplicity | Y | Y | medium | niche | medium | pro | pro | pro | trade + HW | **Y** |
| Typical monetization | free | IAP/sub | paid tiers | free | sub | expensive sub | sub | per sqft + membership | hardware | TBD |

---

## Capability clusters (what to copy / skip)

### Must study deeply
- **ImageMeter** — calibration UX (reference scale, perspective reference, perspective length)
- **Apple Measure** — minimal live measure gestures
- **Moasure / magicplan** — “drawing appears as you capture” feedback loop

### Borrow selectively
- TapeAR — auto-detect for a **known object class** (if we ever niche)
- Polycam — measurement-on-mesh UX (if we add scan mode)
- RoomPlot — manual draw + snap after scan

### Avoid as v1 scope
- Full Scan-to-Revit human service (Twindo model)
- Insurance estimate stacks (magicplan Estimate tier)
- Bluetooth laser ecosystem (ImageMeter Business) — unless B2B later

---

## Accuracy expectations (industry rough ranges)

Not guarantees — for product honesty / marketing tone:

| Method | Typical use | Rough expectation |
|--------|-------------|-------------------|
| Bluetooth laser | Single distances | ±1–2 mm device-class |
| iPhone LiDAR short indoor | Rooms / furniture | often ~1–2% / cm-level; degrades with distance & sun |
| ARKit without LiDAR | Casual measure | more variable |
| Photo + good reference, same plane | Flat objects / walls | can be good if reference large & perspective handled |
| Photo without reference | — | **impossible** for absolute scale |

Product copy should say **“good enough for planning / listing / DIY”**, not “survey grade,” unless we validate otherwise.
