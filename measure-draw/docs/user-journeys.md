# User journeys

## Personas (draft)

| Persona | Goal | Constraints |
|---------|------|-------------|
| **DIY / home** | Will this shelf / sofa fit? | Casual accuracy; iPhone may not be Pro |
| **Reseller / seller** | List item with real dimensions | Speed; photo workflow; shareable image |
| **Trades / carpenter** | Opening / cut list sketch | Wants drawing + units; maybe DXF later |
| **Designer** | Quick field measure → sketch | Already may use magicplan/Polycam for rooms |
| **Remote quoter** | Client sends photo with a card in frame | Must calibrate photo; never visits site |

---

## Journey 1 — Live object measure → drawing

1. Open app → **Live**
2. Scan surfaces until tracking is ready
3. Tap two corners of a table → length appears
4. Tap to add width and height (or auto cuboid)
5. Canvas shows a rectangle/box with dimensions
6. Add note “dining table”
7. Export PDF / share image

**Success:** Under 60 seconds to a shareable dimensioned sketch.

---

## Journey 2 — Photo with credit-card reference

1. Open app → **Photo**
2. Pick photo of a package with a credit card beside it
3. App offers preset: **Credit card width 85.60 mm**
4. User aligns reference overlay to the card edges
5. User draws edges of the package on the same plane
6. App computes lengths; builds orthographic drawing
7. Export labeled photo + clean drawing

**Success:** User understands calibration; gets trustworthy-enough dimensions without LiDAR.

---

## Journey 3 — LiDAR-assisted cuboid

1. Open app → **Live (LiDAR detected)**
2. Point at a suitcase; app suggests bounding box
3. User confirms / nudges corners
4. W×H×D + volume shown
5. Drawing: isometric or three orthographic views
6. Save to project “Travel”

**Success:** Fewer taps than pure manual AR measure; clear LiDAR badge so user trusts scale.

---

## Journey 4 — Measure while walking a shape (polyline)

1. Live mode → **Path**
2. Tap each corner of an irregular countertop
3. Drawing builds on screen in plan view
4. Close shape → area + perimeter
5. Export SVG for fabricator

**Success:** Feels like Moasure, but phone-only for small indoor shapes.

---

## Journey 5 — Non-goal for v1

Full house as-built → Revit. Point users to Polycam/Twindo/magicplan if that is their job; we stay object/opening focused unless we explicitly expand.
