# Admin CRUD, Roles & Rotating-Only Workflow Plan

**Date:** 2026-09-28  
**Live app:** https://alkinda.com/lineage  
**Scope:** Admin full actions on Area / Activities / Equipment; role allocation UX; Rotating-team-only product (remove Teams from UI)  
**Status:** Planning — ready for phased implementation  
**Related:** `docs/equipment-history-system-plan.md`, `docs/erd-gap-analysis-and-migration-plan.md`

---

## 1. Verdict (short)

The app already has a working **Area → Unit → Equipment → Activity** flow with auth, RCA, status history, work orders, and uploads. For a **Rotating-only** plant tool with strong Admin control, three product decisions are required:

| Decision | Today | Target |
|----------|-------|--------|
| Admin master-data CRUD | Areas / Units / Equipment: **add / edit / remove** (empty-only delete). Activities: **no edit-metadata, no delete** | Admin can **add / edit / delete** Areas, Equipment, and Activities (Units stay as the link between Area and Equipment) |
| Role allocation | Role selectable on Add/Edit user only | Clear **role allocation** on Admin settings (inline assign + edit) |
| Teams / disciplines | Multi-team UI (Rotating, Electrical, …) on Admin + New Activity | **Rotating only** — remove Team pickers from Admin and Activities; default all work to Rotating |

This plan reviews the full workflow, names gaps, and sequences implementation so nothing breaks live data on Hostinger MySQL.

---

## 2. Product context (locked)

- **Users:** Rotating maintenance crew + supervisors + one or more Admins.
- **Hierarchy:** Area → Unit → Equipment → Activities → Updates / Attachments / RCA / Work orders.
- **Discipline:** Always **rotating**. Team is no longer a user-facing concept.
- **Auth roles (keep):** Admin · Supervisor · Technician · Operator.
- **Deploy:** Hostinger Node on `alkinda.com`, branch `cursor/equipment-history-plan-db65`.

> **Note on “Area, Activities and Equipment”:** Units remain in the model (equipment belongs to a unit under an area). Admin CRUD for Units stays, surfaced as part of the Area drill-down, so the plant tree stays valid. If Units should be hidden later, that is a separate UX decision; this plan keeps them.

---

## 3. Current workflow (as live today)

### 3.1 End-to-end process

```text
Sign in (/login)
    │
    ▼
Dashboard (KPIs, delayed, by status / discipline)
    │
    ├─► Areas ──► Area detail ──► Unit detail ──► Equipment profile
    │       │           │               │               │
    │       │           │               │               ├─ status change
    │       │           │               │               └─ create activity
    │       │           │               └─ Add equipment (Admin)
    │       │           └─ Add unit / Edit area (Admin)
    │       └─ Add area (Admin)
    │
    ├─► Activities list (filter: tag, WO ref)
    │       └─► Activity detail
    │               ├─ Add daily update
    │               ├─ Mark completed (Supervisor+)
    │               ├─ Close + RCA verify (Supervisor+)
    │               ├─ Attachments
    │               └─ Work orders
    │
    ├─► Equipment catalogue
    ├─► Reports (closed/completed packs + CSV)
    └─► Admin (Admin only)
            ├─ Users: Add / Edit / Deactivate
            ├─ Roles: read-only list
            └─ Teams: read-only list  ← remove
```

### 3.2 Role capabilities (today)

| Action | Operator | Technician | Supervisor | Admin |
|--------|----------|------------|------------|-------|
| View hierarchy / activities | ✅ | ✅ | ✅ | ✅ |
| Create activity | ✅ | ✅ (via write) | ✅ | ✅ |
| Add daily update / attach / WO | ❌ | ✅ | ✅ | ✅ |
| Complete activity | ❌ | ❌ | ✅ | ✅ |
| Close + verify RCA | ❌ | ❌ | ✅ | ✅ |
| Change equipment status | ❌ | ✅ | ✅ | ✅ |
| Area / Unit / Equipment add·edit·delete | ❌ | ❌ | ❌ | ✅ (delete if empty) |
| Edit activity fields (title, type, priority, equipment) | ❌ | ❌ | ❌ | ❌ **gap** |
| Delete activity | ❌ | ❌ | ❌ | ❌ **gap** |
| Manage users / assign roles | ❌ | ❌ | ❌ | ✅ (via Edit user) |

