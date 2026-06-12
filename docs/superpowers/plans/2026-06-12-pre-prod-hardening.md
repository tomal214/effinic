# Pre-Prod Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close validated pre-production gaps — security, read-only enforcement, workflow UI holes, PWA icons, lint/CI, and real E2E coverage — without rebuilding deferred Laravel modules (stock, CQC, open signup).

**Architecture:** Keep API routes as the primary auth gate; add DB-level write policies for defense-in-depth. Extract small validation helpers (`assertPracticeMember`, `assertPracticeSurgery`) reused by rota and similar routes. UI changes follow existing `readOnly` prop pattern from `StaffView`. No new abstractions beyond what’s needed.

**Tech Stack:** Next.js App Router, Supabase RLS migrations, Vitest, Playwright, GitHub Actions, sharp (icon resize).

**Out of scope (confirmed intentional v1):** Stock module, CQC report page, `/signup` page, sidebar nav redesign, proper brand logo, rota AM/PM UI (schema supports it; UI deferred), staff training fields, PDF upload (URL-only compliance stays).

---

## Priority map

| P | Area | Why |
|---|------|-----|
| P0 | Cron auth, rota FK validation, RLS write roles | Security before prod |
| P1 | Viewer read-only UI, task amend + compliance link | Pilot workflow completeness |
| P2 | PWA icons | Install polish (~10 min asset work) |
| P2 | Error states on key pages | UX reliability |
| P3 | Lint green, CI, E2E stubs | Engineering hygiene |

---

## Task 1: Secure daily-task cron edge function

**Files:**
- Modify: `supabase/functions/generate-daily-tasks/index.ts`
- Modify: `.env.example`
- Create: `tests/unit/edge/cron-auth.test.ts` (pure header check helper, extracted for testability)

- [ ] **Step 1: Extract auth helper**

Create `supabase/functions/_shared/cron-auth.ts`:

```typescript
export function isAuthorizedCronRequest(req: Request, secret: string | undefined) {
  if (!secret) return false
  const header = req.headers.get('authorization')
  return header === `Bearer ${secret}`
}
```

- [ ] **Step 2: Write failing unit test**

```typescript
import { describe, it, expect } from 'vitest'
import { isAuthorizedCronRequest } from '../../../supabase/functions/_shared/cron-auth'

describe('isAuthorizedCronRequest', () => {
  it('rejects missing header', () => {
    const req = new Request('https://x', { method: 'POST' })
    expect(isAuthorizedCronRequest(req, 'secret')).toBe(false)
  })

  it('accepts bearer secret', () => {
    const req = new Request('https://x', {
      method: 'POST',
      headers: { authorization: 'Bearer secret' },
    })
    expect(isAuthorizedCronRequest(req, 'secret')).toBe(true)
  })
})
```

Run: `pnpm test tests/unit/edge/cron-auth.test.ts` → FAIL (module missing)

- [ ] **Step 3: Guard edge function**

At top of handler in `generate-daily-tasks/index.ts`:

```typescript
import { isAuthorizedCronRequest } from '../_shared/cron-auth.ts'

// inside Deno.serve:
const cronSecret = Deno.env.get('CRON_SECRET')
if (!isAuthorizedCronRequest(req, cronSecret)) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
```

- [ ] **Step 4: Document env**

Add to `.env.example`:

```env
CRON_SECRET=change-me-in-production
```

Supabase dashboard: set `CRON_SECRET` on edge function; schedule cron with `Authorization: Bearer <secret>`.

- [ ] **Step 5: Run tests, commit**

```bash
pnpm test tests/unit/edge/cron-auth.test.ts
git commit -am "fix: require bearer secret for daily task cron"
```

---

## Task 2: Validate rota assign belongs to practice

