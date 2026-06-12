# Update domain — where to change it

**Current live URL:** https://effinic.vercel.app/

**Future custom domain (planned):** `app.effinic.com` (see README)

---

## Do this now (for `effinic.vercel.app`)

### 1. Vercel → Project → Settings → Environment Variables

Set for **Production** (and Preview if you test previews):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://effinic.vercel.app` |

Redeploy after changing env vars.

Also confirm these point at **hosted Supabase** (not local):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (same value as on the Supabase edge function)
- `PLATFORM_ADMIN_EMAILS` (your email)

### 2. Supabase Dashboard → Authentication → URL configuration

| Field | Value |
|-------|--------|
| **Site URL** | `https://effinic.vercel.app` |
| **Redirect URLs** | `https://effinic.vercel.app/auth/callback` and `https://effinic.vercel.app/auth/confirm` |

Add preview URLs later if needed, e.g. `https://*.vercel.app/auth/callback`.

### 3. Vercel → Project → Settings → Domains

`effinic.vercel.app` is usually automatic. No extra DNS unless you add a custom domain.

---

## Daily task cron — Vercel or Supabase?

**Supabase, not Vercel.**

- Function: `supabase/functions/generate-daily-tasks`
- Deploy: `supabase functions deploy generate-daily-tasks --no-verify-jwt`
- Secret: `supabase secrets set CRON_SECRET=...` (must match bearer token in cron/curl)
- **Important:** Supabase rejects non-JWT bearer tokens unless `verify_jwt = false` (see `supabase/config.toml`). Without this you get `Invalid JWT` before your function runs.
- Schedule: Supabase SQL Editor (`pg_cron` + `pg_net`) with header `Authorization: Bearer <CRON_SECRET>`

Vercel only hosts the Next.js app. It does **not** run this cron unless you add a separate Vercel Cron route later (we didn’t).

---

## Reminder: when you switch to a custom domain (e.g. `app.effinic.com`)

Update **all** of these again:

- [ ] Vercel env: `NEXT_PUBLIC_SITE_URL` → `https://app.effinic.com`
- [ ] Supabase Auth: Site URL + Redirect URLs → `https://app.effinic.com/auth/callback`
- [ ] Vercel Domains: add `app.effinic.com`, DNS CNAME to Vercel
- [ ] README / any docs that still say `effinic.vercel.app`
- [ ] Re-test manager login (email/password) and nurse practice URL bookmark/PWA install
- [ ] Optional: Supabase invite email templates if they hardcode a domain

**Last updated:** 2026-06-12 — live on `https://effinic.vercel.app/`
