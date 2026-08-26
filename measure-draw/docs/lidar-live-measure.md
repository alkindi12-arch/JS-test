# Live LiDAR measure — investigation & product plan

Research date: **2026-08-26**  
Goal: understand how App Store apps draw edges and auto-measure with the iPhone camera/LiDAR, and how Measure Draw should adopt that.

---

## What you asked for

> Take advantage of iPhone LiDAR for **live** measurement: the camera draws edges and takes measurements by itself (then we still want a drawing).

That is a **native iOS** feature. It cannot run inside the current web/PWA build — Safari has no public API to the LiDAR scanner or ARKit scene mesh.

---

## How apps on the App Store do it

### 1. Apple Measure (built-in) — closest UX reference

| Capability | Notes |
|------------|--------|
| Point-to-point AR tape | Tap two points in live camera |
| **Auto rectangle** | Detects rectangular objects and outlines them; tap + for W×H |
| LiDAR upgrades (Pro) | Faster tracking, **edge guide lines** (H/V), ruler view, person height |
| Output | Numbers + screenshots — weak as an editable drawing |

**Takeaway:** “Camera draws the edges” in Measure is mostly **rectangle / edge guides** driven by Vision + ARKit, **improved by LiDAR depth**, not a full CAD auto-trace of every object silhouette.

### 2. Object / mesh scanners

| App | What it does with LiDAR |
|-----|-------------------------|
| **Polycam** | LiDAR mesh + photogrammetry; measure on scan; floor plans; CAD exports |
| **3D Scanner App** | LiDAR / TrueDepth / Object Capture; bounding box + ruler on mesh |
| **3D Scan & Measure** | RoomPlan rooms + object mesh; auto W×H×D |
| **iLidar** | RoomPlan + point cloud; live AR measure claims ~±2 mm marketing |

**Takeaway:** They often **scan first → measure on the model**, or show a **bounding box**, rather than only drawing 2D edges on the live camera forever.

### 3. Room / floor-plan (auto walls & furniture)

| App | Stack |
|-----|--------|
| **magicplan**, **RoomScan Pro**, **RoomPlot**, **FloorPlan AI**, **ArchScan** | Apple **RoomPlan** + LiDAR |

RoomPlan detects walls, doors, windows, furniture types and dimensions automatically while you walk. Great for rooms — heavier than “measure this box.”

### 4. Niche auto-dimension

| App | Behavior |
|-----|----------|
| **TapeAR** | Flat-lay clothing; LiDAR + visual intelligence; auto garment dimensions |

Shows that **auto-measure shines when the object class is known**.

---

## Apple building blocks (what we would use)

```
┌─────────────────────────────────────────────────────────┐
│  Live camera (AVFoundation / ARView)                    │
│    ├─ ARKit world tracking                              │
│    ├─ LiDAR sceneReconstruction (.meshWithClassification)│
│    ├─ Vision DetectRectanglesRequest (2D rectangles)    │
│    ├─ Raycasts onto mesh / planes for metric 3D points  │
│    ├─ RoomPlan (rooms only)                             │
│    └─ Object Capture (guided object → USDZ → bounds)    │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
              Dimensioned drawing canvas (shared with photo mode)
```

### Approach A — Live edge guides + tap (Apple Measure–like)

1. ARKit tracks the world; LiDAR builds a depth mesh.  
2. Vision finds rectangles in the camera frame.  
3. Project rectangle corners into 3D via raycast → metric W×H.  
4. Overlay guides; user confirms / drags handles.  
5. Push segments into the same drawing export as photo mode.

**Pros:** Familiar, fast, good for boxes/screens/frames.  
**Cons:** Soft edges / non-rectangles need manual taps.

### Approach B — Auto cuboid / bounding box

1. User orbits the object (or we accumulate mesh in front of camera).  
2. Fit an oriented bounding box (OBB) to the segmented mesh.  
3. Show W×H×D overlays; user nudges faces/corners.  
4. Emit orthographic drawing (front/side/top).

**Pros:** True 3D; matches “measure by itself.”  
**Cons:** Harder UX/engineering; fails on transparent/shiny/cluttered scenes.

### Approach C — Object Capture then dimensions

1. Guided multi-angle capture (iOS 17+ `ObjectCaptureSession`).  
2. Photogrammetry → USDZ.  
3. `visualBounds` → extents in meters.

**Pros:** Stable dimensions for products.  
**Cons:** Not instant “live”; processing time; device limits.

### Approach D — RoomPlan

Only if we expand to rooms. Not the first LiDAR wedge for object-first Measure Draw.

---

## Recommended Measure Draw LiDAR product

**Name in UI:** Live LiDAR (Pro)

**Hero flow**

1. Open Live mode (requires iPhone 12 Pro or later / LiDAR iPad Pro).  
2. Coaching: “Point at the object — move slowly.”  
3. Auto: detect dominant rectangle **or** propose cuboid.  
4. Overlay drawn edges + dimensions.  
5. **Drag handles** (same interaction language as photo calibrate).  
6. Confirm → dimensioned drawing + export (shared pipeline).  
7. Fallback: manual two-point measure on LiDAR mesh if auto fails.

**Device gating**

- Pro with LiDAR → Live mode enabled.  
- Non-Pro → keep Photo Calibrate (already shipped); soft upsell copy only.

---

## Competitive positioning

| | Apple Measure | Polycam / scanners | **Measure Draw Live** |
|--|---------------|--------------------|------------------------|
| Auto edges | Rectangles | Mesh / room | Rectangles + cuboid |
| Drawing export | Weak | Heavy pro exports | **First-class sketch** |
| Photo + reference | No | Limited | **Yes (already)** |
| Room BIM | No / Room Plan elsewhere | Yes | Later / no |

We do **not** need to out-scan Polycam. We need **auto edges → adjustable handles → clean drawing**, plus photo mode for everyone.

---

## Accuracy & honesty

- Market claims vary (±1–2%, ±2 mm, etc.); treat as **planning-grade**.  
- Always stamp exports: `scaleSource: lidar | arkit | photo_reference`.  
- Disclaimer: not survey / permit grade unless validated.

---

## Web vs native

| Surface | LiDAR live edges |
|---------|------------------|
| Current web/PWA | **Impossible** (no LiDAR/ARKit) |
| Native Swift iOS | **Required** |
| Distribution | TestFlight → App Store |

Optional later: **WebXR** on Android depth phones is a different stack and still weaker than Apple LiDAR for this UX.

---

## Implementation phases (when we start native)

1. **Spike:** ARKit mesh raycast two-point measure + overlay line.  
2. **Auto rectangle:** Vision + confirm + drag corners.  
3. **Cuboid:** bounding box W×H×D + orthographic drawing.  
4. **Unify:** same export/PDF/SVG model as photo mode.  
5. **Polish:** edge guides, units, tutorials, non-Pro fallback deep-link to photo mode.

---

## Open questions

1. Object-first cuboid, or Measure-like rectangles first?  
2. Do you have an **iPhone Pro with LiDAR** for TestFlight?  
3. Apple Developer account available for signing?  
4. Should Live mode be free or Pro-unlock?

---

## Decision for this repo right now

- ✅ Photo mode UX: **draggable calibration handles + Next** (web).  
- ✅ This document: LiDAR investigation + plan.  
- ⏳ Native Live LiDAR app: **next build track** after photo UX is solid.
