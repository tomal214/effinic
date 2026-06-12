-- Role-aware write policies (viewer read-only; manager tables restricted)

CREATE OR REPLACE FUNCTION get_user_member_role()
RETURNS member_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM practice_members
  WHERE user_id = auth.uid()
    AND practice_id = get_user_practice_id()
    AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION user_is_manager_or_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT get_user_member_role() IN ('manager', 'admin');
$$;

CREATE OR REPLACE FUNCTION user_can_write_tasks()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT get_user_member_role() IN ('manager', 'admin', 'nurse', 'receptionist');
$$;

CREATE OR REPLACE FUNCTION user_can_write_incidents()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT get_user_member_role() IN (
    'manager', 'admin', 'nurse', 'receptionist', 'dentist', 'hygienist'
  );
$$;

-- practice_members (manager/admin only)
DROP POLICY IF EXISTS practice_members_insert ON practice_members;
CREATE POLICY practice_members_insert ON practice_members FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS practice_members_update ON practice_members;
CREATE POLICY practice_members_update ON practice_members FOR UPDATE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS practice_members_delete ON practice_members;
CREATE POLICY practice_members_delete ON practice_members FOR DELETE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

-- practice_invites (manager/admin only)
DROP POLICY IF EXISTS practice_invites_insert ON practice_invites;
CREATE POLICY practice_invites_insert ON practice_invites FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS practice_invites_update ON practice_invites;
CREATE POLICY practice_invites_update ON practice_invites FOR UPDATE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS practice_invites_delete ON practice_invites;
CREATE POLICY practice_invites_delete ON practice_invites FOR DELETE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

-- surgeries (manager/admin only)
DROP POLICY IF EXISTS surgeries_insert ON surgeries;
CREATE POLICY surgeries_insert ON surgeries FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS surgeries_update ON surgeries;
CREATE POLICY surgeries_update ON surgeries FOR UPDATE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS surgeries_delete ON surgeries;
CREATE POLICY surgeries_delete ON surgeries FOR DELETE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

-- task_templates (manager/admin only)
DROP POLICY IF EXISTS task_templates_insert ON task_templates;
CREATE POLICY task_templates_insert ON task_templates FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS task_templates_update ON task_templates;
CREATE POLICY task_templates_update ON task_templates FOR UPDATE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS task_templates_delete ON task_templates;
CREATE POLICY task_templates_delete ON task_templates FOR DELETE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

-- daily_tasks (clinical staff + managers)
DROP POLICY IF EXISTS daily_tasks_insert ON daily_tasks;
CREATE POLICY daily_tasks_insert ON daily_tasks FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id() AND user_can_write_tasks());

DROP POLICY IF EXISTS daily_tasks_update ON daily_tasks;
CREATE POLICY daily_tasks_update ON daily_tasks FOR UPDATE
  USING (practice_id = get_user_practice_id() AND user_can_write_tasks());

DROP POLICY IF EXISTS daily_tasks_delete ON daily_tasks;
CREATE POLICY daily_tasks_delete ON daily_tasks FOR DELETE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

-- incidents (all except viewer)
DROP POLICY IF EXISTS incidents_insert ON incidents;
CREATE POLICY incidents_insert ON incidents FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id() AND user_can_write_incidents());

DROP POLICY IF EXISTS incidents_update ON incidents;
CREATE POLICY incidents_update ON incidents FOR UPDATE
  USING (practice_id = get_user_practice_id() AND user_can_write_incidents());

DROP POLICY IF EXISTS incidents_delete ON incidents;
CREATE POLICY incidents_delete ON incidents FOR DELETE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

-- rota_assignments (manager/admin only)
DROP POLICY IF EXISTS rota_assignments_insert ON rota_assignments;
CREATE POLICY rota_assignments_insert ON rota_assignments FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS rota_assignments_update ON rota_assignments;
CREATE POLICY rota_assignments_update ON rota_assignments FOR UPDATE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS rota_assignments_delete ON rota_assignments;
CREATE POLICY rota_assignments_delete ON rota_assignments FOR DELETE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

-- settings (manager/admin only)
DROP POLICY IF EXISTS settings_insert ON settings;
CREATE POLICY settings_insert ON settings FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS settings_update ON settings;
CREATE POLICY settings_update ON settings FOR UPDATE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());

DROP POLICY IF EXISTS settings_delete ON settings;
CREATE POLICY settings_delete ON settings FOR DELETE
  USING (practice_id = get_user_practice_id() AND user_is_manager_or_admin());
