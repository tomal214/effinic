# Effinic Workflow Rebuild — Design Spec

**Date:** 2026-06-12  
**Status:** Approved  
**Scope:** Workflow app only (Phase 2 comparison/procurement out of scope)

---

## 1. Summary

Rebuild the Effinic clinical workflow app (legacy Laravel/PHP on Hostinger) as a production-ready Next.js app on Vercel with Supabase (Postgres, Auth, Storage, RLS). Feature parity with the live Laravel app plus multi-practice tenancy and pilot feedback items 1, 2, and 4.

**Success criteria:** A practice manager and nurses can use `app.effinic.com` instead of Laravel for daily workflow, with multi-practice-ready schema, real manager emails, and pilot feedback shipped.

**Related docs:** `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`

---

## 2. Discovery Decisions Log

| # | Topic | Decision |
|---|-------|----------|
| 1 | Auth | Hybrid B: managers email/password; nurses via practice URL + name + 4-digit PIN + surgery |
| 2 | Bootstrap | Invite-only managers; design for open signup later |
| 3 | Session lock | Per-practice timezone (default `Europe/London`); lock at 13:15 and 18:00 via dev constants |
| 4 | Seed data | Synthetic `seed.sql` + optional `seed.pilot.sql`; photos in scope, Hostinger migration deferred |
| 5 | Compliance docs | `compliance_file_url` only in v1; PDF upload deferred |
| 6 | Mandatory gate | Hard block on sign-off; per-session morning + end-of-day |
| 7 | Infrastructure | Fresh Supabase + Vercel |
| 8 | Domain | `app.effinic.com` |
| 9 | Manager invites | Supabase `inviteUserByEmail()`; manual link as dev fallback |
| 10 | Roles | Legacy parity: dentist/hygienist dashboard+incidents; viewer read-only manager |
| 11 | Platform admin | Env-gated `/platform` for our emails; nurses added in-app by manager |
| 12 | Repo | Single repo at `effinic/` |
| 13 | Mandatory scope | Morning sign-off = morning mandatory; end-of-day = all mandatory |
| 14 | Session mapping | Derived from template `time_due` (< 13:15 morning, ≥ 13:15 afternoon, null = all_day) |
| 15 | Sign-off UX | Explicit "End morning session" and "End day / Sign off" buttons |
| 16 | Rota | Draft/publish with `is_published` |
| 17 | Analytics | Tables + stats + basic charts + CSV; no AI |
| 18 | Theme | Light-first (Studio Tom token discipline, teal accent) |
| 19 | Logo | Temp logo in `public/brand/`; full on auth, compact in-app |
| 20 | Typography | Geist Sans (Satoshi licensable alternative later) |

---

## 3. Architecture

### 3.1 Approach

**A — API routes + RLS (selected)** with DB triggers for session-lock immutability and edge functions for cron/export only.

- All mutations in `src/app/api/**/route.ts` (Zod, no server actions)
- RLS enforces tenancy; triggers as safety net
- Edge functions: `generate-daily-tasks`, optional `export-cqc-report`

### 3.2 Repository Layout

```text
effinic/
├── src/
│   ├── app/
│   │   ├── api/                 # All server mutations
│   │   ├── (auth)/              # login, signup
│   │   ├── p/[slug]/[token]/    # Nurse login flow
│   │   ├── platform/            # Env-gated super-admin
│   │   └── app/                 # Authenticated product
│   ├── components/
│   │   ├── ui/                  # shadcn
│   │   └── app/                 # Feature components
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validation/
│   │   └── session/             # Lock constants, session helpers
│   └── types/
│       └── database.ts          # Generated; never hand-edit
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── seed.pilot.sql
├── public/brand/
├── docs/
├── AGENTS.md
├── DESIGN.md
└── PRODUCT.md
```

### 3.3 URL Map

