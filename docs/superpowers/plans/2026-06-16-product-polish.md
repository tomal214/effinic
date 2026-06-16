# Product Polish & Reception Experience — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a finished-feeling clinical product: kiosk desk filter, reception-specific tasks UI, nurse/manager polish, template metadata, photo audit, and demo-ready seed/assets — without demo AI fiction.

**Architecture:** Extend DB + `EnrichedTask` pipeline; shared task UI components; `ReceptionTasksView` parallel to `NurseTasksView`; kiosk desk step before staff picker; dashboard activity loader in `page-data.ts`. Restrained product UI per `DESIGN.md`.

**Spec:** `docs/superpowers/specs/2026-06-16-product-polish-design.md`

**Tech Stack:** Next.js App Router, Tailwind, shadcn/ui, Supabase, Vitest, Playwright

---

## File map (new / major touch)

| File | Action |
|------|--------|
| `supabase/migrations/20260616100000_template_category.sql` | Create |
| `src/lib/tasks/categories.ts` | Create — labels, filter helpers |
| `src/lib/tasks/evidence.ts` | Create — parse/validate evidence_required |
| `src/lib/tasks/use-tasks-page.ts` | Create — shared fetch/mutate state |
| `src/components/tasks/TaskProgressHeader.tsx` | Create |
| `src/components/tasks/TaskMetaBadges.tsx` | Create |
| `src/components/tasks/TaskCategoryFilter.tsx` | Create |
| `src/components/tasks/TaskSection.tsx` | Create |
| `src/components/kiosk/KioskDeskPicker.tsx` | Create |
| `src/components/app/ReceptionTasksView.tsx` | Create |
| `src/components/app/NurseTasksView.tsx` | Modify |
| `src/components/app/TaskRow.tsx` | Modify |
| `src/components/app/DashboardView.tsx` | Modify |
| `src/components/app/StaffView.tsx` | Modify — edit dialog |
| `src/components/app/TemplatesView.tsx` | Modify — full fields + edit |
| `src/components/app/ManagerTasksView.tsx` | Modify — viewer view mode |
| `src/components/app/TaskCompleteDialog.tsx` | Modify — photo display, evidence gate |
| `src/app/p/[slug]/[token]/page.tsx` | Modify — desk step, skip surgery for reception |
| `src/app/api/auth/nurse/staff-list/route.ts` | Modify — desk filter |
| `src/lib/validation/auth.ts` | Modify — desk in staff-list schema |
| `src/lib/validation/templates.ts` | Modify — category, priority, description, evidence |
| `src/lib/services/tasks.ts` | Modify — enrich fields |
| `src/lib/services/dashboard.ts` | Modify — completedToday, activity |
| `src/lib/app/page-data.ts` | Modify — activity loader |
| `src/app/app/tasks/page.tsx` | Modify — ReceptionTasksView route |
| `supabase/seed.sql` | Modify — receptionist, categories, history |
| `public/brand/*` | Add via icon script |

---

## Phase 1 — Data model & API enrichment

### Task 1: Template category migration

**Files:**
- Create: `supabase/migrations/20260616100000_template_category.sql`

- [ ] **Step 1: Add migration**

```sql
ALTER TABLE task_templates
  ADD COLUMN IF NOT EXISTS category text;

COMMENT ON COLUMN task_templates.category IS
  'Optional filter chip: sterilisation, cleaning, equipment, financial, confidential, end_of_day, general';
```

- [ ] **Step 2: Apply locally**

Run: `supabase db reset` or `supabase migration up`  
Expected: migration applies without error

- [ ] **Step 3: Regenerate types**

Run: `pnpm gen-types`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260616100000_template_category.sql src/types/database.ts
git commit -m "feat: add task template category column"
```

---

### Task 2: Category and evidence helpers

**Files:**
- Create: `src/lib/tasks/categories.ts`
- Create: `src/lib/tasks/evidence.ts`
- Create: `tests/unit/tasks/categories.test.ts`
- Create: `tests/unit/tasks/evidence.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/tasks/categories.test.ts
import { describe, expect, it } from 'vitest'
import { categoryLabel, filterTasksByCategory } from '@/lib/tasks/categories'

