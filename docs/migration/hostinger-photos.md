# Hostinger photo migration (deferred)

> Status: **stub only** — not implemented in v1.

## Scope

Migrate task evidence photos from legacy Hostinger storage into Supabase Storage bucket `task-evidence`.

## Target path pattern

```
{practice_id}/tasks/{task_id}/{filename}
```

Private bucket — signed URLs only (see `src/app/api/uploads/sign/route.ts`).

## Planned steps

1. Inventory legacy photo URLs/paths from MySQL `daily_tasks` (or filesystem export)
2. Download from Hostinger via SFTP or HTTP
3. Upload to Supabase Storage with service role
4. Update `daily_tasks.photo_paths` JSON arrays with new storage paths
5. Verify thumbnails load in task history / complete dialog

## Considerations

- Compress on upload already handled client-side (`browser-image-compression`)
- Deduplicate filenames per task
- Map legacy task IDs → new UUIDs (depends on MySQL migration)
- Compliance PDFs (`compliance_file_url`) remain external URLs in v1

## Out of scope for v1

- Automated migration tooling
- `compliance-docs` storage bucket (PDF upload fast follow)
