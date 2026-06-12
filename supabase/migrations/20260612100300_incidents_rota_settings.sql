CREATE TYPE incident_type AS ENUM ('incident', 'near_miss', 'issue');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('open', 'under_review', 'resolved');
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'full_day');

CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  title text NOT NULL,
  type incident_type NOT NULL DEFAULT 'incident',
  severity incident_severity NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  surgery_id uuid REFERENCES surgeries(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status incident_status NOT NULL DEFAULT 'open',
  manager_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rota_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surgery_id uuid NOT NULL REFERENCES surgeries(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  shift_type shift_type NOT NULL DEFAULT 'full_day',
  is_published boolean NOT NULL DEFAULT false,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_id, user_id, surgery_id, shift_date, shift_type)
);

CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  UNIQUE (practice_id, key)
);

CREATE INDEX idx_incidents_practice_created ON incidents(practice_id, created_at);
CREATE INDEX idx_rota_practice_date ON rota_assignments(practice_id, shift_date);
