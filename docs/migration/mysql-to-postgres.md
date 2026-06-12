# MySQL → Postgres migration (deferred)

> Status: **stub only** — not implemented in v1.

## Scope

Migrate legacy Laravel/MySQL data from Hostinger (`public_html/admin/`) into Supabase Postgres for practices moving off the PHP app.

## Planned tables

| Legacy (MySQL) | Target (Postgres) |
|----------------|-------------------|
| users | `auth.users` + `profiles` + `practice_members` |
| surgeries | `surgeries` |
| task_templates | `task_templates` |
| daily_tasks | `daily_tasks` |
| incidents | `incidents` |
| rota | `rota_assignments` |

## Approach (TBD)

1. Export MySQL dumps per practice
2. Map legacy user IDs → Supabase UUIDs (deterministic mapping table)
3. Transform enums and JSON columns (`checklist_steps`, `photo_paths`)
4. Import in migration order (see design spec §5.4)
5. Validate row counts against legacy admin stats

## Out of scope for v1

- Automated migration script
- PIN hash re-use (bcrypt compatible; verify cost factor)
- Multi-practice bulk import

## References

- Legacy scale: ~29 users, 9 surgeries, 19 templates, 1637 daily_tasks
- Design spec: `docs/superpowers/specs/2026-06-12-effinic-rebuild-design.md`
