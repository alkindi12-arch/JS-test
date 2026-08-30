# Capture modes

The idea naturally splits into **three capture modes**. A strong product can ship one first and add the others.

---

## Mode A — Live AR / LiDAR measure

**What:** Use the camera (and LiDAR on Pro iPhones) to measure in real time.

**How users think about it:** “Point and tap like Apple Measure, but it also draws.”

### Inputs
- Live camera feed
- Device motion (ARKit)
- Optional LiDAR depth (iPhone 12 Pro and later Pro/Pro Max, iPad Pro)

### Outputs
- Point-to-point distances
- Auto rectangle / bounding box (W × H × D)
- On-canvas sketch with live dimension labels
- Session screenshot / PDF / SVG export

### Strengths
- Fast; no reference object needed when depth/AR works
- Feels magical on LiDAR devices
- Good for furniture, openings, people height, room edges

### Weaknesses
- Accuracy varies with lighting, distance, shiny/transparent surfaces
- Non-Pro phones are weaker (ARKit only)
- Harder outdoors in bright sun (LiDAR IR washout)

### Closest competitors
Apple Measure, Ruler AR, AR Measure Lidar, parts of Polycam / 3D Scanner App measurement tools

---

## Mode B — Calibrated photo measure

**What:** Upload or take a photo that includes a **known reference**, calibrate scale, then measure other dimensions in the photo.

**How users think about it:** “I forgot to measure on site — or I only have a photo — put a credit card / ruler in frame and measure later.”

### Inputs
- Photo from camera roll or camera
- User-defined reference (length of known object, or two known points)
- Optional perspective correction (rectangle on a plane)

### Calibration styles
1. **Simple scale (fronto-parallel)** — camera roughly parallel to flat object; one known length.
2. **Perspective plane** — mark a rectangle of known size on a wall/floor; measure anything on that plane.
3. **Perspective line / height** — three known points on a line → measure further along that line (poles, building height style).
4. **Preset references** — credit card (85.60 × 53.98 mm), A4, letter, US quarter, iPhone model dimensions, etc.

### Outputs
- Annotated photo with dimensions
- Extracted orthogonal drawing (orthographic sketch of the measured plane)
- Measurement list (CSV / table)

### Strengths
- Works on **any phone** (no LiDAR)
- Works on **old photos** if a reference exists
- Perfect for resellers, remote quoting, hard-to-reach objects

### Weaknesses
- Needs a reference (physics: a photo alone has no absolute scale)
- Single photo ≈ one plane (true 3D from one photo is limited)
- Lens distortion / bad perspective reduces accuracy

### Closest competitors
ImageMeter (Android-strong; photo calibrate + annotate), TapeAR (LiDAR clothing flat-lay niche)

---

## Mode C — Scan then draw (object / room)

**What:** Scan an object or room into a mesh / RoomPlan model, then measure and produce drawings from the scan.

**How users think about it:** “Walk around it once; get a 3D model and floor plan / silhouette.”

### Inputs
- LiDAR mesh scan and/or photogrammetry (Object Capture)
- Apple RoomPlan for rooms

### Outputs
- 3D model (USDZ / OBJ / STL)
- Bounding box dimensions
- 2D floor plan or orthographic views with dimensions
- Optional CAD export (DXF)

### Strengths
- Best for rooms and complex objects
- Re-measure later without returning to site

### Weaknesses
- Heaviest UX and engineering
- Crowded, subscription-heavy market (Polycam, magicplan, Twindo/Canvas, RoomScan Pro)
- Often overkill for “measure this box”

### Closest competitors
Polycam, 3D Scanner App, magicplan, RoomScan Pro, Twindo (Canvas), 3D Scan & Measure

---

## Mode D (related) — Measure & draw simultaneously (path-based)

**What:** As you move through space (or tap corners), a **drawing builds in real time**.

Moasure does this with a dedicated motion-sensing hardware device: walk the perimeter → get a 2D/3D drawing + area/volume + CAD export.

Phone-only versions exist in floor-plan apps (tap corners / AR walk).

**Why it matters for us:** This is the clearest expression of “draw it at the same time as you measure.”

---

## Recommended framing for Measure Draw

Treat the product as a **pipeline**, not three separate apps:

```
Capture (A or B or C)
    → Scale / calibrate
    → Geometry (points, edges, planes)
    → Dimensioned drawing canvas
    → Export / share
```

The **canvas + export** layer is where differentiation can live even when capture tech is similar to competitors.
