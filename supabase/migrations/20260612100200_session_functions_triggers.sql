CREATE OR REPLACE FUNCTION get_user_practice_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT practice_id FROM practice_members
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_task_session(time_due time)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN time_due IS NULL THEN 'all_day'
    WHEN time_due < time '13:15' THEN 'morning'
    ELSE 'afternoon'
  END;
$$;

CREATE OR REPLACE FUNCTION is_daily_task_locked(p_task_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_time_due time;
  v_task_date date;
  v_tz text;
  v_session text;
  v_local timestamptz;
BEGIN
  SELECT tt.time_due, dt.task_date, p.timezone
  INTO v_time_due, v_task_date, v_tz
  FROM daily_tasks dt
  JOIN task_templates tt ON tt.id = dt.task_template_id
  JOIN practices p ON p.id = dt.practice_id
  WHERE dt.id = p_task_id;

  v_session := get_task_session(v_time_due);
  v_local := timezone(v_tz, now());

  IF v_session = 'morning' THEN
    RETURN v_local >= (v_task_date + time '13:15') AT TIME ZONE v_tz;
  END IF;
  RETURN v_local >= (v_task_date + time '18:00') AT TIME ZONE v_tz;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_daily_task_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND is_daily_task_locked(OLD.id) THEN
    RAISE EXCEPTION 'Session locked';
  END IF;
  IF TG_OP = 'DELETE' AND is_daily_task_locked(OLD.id) THEN
    RAISE EXCEPTION 'Session locked';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_daily_tasks_session_lock
  BEFORE UPDATE OR DELETE ON daily_tasks
  FOR EACH ROW EXECUTE FUNCTION enforce_daily_task_lock();