**Files:**
- Create: `src/lib/practice/assert-practice-refs.ts`
- Create: `tests/unit/practice/assert-practice-refs.test.ts`
- Modify: `src/app/api/rota/assign/route.ts`
- Modify: `src/app/api/rota/assign/[id]/route.ts` (if PATCH exists)

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { assertUserInPractice, assertSurgeryInPractice } from '@/lib/practice/assert-practice-refs'

describe('assertPracticeRefs', () => {
  it('returns error when user not in practice', async () => {
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }),
            }),
          }),
        }),
      }),
    }
    const result = await assertUserInPractice(admin as any, 'practice-1', 'user-1')
    expect(result).toEqual({ ok: false, code: 'invalid_user' })
  })
})
```

- [ ] **Step 2: Implement helpers**

```typescript
export async function assertUserInPractice(admin, practiceId, userId) {
  const { data } = await admin
    .from('practice_members')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (!data) return { ok: false, code: 'invalid_user' as const }
  return { ok: true as const }
}

export async function assertSurgeryInPractice(admin, practiceId, surgeryId) {
  const { data } = await admin
    .from('surgeries')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('id', surgeryId)
    .eq('is_active', true)
    .maybeSingle()
  if (!data) return { ok: false, code: 'invalid_surgery' as const }
  return { ok: true as const }
}
```

- [ ] **Step 3: Use in rota assign route**

Before insert in `src/app/api/rota/assign/route.ts`:

```typescript
const admin = createAdminClient()
const userCheck = await assertUserInPractice(admin, member.practiceId, parsed.data.userId)
if (!userCheck.ok) return jsonError('Invalid staff member', 400)

const surgeryCheck = await assertSurgeryInPractice(admin, member.practiceId, parsed.data.surgeryId)
if (!surgeryCheck.ok) return jsonError('Invalid surgery', 400)
```

- [ ] **Step 4: Run tests + manual curl with wrong surgery UUID → 400**

- [ ] **Step 5: Commit**

```bash
git commit -am "fix: validate rota assign user and surgery belong to practice"
```

---

## Task 3: RLS write policies by role (viewer read-only at DB)

**Files:**
- Create: `supabase/migrations/20260612100800_rls_write_roles.sql`
- Create: `tests/unit/rls/write-role-helper.test.ts` (document SQL helper logic in TS mirror if needed)

**Approach:** Add SQL function `user_can_write_practice()` returning false for `viewer`, dentist/hygienist on manager tables, true for manager/admin/nurse/receptionist on their allowed tables. Replace INSERT/UPDATE/DELETE policies on tenant tables to include `AND user_can_write_practice()`.

- [ ] **Step 1: Migration SQL**

```sql
CREATE OR REPLACE FUNCTION user_can_write_practice()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT role NOT IN ('viewer', 'dentist', 'hygienist')
      FROM practice_members
      WHERE user_id = auth.uid()
        AND practice_id = get_user_practice_id()
        AND is_active = true
      LIMIT 1
    ),
    false
  );
$$;

