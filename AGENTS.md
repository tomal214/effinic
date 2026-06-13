<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI and responsive design

Every UI change must work on **mobile (phone), tablet (iPad), and desktop (laptop)**. Effinic’s critical path is nurse iPad use; managers use laptop and sometimes phone.

Before shipping UI work:

- Check layout at ~390px (phone), ~768px (iPad portrait), and ≥1024px (desktop).
- Preserve safe areas on iOS (bottom nav, home indicator) via `env(safe-area-inset-*)`.
- Use skeleton loading states (`loading.tsx`) for route transitions; avoid blank screens during navigation.
- Tap targets ≥44px on nurse and mobile flows.
- See `PRODUCT.md` and `DESIGN.md` for tokens, roles, and layout rules.

## App data loading (read this before touching `/app` pages)

Effinic uses a **hybrid** pattern on purpose. It can look like “some pages use APIs, some don’t” — they all do, but **first paint** and **refresh** take different paths.

### Mental model

```
Navigation (first visit)
  page.tsx (RSC) → load*PageData() → pass initialData → View renders immediately

After a mutation or filter change (client)
  View → fetch('/api/...') → same load* function → update local state
```

Both paths call the **same loader** in `src/lib/app/page-data.ts` (or a service it wraps). The API route is not a second source of truth — it is the client-accessible entry point to the same logic.

### Why not pick one?

| Approach | Good for | Bad for |
|----------|----------|---------|
| Server-only (RSC, no API) | Fast first paint | Client mutations, filters, exports, nurse kiosk flows that already hit APIs |
| Client-only (`useEffect` + `/api`) | Simple mental model | Double loading (route skeleton → client skeleton → data), duplicate auth |
| **Hybrid (what we use)** | Fast nav + interactive refresh | Needs discipline (documented here) |

We keep `'use client'` views for forms, dialogs, and optimistic UX. Server fetch removes the **mount-time** round trip; APIs remain for **everything that changes after load**.

### File roles

| File | Role |
|------|------|
| `src/lib/app/page-data.ts` | Page loaders (`loadStaffPageData`, `loadTasksData`, …). **Add new read logic here first.** |
| `src/lib/services/*.ts` | Domain DB logic (shared by loaders and sometimes API-only writes) |
| `src/app/api/**/route.ts` | HTTP boundary: auth via `requireMember(supabase)`, call loader for GETs, service for POST/PATCH/DELETE |
| `src/app/app/**/page.tsx` | Auth guard + `load*PageData(member)` + pass `initialData` to View |
| `src/components/app/*View.tsx` | Client UI; accepts optional `initialData`; skips mount fetch when present |

### Auth (don’t duplicate `getUser`)

- **RSC (layout + pages):** use `getAuthContext()` / `getCurrentMember()` from `src/lib/auth/member.ts` — cached per request via `React.cache()`.
- **API routes:** pass `createClient()` into `requireMember(supabase)` — separate HTTP request, no cache sharing with RSC (that’s fine).

Page role guards live in `src/lib/auth/page-guards.ts` on **`page.tsx` only** — not in nested layouts (removed to avoid double auth).

### Adding or changing a read path

1. Implement or extend a loader in `page-data.ts` (or underlying `services/`).
2. Call it from the RSC `page.tsx` and pass `initialData` to the View.
3. Wire the matching `GET` API route to the **same loader** — do not copy query logic into the route.
4. In the View:
   - Initialise state from `initialData`.
   - Set `loading = !initialData`.
   - Skip the **first** mount fetch when `initialData` is present (use a one-shot `useRef` if the effect also runs on filter changes — see `ReportsView`, `RotaView`, `TaskHistoryView`).
   - Keep explicit `load*` / `refresh` functions for mutations and filter changes — those still `fetch('/api/...')`.

### Writes always go through API routes

POST/PATCH/DELETE stay in `src/app/api/**`. Views call them, then re-fetch via the existing `load*` helper (API path). Do not write to the DB from RSC pages.

### Pages using this pattern

All `/app/*` list/dashboard views: Dashboard, Tasks (nurse + manager), Staff, Surgeries, Templates, Incidents, Rota, Reports, Task history.

### Common mistakes to avoid

- **Duplicating query logic** in an API route instead of importing the loader.
- **Adding a nested `layout.tsx` guard** that re-runs auth (layout already guards; pages add role checks).
- **Removing API GET routes** because SSR exists — client refresh and exports still need them.
- **Skipping mount fetch with `if (initialData) return` in an effect that also depends on filters** — use a one-shot ref instead (see review notes in Reports/Rota/TaskHistory).
