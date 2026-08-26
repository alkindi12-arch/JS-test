# Product vision

## Problem

Measuring real-world objects is still awkward:

- Tape measures need two hands, a second person, or awkward positions.
- Phone AR “tape” apps give **numbers**, but rarely a clean **drawing** you can save, edit, or share.
- Photo measurement apps often need **manual calibration** and stop at annotated photos — not an editable sketch.
- LiDAR/scan apps excel at rooms and meshes, but are heavy (subscriptions, Pro-only, CAD export workflows) for “just measure this object and sketch it.”

You want something between a tape measure and a CAD tool: **fast capture → trustworthy scale → dimensioned drawing**.

## Desired outcomes

| Outcome | Description |
|---------|-------------|
| Live 3D measure | Point the phone at an object; get width / height / depth (and maybe volume). |
| Photo calibrate | Upload or snap a photo; mark a known reference; measure other lengths in-plane (and later, multi-plane / 3D). |
| LiDAR assist | On iPhone Pro, use depth/LiDAR for better scale and edge snapping (no reference object required in many cases). |
| Draw as you measure | Each measurement becomes geometry on a canvas: lines, rectangles, polylines, labels — exportable as image/PDF/SVG/DXF later. |

## Non-goals (for now)

- Full architectural BIM / Revit replacement.
- Survey-grade / permit-grade accuracy claims.
- Android parity in v1 (can be decided later).
- Hardware accessories (Bluetooth lasers, Structure Sensor) as a requirement — optional later.

## Design principles (product)

1. **Drawing is the product** — a number alone is a commodity; a dimensioned sketch is sticky.
2. **Works without LiDAR when possible** — photo + reference unlocks non-Pro phones and old photos.
3. **Honest about accuracy** — show confidence / method used (LiDAR vs ARKit vs photo-calibrated).
4. **One job per mode** — clear entry: Live / Photo / Scan Room (if we ever add rooms).
5. **Local-first by default** — measurements are personal/job data; cloud optional.

## North-star user story

> “I need this cabinet / box / furniture / garment / wall opening measured. I open the app, capture once, and walk away with a labeled drawing I can send to a contractor, post in a listing, or keep for myself.”
