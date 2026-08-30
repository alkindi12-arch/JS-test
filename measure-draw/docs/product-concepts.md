# Product concepts & differentiation

## Concept summary

**Measure Draw** = multi-mode capture + shared **dimensioned drawing canvas**.

Competitors usually optimize one corner:

| Corner | Example | Missing |
|--------|---------|---------|
| Fast live numbers | Apple Measure | Drawing / photo calibrate |
| Photo annotate | ImageMeter | Modern LiDAR live + nice object sketch |
| Room documentation | magicplan / RoomScan | Simple object workflows |
| Mesh scanning | Polycam | Lightweight “just sketch this” |
| Path measure→draw | Moasure | Needs paid hardware |

---

## Differentiation theses (pick 1–2)

### Thesis 1 — “The sketch is the souvenir”
Every session ends as a clean **dimensioned drawing** (orthographic), not only an AR screenshot. Share as PNG/PDF/SVG. Optional DXF later.

### Thesis 2 — “Photo mode is a first-class citizen”
Half the time you are not on site with a Pro phone. Calibrate with credit card / ruler / A4 and extract a drawing from a plane. Few iPhone apps make this delightful.

### Thesis 3 — “Object-first, not room-first”
Rooms are a bloodbath of pro SaaS. Start with **boxes, furniture, openings, packages, products** — smaller scenes, clearer drawings, faster success.

### Thesis 4 — “LiDAR when you have it; reference when you don’t”
One product, adaptive accuracy path. UI always shows *how* scale was established.

### Thesis 5 — “Vertical wedge first”
e.g. furniture fit / marketplace product dimensions / window & door openings / carpentry cut lists. Generic tools struggle; wedges convert.

---

## Feature brainstorm (backlog of ideas — not commitments)

### Capture
- [ ] Two-point live measure
- [ ] Multi-segment polyline path (auto-closes for area)
- [ ] Auto detect rectangle / cuboid
- [ ] Edge snap using LiDAR point cloud
- [ ] Guided “orbit the object” for depth
- [ ] Preset reference library (card, paper, coin, phone models)
- [ ] AR overlay: place virtual reference if physical missing (advanced / risky)
- [ ] Import photo from Messages / Files

### Calibration
- [ ] Drag known length on photo
- [ ] 4-corner perspective plane
- [ ] Multi-reference average for better scale
- [ ] Lens distortion soft warning
- [ ] “Confidence” meter (good / ok / poor)

### Drawing canvas
- [ ] Live construction of lines as you tap
- [ ] Auto dimension labels (outside / inside)
- [ ] Layers: raw photo / edges / dimensions / notes
- [ ] Orthographic views: front / side / top from cuboid measures
- [ ] Freehand + snap-to-measure hybrid
- [ ] Undo / edit a measured edge
- [ ] Unit toggle (mm, cm, in, ft-in fractional)

### Intelligence (later)
- [ ] Segment object silhouette (Vision / Core ML)
- [ ] Suggest W×H×D from mesh bounding box
- [ ] Category templates (door, window, sofa, box, garment)
- [ ] OCR read of ruler ticks in photo to auto-calibrate

### Export & share
- [ ] PNG with labels
- [ ] PDF one-pager (photo + drawing + table)
- [ ] SVG / DXF polyline
- [ ] CSV of measurements
- [ ] Share Sheet / AirDrop
- [ ] Project folders

### Platform
- [ ] iOS first (ARKit + LiDAR + RoomPlan + Object Capture available)
- [ ] iPad larger canvas
- [ ] Android later (ARCore Depth API; no Apple LiDAR)
- [ ] Web viewer for shared drawings (optional)

---

## Naming brainstorm (working titles)

| Name | Vibe |
|------|------|
| Measure Draw | Clear, descriptive |
| DimSketch | Dimension + sketch |
| ScaleShot | Photo + scale |
| TraceMeasure | Trace while measuring |
| Reframe | Reference + frame |
| Cubit | Historical measure unit (brandable) |

Keep **Measure Draw** until positioning is firm.

---

## Business model brainstorm (later)

- Free: limited exports / watermarks / N projects
- One-time Pro unlock (DIY friendly — rare in this category, could differentiate)
- Soft subscription for cloud sync + CAD export
- Vertical: per-listing pack for resellers

No need to decide until MVP shape is clear.