Permissions source: `roles.permissions_json` + `lib/auth/permissions.ts` (`Admin` has `{ all: true }`).

### 3.3 What already exists (do not rebuild)

| Domain | Implemented | Key paths |
|--------|-------------|-----------|
| Area CRUD | Create / edit / delete (no child units) | `areas/new`, `areas/[id]/edit`, `lib/data/hierarchy-writes.ts` |
| Unit CRUD | Create / edit / delete (no equipment) | `units/new`, `units/[id]/edit` |
| Equipment CRUD | Create / edit / delete (no activities) | `equipment/new`, `equipment/[id]/edit` |
| Activity lifecycle | Create, update, complete, close, RCA, WO, uploads | `lib/data/plant-writes.ts` |
| User CRUD | Add, edit, deactivate/reactivate, role+team on forms | `admin/users/*`, `lib/auth/admin-actions.ts` |
| Tag + WO filters | Activities list | `activities/page.tsx` |

---

## 4. Gaps vs requested product

### 4.1 Admin actions — Area

| Capability | Status | Gap |
|------------|--------|-----|
| Add | ✅ | — |
| Edit | ✅ | — |
| Delete | ✅ (blocked if units exist) | Optional: cascade policy or “archive” — keep safe delete |
| Discoverability | Partial | Ensure every Area card/detail always shows Edit for Admin |

**Unit (required middle layer):** same add/edit/delete already present; keep and polish buttons.

### 4.2 Admin actions — Equipment

| Capability | Status | Gap |
|------------|--------|-----|
| Add | ✅ | — |
| Edit | ✅ (tag, description, criticality, unit, make/model) | Status stays on profile timeline (correct) |
| Delete | ✅ (blocked if activities exist) | Optional force-delete policy for Admin later |

### 4.3 Admin actions — Activities (**main gap**)

| Capability | Status | Gap |
|------------|--------|-----|
| Add | ✅ (any create-capable role) | Admin already can; keep |
| Edit | ❌ | No form to change title, type, priority, equipment, start date |
| Delete | ❌ | No soft or hard delete; closed history is permanent today |

**Target for Admin:**

1. **Edit activity** — `/lineage/activities/[id]/edit`  
   Fields: title, type, priority, equipment (re-parent carefully), optional notes.  
   Status still follows lifecycle (open → in progress → completed → closed), not free-form from this form (except Admin override — see below).
2. **Delete activity** — Admin only  
   - Preferred: **soft delete** (`deleted_at` / `is_deleted`) so history/reports stay recoverable.  
   - MVP acceptable: hard delete with cascade of updates, attachments metadata, RCA, WO links, status-history rows tied to that activity — only when Admin confirms.  
   - Recommendation: **Phase A soft-delete column**; hard purge later if needed.
3. **Admin status override** (optional but useful) — force status / reopen closed activity for corrections.

### 4.4 Role allocation on Admin settings

| Today | Gap |
|-------|-----|
| Role chosen on Add user and Edit user pages | Role is buried; Admin page Roles section is **read-only** |
| No quick-assign from the users table | Want **allocate roles** without hunting |

**Target UX on `/lineage/admin`:**

1. Users table columns: Name · Email · **Role** (editable control) · Status · Actions.
2. Inline **Role** `<select>` + Save per row (or autosubmit) → `assignRoleAction`.
3. Keep full Edit page for name/email/password/active.
4. Roles panel: keep definitions (permissions summary); no need for custom permission editor in this phase.
5. Remove Teams panel entirely.

### 4.5 Rotating-only — remove Team from Admin & Activities

| Location | Today | Target |
|----------|-------|--------|
| Admin users table | Team column | **Remove** |
| Admin Add/Edit user | Team `<select>` | **Remove**; server always sets `team_id` = Rotating |
| Admin Teams surface | Lists all teams | **Remove** section |
| New Activity form | “Assigned team” `<select>` | **Remove**; always assign Rotating |
| Activity detail badge | Shows `activity.team` | Show **Rotating** or hide badge |
| Dashboard “by discipline” | Multi-team chart | Collapse to Rotating-only KPI or replace with type/status chart |
| DB `teams` / `assigned_team` | Still present | Keep columns for compatibility; stop exposing in UI |

