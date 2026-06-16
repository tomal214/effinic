# Roles & login

Who can do what, how they sign in, and how to add them.

---

## Two separate layers

| Layer | Who | Purpose |
|-------|-----|---------|
| **Platform admin** | You, Sahil (Effinic operators) | Create clinics, invite the first manager |
| **Practice roles** | People inside one clinic | Day-to-day work in that clinic |

Platform admin is **not** a database role. It is your email in `PLATFORM_ADMIN_EMAILS` in Vercel/env.

---

## Platform admin

**Who:** Anyone whose email is in `PLATFORM_ADMIN_EMAILS` (comma-separated).

**Login:** `/login` with that email + password (normal Supabase account — create it in Supabase Auth or sign up once).

**Then:** `/platform` — create a practice, copy the **nurse practice URL**, invite a manager.

**How to add another platform admin:** Add their email to `PLATFORM_ADMIN_EMAILS` in env and redeploy. They need a Supabase Auth user with that email.

**Not for:** Clinic staff. Managers never use `/platform`.

---

## Practice roles

| Role | Typical person | Login method | App access |
|------|----------------|--------------|------------|
| **manager** | Clinic owner / lead | Email + password at `/login` | Full app: dashboard, staff, surgeries, templates, tasks, history, incidents, rota, reports |
| **admin** | Same as manager (practice-level) | Email + password at `/login` | Same as manager |
| **nurse** | Nurse, HCA | Practice URL → name → PIN | Tasks + incidents only; morning/end-of-day sign-off |
| **receptionist** | Front desk | Practice URL → name → PIN | Same as nurse |
| **viewer** | Auditor, area manager | Practice URL → name → PIN | Same pages as manager but **read-only** (no edits) |
| **dentist** | Dentist | Practice URL → name → PIN | Dashboard + incidents |
| **hygienist** | Hygienist | Practice URL → name → PIN | Dashboard + incidents |

**manager / admin** should be onboarded via **platform invite** (email link sets their password).

**Everyone else** is added by the manager under **Staff** and signs in on the **iPad/kiosk URL** with a **4-digit PIN** (shown once when created; reset from Staff).

---

## Desk filter (clinical vs reception)

The kiosk login URL (`/p/{slug}/{token}`) starts with a **desk** choice:

- **Clinical staff**: shows clinical staff (e.g. nurses). After PIN, nurses select a **surgery** for their shift.
- **Reception**: shows reception staff. After PIN, receptionists go straight to **Tasks** (no surgery step).

This desk choice is a UI-level filter for the staff picker (the API accepts `desk=clinical|reception`) so a shared kiosk can be used at both desks without mixing name lists.

---

## How to add users

### New clinic (real pilot)

1. Platform admin → `/platform`
2. **Create practice** (name, slug, timezone)
3. Copy **nurse practice URL** (e.g. `https://app.effinic.com/p/smith-dental/abc-uuid`)
4. **Invite manager** — enter their real email; they get a Supabase invite email
5. Manager accepts invite, sets password, signs in at `/login`
6. Manager → **Staff** → add nurses (name + role; optional email)
7. Save the **one-time PIN** shown; give it to the nurse
8. Nurse opens practice URL on iPad → tap name → PIN → surgery → **Start shift**

### Add a nurse (existing clinic)

Manager → **Staff** → Add staff → role `nurse` → note PIN → share practice URL + PIN.

### Add a read-only auditor

Manager → **Staff** → role `viewer` → note PIN → they use the same practice URL + PIN (read-only UI).

### Reset a PIN

Manager → **Staff** → **Reset PIN** on that person → new PIN shown once.

### Deactivate someone

Manager → **Staff** → deactivate (they disappear from kiosk name list).

---

## Demo / testing accounts (seed only)

Only exist after running `supabase/seed.sql` (local: `supabase db reset`; remote: `supabase db query --linked --file supabase/seed.sql`).

| Role | How to sign in |
|------|----------------|
| Manager | `/login` → `manager@demo.effinic.test` / `DemoManager1!` |
| Sarah Nurse | `/p/demo-dental/11111111-1111-1111-1111-111111111111` → Sarah Nurse → PIN `1234` |
| James Nurse | Same URL → James Nurse → PIN `1234` |
| Rita Reception | Same URL → Reception (desk) → Rita Reception → PIN `1234` |

Demo manager is **not** a platform admin unless that email is also in `PLATFORM_ADMIN_EMAILS`.

Check **Supabase → Authentication → Users** if the account is missing — seed was not applied.

---

## URLs cheat sheet

| URL | Who |
|-----|-----|
| `/login` | Managers (email/password), platform admins |
| `/platform` | Platform admins only (after `/login`) |
| `/p/{slug}/{token}` | Nurses and all kiosk staff (name + PIN) |
| `/app` | After login — main app |

Nurse URL is shown when a practice is created on `/platform`, or from the `practices` table (`slug` + `practice_token`).

---

## Tips

- **Same browser:** Manager and nurse share one auth cookie. Testing both? Use separate profiles or incognito.
- **Platform vs manager:** `/platform` = you running Effinic. `/app` = a clinic running their day.
- **Supabase dashboard:** You *can* create users/practices manually, but `/platform` + Staff is the supported path.
- **E2E / QA:** The three demo seed accounts are enough for automated and manual testing.
