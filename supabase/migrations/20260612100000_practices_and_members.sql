-- Practices and membership
CREATE TYPE signup_mode AS ENUM ('invite_only', 'open');
CREATE TYPE member_role AS ENUM (
  'admin', 'manager', 'nurse', 'receptionist', 'dentist', 'hygienist', 'viewer'
);

CREATE TABLE practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  practice_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  timezone text NOT NULL DEFAULT 'Europe/London',
  signup_mode signup_mode NOT NULL DEFAULT 'invite_only',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE practice_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  pin_hash text,
  pin_failed_attempts int NOT NULL DEFAULT 0,
  pin_locked_until timestamptz,
  active_surgery_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_id, user_id)
);

CREATE TABLE practice_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  email text NOT NULL,
  role member_role NOT NULL DEFAULT 'manager',
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_practice_members_user ON practice_members(user_id);
CREATE INDEX idx_practice_members_practice ON practice_members(practice_id);
