-- Demo practice seed for local dev and E2E tests
--
-- Practice URL: /p/demo-dental/11111111-1111-1111-1111-111111111111
-- Manager login: manager@demo.effinic.test / DemoManager1!
-- Nurse PIN (all nurses): 1234
-- pin_hash uses bcrypt cost 10 (compatible with bcryptjs in src/lib/auth/pin.ts)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fixed UUIDs for deterministic E2E
-- practice_id:       22222222-2222-2222-2222-222222222222
-- practice_token:    11111111-1111-1111-1111-111111111111
-- manager user_id:   33333333-3333-3333-3333-333333333331
-- nurse1 user_id:    33333333-3333-3333-3333-333333333332
-- nurse2 user_id:    33333333-3333-3333-3333-333333333333

-- Precomputed bcrypt for PIN 1234 (bcryptjs cost 10):
-- $2b$10$2ke8lvRdnuXwmuXGdzbxB.10nTKydXsjjdHF2RcUoFX9fZOobIojW

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333331',
    'authenticated',
    'authenticated',
    'manager@demo.effinic.test',
    crypt('DemoManager1!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Manager"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333332',
    'authenticated',
    'authenticated',
    'demo-dental.nurse1@practice.internal',
    crypt(gen_random_uuid()::text, gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sarah Nurse"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'demo-dental.nurse2@practice.internal',
    crypt(gen_random_uuid()::text, gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"James Nurse"}',
    now(),
    now()
  );

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333331',
    '33333333-3333-3333-3333-333333333331',
    '{"sub":"33333333-3333-3333-3333-333333333331","email":"manager@demo.effinic.test","email_verified":true}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333332',
    '33333333-3333-3333-3333-333333333332',
    '{"sub":"33333333-3333-3333-3333-333333333332","email":"demo-dental.nurse1@practice.internal","email_verified":true}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '{"sub":"33333333-3333-3333-3333-333333333333","email":"demo-dental.nurse2@practice.internal","email_verified":true}'::jsonb,
    'email',
    now(),
    now(),
    now()
  );

INSERT INTO practices (id, name, slug, practice_token, timezone, signup_mode)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Demo Dental Practice',
  'demo-dental',
  '11111111-1111-1111-1111-111111111111',
  'Europe/London',
  'invite_only'
);

INSERT INTO profiles (id, full_name) VALUES
  ('33333333-3333-3333-3333-333333333331', 'Demo Manager'),
  ('33333333-3333-3333-3333-333333333332', 'Sarah Nurse'),
  ('33333333-3333-3333-3333-333333333333', 'James Nurse');

INSERT INTO surgeries (id, practice_id, name, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222222', 'Surgery 1', 1),
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'Surgery 2', 2),
  ('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222222', 'Surgery 3', 3);

INSERT INTO practice_members (id, practice_id, user_id, role, active_surgery_id) VALUES
  (
    '66666666-6666-6666-6666-666666666661',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    'manager',
    NULL
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333332',
    'nurse',
    '44444444-4444-4444-4444-444444444441'
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'nurse',
    '44444444-4444-4444-4444-444444444442'
  );

INSERT INTO practice_member_pins (member_id, pin_hash) VALUES
  (
    '66666666-6666-6666-6666-666666666662',
    '$2b$10$2ke8lvRdnuXwmuXGdzbxB.10nTKydXsjjdHF2RcUoFX9fZOobIojW'
  ),
  (
    '66666666-6666-6666-6666-666666666663',
    '$2b$10$2ke8lvRdnuXwmuXGdzbxB.10nTKydXsjjdHF2RcUoFX9fZOobIojW'
  );