-- Example: surgeries INSERT
DROP POLICY IF EXISTS surgeries_insert ON surgeries;
CREATE POLICY surgeries_insert ON surgeries FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id() AND user_can_write_practice());
```

Repeat for UPDATE/DELETE on: `surgeries`, `task_templates`, `daily_tasks`, `incidents`, `rota_assignments`, `settings`, `practice_members`, `practice_invites`.

Nurses/receptionists still need INSERT/UPDATE on `daily_tasks` and `incidents` — refine function:

```sql
-- user_can_write_practice(): manager/admin always; nurse/receptionist on tasks+incidents only
-- Use table-specific policies instead of one function if simpler:
-- e.g. daily_tasks_update allows nurse/receptionist OR manager/admin
```

**Recommended split:**
- `is_manager_or_admin()` — existing pattern or new helper
- Manager-only tables: surgeries, templates, rota, staff, settings
- Task tables: nurse/receptionist + manager/admin can write
- Viewer: SELECT only everywhere

- [ ] **Step 2: Apply migration locally**

```bash
supabase db reset
pnpm test
```

- [ ] **Step 3: Commit migration**

```bash
git add supabase/migrations/20260612100800_rls_write_roles.sql
git commit -m "fix: RLS write policies enforce role-based access"
```

---

## Task 4: PWA icons

**Files:**
- Create: `public/brand/icon-192.png`, `public/brand/icon-512.png`, `public/apple-touch-icon.png`
- Modify: `public/manifest.webmanifest`
- Modify: `src/app/api/manifest/practice/[slug]/[token]/route.ts` (if hardcoded icons)
- Modify: `src/app/layout.tsx` (apple-touch-icon link)

- [ ] **Step 1: Generate icons from existing logo**

```bash
pnpm add -D sharp
node scripts/generate-pwa-icons.mjs
```

Script reads `public/brand/logo.png`, outputs 192, 512, and 180 apple touch.

- [ ] **Step 2: Update manifests**

```json
"icons": [
  { "src": "/brand/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/brand/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
]
```

- [ ] **Step 3: Verify in Chrome DevTools → Application → Manifest**

- [ ] **Step 4: Commit assets + script**

---

## Task 5: Viewer read-only on surgeries and templates pages

**Files:**
- Modify: `src/app/app/surgeries/page.tsx` → convert to server wrapper + `SurgeriesView` client component
- Modify: `src/app/app/templates/page.tsx` → pass `readOnly` from layout
- Modify: `src/app/app/surgeries/layout.tsx`, `src/app/app/templates/layout.tsx`

- [ ] **Step 1: Surgeries layout passes readOnly**

```tsx
// surgeries/layout.tsx
const member = await requireManagerOrViewerPage()
return <SurgeriesView readOnly={member.role === 'viewer'} />
// Move page content to SurgeriesView.tsx; page.tsx re-exports or layout renders view
```

- [ ] **Step 2: Hide forms and action buttons when `readOnly`**

Same pattern as `StaffView`: no create form, no Deactivate/Delete buttons.

- [ ] **Step 3: Templates page — same treatment**

Hide add form and Remove button for viewer.

- [ ] **Step 4: E2E test (optional)**

Login as viewer seed user (add to seed if missing) → `/app/surgeries` has no "Add surgery" button.

- [ ] **Step 5: Commit**

```bash
git commit -am "fix: hide write UI for viewer on surgeries and templates"
```

---

## Task 6: Task amend UI + compliance link in task modal

**Files:**
- Modify: `src/components/app/TaskCompleteDialog.tsx`
- Modify: `src/lib/services/tasks.ts` (ensure enriched task includes `complianceFileUrl` from template)
- Create: `tests/e2e/task-amend.spec.ts` (manager amends unlocked completed task)

- [ ] **Step 1: Extend EnrichedTask with `complianceFileUrl`**

In `enrichTask()`, map `template.compliance_file_url`.

- [ ] **Step 2: TaskCompleteDialog modes**

- Pending task → existing complete flow
- Completed + not locked → show read-only summary + "Amend" fields + PATCH `/api/tasks/[id]`
- Completed + locked → read-only, no amend button
- If `complianceFileUrl` → show "View compliance doc" link opening in new tab

- [ ] **Step 3: Nurse vs manager**

Nurses amend own completed tasks (unlocked); managers can amend any (existing `userCanActOnTask` + `amendTask` service).

- [ ] **Step 4: E2E**

Complete task → amend notes → verify persisted.

- [ ] **Step 5: Commit**

---

## Task 7: Error states on data-fetch pages

**Files:**
- Modify: `src/components/app/DashboardView.tsx`
- Modify: `src/components/app/IncidentsView.tsx`
- Modify: `src/components/app/RotaView.tsx`
- Modify: `src/app/app/surgeries/page.tsx` (or SurgeriesView)
- Modify: `src/app/app/templates/page.tsx`

**Pattern (copy from login form):**

```tsx
{error && (
  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
    {error}
  </p>
)}
```

- [ ] **Step 1: Dashboard — show error + retry button when `/api/dashboard` fails (already has `error` state; ensure visible)**

- [ ] **Step 2: Incidents, Rota, Surgeries, Templates — add `error` state on failed fetch, replace infinite "Loading…"**

- [ ] **Step 3: Commit**

```bash
git commit -am "fix: show fetch errors with retry on manager pages"
```

---

## Task 8: Fix lint errors (13 react-hooks/set-state-in-effect)

**Files:** All client views with `useEffect(() => { load() }, [load])` pattern (~13 files)

**Approach:** Replace effect-triggered fetch with one of:
1. React 19 `use()` + server component data pass (preferred for new pages)
2. `useEffect` with void IIFE and eslint-disable only if unavoidable
3. **Pragmatic fix:** extract `load()` call to event/navigation, or use `startTransition(() => load())` inside effect to satisfy rule

Simplest consistent fix across codebase:

```tsx
useEffect(() => {
  void loadData()
}, [loadData])
```

If rule still fires, add shared hook `useOnMount(fn)` in `src/lib/use-on-mount.ts` with targeted eslint comment documented once.

- [ ] **Step 1: Run `pnpm lint` and list 13 error files**

- [ ] **Step 2: Apply fix file-by-file**

- [ ] **Step 3: Target: `pnpm lint` exits 0 (warnings OK to triage later)**

- [ ] **Step 4: Commit**

```bash
git commit -am "fix: resolve eslint react-hooks errors in client views"
```

---

## Task 9: Real E2E tests (RLS + session lock)

**Files:**
- Modify: `tests/e2e/rls-isolation.spec.ts`
- Modify: `tests/e2e/session-lock.spec.ts`
- Modify: `supabase/seed.sql` (second practice stub OR use service role to assert 403)
- Modify: `playwright.config.ts` (optional `TEST_FROZEN_TIME` env on webServer)

- [ ] **Step 1: RLS test — manager A cannot fetch practice B task by ID**

Use API route with manager session cookie; expect 404/403 on foreign task UUID (document foreign UUID in seed comments).

- [ ] **Step 2: Session lock test**

Set `webServer.env: { TEST_FROZEN_TIME: '2026-06-12T14:00:00+01:00' }` when `process.env.CI` or test file needs it; wire `getNow()` in `src/lib/clock.ts` to read env (already may support this — verify).

- [ ] **Step 3: Run `pnpm test:e2e` — 0 skipped except intentional**

- [ ] **Step 4: Commit**

---

## Task 10: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main, feat/**]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm build
```

E2E job (optional separate, needs Supabase in CI — defer to Task 10b or use `supabase start` in CI with health wait).

- [ ] **Step 1: Add workflow, push branch, confirm green on type-check + test + build + lint**

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions for type-check, test, lint, build"
```

---

## Verification checklist

```bash
supabase db reset
pnpm test
pnpm lint        # 0 errors
pnpm build
pnpm test:e2e    # all non-skipped pass
```

Manual:
- [ ] Cron POST without bearer → 401
- [ ] Rota assign with foreign surgery UUID → 400
- [ ] Viewer: no write forms on staff/surgeries/templates
- [ ] PWA manifest shows 192 + 512 icons
- [ ] Amend completed task (unlocked) works; locked task blocked
- [ ] Compliance URL visible in task modal when set

---

## Suggested commit order

1. Security (Tasks 1–3)
2. PWA icons (Task 4)
3. Viewer UI + amend modal (Tasks 5–6)
4. Error states + lint (Tasks 7–8)
5. E2E + CI (Tasks 9–10)

---

## Execution handoff

**Plan saved to `docs/superpowers/plans/2026-06-12-pre-prod-hardening.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** — one task per subagent, review between tasks
2. **Inline Execution** — implement in this session with checkpoints

Which approach?
