-- Row Level Security: tenant isolation via get_user_practice_id()
-- Viewer read-only enforced in API; SELECT allowed for all practice members.

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rota_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- practices
CREATE POLICY practices_select ON practices FOR SELECT
  USING (id = get_user_practice_id());

-- profiles
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT user_id FROM practice_members
      WHERE practice_id = get_user_practice_id()
    )
  );

CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (id = auth.uid());

-- practice_members
CREATE POLICY practice_members_select ON practice_members FOR SELECT
  USING (practice_id = get_user_practice_id());

CREATE POLICY practice_members_insert ON practice_members FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY practice_members_update ON practice_members FOR UPDATE
  USING (practice_id = get_user_practice_id());

CREATE POLICY practice_members_delete ON practice_members FOR DELETE
  USING (practice_id = get_user_practice_id());

-- practice_invites
CREATE POLICY practice_invites_select ON practice_invites FOR SELECT
  USING (practice_id = get_user_practice_id());

CREATE POLICY practice_invites_insert ON practice_invites FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY practice_invites_update ON practice_invites FOR UPDATE
  USING (practice_id = get_user_practice_id());

CREATE POLICY practice_invites_delete ON practice_invites FOR DELETE
  USING (practice_id = get_user_practice_id());

-- surgeries
CREATE POLICY surgeries_select ON surgeries FOR SELECT
  USING (practice_id = get_user_practice_id());

CREATE POLICY surgeries_insert ON surgeries FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY surgeries_update ON surgeries FOR UPDATE
  USING (practice_id = get_user_practice_id());

CREATE POLICY surgeries_delete ON surgeries FOR DELETE
  USING (practice_id = get_user_practice_id());

-- task_templates
CREATE POLICY task_templates_select ON task_templates FOR SELECT
  USING (practice_id = get_user_practice_id());

CREATE POLICY task_templates_insert ON task_templates FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY task_templates_update ON task_templates FOR UPDATE
  USING (practice_id = get_user_practice_id());

CREATE POLICY task_templates_delete ON task_templates FOR DELETE
  USING (practice_id = get_user_practice_id());

-- daily_tasks
CREATE POLICY daily_tasks_select ON daily_tasks FOR SELECT
  USING (practice_id = get_user_practice_id());

CREATE POLICY daily_tasks_insert ON daily_tasks FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY daily_tasks_update ON daily_tasks FOR UPDATE
  USING (practice_id = get_user_practice_id());

CREATE POLICY daily_tasks_delete ON daily_tasks FOR DELETE
  USING (practice_id = get_user_practice_id());

-- incidents
CREATE POLICY incidents_select ON incidents FOR SELECT
  USING (practice_id = get_user_practice_id());

CREATE POLICY incidents_insert ON incidents FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY incidents_update ON incidents FOR UPDATE
  USING (practice_id = get_user_practice_id());

CREATE POLICY incidents_delete ON incidents FOR DELETE
  USING (practice_id = get_user_practice_id());

-- rota_assignments
CREATE POLICY rota_assignments_select ON rota_assignments FOR SELECT
  USING (practice_id = get_user_practice_id());

CREATE POLICY rota_assignments_insert ON rota_assignments FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY rota_assignments_update ON rota_assignments FOR UPDATE
  USING (practice_id = get_user_practice_id());

CREATE POLICY rota_assignments_delete ON rota_assignments FOR DELETE
  USING (practice_id = get_user_practice_id());

-- settings
CREATE POLICY settings_select ON settings FOR SELECT
  USING (practice_id = get_user_practice_id());

CREATE POLICY settings_insert ON settings FOR INSERT
  WITH CHECK (practice_id = get_user_practice_id());

CREATE POLICY settings_update ON settings FOR UPDATE
  USING (practice_id = get_user_practice_id());

CREATE POLICY settings_delete ON settings FOR DELETE
  USING (practice_id = get_user_practice_id());
