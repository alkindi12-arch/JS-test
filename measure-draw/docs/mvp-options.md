# MVP options (choose later — do not build yet)

Three credible first products. Pick **one**.

---

## MVP-1 — Photo Calibrate → Drawing (fastest learning)

**Ship:** Upload photo → pick preset reference → draw lines → get dimensioned sketch + annotated photo.

| | |
|--|--|
| **Why** | Unique vs Apple Measure; works on all iPhones; validates “drawing” value |
| **Skip** | LiDAR, room scan, CAD |
| **Risk** | Accuracy complaints if perspective UX is weak |
| **Success metric** | Users complete calibration without dropping; share ≥1 export |

---

## MVP-2 — Live AR Measure → Canvas Drawing

**Ship:** ARKit two-point + rectangle tools that **construct a vector drawing** live; LiDAR snap if available.

| | |
|--|--|
| **Why** | Familiar category; differentiation via drawing/export quality |
| **Skip** | Photo calibrate (add next) |
| **Risk** | Looks like “another Measure clone” in App Store screenshots |
| **Success metric** | Export rate; retention vs free Apple Measure |

---

## MVP-3 — Object Cuboid Wizard (LiDAR Pro)

**Ship:** Guided LiDAR bounding box for boxes/furniture → W×H×D → isometric + orthographic drawings.

| | |
|--|--|
| **Why** | Clear demo magic; narrow scope |
| **Skip** | Non-Pro users (or show soft upgrade path / photo fallback) |
| **Risk** | Small addressable audience; many scan apps overlap |
| **Success metric** | Time-to-cuboid; listing/share usage |

---

## Suggested sequencing (if we want the full vision)

```
MVP-1 Photo calibrate + drawing
   → add Live AR canvas (MVP-2)
   → add LiDAR assists / cuboid (MVP-3)
   → only then consider rooms / mesh / DXF Pro
```

Alternative if the founder has a Pro iPhone and cares most about live feel: start MVP-2, but **still** design data model for photo references so Mode B is not a rewrite.

---

## Explicitly out of first build

- Android
- Subscription cloud suite
- Scan-to-Revit
- Bluetooth lasers
- Gaussian splats / photogrammetry pipelines
- Team/enterprise admin
