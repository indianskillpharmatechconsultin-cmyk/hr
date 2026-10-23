CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'staff')),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  access_revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accession text NOT NULL UNIQUE CHECK (length(accession) BETWEEN 1 AND 50),
  subject_code text NOT NULL CHECK (length(subject_code) <= 100),
  sample_type text NOT NULL CHECK (length(sample_type) <= 100),
  status text NOT NULL CHECK (status IN ('received', 'processing', 'completed', 'rejected')),
  result text CHECK (length(result) <= 2000),
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS samples_updated_idx ON samples(updated_at DESC);

CREATE TABLE IF NOT EXISTS work_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 150),
  description text NOT NULL CHECK (length(description) BETWEEN 1 AND 4000),
  assigned_to uuid NOT NULL REFERENCES users(id),
  assigned_by uuid NOT NULL REFERENCES users(id),
  due_at timestamptz,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS work_assignee_idx ON work_assignments(assigned_to, updated_at DESC);

CREATE TABLE IF NOT EXISTS work_recipients (
  assignment_id uuid NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, user_id)
);
CREATE INDEX IF NOT EXISTS work_recipient_user_idx ON work_recipients(user_id, assignment_id);

CREATE TABLE IF NOT EXISTS work_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES work_assignments(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 200),
  blob_path text UNIQUE,
  mime_type text,
  size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes BETWEEN 1 AND 5242880),
  external_url text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (blob_path IS NOT NULL OR external_url IS NOT NULL),
  CHECK (
    (blob_path IS NULL AND mime_type IS NULL AND size_bytes IS NULL)
    OR (blob_path IS NOT NULL AND mime_type IS NOT NULL AND size_bytes IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS work_resources_assignment_idx ON work_resources(assignment_id);

CREATE TABLE IF NOT EXISTS upload_tickets (
  id uuid PRIMARY KEY,
  blob_path text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 200),
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/png', 'image/jpeg', 'text/plain')),
  size_bytes bigint NOT NULL CHECK (size_bytes BETWEEN 1 AND 5242880),
  expires_at bigint NOT NULL,
  uploaded_at timestamptz,
  blob_url text,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((uploaded_at IS NULL AND blob_url IS NULL) OR (uploaded_at IS NOT NULL AND blob_url IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS upload_tickets_expiry_idx ON upload_tickets(expires_at) WHERE claimed_at IS NULL;
CREATE INDEX IF NOT EXISTS upload_tickets_owner_idx ON upload_tickets(created_by, created_at DESC);

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  clock_in_at timestamptz NOT NULL DEFAULT now(),
  clock_out_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_time_entry_per_user
  ON time_entries(user_id) WHERE clock_out_at IS NULL;
CREATE INDEX IF NOT EXISTS time_entries_user_idx ON time_entries(user_id, clock_in_at DESC);

CREATE TABLE IF NOT EXISTS sync_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event text NOT NULL CHECK (event IN ('users:changed', 'work:changed', 'time:changed', 'samples:changed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sync_events_created_idx ON sync_events(created_at);