**Server rules after change:**

- `createUserAction` / `updateUserAction`: force `team_id` to Rotating team id (seed id `1`).
- `createActivityAction`: ignore client `teamId`; set `assigned_team = 'rotating'`, `assigned_team_id = <Rotating>`.
- Existing non-Rotating users/activities: one-time backfill script optional (recommended).

---

## 5. Target workflows (after plan)

### 5.1 Admin — plant master data

```text
Admin signs in
  → Areas: Add area | open area → Edit area | Add unit
  → Unit: Edit unit | Add equipment | Remove unit (if empty)
  → Equipment: Edit equipment | Remove equipment (if no activities)
  → Activities: New | Edit metadata | Delete (Admin) | lifecycle as today
```

### 5.2 Crew — daily work (unchanged intent)

```text
Operator/Tech opens activity on equipment tag
  → logs daily update, photos
  → Tech progresses status
  → Supervisor completes → closes with RCA
  → Equipment status follows open/close rules
```

### 5.3 Admin — people

```text
Admin → Admin settings
  → Add user (name, email, password, ROLE)
  → Inline assign role on user row
  → Edit user / deactivate
  → No team picker
```

---

## 6. Data & permission design

### 6.1 New / changed permissions

| Permission | Meaning | Who |
|------------|---------|-----|
| `admin` (existing) | Users, hierarchy CRUD, activity edit/delete | Admin |
| `activities.create` | Open activity | Operator+ |
| `activities.update` | Daily updates / attach / WO | Technician+ |
| `activities.complete` / `close` | Lifecycle | Supervisor+ |
| `activities.delete` (**new**) | Soft/hard delete activity | Admin only (`all` covers it) |
| `activities.edit` (**new** or fold into admin) | Edit activity metadata | Admin (Supervisors later if needed) |

Implementation shortcut: gate edit/delete with `requirePermission('admin')` for this phase — same as hierarchy writes.

### 6.2 Schema changes (minimal)

| Change | Migration | Notes |
|--------|-----------|-------|
| `activities.deleted_at DATETIME NULL` | `006_activity_soft_delete.sql` | Filter list/detail queries `WHERE deleted_at IS NULL` |
| Optional `activities.updated_by_user_id` | same or later | Audit who edited metadata |
| Teams table | **No drop** | Hide in UI; keep FK stability |

### 6.3 Rotating constant

```ts
// lib/auth/rotating.ts (proposed)
export const ROTATING_TEAM_ID = 1;
export const ROTATING_DISCIPLINE = 'rotating' as const;
```

All writes use this constant; UI never asks.

---

## 7. UI / screen checklist

### 7.1 Remove

- [ ] Admin → Teams section  
- [ ] Admin users table → Team column  
- [ ] Admin Add user → Team field  
- [ ] Admin Edit user → Team field  
- [ ] Activities → New → Assigned team field  
- [ ] Activity detail → team badge (or hardcode label “Rotating”)  
- [ ] Dashboard discipline breakdown if it implies multi-team (replace with activity type / status)

### 7.2 Add / improve (Admin)

- [ ] Admin users table → inline Role select + save  
- [ ] Activities detail → **Edit** button (Admin)  
- [ ] Activities edit page (metadata)  
- [ ] Activities detail → **Delete** (Admin, confirm)  
- [ ] Soft-deleted activities excluded from lists/filters/reports  
- [ ] Confirm Area / Equipment delete copy is clear (“Remove” + reason when blocked)

### 7.3 Keep

- [ ] Hierarchy Add/Edit/Remove for Area, Unit, Equipment  
- [ ] Activity lifecycle (update / complete / close / RCA / WO / attachments)  
- [ ] Tag + WO filters on Activities list  
- [ ] Equipment status timeline  

---

## 8. Phased implementation plan

### Phase R1 — Rotating-only UI + writes (smallest, unblocks product message)

