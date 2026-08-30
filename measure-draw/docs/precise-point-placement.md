# Precise point placement — brainstorm & improvement plan

Date: **2026-08-30**  
Problem: Placing and adjusting measurement / calibration points is too hard on a phone. Fingers are large, the photo is small on screen, and a 1–2 mm miss at the tip of a finger becomes a noticeable length error after calibration.

---

## What’s wrong today

| Issue | Why it hurts |
|-------|----------------|
| Fat-finger placement | First tap lands under the fingertip, not where you aimed |
| Drag without zoom | Hard to see exact corners/edges while dragging |
| Finger covers the target | You can’t see the pixel you’re editing |
| No magnifier | ImageMeter / Maps / iOS Measure-style loupes are missing |
| No fine nudge | After drag, no “move 1 px” controls |
| No pan/zoom of the photo | You’re stuck at fit-to-screen scale |
| No edge snap | Corners and high-contrast edges aren’t assisted |
| Handle hit area vs precision | Large hit targets help grabbing but look imprecise |

Current model: tap → place → drag handle on a fit-width canvas (`MeasureCanvas` + `handleHitRadius`). Good start; not enough for accurate work.

---

## What good apps do (patterns to steal)

| Pattern | Where you see it | Benefit |
|---------|------------------|---------|
| **Loupe / magnifier** | ImageMeter, many photo editors | See under-finger detail while dragging |
| **Crosshair reticle** | Apple Measure, AR rulers | Aim with a fixed center; tap confirms |
| **Pinch zoom + pan** | Almost every map / photo tool | Work at true pixel scale |
| **Nudge pad (↑↓←→)** | CAD-ish mobile tools | Sub-pixel / 1-px corrections |
| **Offset drag** | Some annotation apps | Handle sits *above* the finger so target stays visible |
| **Edge / corner snap** | CAD, Figma mobile, Vision rectangle tools | Snap to strong edges |
| **Two-step: rough then refine** | Common UX | Fast place → zoomed refine mode |
| **Lock axis (H/V)** | Measure / CAD | Keep lines square when needed |

---

## Idea backlog (ranked)

### P0 — Must fix first (highest impact / effort)

1. **Pinch-to-zoom + one-finger pan** on the photo  
   - Double-tap to zoom toward a point  
   - “Fit” button to reset  
   - Point coords stay in image space (already true)

2. **Magnifier loupe while dragging a handle**  
   - Circular zoomed inset near the finger (or top of screen)  
   - Crosshair at the true point under edit  
   - Finger no longer hides the corner

3. **Touch offset while dragging**  
   - Point sits ~40–60 CSS px *above* the contact point  
   - Combined with loupe = big accuracy win on phones

4. **Selected-point nudge controls**  
   - After selecting a handle: on-screen D-pad or step buttons  
   - Steps: 1 px / 5 px / 10 px (or 0.1 mm once calibrated)  
   - Optional haptic tick on each nudge (native later)

### P1 — Strong upgrades

5. **Reticle placement mode**  
   - Fixed crosshair at screen center  
   - Pan the photo under it (or move phone in live mode later)  
   - “Place” / “Set point” button commits  
   - Same pattern Apple Measure uses mentally

6. **Refine mode sheet**  
   - Tap a handle → opens a zoomed crop centered on that point  
   - Drag inside the crop for fine control → Done  
   - Keeps main canvas readable

7. **Snap to edge / corner (optional toggle)**  
   - Simple: Sobel / Canny-ish or luminance gradient on local patch  
   - Or Vision rectangle corners when we detect a card/box  
   - “Snap: On/Off” so users can override

8. **Larger ghost handle + thin true point**  
   - Visual: big translucent grab ring + 1–2 px true tip  
   - Communicates “grab here / measure here”

### P2 — Nice later

9. **Lock horizontal / vertical** for the active segment  
10. **Undo last point / undo last nudge**  
11. **Numeric entry** (“this edge is exactly 40 cm”) as override  
12. **Multi-touch: one finger drag point, other pinch zoom**  
13. **Apple Pencil / stylus precision path** (iPad)  
14. **Auto-suggest corners** after Vision rectangle detect (ties to LiDAR/native later)

