INSERT INTO storage.buckets (id, name, public)
VALUES ('task-evidence', 'task-evidence', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY task_evidence_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-evidence'
    AND (storage.foldername(name))[1] = get_user_practice_id()::text
  );

CREATE POLICY task_evidence_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-evidence'
    AND (storage.foldername(name))[1] = get_user_practice_id()::text
  );

CREATE POLICY task_evidence_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'task-evidence'
    AND (storage.foldername(name))[1] = get_user_practice_id()::text
  );

CREATE POLICY task_evidence_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-evidence'
    AND (storage.foldername(name))[1] = get_user_practice_id()::text
  );