| URL | Access |
|-----|--------|
| `/` | Redirect login or /app |
| `/login` | Manager email/password |
| `/signup?token=` | Manager invite completion |
| `/p/{slug}/{token}` | Nurse: name → PIN → surgery |
| `/platform` | Platform admin (env allowlist) |
| `/app` | Role-aware dashboard |
| `/app/tasks` | Daily tasks |
| `/app/tasks/history` | Audit log |
| `/app/incidents` | Incidents |
| `/app/rota` | Weekly rota |
| `/app/staff` | Staff CRUD |
| `/app/surgeries` | Surgery CRUD |
| `/app/templates` | Task template CRUD |
| `/app/reports` | Analytics |
| `/api/manifest/practice/{slug}/{token}` | Dynamic PWA manifest for nurse devices |

### 3.4 Tenancy

- `practices` table with `slug` + `practice_token` (UUID)
- `practice_members` links `auth.users` to practice with role
- All tenant tables include `practice_id`
- v1: one practice per user (enforced in API)
- RLS via `get_user_practice_id()`

### 3.5 Dev Constants

```ts
// src/lib/session/constants.ts — dev-editable, not user settings
export const SESSION_MORNING_LOCK = '13:15'
export const SESSION_AFTERNOON_LOCK = '18:00'
export const PIN_LENGTH = 4
export const PIN_MAX_ATTEMPTS = 5
export const PIN_LOCKOUT_MINUTES = 15
export const DUE_SOON_MINUTES = 30
```

Mirror in SQL for trigger functions.

---

## 4. Auth and Onboarding

### 4.1 Platform Admin

1. Visit `/platform` (email in `PLATFORM_ADMIN_EMAILS` env)
2. Create practice: name, slug, timezone
3. System generates `practice_token`
4. Enter manager email → `supabase.auth.admin.inviteUserByEmail()`
5. Manager completes Supabase invite → linked as `practice_members`

Dev fallback: copy invite link from platform UI.

### 4.2 Manager Auth

- `/login` → Supabase email/password
- Standard SSR session cookies via middleware
- Never uses PIN or practice URL

### 4.3 Manager Adds Staff

| Field | Rule |
|-------|------|
| Name | Required |
| Role | Full role enum |
| Email | Optional |

On create:
1. Email provided → create/link `auth.users`
2. No email → `{slug}.{random}@practice.internal`
3. Auto-generate 4-digit PIN → `pin_hash` (bcrypt) on `practice_members`
4. Manager views/resets PIN on staff detail

No nurse email invites in v1.

### 4.4 Nurse Auth Flow

```text
GET  /p/{slug}/{token}
POST /api/auth/nurse/staff-list     { slug, token } → names only
POST /api/auth/nurse/verify         { slug, token, memberId, pin }
  → bcrypt verify, rate limit, auth.admin.createSession()
POST /api/auth/surgery/switch       { surgeryId }
  → set active_surgery_id on practice_members
```

Security:
- Invalid slug+token → generic 404
- Staff list never exposed without valid practice URL
- PIN not stored as Supabase password
- 5 failed attempts → lockout 15 minutes

### 4.5 Nurse Sign-Off

| Action | Window | Mandatory check | On success |
|--------|--------|-----------------|------------|
| End morning session | Until 13:15 local | Morning session mandatory tasks | Clear surgery context |
| End day / Sign off | Afternoon | All mandatory for day | signOut → practice URL |

Single hard block per action. No stacked confirmation dialogs.

### 4.6 Role Routing

| Role | Default route | Nav |
|------|---------------|-----|
| Nurse, receptionist | `/app/tasks` | Tasks, incidents |
| Manager, admin | `/app` | Full |
| Dentist, hygienist | `/app` | Dashboard, incidents |
| Viewer | `/app` | Read-only manager nav |

### 4.7 Open Signup (deferred)

- `practices.signup_mode`: `invite_only` | `open`
- `practice_invites` table
- `/signup` branches on mode when enabled

---

## 5. Data Model

### 5.1 Tables

#### practices
`id`, `name`, `slug` (unique), `practice_token` (uuid, unique), `timezone`, `signup_mode`, `created_at`

#### profiles
`id` (FK auth.users), `full_name`, `created_at`

#### practice_members
`id`, `practice_id`, `user_id`, `role`, `is_active`, `pin_hash`, `pin_failed_attempts`, `pin_locked_until`, `active_surgery_id`, `created_at`  
Unique: `(practice_id, user_id)`

