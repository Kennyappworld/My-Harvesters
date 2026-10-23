# Database Migrations

## Migration: New roles + Announcements workflow
**Run these in your Supabase SQL Editor (Settings → SQL Editor)**

---

### 1. Update `workers.role` to accept new roles

```sql
-- If there is a CHECK constraint on the role column, update it:
ALTER TABLE workers
  DROP CONSTRAINT IF EXISTS workers_role_check;

ALTER TABLE workers
  ADD CONSTRAINT workers_role_check CHECK (
    role IN (
      'developer', 'senior_pastor', 'pastor',
      'ops_head', 'admin_head',
      'admin', 'unit_head', 'worker', 'guest'
    )
  );
```

---

### 2. Create `announcements` table

```sql
CREATE TABLE IF NOT EXISTS announcements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL CHECK (char_length(title) <= 120),
  body             text NOT NULL CHECK (char_length(body) <= 800),
  type             text NOT NULL DEFAULT 'all'
                     CHECK (type IN ('pulpit','bulletin','screen','all')),
  target_audience  text NOT NULL DEFAULT 'all-church',
  run_start        timestamptz,
  run_end          timestamptz,
  priority         text NOT NULL DEFAULT 'standard'
                     CHECK (priority IN ('standard','urgent')),
  status           text NOT NULL DEFAULT 'submitted'
                     CHECK (status IN (
                       'draft','submitted','dept_approved',
                       'collated','ops_review','approved','published','rejected'
                     )),
  submitted_by     uuid REFERENCES workers(id),
  submitter_name   text,
  unit_id          uuid,
  dept_id          uuid,
  dept_name        text,
  channel          text DEFAULT 'platform',
  scope            text DEFAULT 'all',
  branch_id        uuid REFERENCES branches(id),
  media_url        text,
  rejection_reason text,
  is_highlighted   boolean DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS ann_status_idx     ON announcements(status);
CREATE INDEX IF NOT EXISTS ann_submitted_idx  ON announcements(submitted_by);
CREATE INDEX IF NOT EXISTS ann_created_idx    ON announcements(created_at DESC);
```

---

### 3. Create `announcement_approvals` table

```sql
CREATE TABLE IF NOT EXISTS announcement_approvals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id  uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  approved_by      uuid NOT NULL REFERENCES workers(id),
  role_at_approval text,
  action           text NOT NULL CHECK (action IN ('approved','rejected','collated')),
  note             text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ann_approval_ann_idx ON announcement_approvals(announcement_id);
```

---

### 4. Row Level Security (optional but recommended)

```sql
-- Enable RLS
ALTER TABLE announcements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_approvals ENABLE ROW LEVEL SECURITY;

-- Service role key bypasses RLS — our API routes use that, so these
-- policies only restrict direct client access:

-- Published announcements readable by all authenticated workers
CREATE POLICY "published_readable" ON announcements
  FOR SELECT USING (
    status = 'published'
    AND auth.role() = 'authenticated'
  );

-- Submitters can see their own submissions
CREATE POLICY "own_submissions_readable" ON announcements
  FOR SELECT USING (
    submitted_by = auth.uid()
  );

-- Only service role can insert/update (all writes go through our API routes)
-- No additional INSERT/UPDATE policies needed since API uses service role key.
```

---

### 5. Add `date_of_birth` to workers (for birthday widget)

```sql
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Index for birthday queries
CREATE INDEX IF NOT EXISTS workers_dob_idx ON workers (
  EXTRACT(MONTH FROM date_of_birth),
  EXTRACT(DAY FROM date_of_birth)
);
```

---

### 6. Assign a worker as Operations Head (replace with real UUID)

```sql
UPDATE workers
  SET role = 'ops_head'
  WHERE email = 'your-ops-head@email.com';

-- Or for Admin Head:
UPDATE workers
  SET role = 'admin_head'
  WHERE email = 'your-admin-head@email.com';
```

---

*Run migrations top-to-bottom. Each is idempotent (uses IF NOT EXISTS / IF EXISTS).*
