# Effinic — Design System

Source of truth for the clinical workflow app UI. Product register: familiar patterns, calm density, mobile-first for nurses.

## Scene Sentence

A nurse on an iPad in a bright surgery at 8am, tapping through prep tasks between patients. A practice manager at a desk at 10am, scanning what is incomplete before the morning session locks at 1:15pm.

Forces **light-first**, high contrast, large tap targets, restrained teal accent.

## Visual Register

**Product UI** — design serves the workflow. Earned familiarity over decoration. The tool should disappear into the task.

## Colour Strategy

**Restrained** — warm tinted neutrals + teal accent on primary actions and state indicators only (~5–10% of surface).

Use OKLCH in CSS custom properties. Never use pure `#000` or `#fff`.

### Light Mode Tokens

| Token | Role | Value |
|-------|------|-------|
| `--color-canvas` | Page background | `oklch(0.975 0.010 82)` |
| `--color-panel` | Sidebar, secondary bands | `oklch(0.947 0.012 82)` |
| `--color-surface` | Cards, modals | `oklch(0.990 0.004 82)` |
| `--color-ink` | Primary text | `oklch(0.190 0.010 145)` |
| `--color-muted` | Secondary text | `oklch(0.500 0.014 145)` |
| `--color-faint` | Tertiary text | `oklch(0.650 0.012 145)` |
| `--color-rule` | Borders, dividers | `oklch(0.850 0.012 82)` |
| `--color-accent` | Primary CTA, focus, completed | `oklch(0.58 0.14 175)` |
| `--color-accent-dark` | Accent hover | `oklch(0.52 0.13 175)` |
| `--color-success` | Completed tasks | `oklch(0.55 0.12 165)` |
| `--color-warning` | Due soon, session closing | `oklch(0.75 0.15 75)` |
| `--color-danger` | Overdue, critical incidents | `oklch(0.55 0.18 25)` |
| `--color-info` | Informational badges | `oklch(0.55 0.08 230)` |

Dark mode: deferred post-v1. CSS variable structure should allow adding dark tokens without refactor.

### Semantic State Colours

Standardize across all components: default, hover, focus, active, disabled, loading, error, warning, success, info.

## Typography

### Font Choice: Geist Sans

**Geist** (SIL Open Font License via `geist` npm package) is the v1 typeface.

| Option | Verdict |
|--------|---------|
| **Geist** | Selected — clear OSS license, ships via npm, excellent legibility at 16px, strong numerals for times and PIN pad |
| Satoshi (Fontshare) | Commercial use allowed under ITF Free Font License, but files cannot be redistributed in the repo; requires manual Fontshare download. Suitable as a brand upgrade later. |

Implementation: `import { GeistSans } from 'geist/font/sans'` in root layout.

### Scale (fixed rem, not fluid)

| Token | Size | Use |
|-------|------|-----|
| `text-xs` | 13px | Meta, timestamps, badges |
| `text-sm` | 14px | Secondary labels |
| `text-base` | 16px | Body, task titles |
| `text-lg` | 18px | Section headings |
| `text-xl` | 20px | Page titles (mobile) |
| `text-2xl` | 24px | Page titles (desktop) |

- Body line length: 65–75ch for prose; tables and task lists may run full width
- Weight contrast ≥1.25 between body (400) and headings (600)
- No display fonts in UI labels, buttons, or data

## Layout

- **Nurse:** single column, full width, bottom-safe padding for iOS Safari
- **Manager:** sidebar nav ≥768px; optional bottom tabs on mobile
- Page padding: 20px mobile, 32px desktop
- Max content width for reports: 1280px
- Vary section spacing for rhythm; avoid uniform padding everywhere

## Shape and Radius

| Element | Radius |
|---------|--------|
| Cards, inputs | 6–8px |
| Primary buttons | Pill (9999px) with restrained height |
| Tags/chips | 9999px |

## Elevation

- Default: 1px `--color-rule` border, no shadow
- Modals/sheets: subtle shadow only when elevated above content
- No floating SaaS-card shadows, no nested cards

## Logo

Assets in `public/brand/`. Temp logo until final icon-only mark arrives.

| Surface | Treatment |
|---------|-----------|
| Auth screens (login, practice URL) | Full lockup: icon + wordmark |
| In-app nav | Compact: icon + "Effinic" wordmark |
| Tagline | Not shown in product UI |

Swap via single `<Logo variant="full" | "compact" />` component.

Brand colours from logo: forest green (`eff`), teal (`inic`), mint accent in icon.

## Role Layouts

### Nurse / receptionist

- Surgery switcher always visible in header
- Session deadline banner when within 30 minutes of lock
- Task rows: status, title, due time, mandatory indicator
- Explicit actions: "End morning session" (until 13:15), "End day / Sign off" (afternoon)
- Complete modal: scrollable checklist, camera capture, async photo queue indicator
- Locked tasks: muted, lock icon, no edit affordance

### Manager / admin

- Dashboard: incomplete/overdue counts, session warnings, per-surgery and per-nurse breakdown
- Dense filterable tables for history and reports
- Week selector + simple bar/line charts (Recharts)
- Rota: weekly grid, staff palette, publish week action

### Viewer

Manager layout with all write actions hidden.

## Components (shadcn/ui)

`Button`, `Input`, `Label`, `Select`, `Dialog`, `Sheet`, `Table`, `Badge`, `Tabs`, `Skeleton`, `Toast`, `DropdownMenu`, `Separator`, `Checkbox`.

Custom app components: `TaskRow`, `PinPad`, `StaffPicker`, `SurgerySwitcher`, `SessionBanner`, `PhotoUploadQueue`, `WeekChart`, `Logo`.

Use `Card` sparingly. Prefer flat bordered rows for task lists.

## Motion

- Duration: 150–250ms for interactions; 400–500ms for page transitions
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Motion conveys state only (loading, success, error). No decorative animation.
- Respect `prefers-reduced-motion`

## PWA

Installable on iPad/iPhone Safari and Android Chrome.

### Device-specific start URL

PWA launch URL depends on how the device was installed:

| Device | Install from | start_url |
|--------|--------------|-----------|
| **Nurse iPad** | `/p/{slug}/{token}` | Dynamic manifest: `/api/manifest/practice/{slug}/{token}` → start_url returns that practice URL |
| **Manager laptop** | `/login` or `/app` | Static manifest: `start_url: /login` |

iOS Safari uses the page URL at install time; Android uses manifest `start_url`. Both paths are supported.

Manifest fields:
- `name`: Effinic
- `short_name`: Effinic
- `display`: standalone
- `theme_color`: `--color-accent`
- `background_color`: `--color-canvas`
- Icons: 192 + 512 from `public/brand/`

## Accessibility

- WCAG AA contrast minimum
- Visible focus rings on all interactive elements
- 44px minimum tap targets on nurse flows
- Semantic headings and real button elements
- Do not rely on colour alone for task status (pair with icon + label)

## Absolute Bans

- Side-stripe borders on cards or alerts
- Gradient text (`background-clip: text`)
- Glassmorphism as default
- Hero-metric template (big number, small label, gradient)
- Identical icon-card grids
- Purple or blue gradients
- Decorative blobs, orbs, mesh backgrounds

## Implementation Quality Bar

Before shipping any screen:

- Mobile and desktop screenshot review
- No horizontal overflow
- Loading, empty, and error states on every async action
- Light mode passes contrast check
- Nurse flow usable one-handed on iPhone
