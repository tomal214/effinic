# Effinic Workflow Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-ready Effinic clinical workflow app on Vercel + Supabase with nurse PIN auth, session-locked tasks, manager analytics, and pilot feedback items 1, 2, and 4.

**Architecture:** Next.js App Router with all mutations in API routes; Supabase Postgres + RLS + session-lock triggers; hybrid auth (managers via Supabase email/password, nurses via practice URL + PIN); edge function for daily task generation.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui, Geist Sans, Supabase (Auth/Postgres/Storage), Vitest, Playwright, pnpm, Recharts, next-pwa (or `@ducanh2912/next-pwa`)

**Spec:** `docs/superpowers/specs/2026-06-12-effinic-rebuild-design.md`

---

## File Structure (created by this plan)

```text
effinic/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/signup/page.tsx
│   │   ├── p/[slug]/[token]/page.tsx
│   │   ├── platform/page.tsx
│   │   ├── app/layout.tsx
│   │   ├── app/page.tsx
│   │   ├── app/tasks/page.tsx
│   │   ├── app/tasks/history/page.tsx
│   │   ├── app/incidents/page.tsx
│   │   ├── app/rota/page.tsx
│   │   ├── app/staff/page.tsx
│   │   ├── app/surgeries/page.tsx
│   │   ├── app/templates/page.tsx
│   │   ├── app/reports/page.tsx
│   │   └── api/
│   │       ├── auth/nurse/staff-list/route.ts
│   │       ├── auth/nurse/verify/route.ts
│   │       ├── auth/nurse/sign-off/morning/route.ts
│   │       ├── auth/nurse/sign-off/end-day/route.ts
│   │       ├── auth/surgery/switch/route.ts
│   │       ├── platform/practices/route.ts
│   │       ├── platform/practices/[id]/invite/route.ts
│   │       ├── staff/route.ts
│   │       ├── staff/[id]/route.ts
│   │       ├── staff/[id]/reset-pin/route.ts
│   │       ├── surgeries/route.ts
│   │       ├── surgeries/[id]/route.ts
│   │       ├── templates/route.ts
│   │       ├── templates/[id]/route.ts
│   │       ├── tasks/route.ts
│   │       ├── tasks/[id]/route.ts
│   │       ├── tasks/[id]/complete/route.ts
│   │       ├── tasks/history/route.ts
│   │       ├── tasks/history/export/route.ts
│   │       ├── uploads/sign/route.ts
│   │       ├── incidents/route.ts
│   │       ├── incidents/[id]/route.ts
│   │       ├── rota/route.ts
│   │       ├── rota/assign/route.ts
│   │       ├── rota/assign/[id]/route.ts
│   │       ├── rota/publish/route.ts
│   │       ├── dashboard/route.ts
│   │       ├── reports/weekly/route.ts
│   │       ├── reports/export/route.ts
│   │       └── manifest/practice/[slug]/[token]/route.ts
│   ├── components/
│   │   ├── ui/                    # shadcn
│   │   └── app/
│   │       ├── Logo.tsx
│   │       ├── PinPad.tsx
│   │       ├── StaffPicker.tsx
│   │       ├── SurgerySwitcher.tsx
│   │       ├── SessionBanner.tsx
│   │       ├── TaskRow.tsx
│   │       ├── TaskCompleteDialog.tsx
│   │       ├── PhotoUploadQueue.tsx
│   │       ├── AppNav.tsx
│   │       └── WeekChart.tsx
│   ├── lib/
│   │   ├── supabase/server.ts
│   │   ├── supabase/client.ts
│   │   ├── supabase/admin.ts
│   │   ├── supabase/middleware.ts
│   │   ├── auth/platform-admin.ts
│   │   ├── auth/member.ts
│   │   ├── auth/pin.ts
│   │   ├── session/constants.ts
│   │   ├── session/task-session.ts
│   │   ├── session/task-lock.ts
│   │   ├── session/mandatory-gate.ts
│   │   ├── tasks/filter-tasks.ts
│   │   ├── tasks/computed-status.ts
│   │   └── validation/              # Zod schemas per domain
│   ├── middleware.ts
│   └── types/database.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260612100000_practices_and_members.sql
│   │   ├── 20260612100100_surgeries_templates_tasks.sql
│   │   ├── 20260612100200_session_functions_triggers.sql
│   │   ├── 20260612100300_incidents_rota_settings.sql
│   │   ├── 20260612100400_rls_policies.sql
│   │   └── 20260612100500_storage_buckets.sql
│   ├── functions/generate-daily-tasks/index.ts
│   ├── seed.sql
│   └── seed.pilot.sql
├── tests/
│   ├── unit/session/task-session.test.ts
│   ├── unit/session/task-lock.test.ts
│   ├── unit/session/mandatory-gate.test.ts
│   ├── unit/auth/pin.test.ts
│   ├── unit/tasks/filter-tasks.test.ts
│   ├── unit/tasks/computed-status.test.ts
│   └── e2e/
│       ├── nurse-complete-task.spec.ts
│       ├── manager-dashboard.spec.ts
│       ├── session-lock.spec.ts
│       └── rls-isolation.spec.ts
├── playwright.config.ts
├── vitest.config.ts
├── README.md
└── docs/demo-script.md
```

