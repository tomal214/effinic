# Effinic demo script (~5 minutes)

Use the seeded demo practice after `supabase db reset`.

## 1. Platform admin — create practice (30s)

1. Sign in at `/platform` with an email in `PLATFORM_ADMIN_EMAILS`
2. Create a practice (name, slug, timezone)
3. Invite a manager email via Supabase invite

*Skip if using seed: manager already exists.*

## 2. Manager setup (1 min)

1. Open `/login` → `manager@demo.effinic.test` / `DemoManager1!`
2. **Staff** — add a nurse (note the one-time PIN)
3. **Templates** — confirm morning steriliser template exists
4. **Rota** — publish this week’s assignments

## 3. Nurse iPad flow (2 min)

1. Open practice URL: `/p/demo-dental/11111111-1111-1111-1111-111111111111`
2. Add to Home Screen (PWA manifest uses practice `start_url`)
3. Choose **Clinical staff** → select nurse → enter PIN `1234` → choose **Surgery 1**
4. Complete **Steriliser cycle check** with checklist + optional photo

## 3b. Reception iPad flow (45s)

1. Open the same practice URL
2. Choose **Reception** (desk filter)
3. Select **Rita Reception** → PIN `1234`
4. You go straight to **Tasks** (no surgery step) and see reception templates (cash-up / close checklist)

## 4. Manager dashboard (1 min)

1. Return to `/app` as manager
2. Show **Incomplete today** and **Overdue today** cards
3. Highlight session warning banner when within 30 minutes of lock (13:15 / 18:00)
4. Review per-surgery and per-nurse breakdown tables

## 5. Reports + export (1 min)

1. Open **Reports** → 8-week completion + incidents chart
2. Select a week → review summary cards (completion, mandatory missed, incidents, photos)
3. Switch tabs: **By surgery** / **By nurse** / **By category**
4. **Export tasks CSV** and **Export incidents CSV**
5. Optional: **History** → date filter → export audit CSV
