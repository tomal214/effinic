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
