CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'completed', 'overdue', 'missed');

CREATE TABLE surgeries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE practice_members
  ADD CONSTRAINT fk_active_surgery
  FOREIGN KEY (active_surgery_id) REFERENCES surgeries(id) ON DELETE SET NULL;

CREATE TABLE task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  time_due time,
  role_responsible member_role NOT NULL DEFAULT 'nurse',
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  surgery_ids uuid[] NOT NULL DEFAULT '{}',
  is_mandatory boolean NOT NULL DEFAULT true,
  priority task_priority NOT NULL DEFAULT 'medium',
  checklist_steps jsonb NOT NULL DEFAULT '[]',
  evidence_required text,
  compliance_file_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  task_template_id uuid NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  surgery_id uuid REFERENCES surgeries(id) ON DELETE SET NULL,
  task_date date NOT NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  checklist_progress jsonb,
  start_time time,
  end_time time,
  materials_used text,
  notes text,
  photo_paths jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_template_id, surgery_id, task_date)
);

CREATE INDEX idx_daily_tasks_practice_date ON daily_tasks(practice_id, task_date);
CREATE INDEX idx_task_templates_practice ON task_templates(practice_id);