#### practice_invites
`id`, `practice_id`, `email`, `role`, `token`, `expires_at`, `used_at`, `created_by`

#### surgeries
`id`, `practice_id`, `name`, `is_active`, `sort_order`

#### task_templates
`id`, `practice_id`, `title`, `description`, `time_due`, `role_responsible`, `assigned_user_id`, `surgery_ids` (uuid[]), `is_mandatory`, `priority`, `checklist_steps` (jsonb), `evidence_required`, `compliance_file_url`, `is_active`  
Note: `compliance_file_path` reserved for PDF upload fast follow.

#### daily_tasks
`id`, `practice_id`, `task_template_id`, `surgery_id`, `task_date`, `assigned_to`, `status`, `completed_at`, `completed_by`, `checklist_progress`, `start_time`, `end_time`, `materials_used`, `notes`, `photo_paths` (jsonb), `created_at`  
Unique: `(task_template_id, surgery_id, task_date)`

Status enum: `pending`, `completed`, `overdue`, `missed`  
Computed in API: `due_soon`, `session`, `is_locked`

#### incidents
`id`, `practice_id`, `title`, `type`, `severity`, `description`, `surgery_id`, `reported_by`, `status`, `manager_notes`, `created_at`

Types: `incident`, `near_miss`, `issue`  
Severity: `low`, `medium`, `high`, `critical`  
Status: `open`, `under_review`, `resolved`

#### rota_assignments
`id`, `practice_id`, `user_id`, `surgery_id`, `shift_date`, `shift_type`, `is_published`, `assigned_by`, `created_at`

Shift types: `morning`, `afternoon`, `full_day`

#### settings
`id`, `practice_id`, `key`, `value` (jsonb)  
Unique: `(practice_id, key)`

### 5.2 Postgres Functions and Triggers

```sql
get_user_practice_id() → uuid
get_user_role() → text
get_task_session(time_due time) → 'morning' | 'afternoon' | 'all_day'
is_daily_task_locked(task daily_tasks, tz text) → boolean
```

**Trigger:** `BEFORE UPDATE OR DELETE ON daily_tasks` → reject if locked.

### 5.3 Storage

| Bucket | v1 | Path pattern |
|--------|-----|--------------|
| `task-evidence` | Yes | `{practice_id}/tasks/{task_id}/{filename}` |
| `compliance-docs` | Deferred | `{practice_id}/templates/{template_id}/{filename}` |

Private buckets. Signed URLs only.

### 5.4 Migration Order

1. practices, profiles, practice_members, practice_invites
2. surgeries, task_templates, daily_tasks
3. Helper functions + session-lock trigger
4. incidents, rota_assignments, settings
5. RLS policies
6. Storage buckets + storage RLS
7. Indexes

### 5.5 Seed Files

| File | Purpose |
|------|---------|
| `seed.sql` | Demo practice for local dev |
| `seed.pilot.sql` | Stub for MySQL → Postgres transform when export ready |

---

## 6. Feature Modules and API

### 6.1 API Routes

All routes: auth check, Zod validation, `{ data }` / `{ error }`, try/catch.

**Auth:** nurse staff-list, verify, sign-off morning/end-day, surgery switch  
**Platform:** list/create practices, invite manager  
**Staff:** CRUD, reset-pin  
**Surgeries:** CRUD  
**Templates:** CRUD (compliance_file_url only)  
**Tasks:** list, complete, amend, history, export CSV  
**Uploads:** sign URL for task-evidence  
**Incidents:** list, create, update status  
**Rota:** list week, assign, remove, publish  
**Dashboard/Reports:** incomplete stats, weekly chart data, CSV export  
**Manifest:** dynamic PWA manifest per practice

### 6.2 Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `generate-daily-tasks` | Daily cron (~05:00 per practice tz) | Spawn daily_tasks from templates |
| `export-cqc-report` | Optional HTTP | Audit export (v1 may use Next.js API instead) |

Fallback: `GET /api/tasks` auto-generates today if cron missed (legacy parity).

### 6.3 Session Lock Behaviour