**Goal:** App reads as a Rotating tool; no team pickers.

1. Add `lib/auth/rotating.ts` constant.  
2. Strip Team fields from Admin add/edit/list and Teams panel.  
3. Strip Assigned team from New Activity; force Rotating in `createActivityAction`.  
4. Force `team_id = Rotating` on user create/update.  
5. Soften activity badge / dashboard multi-team chart.  
6. Optional SQL backfill: set all users/activities to Rotating.

**Risk:** Low. No destructive schema.  
**Verify:** New activity has no team control; Admin has no Teams section; DB rows show rotating.

### Phase R2 — Admin role allocation UX

**Goal:** Assign roles from Admin settings without friction.

1. `assignRoleAction` (admin-only, self-demotion guard kept).  
2. Inline role control on Admin users table.  
3. Short help text: “Roles control what each person can do in Lineage.”  
4. Keep full Edit user for password / deactivate.

**Risk:** Low.  
**Verify:** Change Operator → Technician inline; login as that user sees update actions.

### Phase R3 — Admin activity edit + delete

**Goal:** Full Admin CRUD on Activities.

1. Migration `006_activity_soft_delete.sql` (`deleted_at`).  
2. Update list/get/report queries to hide soft-deleted.  
3. `updateActivityAction` + `/activities/[id]/edit` (Admin).  
4. `deleteActivityAction` (soft delete) + confirm UI on detail.  
5. Revalidate paths; equipment/activity counts stay correct.

**Risk:** Medium (reports, filters, FK children). Prefer soft delete.  
**Verify:** Edit title/priority; delete hides from list; direct URL shows gone/not found; Admin can confirm in DB `deleted_at` set.

### Phase R4 — Admin hierarchy polish (close the loop)

**Goal:** Area / Equipment actions feel complete and obvious.

1. Audit every hierarchy page for consistent Add / Edit / Remove.  
2. Empty-state CTAs (“No units — Add unit”).  
3. Block-copy when delete forbidden (child counts).  
4. Add equipment `serial` to create/edit forms (column already in schema).  
5. Optional: Admin “force remove equipment” only after soft-deleting all its activities (document, do not auto-cascade).

**Risk:** Low–medium if cascade added; avoid cascade in R4.

### Phase R5 — Hardening & docs (optional)

- Activity reopen (Admin).  
- Audit log table for admin destroys/edits.  
- Update `docs/hostinger-deploy.md` + short Admin user guide.  
- Rename `daily_updates` → `activity_updates` (deferred leftover from ERD plan).

---

## 8.5 Audit confirmation (codebase inventory)

Cross-checked against a full workflow audit of the live tree. Confirms the gap list above and adds these notes:

| Finding | Plan response |
|---------|----------------|
| Hierarchy Admin CRUD already exists for Area / Unit / Equipment with empty-child delete guards | R4 = polish only, not rebuild |
| **No activity delete action, UI, or permission key anywhere** | R3 primary deliverable |
| **No post-create activity metadata edit** (title/type/priority/equipment) | R3 edit page |
| Teams: DB + `listTeams` only; no Team CRUD UI | **Do not build Team CRUD** — R1 removes Team from UI (Rotating-only) |
| Roles panel is name-only; no `permissions_json` editor | R2 = assign existing roles to users; permission editor stays out of scope |
| Operator can create but cannot post daily updates | Deferred — not requested now; revisit after R1–R3 if crew needs it |
| Technician cannot mark Completed (seed: read/write/update only) | Deferred — keep Supervisor complete/close unless product asks otherwise |
| Equipment `serial` in schema but missing from create/edit forms | Fold into R4 hierarchy polish |
| No delete for attachments / work orders after create | Out of scope unless Admin asks later |
| `activities.read` never enforced on pages (any signed-in user can view) | Acceptable for Rotating single-crew app; leave as-is |
| Session cookie stores `role` at login | R2 must handle re-login or session re-issue after role change (already in §10) |

---

## 9. Out of scope (this plan)

