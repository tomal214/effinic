# Reports Tier 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich `/app/reports` with week summary cards, surgery/nurse/category breakdown tables, incidents CSV export, tests, and demo seed data.

**Architecture:** Pure aggregation in `src/lib/reports/week-breakdown.ts`; `getWeekReportDetail` in reports service; `GET /api/reports/week` + `GET /api/reports/export/incidents`; extend `ReportsView` UI.

**Tech Stack:** Next.js App Router, Vitest, Supabase, shadcn Tabs

---

## Files

| File | Action |
|------|--------|
| `src/lib/reports/week-breakdown.ts` | Create — summary + breakdown aggregators |
| `src/lib/reports/incidents-csv.ts` | Create — incidents CSV builder |
| `src/lib/services/reports.ts` | Modify — week detail + incidents export |
| `src/lib/app/page-data.ts` | Modify — `loadWeekReportDetail` |
| `src/app/api/reports/week/route.ts` | Create |
| `src/app/api/reports/export/incidents/route.ts` | Create |
| `src/components/app/ReportsView.tsx` | Modify — cards, tabs, dual export |
| `supabase/seed.sql` | Modify — 8 weeks history, incidents, photos |
| `tests/unit/reports/week-breakdown.test.ts` | Create |
| `tests/unit/reports/incidents-csv.test.ts` | Create |