| Action | Morning (before 13:15) | Afternoon (13:15–18:00) | After 18:00 |
|--------|------------------------|-------------------------|-------------|
| Complete pending | ✓ | ✓ | ✓ |
| Amend morning task | ✓ | Locked | Locked |
| Amend afternoon task | N/A | ✓ | Locked |
| Amend all_day task | ✓ | ✓ | Locked |

### 6.4 Task Visibility (legacy parity)

- Manager/admin: all tasks
- Nurse: role match + active surgery (or null surgery); assigned_user override
- Receptionist: role match + overdue
- Dentist/hygienist: no tasks module

Default surgery: `active_surgery_id` → published rota for today.

### 6.5 Photo Upload Flow

1. Client compresses image (browser-image-compression or canvas)
2. `POST /api/uploads/sign` → signed URL
3. Client PUT to Storage (background queue; nurse continues)
4. `PATCH /api/tasks/[id]` → append `photo_paths`

### 6.6 Deferred

- Compliance PDF upload
- Rota drag-drop
- Stock, leaves, AI troubleshooting
- MySQL/Hostinger photo migration
- Excel export
- Nurse PIN self-change
- Dark mode full QA

---

## 7. UI and Design

See `DESIGN.md` for tokens, typography, layouts, PWA, and bans.

**Font:** Geist Sans (SIL OFL). Satoshi available under ITF Free Font License from Fontshare for commercial use but not redistributed in repo.

**PWA start_url:**
- Nurse iPad: dynamic manifest at `/api/manifest/practice/{slug}/{token}`
- Manager: static manifest `start_url: /login`

---

## 8. Testing

### 8.1 Vitest (P0)

- `get_task_session()`, `is_daily_task_locked()`
- Mandatory gate: morning vs end-of-day
- PIN verify + lockout
- Task filter logic, computed status

### 8.2 Playwright (smoke)

1. Nurse: practice URL → PIN → surgery → complete task with photo
2. Manager: login → see incomplete tasks
3. Session lock: amend before lock ✓, after lock blocked
4. RLS: user A cannot read practice B

Time mocking via test env or `page.addInitScript`.

### 8.3 Verification Gates

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
pnpm test:e2e
```

Plus: PWA manifest valid, all SQL in migrations, README complete.

---

## 9. Deployment

| Layer | Target |
|-------|--------|
| App | Vercel → `app.effinic.com` |
| DB | Supabase (London region) |
| Cron | Supabase → `generate-daily-tasks` |
| Email | Supabase invite templates |

**Env vars:**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PLATFORM_ADMIN_EMAILS=
```

**Local:**
```bash
pnpm install && supabase start && supabase db reset && pnpm dev
```

---

## 10. Deliverables

| Item | Location |
|------|----------|
| This spec | `docs/superpowers/specs/2026-06-12-effinic-rebuild-design.md` |
| Implementation plan | `docs/superpowers/plans/2026-06-12-effinic-rebuild.md` (next step) |
| Agent rules | `AGENTS.md` |
| Design system | `DESIGN.md` |
| Product context | `PRODUCT.md` |
| Demo script | `docs/demo-script.md` |
| MySQL migration stub | `docs/migration/mysql-to-postgres.md` |
| Photo migration stub | `docs/migration/hostinger-photos.md` |

---

## 11. Demo Script (5 min)

1. Platform admin: create practice, invite manager (30s)
2. Manager: login, add nurse + PIN, create template, publish rota (1m)
3. Nurse iPad: practice URL → PIN → surgery → complete task with photo (2m)
4. Manager dashboard: incomplete highlighting, session warning (1m)
5. Reports: week-on-week chart + CSV export (30s)

---

## 12. Legacy Reference

- Laravel codebase: `Downloads/public_html/admin/`
- Live scale: ~29 users, 9 surgeries, 19 templates, 1637 daily_tasks, 4 incidents, 272 rota rows
- Primary colour: `#0ab39c` teal
- Key legacy routes mapped in Section 6

---

## 13. Out of Scope

Phase 2 comparison site, Stripe, multi-region, native app, stock, staff leaves, AI troubleshooting, MySQL migration script (stub only), Hostinger photo migration (stub only).