INSERT INTO task_templates (
  id, practice_id, title, description, time_due, role_responsible,
  surgery_ids, is_mandatory, priority, checklist_steps
) VALUES
  (
    '55555555-5555-5555-5555-555555555551',
    '22222222-2222-2222-2222-222222222222',
    'Steriliser cycle check',
    'Run and log morning steriliser cycle',
    '08:00',
    'nurse',
    ARRAY['44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444443']::uuid[],
    true,
    'high',
    '[{"label":"Run cycle","done":false},{"label":"Log temperature","done":false}]'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555552',
    '22222222-2222-2222-2222-222222222222',
    'Reception area tidy',
    'Clear waiting area and restock leaflets',
    '09:00',
    'nurse',
    ARRAY['44444444-4444-4444-4444-444444444441']::uuid[],
    true,
    'medium',
    '[]'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555553',
    '22222222-2222-2222-2222-222222222222',
    'Surgery prep',
    'Prepare instruments and PPE for morning list',
    '10:30',
    'nurse',
    ARRAY['44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444442']::uuid[],
    true,
    'high',
    '[]'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555554',
    '22222222-2222-2222-2222-222222222222',
    'Instrument audit',
    'Afternoon instrument count and log',
    '14:00',
    'nurse',
    ARRAY['44444444-4444-4444-4444-444444444443']::uuid[],
    true,
    'medium',
    '[]'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'Clinical waste disposal',
    'Seal and label clinical waste bags',
    '15:30',
    'nurse',
    ARRAY['44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444443']::uuid[],
    true,
    'medium',
    '[]'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555556',
    '22222222-2222-2222-2222-222222222222',
    'Stock check',
    'Check PPE and consumables levels',
    '16:00',
    'nurse',
    ARRAY['44444444-4444-4444-4444-444444444442']::uuid[],
    false,
    'low',
    '[]'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555557',
    '22222222-2222-2222-2222-222222222222',
    'Fire exit inspection',
    'Verify all fire exits clear and signed',
    NULL,
    'nurse',
    ARRAY['44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444443']::uuid[],
    true,
    'high',
    '[]'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555558',
    '22222222-2222-2222-2222-222222222222',
    'Hand hygiene audit',
    'Spot-check hand hygiene compliance',
    NULL,
    'nurse',
    ARRAY['44444444-4444-4444-4444-444444444441']::uuid[],
    true,
    'medium',
    '[]'::jsonb
  );

INSERT INTO rota_assignments (
  practice_id, user_id, surgery_id, shift_date, shift_type, is_published, assigned_by
)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  '33333333-3333-3333-3333-333333333332'::uuid,
  '44444444-4444-4444-4444-444444444441'::uuid,
  (date_trunc('week', current_date)::date + d),
  'full_day'::shift_type,
  true,
  '33333333-3333-3333-3333-333333333331'::uuid
FROM generate_series(0, 6) AS d
UNION ALL
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  '44444444-4444-4444-4444-444444444442'::uuid,
  (date_trunc('week', current_date)::date + d),
  'full_day'::shift_type,
  true,
  '33333333-3333-3333-3333-333333333331'::uuid
FROM generate_series(0, 6) AS d;

INSERT INTO incidents (
  id, practice_id, title, type, severity, description,
  surgery_id, reported_by, status
) VALUES
  (
    '77777777-7777-7777-7777-777777777771',
    '22222222-2222-2222-2222-222222222222',
    'Slip near steriliser room',
    'near_miss',
    'low',
    'Wet floor spotted and mopped before patient arrival.',
    '44444444-4444-4444-4444-444444444441',
    '33333333-3333-3333-3333-333333333332',
    'resolved'
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '22222222-2222-2222-2222-222222222222',
    'Autoclave temperature fluctuation',
    'issue',
    'medium',
    'Brief temperature dip during cycle; manufacturer contacted.',
    '44444444-4444-4444-4444-444444444443',
    '33333333-3333-3333-3333-333333333333',
    'under_review'
  );

INSERT INTO settings (practice_id, key, value) VALUES
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'notifications',
    '{"email_digest": true, "incident_alerts": true}'::jsonb
  );
