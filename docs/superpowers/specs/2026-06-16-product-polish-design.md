# Product polish & reception experience — Design spec

**Date:** 2026-06-16  
**Status:** Approved for planning (user-requested scope)  
**Register:** Product UI (clinical workflow app)

---

## 1. Problem

The rebuild ships the core clinic engine (tasks, sign-off, staff, rota, incidents, reports) but feels like an internal tool next to the public effinic.com demos and to what managers/nurses expect day one:

- Kiosk login shows every staff member on one list; reception and clinical staff are mixed.
- Receptionists use the nurse UI and must pick a surgery they do not need.
- Task lists lack progress, categories, priority, and evidence cues visible on the marketing demos.
- Manager dashboard is sparse (counts + tables) with no lightweight activity feed or drill-down.
- Template/staff edit APIs exist without UI; photo evidence uploads but managers cannot audit photos easily.
- Fresh installs show empty reports/history; PWA brand assets are missing.

**Goal:** Make `app.effinic.com` feel like a finished, trustworthy product for daily use — without copying demo AI fiction (risk scores, streaks, gamification, fake trend %).

---

## 2. Users & devices

| Surface | Who | Device | Scene |
|---------|-----|--------|-------|
| Kiosk login | Nurse, receptionist | iPad at practice | Bright room, shared device, large taps |
| Nurse tasks | Nurse | iPad / phone PWA | Between patients, one hand |
| Reception tasks | Receptionist | iPad at desk | Front desk, no surgery context |
| Manager dashboard | Manager, viewer | Laptop + phone | Desk review before session lock |
| Manager tasks | Manager, viewer | Laptop + tablet | Oversight, audit |

**Responsive bar:** 390px phone, 768px iPad portrait, ≥1024px desktop. Nurse/reception: mobile-first. Manager: sidebar ≥768px, bottom tabs on phone (existing `AppNav`).

---

## 3. Explicit anti-goals (do NOT build)

Per `PRODUCT.md` and demo analysis:

- AI risk predictions, anomaly detection, “Send reminder” automation
- Gamification (streaks, top 10%, efficiency score rings with fake trends)
- Stock/inventory module, equipment log as separate product area
- Hero-metric template dashboard (+12% trend arrows)
- Card grids with icon + heading + blurb patterns
- Dark mode (deferred post-v1)
- New auth method for reception (keep PIN kiosk)

---

## 4. Design direction (impeccable / product register)

- **Color strategy:** Restrained — warm canvas, teal accent on primary actions and state only.
- **Scene sentence:** Nurse on iPad in a bright surgery; receptionist at a front desk iPad; manager at a laptop scanning what is still open before 13:15 lock.
- **Anchors:** NHS/clinical checklist apps (calm density), Linear (manager tables), Apple Reminders (task rows, not card grid).
- **Layout:** Flat bordered rows for tasks (extend `TaskRow`, do not replace with card grid). Progress as a thin bar or compact fraction text, not a giant ring.
- **Motion:** State only (loading skeleton, dialog open). Respect `prefers-reduced-motion`.
- **Copy:** Short, plain English. No em dashes.

---

## 5. Feature scope

### 5.1 Kiosk login — desk filter (“I’m reception” / “I’m clinical staff”)

**Flow:**

```
/p/{slug}/{token}
  → Step: Choose desk (Clinical staff | Reception)     [NEW]
  → Step: Pick your name (filtered by desk)             [MODIFIED]
  → Step: Enter PIN                                    [existing]
  → If clinical: Pick surgery → /app/tasks (nurse view)
  → If reception: Skip surgery → /app/tasks (reception view)
```

**Staff list filter:**

| Desk | Roles shown |
|------|-------------|
| Clinical staff | `nurse` (v1; extensible to dentist/hygienist if given PINs later) |
| Reception | `receptionist` |

**API:** Extend `POST /api/auth/nurse/staff-list` with optional `desk: 'clinical' | 'reception'`; filter `practice_members` by role.

**Persistence:** Store desk choice in session only for routing (not DB). Optional: `?desk=reception` query on URL for reception PWA bookmark (phase 2 in plan).

### 5.2 Task data model extensions

Add to `task_templates` (migration):

| Column | Type | Purpose |
|--------|------|---------|
| `category` | `text` nullable | Filter chips: `sterilisation`, `cleaning`, `equipment`, `financial`, `confidential`, `end_of_day`, `general` |

Expose on enriched tasks: `description`, `priority`, `evidenceRequired` (parse `evidence_required` text field, e.g. `"photo,checklist"`).

**Template UI:** Add category, priority, description, evidence checkboxes to create form; edit dialog for existing templates.

### 5.3 Shared task UI components

