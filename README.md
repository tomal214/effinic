# Effinic

Dental clinic workflow app — daily tasks, incidents, rota, and manager analytics. Built with Next.js (App Router), Supabase, and Tailwind CSS.

Production target: [app.effinic.com](https://app.effinic.com)

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for local Supabase)

## Local setup

```bash
pnpm install
cp .env.example .env.local
supabase start
supabase db reset
pnpm gen-types
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed credentials

After `supabase db reset`, the demo practice is available:

| Role | Access |
|------|--------|
| Manager | `manager@demo.effinic.test` / `DemoManager1!` at `/login` |
| Nurse | `/p/demo-dental/11111111-1111-1111-1111-111111111111` → Sarah Nurse → PIN `1234` |

**Testing both roles:** Manager and nurse share one auth cookie on the same origin. Signing in as one role replaces the other. For parallel QA, use separate browser profiles or incognito. After nurse flow, re-login as manager if needed.

Copy Supabase keys from `supabase start` output into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PLATFORM_ADMIN_EMAILS=you@example.com
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm type-check` | TypeScript check |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright E2E (requires Supabase + dev server) |
| `pnpm gen-types` | Regenerate `src/types/database.ts` from local DB |
| `supabase db reset` | Re-run migrations + seed |

## Database

Migrations live in `supabase/migrations/`. Seed data:

- `supabase/seed.sql` — demo practice for local dev and E2E
- `supabase/seed.pilot.sql` — optional pilot overlay

```bash
supabase db reset          # migrate + seed
supabase gen types typescript --local > src/types/database.ts
```

## Edge functions

Daily task generation runs via Supabase Edge Function:

```bash
supabase functions deploy generate-daily-tasks
```

Schedule a daily cron in the Supabase dashboard (≈ 05:00 local per practice timezone).

## PWA

- Managers: `public/manifest.webmanifest` (`start_url: /app`; middleware sends unauthenticated users to `/login`)
- Nurses: dynamic manifest at `/api/manifest/practice/{slug}/{token}` (`start_url` → practice URL)

`@ducanh2912/next-pwa` is configured in `next.config.ts` (disabled in development).

## Deploy

### Vercel

1. Connect the GitHub repo to Vercel
2. Set environment variables (same as `.env.example`, with production Supabase URLs)
3. Deploy; assign custom domain `app.effinic.com`

### Supabase (production)

1. Create a project (London region recommended)
2. Run migrations: `supabase db push`
3. Set Auth redirect URLs: `https://app.effinic.com/auth/callback` and `https://app.effinic.com/auth/confirm`
4. Configure invite email templates for manager onboarding

### DNS

Point `app.effinic.com` CNAME to your Vercel deployment.

## Docs

- **[Roles & login](docs/roles-and-login.md)** — platform admin, practice roles, how to add users
- [Demo script](docs/demo-script.md)
- [MySQL → Postgres migration stub](docs/migration/mysql-to-postgres.md)
- [Hostinger photos migration stub](docs/migration/hostinger-photos.md)
- Design spec: `docs/superpowers/specs/2026-06-12-effinic-rebuild-design.md`

## E2E tests

E2E tests skip automatically when Supabase env vars are missing.

```bash
supabase start && supabase db reset
pnpm test:e2e
```

Session-lock API test additionally requires the dev server started with:

```bash
TEST_FROZEN_TIME=2026-06-12T14:00:00+01:00 pnpm dev
```