describe('filterTasksByCategory', () => {
  const tasks = [
    { category: 'sterilisation' },
    { category: 'cleaning' },
    { category: null },
  ]

  it('returns all when category is all', () => {
    expect(filterTasksByCategory(tasks, 'all')).toHaveLength(3)
  })

  it('filters by category', () => {
    expect(filterTasksByCategory(tasks, 'cleaning')).toHaveLength(1)
  })
})
```

```typescript
// tests/unit/tasks/evidence.test.ts
import { describe, expect, it } from 'vitest'
import { parseEvidenceRequired, evidenceSatisfied } from '@/lib/tasks/evidence'

describe('parseEvidenceRequired', () => {
  it('parses comma-separated values', () => {
    expect(parseEvidenceRequired('photo, checklist')).toEqual(['photo', 'checklist'])
  })
})

describe('evidenceSatisfied', () => {
  it('requires photo when photo in template', () => {
    expect(
      evidenceSatisfied(['photo'], { checklistComplete: true, photoCount: 0 })
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm test tests/unit/tasks/categories.test.ts tests/unit/tasks/evidence.test.ts`

- [ ] **Step 3: Implement**

```typescript
// src/lib/tasks/categories.ts
export const TASK_CATEGORIES = [
  'sterilisation',
  'cleaning',
  'equipment',
  'financial',
  'confidential',
  'end_of_day',
  'general',
] as const

export type TaskCategory = (typeof TASK_CATEGORIES)[number] | 'all'

const LABELS: Record<string, string> = {
  sterilisation: 'Sterilisation',
  cleaning: 'Cleaning',
  equipment: 'Equipment',
  financial: 'Financial',
  confidential: 'Confidential',
  end_of_day: 'End of day',
  general: 'General',
}

export function categoryLabel(category: string | null | undefined) {
  if (!category) return 'General'
  return LABELS[category] ?? category
}

export function filterTasksByCategory<T extends { category?: string | null }>(
  tasks: T[],
  category: TaskCategory
) {
  if (category === 'all') return tasks
  return tasks.filter((t) => (t.category ?? 'general') === category)
}

export function countByCategory<T extends { category?: string | null }>(tasks: T[]) {
  const counts = new Map<string, number>()
  for (const task of tasks) {
    const key = task.category ?? 'general'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}
```

```typescript
// src/lib/tasks/evidence.ts
export type EvidenceKind = 'photo' | 'checklist'

export function parseEvidenceRequired(raw: string | null | undefined): EvidenceKind[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is EvidenceKind => s === 'photo' || s === 'checklist')
}

export function evidenceSatisfied(
  required: EvidenceKind[],
  state: { checklistComplete: boolean; photoCount: number }
) {
  if (required.includes('checklist') && !state.checklistComplete) return false
  if (required.includes('photo') && state.photoCount < 1) return false
  return true
}

export function evidenceLabel(required: EvidenceKind[]) {
  if (!required.length) return null
  const parts: string[] = []
  if (required.includes('photo')) parts.push('Photo')
  if (required.includes('checklist')) parts.push('Checklist')
  return parts.join(', ')
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

---

### Task 3: Enrich tasks API with template metadata

**Files:**
- Modify: `src/lib/services/tasks.ts` — `EnrichedTask`, `enrichTask`, select queries
- Modify: `src/lib/validation/templates.ts`
- Modify: `src/lib/services/templates.ts` — create/update/list

- [ ] **Step 1: Extend EnrichedTask type and enrichTask**

Add fields: `description`, `priority`, `category`, `evidenceRequired: EvidenceKind[]`

Update template select to include: `description, priority, category, evidence_required`

- [ ] **Step 2: Extend template validation**

```typescript
// add to createTemplateSchema
description: z.string().trim().optional(),
priority: z.enum(['low', 'medium', 'high']).optional(),
category: z.enum(['sterilisation','cleaning','equipment','financial','confidential','end_of_day','general']).optional(),
evidencePhoto: z.boolean().optional(),
evidenceChecklist: z.boolean().optional(),
```

Map `evidencePhoto`/`evidenceChecklist` to `evidence_required` string on write.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test && pnpm build`

- [ ] **Step 4: Commit**

---

## Phase 2 — Kiosk desk filter

### Task 4: Staff list desk filter API

**Files:**
- Modify: `src/lib/validation/auth.ts`
- Modify: `src/app/api/auth/nurse/staff-list/route.ts`
- Create: `tests/unit/auth/staff-list-desk.test.ts` (optional integration via unit on pure filter fn)

- [ ] **Step 1: Add desk to schema**

```typescript
desk: z.enum(['clinical', 'reception']).optional(),
```

- [ ] **Step 2: Filter members by role after fetch**

```typescript
const CLINICAL_ROLES = new Set(['nurse'])
const RECEPTION_ROLES = new Set(['receptionist'])

// join practice_members with role in select, then:
function filterByDesk<T extends { role: string }>(staff: T[], desk?: 'clinical' | 'reception') {
  if (!desk) return staff
  const allowed = desk === 'reception' ? RECEPTION_ROLES : CLINICAL_ROLES
  return staff.filter((s) => allowed.has(s.role))
}
```

Note: extend staff-list query to include `role` from `practice_members`.

- [ ] **Step 3: Commit**

---

### Task 5: Kiosk UI — desk picker + reception skip surgery

**Files:**
- Create: `src/components/kiosk/KioskDeskPicker.tsx`
- Modify: `src/app/p/[slug]/[token]/page.tsx`

- [ ] **Step 1: Build KioskDeskPicker**

Two full-width buttons, min-h 56px, plain labels:
- "Clinical staff" — subtext: "Nurses and surgery tasks"
- "Reception" — subtext: "Front desk tasks"

No icons grid. Border + hover per DESIGN.md.

- [ ] **Step 2: Add step `'desk'` before `'staff'`**

State: `desk: 'clinical' | 'reception' | null`

`loadStaff` passes `desk` to API body.

- [ ] **Step 3: After PIN verify, branch routing**

```typescript
// After successful verify, fetch session role OR pass desk through:
if (desk === 'reception') {
  router.push('/app/tasks')
  return
}
setStep('surgery')
await loadSurgeries()
```

Better: after verify, call lightweight `/api/auth/onboarding-status` or include `role` in verify response. **Prefer:** extend verify JSON with `role` from member record to avoid extra round trip.

- [ ] **Step 4: Extend verify route response**

`return jsonOk({ ok: true, role: member.role })`

- [ ] **Step 5: Manual test**

Reception desk → PIN → lands on tasks without surgery step.  
Clinical → PIN → surgery → tasks.

- [ ] **Step 6: Commit**

---

## Phase 3 — Shared task UI components

### Task 6: TaskProgressHeader, TaskMetaBadges, TaskCategoryFilter, TaskSection

**Files:**
- Create: `src/components/tasks/TaskProgressHeader.tsx`
- Create: `src/components/tasks/TaskMetaBadges.tsx`
- Create: `src/components/tasks/TaskCategoryFilter.tsx`
- Create: `src/components/tasks/TaskSection.tsx`

**Design rules:**
- Progress: text `3 of 8 complete` + `h-1.5` rounded bar, accent fill, no circular ring
- Chips: horizontal scroll on mobile, `rounded-full`, count in chip `(2)`
- Sections: `text-lg font-semibold` heading + muted count, not cards

- [ ] **Step 1: Implement components (no business logic beyond props)**

- [ ] **Step 2: Verify at 390px / 768px — no horizontal overflow**

- [ ] **Step 3: Commit**

---

### Task 7: Upgrade TaskRow

**Files:**
- Modify: `src/components/app/TaskRow.tsx`

- [ ] **Step 1: Add optional `description`, `priority`, `evidenceLabel`, `categoryLabel` props**

- [ ] **Step 2: Render TaskMetaBadges below title when any meta present**

- [ ] **Step 3: Truncate description to 1 line `text-sm text-muted-foreground`**

- [ ] **Step 4: Commit**

---

## Phase 4 — Nurse & reception task views

### Task 8: Shared useTasksPage hook

**Files:**
- Create: `src/lib/tasks/use-tasks-page.ts`

Extract from `NurseTasksView`: load tasks/surgeries, filter by category, split pending/completed, dialog state, refresh after complete.

Props: `initialData`, `showSurgerySwitcher: boolean`

- [ ] **Step 1: Extract hook without behavior change**

- [ ] **Step 2: NurseTasksView uses hook**

- [ ] **Step 3: Run app manually + `pnpm test`**

- [ ] **Step 4: Commit**

---

### Task 9: NurseTasksView polish

**Files:**
- Modify: `src/components/app/NurseTasksView.tsx`

- [ ] **Step 1: Add TaskProgressHeader at top**

- [ ] **Step 2: Add TaskCategoryFilter**

- [ ] **Step 3: Split into TaskSection Pending / Completed**

- [ ] **Step 4: Pass enriched fields to TaskRow**

- [ ] **Step 5: Responsive pass — surgery switcher + bottom nav safe area**

- [ ] **Step 6: Commit**

---

### Task 10: ReceptionTasksView

**Files:**
- Create: `src/components/app/ReceptionTasksView.tsx`
- Modify: `src/app/app/tasks/page.tsx`

- [ ] **Step 1: Create ReceptionTasksView using useTasksPage with `showSurgerySwitcher: false`**

Layout differences:
- Page title: "Today's tasks" + staff name from profile optional later
- No SessionBanner surgery context in header (keep session banner for lock times)
- Slightly taller row padding (`py-5`) for desk use
- Show step count: `{task.checklistSteps.length} steps` when > 0

- [ ] **Step 2: Route in tasks/page.tsx**

```tsx
if (member.role === 'receptionist') {
  return <ReceptionTasksView initialData={initialData} />
}
```

- [ ] **Step 3: E2E test `tests/e2e/reception-kiosk.spec.ts`**

Desk reception → PIN → no surgery URL in flow → tasks visible

- [ ] **Step 4: Commit**

---

## Phase 5 — Manager dashboard & audit

### Task 11: Dashboard extensions

**Files:**
- Modify: `src/lib/services/dashboard.ts`
- Modify: `src/lib/app/page-data.ts`
- Modify: `src/components/app/DashboardView.tsx`

- [ ] **Step 1: Add `completedToday` count to dashboard data**

- [ ] **Step 2: Add `staffActiveCount` (active practice_members)**

- [ ] **Step 3: Add `loadRecentActivity` — union last 10 task completions + incidents**

- [ ] **Step 4: Dashboard UI — 4 stat tiles in `grid grid-cols-2 lg:grid-cols-4 gap-3`**

Incomplete and overdue link to `/app/tasks` with query `?status=incomplete` / `?status=overdue` (implement filter in ManagerTasksView).

- [ ] **Step 5: Recent activity list — flat rows, relative time**

- [ ] **Step 6: Commit**

---

### Task 12: Manager photo audit + viewer inspect

**Files:**
- Modify: `src/app/api/uploads/sign/route.ts` — support `action: 'read'` for existing paths
- Modify: `src/components/app/TaskCompleteDialog.tsx` — render photo thumbnails with signed URLs in view mode
- Modify: `src/components/app/ManagerTasksView.tsx` — remove `readOnly` block on `handleSelectTask`; use view mode

- [ ] **Step 1: Read signed URL endpoint**

- [ ] **Step 2: Photo grid in dialog when `mode === 'view'`**

- [ ] **Step 3: Viewer can open completed/locked tasks read-only**

- [ ] **Step 4: Commit**

---

### Task 13: Evidence gate on complete

**Files:**
- Modify: `src/components/app/TaskCompleteDialog.tsx`

- [ ] **Step 1: On submit, call `evidenceSatisfied`**

- [ ] **Step 2: Show inline error if blocked**

- [ ] **Step 3: Unit test evidence gate**

- [ ] **Step 4: Commit**

---

## Phase 6 — Manager setup polish

### Task 14: Template form — full fields + edit dialog

**Files:**
- Modify: `src/components/app/TemplatesView.tsx`
- Modify: `src/lib/services/templates.ts`

Fields to add on create/edit:
- Description (textarea)
- Priority (select)
- Category (select)
- Evidence checkboxes (photo, checklist)

- [ ] **Step 1: Create form fields**

- [ ] **Step 2: Edit button per row → dialog with PATCH**

- [ ] **Step 3: Commit**

---

### Task 15: Staff edit dialog

**Files:**
- Modify: `src/components/app/StaffView.tsx`

- [ ] **Step 1: Edit action opens dialog (name, role, active toggle)**

- [ ] **Step 2: PATCH on save, refresh list**

- [ ] **Step 3: Commit**

---

## Phase 7 — Demo readiness

### Task 16: Seed data

**Files:**
- Modify: `supabase/seed.sql`

- [ ] **Step 1: Add receptionist user + member + PIN `1234`**

- [ ] **Step 2: Add 4–6 reception templates with categories**

- [ ] **Step 3: Tag existing nurse templates with categories**

- [ ] **Step 4: Insert historical `daily_tasks` for past 21 days (~30% incomplete)**

Use fixed UUIDs for determinism.

- [ ] **Step 5: `supabase db reset` + verify reports chart has bars**

- [ ] **Step 6: Commit**

---

### Task 17: PWA brand assets

**Files:**
- Run: `node scripts/generate-pwa-icons.mjs`
- Commit: `public/brand/logo.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`

- [ ] **Step 1: Generate icons**

- [ ] **Step 2: Verify manifest resolves icons**

- [ ] **Step 3: Commit**

---

## Phase 8 — QA & documentation

### Task 18: E2E and docs

**Files:**
- Modify: `docs/demo-script.md` — reception path, desk filter
- Modify: `docs/roles-and-login.md` — desk filter section
- Modify: `AGENTS.md` — note reception view (one paragraph)

- [ ] **Step 1: Add Playwright spec for kiosk desk + reception skip surgery**

- [ ] **Step 2: Run `pnpm test && pnpm test:e2e && pnpm build`**

- [ ] **Step 3: Update docs**

- [ ] **Step 4: Commit**

---

### Task 19: Impeccable polish pass

**Files:** All touched views

- [ ] **Step 1: Audit each screen at 390 / 768 / 1280 — checklist from DESIGN.md bans**

- [ ] **Step 2: Fix spacing rhythm, empty states, error states**

- [ ] **Step 3: Final commit `polish: product finish pass`**

---

## Execution order (subagent batches)

| Batch | Tasks | Can parallelize |
|-------|-------|-----------------|
| A | 1, 2, 3 | 2 after 1 types |
| B | 4, 5 | sequential |
| C | 6, 7 | parallel |
| D | 8, 9, 10 | sequential |
| E | 11, 12, 13 | 11 parallel with 12 |
| F | 14, 15 | parallel |
| G | 16, 17 | parallel |
| H | 18, 19 | sequential |

---

## Self-review (spec coverage)

| Spec § | Task |
|--------|------|
| 5.1 Kiosk desk filter | 4, 5 |
| 5.2 Task data extensions | 1, 2, 3 |
| 5.3 Shared components | 6, 7 |
| 5.4 Nurse polish | 8, 9 |
| 5.5 Reception view | 10 |
| 5.6 Dashboard | 11 |
| 5.7 Viewer/photos | 12 |
| 5.8 Staff/template edit | 14, 15 |
| 5.9 Demo seed/assets | 16, 17 |
| 5.10 Evidence enforcement | 13 |

**Explicitly excluded:** AI panels, streaks, equipment log module, stock module.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-16-product-polish.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per phase/batch, review between batches  
2. **Inline Execution** — implement in this session with checkpoints after each phase

Which approach do you want?
