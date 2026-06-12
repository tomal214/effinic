# Effinic — Product Context

Dental clinic workflow app for UK practices. Nurses complete daily compliance tasks on iPads; managers oversee operations, rotas, incidents, and performance.

## Register

**Product** — app UI, not marketing. Design serves the workflow.

## Users

| User | Context | Primary device |
|------|---------|----------------|
| **Nurse** | Between patients in surgery; time-pressured; needs large taps and fast photo upload | iPad / iPhone Safari (PWA) |
| **Receptionist** | Front desk; role-specific tasks and incidents | iPad or desktop |
| **Practice manager** | Oversight, rota, staff, templates, reports | Laptop |
| **Practice admin** | Same as manager + staff administration | Laptop |
| **Dentist / hygienist** | Dashboard and incident logging only; no task module | Phone or desktop |
| **Viewer** | Owner or external auditor; read-only manager view | Laptop |
| **Platform admin** | Effinic team; creates practices and sends manager invites | Laptop |

## Product Purpose

Replace the legacy Laravel workflow tool with a production Next.js app on Vercel and Supabase. Feature parity for daily clinical operations plus pilot feedback: session-based edit windows, faster photo uploads, and owner-facing performance analytics.

**Not in scope:** comparison/procurement site (Phase 2), stock management, staff leaves, AI equipment troubleshooting, Stripe, native App Store build, MySQL data migration (separate follow-up).

## Strategic Principles

1. **Mobile-first for nurses** — the iPad path is the critical path; everything else supports it.
2. **Audit trail integrity** — session locking preserves immutability after lock windows; amendments allowed within session.
3. **Multi-practice ready** — `practice_id` on all tenant data from day one; v1 users belong to one practice.
4. **RLS is truth** — Postgres policies enforce isolation; API routes are a second layer.
5. **Ship MVP, iterate** — no over-engineering; defer nice-to-haves ruthlessly.

## Brand Signals

- Clinical efficiency without corporate sterility
- Trustworthy, calm, professional
- Teal accent from brand logo; light, readable surfaces for bright surgery environments
- Real workflow tool, not a generic SaaS dashboard

## Anti-References

- Purple gradients, Inter-as-default-with-no-thought, identical icon-card grids
- Glassmorphism-heavy UI, gradient text, side-stripe alert borders
- Fake metrics, hero-metric template dashboards
- Generic "AI made this" admin panels

## Tone (in-app copy)

- Direct, short labels
- Plain English for nurses under time pressure
- Professional for managers and audit contexts
- No em dashes in UI copy

## Success Criteria (v1)

A practice manager and nurses can use the Vercel preview at `app.effinic.com` instead of Laravel for daily workflow, with multi-practice-ready schema, real emails for managers, and pilot feedback items 1, 2, and 4 shipped.

## Pilot Feedback (in v1)

1. **Session-based edit windows** — morning locks 13:15, afternoon locks 18:00 (practice timezone)
2. **Faster photo uploads** — client compression + background async upload
3. **AI troubleshooting** — deferred
4. **Performance tracking** — incomplete highlighting, session deadline warnings, week-on-week analytics

## Roles (v1)

`admin`, `manager`, `nurse`, `receptionist`, `dentist`, `hygienist`, `viewer`

| Role | Tasks | Incidents | Rota edit | Staff | Reports |
|------|-------|-----------|-----------|-------|---------|
| Nurse | Own tasks | Log own | — | — | — |
| Receptionist | Own tasks | Log | — | — | — |
| Manager / admin | All | All | Yes | Yes | Yes |
| Dentist / hygienist | — | Log | — | — | — |
| Viewer | — | Read | — | — | Read |

## Auth Model (v1)

- **Managers:** email + password (Supabase Auth); invite-only via platform admin
- **Nurses:** no self-signup; manager adds staff with auto 4-digit PIN; login via `/p/{slug}/{token}` → name → PIN → surgery
- **Open signup:** schema-ready, not enabled in v1

## Domain

- Workflow app: `app.effinic.com`
- Marketing: `effinic.com` (out of scope for this repo)
