# Competitive landscape (App Store & adjacent)

Research date: **2026-08-26**  
Scope: iPhone-oriented measurement / scan / photo-calibrate / draw apps relevant to the Measure Draw idea.  
Note: App Store listings change; treat capabilities as directional, not audited lab results.

---

## Market map

```
                    PHOTO + REFERENCE                 LIVE AR / LiDAR
                 ┌─────────────────────┐         ┌─────────────────────┐
                 │ ImageMeter          │         │ Apple Measure       │
                 │ (calibrate & annotate)│       │ Ruler AR            │
                 └──────────┬──────────┘         │ AR Measure Lidar    │
                            │                    └──────────┬──────────┘
                            │                               │
                            └──────────┬────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │  MEASURE DRAW   │  ← proposed sweet spot
                              │ measure + draw  │
                              └────────┬────────┘
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 ▼                     ▼                     ▼
         OBJECT / CLOTHING      ROOM / FLOOR PLAN      SCAN → CAD
         TapeAR                 magicplan              Polycam
         (niche auto-measure)   RoomScan Pro           Twindo/Canvas
                                RoomPlot               3D Scanner App
                                                       Moasure (+hardware)
```

---

## Category A — Live tape / AR measure

### Apple Measure (built-in)
- **What it does:** AR tape measure; auto-detect rectangles; person height on LiDAR devices; guide lines on Pro; share screenshots.
- **Does not do:** Rich photo calibration workflow; editable CAD-like drawings; project folders with exports beyond screenshots/session saves.
- **Price:** Free (system app).
- **Takeaway:** Sets the baseline UX. Hard to beat on “quick two-point measure.” Win by adding **drawing + photo mode + better export**.

### Ruler AR – Measuring Tape Cam
- Camera measure (length, height, distance, area)
- 3D room plans / LiDAR scanner claims
- Angles, square check, bubble level
- Folders, PDF export
- Touch mode (place phone against start/end for precision)
- Monetization: ads + IAP / weekly premium
- Ratings: ~4.3 / 3.5K (US listing snapshot)

### AR Measure Lidar
- Floor/wall/ceiling/furniture measure with LiDAR (Pro models)
- Area, perimeter, radius/diameter
- Multiple units
- Simpler utility positioning

---

## Category B — Photo calibrate & annotate

### ImageMeter (photo measure)
Strongest reference for **Mode B** of our idea.

- Annotate photos with lengths, areas, angles, circles, rectangles
- **Reference scale** (flat / map-like)
- **Perspective reference** (measure on a perspectively distorted plane)
- **Perspective length** (heights along a line)
- Manual entry + Bluetooth laser distance meters
- PDF import at scale; notes, freehand, counters
- Export PDF/JPEG/PNG; business sync (Drive/Dropbox/etc.)
- Strong on Android; iOS presence historically weaker than Android — still the conceptual gold standard for photo calibration

**Key lesson from ImageMeter docs:** Absolute size from a photo alone is impossible; a reference is mandatory. Our photo mode must teach this clearly.

---

## Category C — Niche auto-measure from photo + LiDAR

### TapeAR (AI Measure & BG remover)
- Flat-lay clothing → auto dimensions (pit-to-pit, inseam, etc.)
- Background removal for marketplace listings
- LiDAR + Visual Intelligence; **Pro LiDAR required**
- Free positioning; reseller (Depop/Poshmark/eBay) focused
- **Lesson:** Vertical niche + auto-measure + export for a job-to-be-done beats generic “AR ruler.”

---

## Category D — 3D scan + measure

### Polycam
- LiDAR + photogrammetry + Gaussian splats
- Floor plans, measurements, annotations
- Heavy CAD/export suite (OBJ, FBX, STL, DXF, PLY, …)
- Construction / insurance / BIM positioning
- Large installed base

### 3D Scanner App
- LiDAR / TrueDepth / Photo Mode (Object Capture)
- Measure with virtual ruler / bounding boxes
- Many export formats (USDZ, OBJ, GLTF, LAS, DXF floor plans, …)
- AR Quick Look sharing

### 3D Scan & Measure
- RoomPlan room scan → USDZ + floor plan PDF + STL
- Object scan (LiDAR mesh or photogrammetry)
- Auto W/H/D; volume; AR ruler; tap-to-measure on floor plans

### Meshio / other “3D Scanner LiDAR” clones
- Object scan, measure, AR preview, export OBJ/STL/USDZ — typically subscription-gated

---

## Category E — Floor plan / measure & draw for trades

### magicplan
- AR/LiDAR floor plans in real time
- Photos, notes, equipment, forms, estimates
- Insurance / restoration integrations (Xactimate, CoreLogic)
- High ratings (~4.7 / 41K); expensive subscription tiers

### RoomScan Pro
- RoomPlan + Brick Mode + Touch Mode
- Bluetooth lasers (Bosch/Leica)
- Broad professional exports (DXF, IFC, Xactimate ESX, Sweet Home 3D, …)

### RoomPlot / Floor Plan Creator
- LiDAR scan **or** manual draw with snapping
- DXF, USDZ, PDF, symbols library
- Edit in 2D/3D after capture

### Twindo (formerly Canvas by Occipital)
- LiDAR capture → **Scan to CAD** service (human+AI)
- Delivers Revit/SketchUp/AutoCAD-ready as-builts (paid per sq ft / membership)
- Pro workflow: accuracy + clean CAD, not DIY instant sketch

---

## Category F — Hardware-assisted measure & draw

### Moasure (app + device)
- Companion to Moasure motion-measuring hardware
- **Measure and draw simultaneously** in 2D/3D
- Area, perimeter, volume, elevation, gradients
- Export DXF/DWG, PDF, CSV, images — no app subscription
- **Lesson:** “Draw while measuring” is a proven sticky value prop; their moat is hardware accuracy.

---

## What exists vs. the gap

| Need from your idea | Covered well today? | Gap |
|---------------------|---------------------|-----|
| Live phone measure | Yes (Apple Measure, Ruler AR, …) | Drawing quality / export often weak |
| Photo + reference calibrate | Partially (ImageMeter) | Less polished on iOS; rarely becomes editable drawing |
| LiDAR depth measure | Yes on Pro (many apps) | Fragmented; often scan-heavy |
| Draw at the same time | Rooms: magicplan etc.; outdoor/path: Moasure | **Object-level** measure→sketch is thinner |
| All three in one simple consumer app | Rare | Likely opportunity if UX is focused |

---

## Competitive conclusions

1. **Do not compete with Polycam/magicplan/Twindo on “full site documentation.”** That market is mature and subscription-deep.
2. **Photo calibration is underserved on iPhone** relative to how often people only have a photo.
3. **“Measure → dimensioned drawing”** (especially for **objects**, not only rooms) is the clearest white space.
4. **LiDAR is an accelerator, not the whole product** — otherwise non-Pro users are locked out and App Store competition is fiercest.
5. Niches (clothing, insurance rooms, CAD as-builts) win with workflow fit; a generic AR ruler does not.
