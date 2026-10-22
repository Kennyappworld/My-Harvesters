-- ============================================================
-- SanctuaryHQ — Passkey (WebAuthn / Biometric) Migration
-- Run in your Supabase SQL Editor (Project → SQL Editor)
-- ============================================================


-- ── 1. PASSKEY CREDENTIALS TABLE ─────────────────────────────
-- Stores one row per registered passkey per worker.
-- A worker may have multiple passkeys (phone + laptop, etc.)

CREATE TABLE IF NOT EXISTS public.passkey_credentials (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id        UUID        NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,

  -- WebAuthn fields (base64url encoded)
  credential_id    TEXT        NOT NULL UNIQUE,   -- the credential's unique ID from the authenticator
  public_key       TEXT        NOT NULL,           -- COSE-encoded public key (base64url)
  counter          BIGINT      NOT NULL DEFAULT 0, -- replay-attack counter; must increase each use

  -- Device metadata (for the "Manage passkeys" UI)
  device_name      TEXT,                           -- user-supplied label, e.g. "My iPhone"
  aaguid           TEXT,                           -- authenticator AAGUID (identifies device type)
  transports       TEXT[],                         -- ['internal'] | ['usb'] | ['hybrid'] etc.

  -- Lifecycle
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at     TIMESTAMPTZ,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_passkey_worker    ON public.passkey_credentials (worker_id);
CREATE INDEX IF NOT EXISTS idx_passkey_active    ON public.passkey_credentials (worker_id) WHERE is_active = TRUE;

-- RLS
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

-- Workers can only see and manage their own passkeys
CREATE POLICY "Workers manage own passkeys" ON public.passkey_credentials
  FOR ALL
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());

-- Admins can view all (for support / audit)
CREATE POLICY "Admins view all passkeys" ON public.passkey_credentials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workers w
      WHERE w.id = auth.uid()
        AND w.role IN ('developer', 'admin', 'senior_pastor')
    )
  );


-- ── 2. PASSKEY CHALLENGES TABLE ───────────────────────────────
-- Temporary challenge storage (used during WebAuthn ceremony).
-- Challenges expire after 5 minutes to prevent replay attacks.

CREATE TABLE IF NOT EXISTS public.passkey_challenges (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge    TEXT        NOT NULL UNIQUE,  -- base64url random bytes
  email        TEXT,                          -- set during registration (pre-auth)
  worker_id    UUID        REFERENCES public.workers(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,          -- 'registration' | 'authentication'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  used         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_passkey_challenges_challenge ON public.passkey_challenges (challenge);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires   ON public.passkey_challenges (expires_at);

-- No RLS needed — only the service-role key (server-side) reads/writes challenges.
-- Anon + authenticated roles have no access.
REVOKE ALL ON public.passkey_challenges FROM anon, authenticated;

-- Auto-clean expired challenges (runs as a cron if pg_cron is enabled,
-- or just leave it — 5-min rows are tiny and the server cleans on read)


-- ── 3. WORKERS TABLE — PASSKEY FLAG ──────────────────────────
-- Optional: track whether a worker has registered at least one passkey.
-- Makes it easy to show/hide the biometric login button on the login page.

ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS has_passkey BOOLEAN NOT NULL DEFAULT FALSE;

-- Function to keep has_passkey in sync automatically
CREATE OR REPLACE FUNCTION public.sync_worker_passkey_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- After any change to passkey_credentials, update the worker's flag
  IF TG_OP = 'DELETE' THEN
    UPDATE public.workers
    SET has_passkey = EXISTS (
      SELECT 1 FROM public.passkey_credentials
      WHERE worker_id = OLD.worker_id AND is_active = TRUE
    )
    WHERE id = OLD.worker_id;
    RETURN OLD;
  ELSE
    UPDATE public.workers
    SET has_passkey = EXISTS (
      SELECT 1 FROM public.passkey_credentials
      WHERE worker_id = NEW.worker_id AND is_active = TRUE
    )
    WHERE id = NEW.worker_id;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_passkey_flag ON public.passkey_credentials;
CREATE TRIGGER trg_sync_passkey_flag
  AFTER INSERT OR UPDATE OR DELETE ON public.passkey_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_worker_passkey_flag();


-- ── 4. VERIFY SETUP ──────────────────────────────────────────

SELECT
  'passkey_credentials' AS table_name,
  COUNT(*) AS rows
FROM public.passkey_credentials
UNION ALL
SELECT
  'passkey_challenges',
  COUNT(*)
FROM public.passkey_challenges;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workers'
  AND column_name = 'has_passkey';