- Multi-plant / multi-discipline teams returning in UI  
- **Team CRUD** (intentionally removed, not expanded)  
- Custom permission matrix editor per role  
- Changing Operator/Technician lifecycle powers (unless requested later)  
- Attachment / work-order delete  
- QR codes, email digests, AI RCA (still Phase 2/3 in system plan)  
- Dropping `teams` table from MySQL  
- Changing VARCHAR plant PKs (`A01`, `CDU`, `EQ-…`)

---

## 10. Test plan (acceptance)

### Rotating-only
- [ ] Admin page has no Teams section and no Team column  
- [ ] Add/Edit user has Role, not Team  
- [ ] New activity has no team dropdown; new row `assigned_team = rotating`  
- [ ] Non-admin users never see team controls  

### Roles
- [ ] Admin can change a user’s role from the Admin table  
- [ ] Admin cannot remove own Admin role / deactivate self  
- [ ] Role change takes effect on next request (session role from JWT — **confirm**: today session stores `role` name at login; may need re-login or session refresh on role change)

> **Session note:** `lib/auth/session.ts` cookies store `role` at login. After inline role assign, either (a) document “user must sign in again”, or (b) R2 enhancement: re-issue session when Admin edits that user if it is the current session. Prefer (b) for the edited user only when `session.id === userId`; for other users, next login is enough.

### Activity Admin CRUD
- [ ] Admin sees Edit + Delete on activity detail  
- [ ] Edit updates title/type/priority/equipment  
- [ ] Delete removes from lists/filters/reports  
- [ ] Technician cannot edit metadata or delete  

### Hierarchy (regression)
- [ ] Admin still Add/Edit/Remove Area, Unit, Equipment with existing safeguards  
- [ ] Tag filter + WO filter still work  

### Live
- [ ] Deploy on `cursor/equipment-history-plan-db65`  
- [ ] `https://alkinda.com/lineage/admin` and activity edit/delete verified with Admin account  

---

## 11. Suggested build order (for “next” turns)

| Turn | Phase | Outcome |
|------|-------|---------|
| 1 | **R1** | Team UI gone; Rotating forced in writes |
| 2 | **R2** | Inline role allocation on Admin |
| 3 | **R3** | Activity edit + soft delete for Admin |
| 4 | **R4** | Hierarchy CTA polish + empty states |
| 5 | **R5** | Session refresh on self-role change, docs |

Each phase: implement → `npm run build` → commit → push feature branch → merge/push deploy branch → verify on alkinda.com.

---

## 12. Open questions (defaults if unanswered)

| Question | Default in this plan |
|----------|----------------------|
| Delete activity = soft or hard? | **Soft** (`deleted_at`) |
| Can Supervisor edit activity metadata? | **No** — Admin only for now |
| Show Unit in nav as first-class? | **No** — keep under Area drill-down |
| Backfill historical Electrical/etc. activities to Rotating? | **Yes** in R1 script (display consistency) |
| Keep CMMS work-order attach? | **Yes** — independent of team |

---

## 13. File touch map (implementation guide)

| Phase | Likely files |
|-------|----------------|
| R1 | `app/lineage/(platform)/admin/**`, `activities/new/page.tsx`, `activities/[id]/page.tsx`, `lib/auth/admin-actions.ts`, `lib/data/plant-writes.ts`, `dashboard/page.tsx`, new `lib/auth/rotating.ts`, optional `scripts/backfill-rotating.mjs` |
| R2 | `admin/page.tsx`, `lib/auth/admin-actions.ts` (`assignRoleAction`), maybe small client row form |
| R3 | `db/migrations/006_activity_soft_delete.sql`, `plant-db.ts`, `plant-writes.ts`, `activities/[id]/edit/page.tsx`, activity detail actions |
| R4 | `areas/**`, `units/**`, `equipment/**` empty states / button consistency |

---

## 14. Success definition

When this plan is done, an Admin on alkinda.com can:

1. Manage the plant tree (Area → Unit → Equipment) with add / edit / delete.  
2. Manage the work stream (Activities) with add / edit / delete, plus existing lifecycle.  
3. Allocate roles to users from Admin settings in one place.  
4. Never see or choose a non-Rotating team anywhere in Admin or Activities.

Crew roles keep their day-to-day update / complete / close path without master-data or delete powers.