| Component | Responsibility |
|-----------|----------------|
| `TaskProgressHeader` | “3 of 8 complete” + thin progress bar; date line |
| `TaskMetaBadges` | Priority, mandatory, evidence required (icon + label), category |
| `TaskCategoryFilter` | Horizontal chip row; counts per category |
| `TaskSection` | “Pending” / “Completed” headings with counts |
| `TaskCard` | Wrapper around row content for reception (slightly more padding, step count); nurse keeps compact `TaskRow` |

**Pending vs completed:** Split lists client-side by `computedStatus === 'completed'`.

### 5.4 Nurse tasks view (`NurseTasksView`)

- Add `TaskProgressHeader`, category filter, pending/completed sections.
- Enrich `TaskRow` with `TaskMetaBadges` + optional one-line `description` truncate.
- Keep surgery switcher, session banner, sign-off buttons (existing).
- No performance/streak panel.

### 5.5 Reception tasks view (`ReceptionTasksView`)

New client view, routed when `member.role === 'receptionist'`:

- Same task APIs and complete/amend/sign-off logic as nurse (shared hooks or thin wrapper).
- **No surgery switcher** in header.
- Progress header + category chips (reception categories weighted: financial, cleaning, confidential, end_of_day).
- Task cards: title, description, category badge, priority, evidence, step count (`checklistSteps.length`), due time, “Start task” affordance (row tap).
- Incidents tab unchanged (existing nav).

### 5.6 Manager dashboard polish

Add without fake trends:

| Element | Implementation |
|---------|----------------|
| Completed today | Count from `getDashboardData` extension |
| Staff on rota today | Count active members with published rota or simple active staff count |
| Stat cards | 4-up grid: incomplete, overdue, completed today, staff active — flat bordered, no % arrows |
| Drill-down | Incomplete/overdue cards link to `/app/tasks?surgery=…` or filter query |
| Recent activity | Last 15 events: task completed, incident logged (simple list, timestamp, actor) — new `loadRecentActivity` in `page-data.ts` |

**No** AI panels, escalation inbox, or activity “Live” badges.

### 5.7 Manager tasks — viewer audit

- When `readOnly`, allow opening `TaskCompleteDialog` in `view` mode (read checklist, times, notes, photos).
- Manager photo audit: signed read URLs for `photoPaths` in view/amend dialog (`GET /api/uploads/sign` extended or new `read` action).

### 5.8 Staff & template edit UI

- Staff: inline or dialog edit for name, role, active (uses existing PATCH `/api/staff/[id]`).
- Templates: edit dialog (uses PATCH `/api/templates/[id]`).

### 5.9 Demo readiness

- `seed.sql`: receptionist user + templates with categories; 14–28 days historical `daily_tasks` with mixed completion states.
- Run `scripts/generate-pwa-icons.mjs`; commit `public/brand/*`.
- Seed viewer user for QA optional.

### 5.10 Evidence enforcement (light)

On complete: if template `evidence_required` includes `photo` and no photos queued/uploaded, block submit with clear message. Same for checklist if `checklist` required and steps incomplete.

---

## 6. Architecture notes

- Follow hybrid data loading (`AGENTS.md`): extend `page-data.ts` loaders; pass `initialData` to views.
- Extract shared task logic to `src/lib/tasks/task-view-helpers.ts` and/or `useTasksPageState` hook to avoid duplicating nurse/reception fetch/mutation logic.
- Kiosk page: extract steps to `src/components/kiosk/KioskDeskPicker.tsx`, keep `page.tsx` as orchestrator.
- Route reception: `tasks/page.tsx` renders `ReceptionTasksView` when `role === 'receptionist'`.

---

## 7. Testing strategy

- Unit: category filter helper, staff-list desk filter, evidence validation on complete.
- E2E: kiosk desk filter → reception skips surgery; nurse still picks surgery; viewer opens task read-only.
- Visual: screenshot checklist at 390 / 768 / 1280 for nurse, reception, dashboard.

---

## 8. Phased delivery

| Phase | Deliverable | Ships usable increment |
|-------|-------------|------------------------|
| 1 | Migration + API enrichment + seed | Data ready |
| 2 | Kiosk desk filter + reception routing | Reception login path |
| 3 | Shared task components + nurse polish | Nurse feels finished |
| 4 | ReceptionTasksView | Reception demo parity |
| 5 | Dashboard + activity + drill-down | Manager feels finished |
| 6 | Photo view, staff/template edit, viewer inspect | Audit completeness |
| 7 | Brand assets + historical seed | Demo-ready install |

---

## 9. Success criteria

- Receptionist on shared iPad: tap Reception → name → PIN → tasks (no surgery step).
- Nurse: progress + categories + pending/completed; still completes sign-off flow.
- Manager: dashboard shows completed today + recent activity; can open overdue drill-down.
- Manager can view photo evidence on completed tasks.
- Reports/history show meaningful data after `db reset`.
- UI passes DESIGN.md bans (no card grid, no hero metrics, no AI slop).
