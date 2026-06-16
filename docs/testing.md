# Testing quick reference

Local setup: `supabase db reset` then `pnpm dev` → **http://localhost:3000**

---

## Demo logins (seed only)

| Who | How |
|-----|-----|
| **Manager** | `/login` → `manager@demo.effinic.test` / `DemoManager1!` |
| **Nurse (Sarah)** | Kiosk URL → **Clinical staff** → Sarah Nurse → PIN `1234` → pick surgery |
| **Nurse (James)** | Same → James Nurse → PIN `1234` |
| **Reception (Rita)** | Kiosk URL → **Reception** → Rita Reception → PIN `1234` (no surgery step) |
| **Platform admin** | `/login` with email in `PLATFORM_ADMIN_EMAILS` → `/platform` |

**Kiosk URL (demo practice):**

`/p/demo-dental/11111111-1111-1111-1111-111111111111`

---

## URLs

| URL | Who uses it |
|-----|-------------|
| `/login` | Manager, admin (email + password) |
| `/platform` | Effinic operators only |
| `/p/{slug}/{token}` | Nurses, reception, viewer, dentist, hygienist (desk → name → PIN) |
| `/app` | Dashboard (managers etc.) — nurses/reception redirect to tasks |
| `/app/tasks` | Everyone’s daily tasks |
| `/app/tasks/history` | Manager, admin, viewer |
| `/app/staff` | Manager, admin, viewer (viewer read-only) |
| `/app/surgeries` | Manager, admin, viewer |
| `/app/templates` | Manager, admin, viewer |
| `/app/rota` | Manager, admin, viewer |
| `/app/reports` | Manager, admin, viewer |
| `/app/incidents` | Most roles (nurses create; managers manage) |

---

## Role → access

| Role | Login | Main pages |
|------|-------|------------|
| **manager / admin** | `/login` | Full app — edit staff, templates, surgeries, rota, reports |
| **viewer** | Kiosk + PIN | Same pages as manager but **read-only** |
| **nurse** | Kiosk + PIN | Tasks, incidents. Morning/end-of-day sign-off. Surgery picker required |
| **receptionist** | Kiosk + PIN | Tasks, incidents. **No surgery step** |
| **dentist / hygienist** | Kiosk + PIN | Dashboard + incidents |

---

## What to test (by flow)

**Manager** — dashboard stats, staff edit, template create/edit (category, priority, evidence), rota publish, reports (week summary + breakdown tabs + tasks/incidents CSV export).

**Nurse** — progress bar, category chips, complete task with checklist/photo, morning sign-off, surgery switcher.

**Reception** — desk filter → tasks only, reception templates visible, taller rows, no surgery picker.

**Viewer** — open completed task read-only, photo thumbnails in dialog, cannot edit staff/templates.

**Kiosk** — Clinical vs Reception staff lists are separate; wrong PIN rejected.

---

## Automated tests

```bash
pnpm test          # unit tests
pnpm build         # typecheck + production build
pnpm test:e2e      # Playwright (needs local Supabase running)
```

Key E2E specs: `tests/e2e/reception-kiosk.spec.ts`, `tests/e2e/manager-dashboard.spec.ts`

---

## Tips

- **Manager + kiosk in same browser** share one session — use separate profiles or incognito.
- **Seed missing?** Run `supabase db reset` and check Supabase Auth users exist.
- **Responsive check:** ~390px (phone), ~768px (iPad), ≥1024px (laptop).

More detail: `docs/roles-and-login.md`, `docs/demo-script.md`