---

## Recommended product approach

Treat placement as a **two-speed interaction**:

```
Rough (fast)          Refine (precise)
─────────────         ────────────────
Tap near corner   →   Loupe drag / nudge / zoom
                      Confirm
```

Do **not** require precision on the first tap. Require precision on adjust.

### Target UX story

1. User taps roughly on a card corner.  
2. Handle appears; user drags with **loupe + offset**.  
3. Optional: pinch zoom for more detail.  
4. Optional: tap handle → nudge 1 px until happy.  
5. Second point same way → **Next**.  
6. Measure edges with the same refine tools.

---

## Proposed implementation plan (web first)

### Phase A — Zoom + pan foundation
**Goal:** User can work at 2–4× on the photo.

- Add view transform: `scale`, `offsetX`, `offsetY`  
- Pinch zoom, drag pan when not on a handle  
- Map pointer ↔ image coords through the transform (critical)  
- UI: Fit | 100% | zoom ±  

**Exit criteria:** Place/drag points accurately on a zoomed card corner on iPhone Safari.

### Phase B — Loupe + drag offset
**Goal:** Finger no longer hides the target.

- While dragging: show loupe (e.g. 2.5×–4×) with crosshair  
- Apply vertical touch offset so point is above fingertip  
- Loupe parks at top of canvas if near bottom edge  

**Exit criteria:** Users can align to a credit-card corner without “guessing under the finger.”

### Phase C — Select + nudge
**Goal:** Final 1–2 px corrections without fighting touch jitter.

- Tap handle to select (highlight)  
- Show nudge pad in the dock  
- Keyboard arrows on desktop  

**Exit criteria:** Length changes update live while nudging; export matches adjusted points.

### Phase D — Reticle / refine sheet (pick one)
**Goal:** Alternative precision path for people who hate dragging.

- Either center reticle + Place button  
- Or dedicated refine crop modal  

**Exit criteria:** Usability test: first-time user places card calibration within ~2% of truth without training.

### Phase E — Snap (optional)
**Goal:** Speed without killing control.

- Local edge snap within N image pixels  
- Hold “modifier” or toggle to disable  

---

## Technical notes (for implementers)

- Keep storing points in **natural image pixels** (already done).  
- View transform is display-only; export stays image-native.  
- Hit-testing must use **screen-space** radius (finger size), not raw image pixels only — today `handleHitRadius` scales with image width, which can feel wrong when zoomed. Prefer ~22–28 CSS px hit radius in screen space.  
- Separate gestures:  
  - 1 finger on handle → move point  
  - 1 finger on empty (no handle) → pan *or* place (mode-dependent)  
  - 2 fingers → pinch zoom  
- Avoid accidental pan while placing: short tap = place; move past threshold = pan (when in pan-priority mode) or ignore.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Time to calibrate card ends | &lt; 20 s for new users |
| Calibration length error vs known | within ~2% on fronto-parallel photos |
| “Couldn’t place point” complaints | near zero in informal tests |
| Drag without zoom still works | yes (progressive enhancement) |

---

## What we will not do in the first pass

- Full CAD constraint solver  
- Automatic perfect measurement with no user confirm  
- Relying only on LiDAR (photo mode must stay precise on any phone)

---

## Decision checklist (answer before coding Phase A–C)

1. Prefer **loupe+offset** or **center reticle** as the primary refine method?  
2. Should first tap **place immediately** (current) or open **reticle/refine** first?  
3. Snap to edges: default **on** or **off**?  
4. Is iPhone Safari the only precision target for now, or also desktop?

**Suggested defaults if you want us to proceed without more debate:**

- Primary: loupe + drag offset + pinch zoom  
- First tap still places roughly  
- Snap default off  
- Ship Phase A → B → C in that order  

---

## Next step

Once you confirm the defaults (or pick alternatives), implement **Phase A + B** in the web app next — that pair alone usually fixes “I can’t put the point where I mean.”