---

## Parallel Subagent Map

| Subagent | Tasks | Depends on |
|----------|-------|------------|
| **schema-rls** | 3–8 | 1–2 |
| **auth-tenancy** | 9–12 | 3–8 |
| **tasks-module** | 13–17 | 9–12 |
| **incidents** | 18 | 9–12 |
| **rota** | 19 | 9–12 |
| **manager-dashboard** | 20 | 13–17 |
| **storage-uploads** | 16 (upload slice) | 13–15 |
| **e2e-verification** | 22–24 | All |

---

## Task 0: Git worktree and repo init

**Files:**
- Create: `.gitignore`, `package.json` (placeholder until Task 1)

**Sub-skill:** `using-git-worktrees` — isolate on branch `feat/effinic-rebuild`

- [ ] **Step 1: Init git and branch**

```bash
cd /Volumes/T7B/thomasmini/Documents/Coding/Personal/My-Tech-Projects/effinic
git init
git checkout -b feat/effinic-rebuild
```

- [ ] **Step 2: Add base gitignore**

Create `.gitignore`:

```gitignore
node_modules/
.next/
.env*.local
.vercel
supabase/.branches
supabase/.temp
coverage/
test-results/
playwright-report/
.DS_Store
```

- [ ] **Step 3: Stage docs already written**

```bash
git add AGENTS.md DESIGN.md PRODUCT.md docs/ public/brand/
```

(Do not commit unless user asks.)

---

## Task 1: Next.js scaffold and tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `components.json`

- [ ] **Step 1: Scaffold Next.js with pnpm**

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --turbopack
```

When prompted about existing files, allow merge/keep docs.

- [ ] **Step 2: Install core dependencies**

```bash
pnpm add @supabase/supabase-js @supabase/ssr zod bcryptjs geist recharts sonner browser-image-compression date-fns date-fns-tz
pnpm add -D @types/bcryptjs vitest @vitejs/plugin-react jsdom @playwright/test @ducanh2912/next-pwa
```

- [ ] **Step 3: Add package.json scripts**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "gen-types": "supabase gen types typescript --local > src/types/database.ts"
  }
}
```

- [ ] **Step 4: Configure Geist in root layout**

`src/app/layout.tsx`:

```tsx
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={GeistSans.className}>
      <body className="bg-[var(--color-canvas)] text-[var(--color-ink)] antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Add DESIGN.md tokens to globals.css**

`src/app/globals.css` — paste OKLCH tokens from `DESIGN.md` as `:root { --color-canvas: oklch(...); ... }`.

- [ ] **Step 6: Init shadcn**

```bash
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button input label select dialog sheet table badge tabs skeleton checkbox separator dropdown-menu toast
```

- [ ] **Step 7: Verify scaffold**

```bash
pnpm type-check && pnpm build
```

Expected: PASS (empty app builds).

---

## Task 2: Vitest setup and session helpers (TDD)

**Files:**
- Create: `vitest.config.ts`, `src/lib/session/constants.ts`, `src/lib/session/task-session.ts`, `src/lib/session/task-lock.ts`, `src/lib/session/mandatory-gate.ts`
- Test: `tests/unit/session/task-session.test.ts`, `tests/unit/session/task-lock.test.ts`, `tests/unit/session/mandatory-gate.test.ts`

- [ ] **Step 1: Write failing tests for task session**

`tests/unit/session/task-session.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getTaskSession } from '@/lib/session/task-session'
import { SESSION_MORNING_LOCK } from '@/lib/session/constants'

