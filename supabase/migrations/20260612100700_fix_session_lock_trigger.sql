-- Allow completing pending tasks after session lock; block amending completed tasks only

CREATE OR REPLACE FUNCTION enforce_daily_task_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.status = 'completed'
    AND is_daily_task_locked(OLD.id) THEN
    RAISE EXCEPTION 'Session locked';
  END IF;
  IF TG_OP = 'DELETE' AND is_daily_task_locked(OLD.id) THEN
    RAISE EXCEPTION 'Session locked';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
