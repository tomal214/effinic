-- Isolate PIN secrets from practice_members (service-role API access only)

CREATE TABLE practice_member_pins (
  member_id uuid PRIMARY KEY REFERENCES practice_members(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  pin_failed_attempts int NOT NULL DEFAULT 0,
  pin_locked_until timestamptz
);

INSERT INTO practice_member_pins (member_id, pin_hash, pin_failed_attempts, pin_locked_until)
SELECT id, pin_hash, pin_failed_attempts, pin_locked_until
FROM practice_members
WHERE pin_hash IS NOT NULL;

ALTER TABLE practice_members
  DROP COLUMN pin_hash,
  DROP COLUMN pin_failed_attempts,
  DROP COLUMN pin_locked_until;

ALTER TABLE practice_member_pins ENABLE ROW LEVEL SECURITY;