describe('getTaskSession', () => {
  it('returns morning when due before lock time', () => {
    expect(getTaskSession('09:00', SESSION_MORNING_LOCK)).toBe('morning')
  })

  it('returns afternoon when due at or after lock time', () => {
    expect(getTaskSession('13:15', SESSION_MORNING_LOCK)).toBe('afternoon')
    expect(getTaskSession('17:00', SESSION_MORNING_LOCK)).toBe('afternoon')
  })

  it('returns all_day when no due time', () => {
    expect(getTaskSession(null, SESSION_MORNING_LOCK)).toBe('all_day')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm test tests/unit/session/task-session.test.ts
```

- [ ] **Step 3: Implement session helpers**

`src/lib/session/constants.ts`:

```ts
export const SESSION_MORNING_LOCK = '13:15'
export const SESSION_AFTERNOON_LOCK = '18:00'
export const PIN_LENGTH = 4
export const PIN_MAX_ATTEMPTS = 5
export const PIN_LOCKOUT_MINUTES = 15
export const DUE_SOON_MINUTES = 30
```

`src/lib/session/task-session.ts`:

```ts
import { SESSION_MORNING_LOCK } from './constants'

export type TaskSession = 'morning' | 'afternoon' | 'all_day'

export function getTaskSession(timeDue: string | null, morningLock = SESSION_MORNING_LOCK): TaskSession {
  if (!timeDue) return 'all_day'
  return timeDue < morningLock ? 'morning' : 'afternoon'
}
```

- [ ] **Step 4: Write failing tests for task lock**

`tests/unit/session/task-lock.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isDailyTaskLocked } from '@/lib/session/task-lock'

describe('isDailyTaskLocked', () => {
  const tz = 'Europe/London'

  it('allows amend for morning task during morning session', () => {
    const now = new Date('2026-06-12T10:00:00+01:00')
    expect(isDailyTaskLocked({ session: 'morning', taskDate: '2026-06-12' }, now, tz)).toBe(false)
  })

  it('locks morning task after morning lock', () => {
    const now = new Date('2026-06-12T14:00:00+01:00')
    expect(isDailyTaskLocked({ session: 'morning', taskDate: '2026-06-12' }, now, tz)).toBe(true)
  })

  it('locks all_day task after afternoon lock', () => {
    const now = new Date('2026-06-12T19:00:00+01:00')
    expect(isDailyTaskLocked({ session: 'all_day', taskDate: '2026-06-12' }, now, tz)).toBe(true)
  })
})
```

- [ ] **Step 5: Implement task-lock**

`src/lib/session/task-lock.ts`:

```ts
import { toZonedTime } from 'date-fns-tz'
import { SESSION_MORNING_LOCK, SESSION_AFTERNOON_LOCK } from './constants'
import type { TaskSession } from './task-session'

type LockInput = { session: TaskSession; taskDate: string }

function parseTimeOnDate(dateStr: string, time: string, tz: string): Date {
  const [h, m] = time.split(':').map(Number)
  const base = toZonedTime(new Date(`${dateStr}T00:00:00`), tz)
  base.setHours(h, m, 0, 0)
  return base
}

export function isDailyTaskLocked(task: LockInput, now: Date, timezone: string): boolean {
  const zonedNow = toZonedTime(now, timezone)
  const morningEnd = parseTimeOnDate(task.taskDate, SESSION_MORNING_LOCK, timezone)
  const afternoonEnd = parseTimeOnDate(task.taskDate, SESSION_AFTERNOON_LOCK, timezone)

  if (task.session === 'morning') return zonedNow >= morningEnd
  if (task.session === 'afternoon') return zonedNow >= afternoonEnd
  return zonedNow >= afternoonEnd
}
```

- [ ] **Step 6: Write failing tests for mandatory gate**

`tests/unit/session/mandatory-gate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { canSignOffMorning, canSignOffEndDay } from '@/lib/session/mandatory-gate'

const tasks = [
  { session: 'morning', isMandatory: true, status: 'completed' },
  { session: 'morning', isMandatory: true, status: 'pending' },
  { session: 'afternoon', isMandatory: true, status: 'pending' },
]

describe('mandatory gate', () => {
  it('blocks morning sign-off if morning mandatory incomplete', () => {
    expect(canSignOffMorning(tasks)).toBe(false)
  })

  it('blocks end-day if any mandatory incomplete', () => {
    expect(canSignOffEndDay(tasks)).toBe(false)
  })

  it('allows morning sign-off when morning mandatory done', () => {
    const done = [
      { session: 'morning', isMandatory: true, status: 'completed' },
      { session: 'afternoon', isMandatory: true, status: 'pending' },
    ]
    expect(canSignOffMorning(done)).toBe(true)
  })
})
```

- [ ] **Step 7: Implement mandatory-gate**

`src/lib/session/mandatory-gate.ts`:

```ts
import type { TaskSession } from './task-session'

type GateTask = { session: TaskSession; isMandatory: boolean; status: string }

export function canSignOffMorning(tasks: GateTask[]): boolean {
  return !tasks.some(
    (t) => t.isMandatory && t.session === 'morning' && t.status !== 'completed'
  )
}

export function canSignOffEndDay(tasks: GateTask[]): boolean {
  return !tasks.some((t) => t.isMandatory && t.status !== 'completed')
}
```

- [ ] **Step 8: Run all session tests**

```bash
pnpm test tests/unit/session/
```

Expected: all PASS.

---

## Task 3: Supabase init and migration 001 (practices + members)

**Subagent:** schema-rls

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/20260612100000_practices_and_members.sql`

- [ ] **Step 1: Init Supabase**

```bash
supabase init
supabase start
```

- [ ] **Step 2: Write migration 001**

`supabase/migrations/20260612100000_practices_and_members.sql`:

```sql
-- Practices and membership
CREATE TYPE signup_mode AS ENUM ('invite_only', 'open');
CREATE TYPE member_role AS ENUM (
  'admin', 'manager', 'nurse', 'receptionist', 'dentist', 'hygienist', 'viewer'
);

CREATE TABLE practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  practice_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  timezone text NOT NULL DEFAULT 'Europe/London',
  signup_mode signup_mode NOT NULL DEFAULT 'invite_only',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE practice_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  pin_hash text,
  pin_failed_attempts int NOT NULL DEFAULT 0,
  pin_locked_until timestamptz,
  active_surgery_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_id, user_id)
);

CREATE TABLE practice_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  email text NOT NULL,
  role member_role NOT NULL DEFAULT 'manager',
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_practice_members_user ON practice_members(user_id);
CREATE INDEX idx_practice_members_practice ON practice_members(practice_id);
```

- [ ] **Step 3: Apply migration**

```bash
supabase db reset
```

Expected: migration applies without error.

- [ ] **Step 4: Regenerate types**

```bash
pnpm gen-types
```

---

## Task 4: Migration 002 (surgeries, templates, daily_tasks)

**Files:**
- Create: `supabase/migrations/20260612100100_surgeries_templates_tasks.sql`

- [ ] **Step 1: Write migration**

```sql
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'completed', 'overdue', 'missed');

CREATE TABLE surgeries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE practice_members
  ADD CONSTRAINT fk_active_surgery
  FOREIGN KEY (active_surgery_id) REFERENCES surgeries(id) ON DELETE SET NULL;

CREATE TABLE task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  time_due time,
  role_responsible member_role NOT NULL DEFAULT 'nurse',
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  surgery_ids uuid[] NOT NULL DEFAULT '{}',
  is_mandatory boolean NOT NULL DEFAULT true,
  priority task_priority NOT NULL DEFAULT 'medium',
  checklist_steps jsonb NOT NULL DEFAULT '[]',
  evidence_required text,
  compliance_file_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  task_template_id uuid NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  surgery_id uuid REFERENCES surgeries(id) ON DELETE SET NULL,
  task_date date NOT NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  checklist_progress jsonb,
  start_time time,
  end_time time,
  materials_used text,
  notes text,
  photo_paths jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_template_id, surgery_id, task_date)
);

CREATE INDEX idx_daily_tasks_practice_date ON daily_tasks(practice_id, task_date);
CREATE INDEX idx_task_templates_practice ON task_templates(practice_id);
```

- [ ] **Step 2: Apply and gen types**

```bash
supabase db reset && pnpm gen-types
```

---

## Task 5: Migration 003 (session functions + lock trigger)

**Files:**
- Create: `supabase/migrations/20260612100200_session_functions_triggers.sql`

- [ ] **Step 1: Write SQL helpers mirroring TS**

```sql
CREATE OR REPLACE FUNCTION get_user_practice_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT practice_id FROM practice_members
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_task_session(time_due time)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN time_due IS NULL THEN 'all_day'
    WHEN time_due < time '13:15' THEN 'morning'
    ELSE 'afternoon'
  END;
$$;

CREATE OR REPLACE FUNCTION is_daily_task_locked(p_task_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_time_due time;
  v_task_date date;
  v_tz text;
  v_session text;
  v_local timestamptz;
BEGIN
  SELECT tt.time_due, dt.task_date, p.timezone
  INTO v_time_due, v_task_date, v_tz
  FROM daily_tasks dt
  JOIN task_templates tt ON tt.id = dt.task_template_id
  JOIN practices p ON p.id = dt.practice_id
  WHERE dt.id = p_task_id;

  v_session := get_task_session(v_time_due);
  v_local := timezone(v_tz, now());

  IF v_session = 'morning' THEN
    RETURN v_local >= (v_task_date + time '13:15') AT TIME ZONE v_tz;
  END IF;
  RETURN v_local >= (v_task_date + time '18:00') AT TIME ZONE v_tz;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_daily_task_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND is_daily_task_locked(OLD.id) THEN
    RAISE EXCEPTION 'Session locked';
  END IF;
  IF TG_OP = 'DELETE' AND is_daily_task_locked(OLD.id) THEN
    RAISE EXCEPTION 'Session locked';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_daily_tasks_session_lock
  BEFORE UPDATE OR DELETE ON daily_tasks
  FOR EACH ROW EXECUTE FUNCTION enforce_daily_task_lock();
```

- [ ] **Step 2: Apply migration**

```bash
supabase db reset
```

- [ ] **Step 3: Write integration test stub for lock trigger**

`tests/unit/session/db-lock.test.ts` — skip if no local Supabase in CI; document manual verification in README.

---

## Task 6: Migration 004 + 005 (incidents, rota, RLS, storage)

**Files:**
- Create: `20260612100300_incidents_rota_settings.sql`, `20260612100400_rls_policies.sql`, `20260612100500_storage_buckets.sql`

- [ ] **Step 1: Incidents + rota + settings migration**

```sql
CREATE TYPE incident_type AS ENUM ('incident', 'near_miss', 'issue');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('open', 'under_review', 'resolved');
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'full_day');

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  title text NOT NULL,
  type incident_type NOT NULL DEFAULT 'incident',
  severity incident_severity NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  surgery_id uuid REFERENCES surgeries(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status incident_status NOT NULL DEFAULT 'open',
  manager_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rota_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surgery_id uuid NOT NULL REFERENCES surgeries(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  shift_type shift_type NOT NULL DEFAULT 'full_day',
  is_published boolean NOT NULL DEFAULT false,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_id, user_id, surgery_id, shift_date, shift_type)
);

CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  UNIQUE (practice_id, key)
);

CREATE INDEX idx_incidents_practice_created ON incidents(practice_id, created_at);
CREATE INDEX idx_rota_practice_date ON rota_assignments(practice_id, shift_date);
```

- [ ] **Step 2: RLS policies migration**

Enable RLS on all tenant tables. Pattern for SELECT:

```sql
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_tasks_select ON daily_tasks FOR SELECT
USING (practice_id = get_user_practice_id());

CREATE POLICY daily_tasks_update ON daily_tasks FOR UPDATE
USING (practice_id = get_user_practice_id());
```

Repeat for: `surgeries`, `task_templates`, `daily_tasks`, `incidents`, `rota_assignments`, `settings`, `practice_members` (read own practice).

Nurses: UPDATE on `daily_tasks` where `completed_by = auth.uid() OR assigned_to = auth.uid()` (tighten in API too).

Viewer role: SELECT only — enforce read-only in API by rejecting mutations when `role = 'viewer'`.

- [ ] **Step 3: Storage bucket migration**

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('task-evidence', 'task-evidence', false);

CREATE POLICY task_evidence_select ON storage.objects FOR SELECT
USING (bucket_id = 'task-evidence' AND (storage.foldername(name))[1] = get_user_practice_id()::text);

CREATE POLICY task_evidence_insert ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-evidence' AND (storage.foldername(name))[1] = get_user_practice_id()::text);
```

- [ ] **Step 4: Apply all and gen types**

```bash
supabase db reset && pnpm gen-types
```

---

## Task 7: Seed data

**Files:**
- Create: `supabase/seed.sql`, `supabase/seed.pilot.sql`

- [ ] **Step 1: Write synthetic seed**

`supabase/seed.sql` — insert:
- 1 demo practice (`slug = 'demo-dental'`, known `practice_token` for E2E)
- 3 surgeries
- 1 manager auth user + 2 nurses with known PIN hashes (document PIN `1234` for E2E in README only)
- 8 task templates (mix morning/afternoon/all_day)
- 7 days rota (published current week)
- 2 sample incidents

Use `crypt('1234', gen_salt('bf'))` for pin_hash if pgcrypto enabled, or precomputed bcrypt hash.

- [ ] **Step 2: Write pilot stub**

`supabase/seed.pilot.sql`:

```sql
-- Run after transforming MySQL export. See docs/migration/mysql-to-postgres.md
SELECT 1;
```

- [ ] **Step 3: Enable seed in config.toml**

```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

- [ ] **Step 4: Verify seed**

```bash
supabase db reset
```

Expected: demo practice queryable.

---

## Task 8: Supabase clients and middleware

**Subagent:** auth-tenancy

**Files:**
- Create: `src/lib/supabase/server.ts`, `client.ts`, `admin.ts`, `middleware.ts`, `src/middleware.ts`, `src/lib/auth/member.ts`

- [ ] **Step 1: Server client (SSR cookies)**

`src/lib/supabase/server.ts` — standard `@supabase/ssr` `createServerClient` pattern.

- [ ] **Step 2: Admin client (service role)**

`src/lib/supabase/admin.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

- [ ] **Step 3: Middleware protect /app routes**

`src/middleware.ts` — refresh session; redirect unauthenticated `/app/*` to `/login`.

- [ ] **Step 4: Member helper**

`src/lib/auth/member.ts` — `getCurrentMember(supabase)` returns `{ practiceId, role, memberId }` from `practice_members`.

- [ ] **Step 5: Verify**

```bash
pnpm type-check
```

---

## Task 9: PIN auth library and nurse API routes (TDD)

**Files:**
- Create: `src/lib/auth/pin.ts`, nurse API routes, `tests/unit/auth/pin.test.ts`

- [ ] **Step 1: Write failing PIN tests**

```ts
import { describe, it, expect } from 'vitest'
import { generatePin, hashPin, verifyPin } from '@/lib/auth/pin'

describe('pin', () => {
  it('generates 4-digit pin', () => {
    expect(generatePin()).toMatch(/^\d{4}$/)
  })

  it('verifies correct pin', async () => {
    const hash = await hashPin('1234')
    expect(await verifyPin('1234', hash)).toBe(true)
    expect(await verifyPin('9999', hash)).toBe(false)
  })
})
```

- [ ] **Step 2: Implement pin.ts**

```ts
import bcrypt from 'bcryptjs'
import { PIN_LENGTH } from '@/lib/session/constants'

export function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}
```

- [ ] **Step 3: Implement staff-list route**

`src/app/api/auth/nurse/staff-list/route.ts`:
- Validate `{ slug, token }` with Zod
- Query practice by slug+token; return `{ data: [{ id, fullName }] }` from active members with PIN
- Invalid → 404 `{ error: 'Not found' }`

- [ ] **Step 4: Implement verify route**

`src/app/api/auth/nurse/verify/route.ts`:
- Validate slug, token, memberId, pin
- Check lockout (`pin_locked_until`)
- Verify bcrypt; increment failures or reset on success
- On success: `admin.auth.admin.createSession({ user_id })` — set cookies on response
- Return `{ data: { ok: true } }`

- [ ] **Step 5: Run unit tests**

```bash
pnpm test tests/unit/auth/pin.test.ts
```

---

## Task 10: Nurse login UI and surgery picker

**Files:**
- Create: `src/app/p/[slug]/[token]/page.tsx`, `PinPad.tsx`, `StaffPicker.tsx`, surgery step component

- [ ] **Step 1: Build 3-step client flow**

Step state machine: `staff → pin → surgery → redirect /app/tasks`

- [ ] **Step 2: Surgery picker loads published rota default**

`GET /api/surgeries` + rota for today; pre-select published assignment.

- [ ] **Step 3: POST surgery switch on confirm**

- [ ] **Step 4: Manual test**

Open `/p/demo-dental/{token}` locally; complete flow with seed nurse.

---

## Task 11: Platform admin and manager auth

**Files:**
- Create: `src/lib/auth/platform-admin.ts`, `src/app/platform/page.tsx`, platform API routes, `(auth)/login/page.tsx`

- [ ] **Step 1: Platform admin guard**

```ts
export function isPlatformAdmin(email: string | undefined): boolean {
  const allow = process.env.PLATFORM_ADMIN_EMAILS?.split(',').map((e) => e.trim()) ?? []
  return !!email && allow.includes(email)
}
```

- [ ] **Step 2: Platform create practice + invite**

`POST /api/platform/practices` — create practice row  
`POST /api/platform/practices/[id]/invite` — `admin.auth.admin.inviteUserByEmail({ email, options: { data: { practice_id } } })`

- [ ] **Step 3: Manager login page**

Standard Supabase `signInWithPassword` client-side → redirect `/app`.

- [ ] **Step 4: Signup invite callback**

Handle Supabase invite redirect; link user to `practice_members` if not already.

---

## Task 12: Staff and surgeries modules

**Files:**
- Staff API + `src/app/app/staff/page.tsx`
- Surgeries API + `src/app/app/surgeries/page.tsx`

- [ ] **Step 1: Staff POST creates auth user + member + PIN**

Return `{ data: { member, pin } }` once on create.

- [ ] **Step 2: Reset PIN route**

`POST /api/staff/[id]/reset-pin` → new PIN returned once.

- [ ] **Step 3: Surgeries CRUD**

Standard list/create/patch/delete scoped by practice_id.

- [ ] **Step 4: Zod schemas in `src/lib/validation/staff.ts`, `surgeries.ts`**

---

## Task 13: Task templates module

**Files:**
- `src/app/api/templates/route.ts`, `[id]/route.ts`, `src/app/app/templates/page.tsx`

- [ ] **Step 1: Template CRUD with compliance_file_url only**

- [ ] **Step 2: Manager UI form**

Fields: title, time_due, role, surgery_ids multi-select, checklist_steps editor, is_mandatory, compliance_file_url.

- [ ] **Step 3: API tests for template validation**

Reject empty title; trim strings.

---

## Task 14: Daily tasks API (core)

**Subagent:** tasks-module

**Files:**
- `src/lib/tasks/filter-tasks.ts`, `computed-status.ts`, task API routes
- Tests: `tests/unit/tasks/filter-tasks.test.ts`, `computed-status.test.ts`

- [ ] **Step 1: TDD computed-status**

Port legacy logic: overdue if past time_due; due_soon if within 30 min.

- [ ] **Step 2: TDD filter-tasks**

Port legacy role/surgery/assigned_user filtering from Laravel TaskController.

- [ ] **Step 3: GET /api/tasks**

- Auto-generate today's tasks if none (inline generation from templates)
- Apply filters; return with computed fields

- [ ] **Step 4: POST /api/tasks/[id]/complete**

Validate session not locked for new completion; set status, times, checklist, notes.

- [ ] **Step 5: PATCH /api/tasks/[id]**

Amend path — check `isDailyTaskLocked()` in API before update; return 403 `{ error: 'Session locked' }`.

---

## Task 15: Nurse tasks UI + sign-off

**Files:**
- `src/app/app/tasks/page.tsx`, `TaskRow.tsx`, `TaskCompleteDialog.tsx`, `SessionBanner.tsx`, sign-off API routes

- [ ] **Step 1: Task list mobile layout per DESIGN.md**

- [ ] **Step 2: Complete dialog**

Checklist, times, notes, materials, photo queue hook.

- [ ] **Step 3: Sign-off buttons**

"End morning session" / "End day" call sign-off APIs; hard block message if mandatory incomplete.

- [ ] **Step 4: Surgery switcher in header**

Calls `/api/auth/surgery/switch`.

---

## Task 16: Photo uploads (pilot feedback #2)

**Subagent:** storage-uploads

**Files:**
- `src/app/api/uploads/sign/route.ts`, `PhotoUploadQueue.tsx`, client compression util

- [ ] **Step 1: Compression util**

```ts
import imageCompression from 'browser-image-compression'

export async function compressPhoto(file: File): Promise<File> {
  return imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1600, useWebWorker: true })
}
```

- [ ] **Step 2: Sign route**

Validate task belongs to member's practice; path `{practiceId}/tasks/{taskId}/{uuid}.jpg`.

- [ ] **Step 3: Background queue component**

Upload async; show per-photo progress; PATCH task when each completes; nurse can open next task while uploading.

- [ ] **Step 4: Manual test on iOS Safari simulator or device**

---

## Task 17: Incidents module

**Subagent:** incidents

**Files:**
- `src/app/api/incidents/route.ts`, `[id]/route.ts`, `src/app/app/incidents/page.tsx`

- [ ] **Step 1: POST incident with surgery + reporter auto-filled**

- [ ] **Step 2: PATCH status + manager_notes (manager only)**

- [ ] **Step 3: Role visibility**

Dentists see/create; nurses see own; managers see all.

---

## Task 18: Rota module

**Subagent:** rota

**Files:**
- Rota API routes, `src/app/app/rota/page.tsx`

- [ ] **Step 1: Weekly grid UI (no drag-drop)**

Click cell → assign staff from palette.

- [ ] **Step 2: Publish week endpoint**

Sets `is_published = true` for all assignments in week range.

- [ ] **Step 3: Nurse default surgery reads published rota only**

---

## Task 19: Manager dashboard and reports (pilot feedback #4)

**Subagent:** manager-dashboard

**Files:**
- `src/app/api/dashboard/route.ts`, `reports/weekly/route.ts`, `reports/export/route.ts`, `src/app/app/page.tsx`, `src/app/app/reports/page.tsx`, `WeekChart.tsx`

- [ ] **Step 1: Dashboard API**

Return: incomplete count, overdue count, session deadline warnings, per-surgery breakdown, per-nurse breakdown.

- [ ] **Step 2: Weekly reports API**

Aggregate completion rate and incident counts by ISO week for last 8 weeks.

- [ ] **Step 3: Recharts bar/line in reports page**

- [ ] **Step 4: CSV export route**

Mirror legacy columns: Task Title, Role, Surgery, Status, Completed By, Times, Materials, Notes.

- [ ] **Step 5: Viewer role read-only**

Hide mutation buttons; API returns 403 on write.

---

## Task 20: App shell, role nav, task history

**Files:**
- `src/components/app/AppNav.tsx`, `src/app/app/layout.tsx`, `src/app/app/tasks/history/page.tsx`

- [ ] **Step 1: Role-based nav items**

Hide tasks link for dentist/hygienist; hide write routes for viewer.

- [ ] **Step 2: Task history page with date filters + export button**

- [ ] **Step 3: Root redirect**

`/` → `/login` or `/app` based on session.

---

## Task 21: PWA manifests

**Files:**
- `public/manifest.webmanifest`, `src/app/api/manifest/practice/[slug]/[token]/route.ts`, next-pwa config in `next.config.ts`

- [ ] **Step 1: Static manifest for managers**

```json
{
  "name": "Effinic",
  "short_name": "Effinic",
  "start_url": "/login",
  "display": "standalone",
  "theme_color": "oklch(0.58 0.14 175)",
  "background_color": "oklch(0.975 0.010 82)",
  "icons": [
    { "src": "/brand/logo.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/brand/logo.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Dynamic manifest route**

Returns same manifest but `start_url: /p/{slug}/{token}`.

- [ ] **Step 3: Link manifest on practice login page**

```html
<link rel="manifest" href={`/api/manifest/practice/${slug}/${token}`} />
```

- [ ] **Step 4: Configure next-pwa in next.config.ts**

- [ ] **Step 5: Verify manifest JSON valid**

```bash
curl -s http://localhost:3000/manifest.webmanifest | jq .
```

---

## Task 22: Edge function — generate-daily-tasks

**Files:**
- `supabase/functions/generate-daily-tasks/index.ts`

- [ ] **Step 1: Implement function**

For each practice (respect timezone):
- For each active template × surgery_id (or once if surgery_ids empty)
- Insert daily_tasks if not exists for today

- [ ] **Step 2: Schedule cron in Supabase dashboard or config**

Daily run per `docs` — 05:00 local approximated via UTC cron.

- [ ] **Step 3: Deploy**

```bash
supabase functions deploy generate-daily-tasks
```

---

## Task 23: Playwright E2E suite

**Subagent:** e2e-verification

**Files:**
- `playwright.config.ts`, `tests/e2e/*.spec.ts`

- [ ] **Step 1: Config with baseURL localhost:3000**

- [ ] **Step 2: nurse-complete-task.spec.ts**

Practice URL → select seed nurse → PIN → surgery → complete task → expect success toast.

- [ ] **Step 3: manager-dashboard.spec.ts**

Login as seed manager → expect incomplete task from nurse flow visible.

- [ ] **Step 4: session-lock.spec.ts**

Mock time via env `TEST_FROZEN_TIME=2026-06-12T14:00:00+01:00`; amend morning task → expect 403.

- [ ] **Step 5: rls-isolation.spec.ts**

API call with practice A token cannot fetch practice B task by ID.

- [ ] **Step 6: Run E2E**

```bash
pnpm test:e2e
```

Expected: all PASS.

---

## Task 24: README, deployment docs, demo script, migration stubs

**Files:**
- `README.md`, `docs/demo-script.md`, `docs/migration/mysql-to-postgres.md`, `docs/migration/hostinger-photos.md`

- [ ] **Step 1: README sections**

Local setup, env vars, supabase db reset, gen-types, test commands, Vercel deploy, Supabase project setup, `app.effinic.com` DNS, auth redirect URLs.

- [ ] **Step 2: Demo script from spec Section 11**

- [ ] **Step 3: Migration stubs**

Document deferred MySQL + photo migration steps.

---

## Task 25: Final verification and code review

**Sub-skill:** `verification-before-completion`, `requesting-code-review`

- [ ] **Step 1: Run full verification gate**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build && pnpm test:e2e
```

- [ ] **Step 2: Launch code-reviewer subagent**

Diff: branch changes. Check against spec + AGENTS.md.

- [ ] **Step 3: Fix review findings; re-run tests**

- [ ] **Step 4: Deploy preview to Vercel**

Connect repo; set env vars; confirm preview URL loads login.

---

## Spec Coverage Self-Review

| Spec requirement | Task |
|------------------|------|
| Hybrid PIN auth | 9–10 |
| Platform admin invite | 11 |
| Session lock 13:15/18:00 | 2, 5, 14 |
| Mandatory sign-off gates | 2, 15 |
| Task complete + amend + photos | 14–16 |
| Incidents | 17 |
| Rota draft/publish | 18 |
| Manager analytics + charts | 19 |
| CSV export | 19 |
| compliance_file_url only | 13 |
| PWA device-specific start_url | 21 |
| RLS isolation | 6, 23 |
| Geist typography | 1 |
| seed.sql + seed.pilot.sql | 7 |
| Edge cron | 22 |
| Role matrix | 20 |
| Dentist/hygienist no tasks | 20 |
| README + demo | 24 |

No gaps identified.

---

## Environment Variables Checklist

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PLATFORM_ADMIN_EMAILS=you@example.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production: `NEXT_PUBLIC_APP_URL=https://app.effinic.com`

---

## Incremental Deploy Milestone

After **Task 15** (nurse can complete task): deploy first Vercel preview for stakeholder testing. Full analytics and E2E can follow in Tasks 19–25.

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-12-effinic-rebuild.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch parallel subagents per module (schema, auth, tasks, incidents, rota, dashboard, E2E), review between modules, fast iteration

**2. Inline Execution** — implement task-by-task in this session using executing-plans with checkpoints

Which approach?
