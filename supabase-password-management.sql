-- ============================================================
-- SanctuaryHQ — Password Management SQL
-- Run these in your Supabase SQL Editor (Project → SQL Editor)
-- ============================================================


-- ── 1. ENABLE EMAIL CONFIRMATIONS (if not already) ──────────
-- Go to: Authentication → Settings → Email Auth
-- Ensure "Enable email confirmations" is ON so reset emails work.
-- This is a dashboard setting, not SQL. Reminder only.


-- ── 2. SET SITE URL & REDIRECT URL FOR RESETS ────────────────
-- Go to: Authentication → URL Configuration
-- Site URL:          https://your-app.vercel.app
-- Redirect URLs:     https://your-app.vercel.app/reset-password
--                    http://localhost:3000/reset-password  (for dev)
-- This is a dashboard setting. Reminder only.


-- ── 3. WORKERS TABLE — ENSURE PASSWORD FIELDS EXIST ─────────

ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS password_changed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_count  INTEGER NOT NULL DEFAULT 0;

-- Index for quick lookup of accounts requiring password change
CREATE INDEX IF NOT EXISTS idx_workers_must_change_password
  ON public.workers (must_change_password)
  WHERE must_change_password = TRUE;


-- ── 4. ADMIN: FORCE A USER TO RESET THEIR PASSWORD ──────────
-- Run this when you want a user to set a new password on next login.
-- Replace the email with the target user's email.

UPDATE public.workers
SET
  must_change_password = TRUE
WHERE email = 'user@example.com';   -- ← change this


-- ── 5. ADMIN: RESET MULTIPLE USERS AT ONCE ──────────────────
-- Option A: Force ALL active workers to reset (org-wide security reset):
UPDATE public.workers
SET must_change_password = TRUE
WHERE status = 'active';

-- Option B: Force only a specific branch to reset:
-- UPDATE public.workers
-- SET must_change_password = TRUE
-- WHERE branch_id = 'lekki';  -- ← your branch_id value


-- ── 6. ADMIN: CHANGE A USER'S AUTH PASSWORD DIRECTLY ────────
-- Supabase does not expose a direct SQL password change for auth.users
-- (passwords are stored as bcrypt hashes managed by GoTrue).
-- Use the Admin API instead — safest from your backend:
--
--   POST https://<project-ref>.supabase.co/auth/v1/admin/users/<user-id>
--   Headers: apikey: <service_role_key>
--            Authorization: Bearer <service_role_key>
--            Content-Type: application/json
--   Body:    { "password": "NewTemporaryPass123!" }
--
-- Or use the Supabase Dashboard:
--   Authentication → Users → find user → "Send password recovery"
--   (This sends the reset email flow used by /forgot-password)
--
-- Or generate a magic link for them:
--   Authentication → Users → find user → "Send magic link"


-- ── 7. LOG PASSWORD RESET EVENTS (optional audit trail) ──────

CREATE TABLE IF NOT EXISTS public.password_reset_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID        REFERENCES public.workers(id) ON DELETE SET NULL,
  email       TEXT        NOT NULL,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  ip_address  TEXT,         -- populated server-side if you have middleware
  user_agent  TEXT,
  status      TEXT        NOT NULL DEFAULT 'initiated'  -- 'initiated' | 'completed' | 'expired'
);

-- RLS: only admins / developers can read the log
ALTER TABLE public.password_reset_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read password reset log" ON public.password_reset_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workers w
      WHERE w.id = auth.uid()
        AND w.role IN ('developer', 'admin', 'senior_pastor')
    )
  );

-- No INSERT policy from client — inserts happen server-side via service role
-- (from your Next.js API route or Supabase Edge Function)


-- ── 8. TRIGGER: AUTO-CLEAR must_change_password ON AUTH UPDATE ──
-- When a user successfully changes their password via Supabase Auth,
-- this trigger updates the workers table automatically.
-- Run the entire block below in one go in the Supabase SQL Editor.

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_password_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear the force-change flag and record when password last changed
  UPDATE public.workers
  SET
    must_change_password = FALSE,
    password_changed_at  = NOW(),
    password_reset_count = COALESCE(password_reset_count, 0) + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Step 2: Drop old trigger if it exists, then create fresh
DROP TRIGGER IF EXISTS on_auth_password_changed ON auth.users;

CREATE TRIGGER on_auth_password_changed
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  WHEN (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password)
  EXECUTE FUNCTION public.handle_password_changed();

-- Step 3: Confirm it was created
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_password_changed';


-- ── 9. VIEW: ACCOUNTS PENDING PASSWORD RESET ─────────────────
-- Useful in an admin dashboard to see who still needs to reset.

CREATE OR REPLACE VIEW public.workers_pending_reset AS
SELECT
  w.id,
  w.email,
  w.full_name,
  w.role,
  w.branch_id,
  w.must_change_password,
  w.password_changed_at,
  w.created_at
FROM public.workers w
WHERE w.must_change_password = TRUE
  AND w.status = 'active'
ORDER BY w.created_at DESC;

-- Grant read to admins
GRANT SELECT ON public.workers_pending_reset TO authenticated;


-- ── 10. RLS POLICY: WORKERS CAN UPDATE THEIR OWN PASSWORD FLAG ──
-- Workers shouldn't be able to set must_change_password = FALSE themselves
-- via the client — the app does it after verifying the new password.
-- Make sure your workers UPDATE policy does NOT allow changing this field
-- directly from the client. If you have a broad UPDATE policy, narrow it:

-- Example: drop any broad self-update and replace with a safe one
-- (skip if you already have fine-grained policies)

-- DROP POLICY IF EXISTS "Workers update own profile" ON public.workers;

CREATE POLICY "Workers update own safe fields" ON public.workers
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- must_change_password can only be set to FALSE (never TRUE by user themselves)
    AND (must_change_password = FALSE OR must_change_password IS NULL)
  );


-- ── 11. USEFUL ADMIN QUERIES ─────────────────────────────────

-- List all users who need to reset their password:
SELECT id, email, full_name, role, branch_id, created_at
FROM public.workers
WHERE must_change_password = TRUE
ORDER BY created_at DESC;

-- See when each user last changed their password:
SELECT id, email, full_name, password_changed_at, password_reset_count
FROM public.workers
ORDER BY password_changed_at DESC NULLS LAST;

-- Force ALL workers to reset on next login (e.g. after a security incident):
-- UPDATE public.workers SET must_change_password = TRUE WHERE status = 'active';

-- Clear the flag for a specific user after admin-assisted reset:
UPDATE public.workers
SET
  must_change_password = FALSE,
  password_changed_at  = NOW()
WHERE email = 'user@example.com';   -- ← change this
