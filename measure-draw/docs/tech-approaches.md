# Technical approaches (planning only)

No implementation in this repo yet. This documents **likely building blocks** so brainstorming stays grounded.

---

## Platform recommendation (discussion)

| Option | Pros | Cons |
|--------|------|------|
| **Native iOS (Swift + ARKit)** | Best LiDAR/RoomPlan/Object Capture; App Store fit | iOS-only initially |
| Cross-platform (RN/Flutter + native AR modules) | Faster Android story | AR/LiDAR depth is the hard part; still need native modules |
| Web-first photo calibrate | Fast experiment for Mode B | No serious LiDAR live measure |

**Lean:** Native iOS for live+LiDAR; photo mode could even be prototyped as a simple web/canvas experiment earlier.

---

## Mode A — Live AR / LiDAR

Apple stack:
- **ARKit** world tracking, raycasts, plane detection
- **SceneReconstruction** / mesh (LiDAR)
- **RoomPlan** — only if we add rooms
- **Object Capture** (photogrammetry) — optional object mesh
- Vision framework for rectangle / edge detection

Data model sketch:
- `Session` → `Measurement` (points in 3D) → `Drawable` (2D projection for canvas) → `DimensionLabel`

---

## Mode B — Photo calibration

Math essentials:
1. User provides known length in image pixels → **scale** (mm per pixel) for fronto-parallel case.
2. For perspective: estimate plane homography from a known rectangle (4 points) → measure in plane coordinates.
3. Single-image absolute 3D without depth/reference is underconstrained.

Useful references conceptually:
- ImageMeter’s three tools: Reference Scale, Perspective Reference, Perspective Length
- Camera intrinsics (if available from photo EXIF / AR frame) improve accuracy

On-device helpers:
- Vision rectangle detection to snap to card / paper
- Preset sizes library
- Optional OCR on ruler markings (advanced)

---

## Mode C — Scan

- LiDAR mesh → bounding box / section planes → drawings
- Heavier storage, UX, and export — treat as phase 3+

---

## Drawing engine

Options:
- Custom Canvas / Core Graphics / Metal overlay
- Vector scene graph (lines, polylines, arcs, text)
- Export: bitmap easy; **SVG/DXF** need real vector model from day one if that is a goal

**Recommendation:** Even in MVP, store measurements as **vectors + numbers**, then render — do not only screenshot AR.

---

## Accuracy & UX honesty

Always persist:
- `scaleSource`: lidar | arkit | photo_reference | manual
- `referenceDescription`: "credit_card_width"
- `estimatedErrorBand`: optional later

Show this on the drawing footer (“Scaled with credit card · photo mode”).

---

## Privacy

Measurements + photos can be sensitive (homes, inventory).
- Default on-device
- Cloud sync only as explicit feature
- Follow App Store photo/LiDAR permission patterns
