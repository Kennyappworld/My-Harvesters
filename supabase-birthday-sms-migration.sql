-- ============================================================
-- SanctuaryHQ — Birthday Engine + SMS Log Migration
-- Run these in your Supabase SQL Editor (Project → SQL Editor)
-- ============================================================


-- ── 1. BIRTHDAY / DATE-OF-BIRTH COLUMN ───────────────────────
-- Add dob (date of birth) to workers table for the Birthday Engine.
-- We store the full date so we can calculate age and search by month/day.

ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS dob DATE;

-- Index for fast birthday lookups by month and day (for the notice board)
-- PostgreSQL lets us index on expressions — this finds all birthdays in a month:
CREATE INDEX IF NOT EXISTS idx_workers_dob_mmdd
  ON public.workers (
    EXTRACT(MONTH FROM dob),
    EXTRACT(DAY   FROM dob)
  )
  WHERE dob IS NOT NULL;

-- Back-fill from birthday text if you already have data in a text column:
-- UPDATE public.workers SET dob = birthday::DATE WHERE birthday IS NOT NULL AND birthday ~ '^\d{4}-\d{2}-\d{2}$';

-- RLS: workers can see own dob; admins can see all
-- (Assumes workers already have a SELECT policy covering all authenticated users)


-- ── 2. TODAY'S BIRTHDAYS — FAST QUERY ────────────────────────
-- Use this in your API route or Supabase Edge Function to get today's birthdays:

-- SELECT id, full_name, phone, email, branch_id, dob
-- FROM public.workers
-- WHERE EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)
--   AND EXTRACT(DAY   FROM dob) = EXTRACT(DAY   FROM CURRENT_DATE)
--   AND status = 'active';


-- ── 3. BIRTHDAY RANGE QUERY (e.g. April 1–30) ────────────────
-- Find all members with birthdays between two MM-DD values:

-- SELECT id, full_name, phone, email, branch_id, dob
-- FROM public.workers
-- WHERE (
--   EXTRACT(MONTH FROM dob) * 100 + EXTRACT(DAY FROM dob)
-- ) BETWEEN 401 AND 430   -- April 1–30
--   AND status = 'active'
-- ORDER BY EXTRACT(MONTH FROM dob), EXTRACT(DAY FROM dob);


-- ── 4. SMS LOG TABLE ──────────────────────────────────────────
-- Record every bulk SMS dispatch for audit and de-duplication.

CREATE TABLE IF NOT EXISTS public.sms_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by      UUID        REFERENCES public.workers(id) ON DELETE SET NULL,
  recipient_id UUID        REFERENCES public.workers(id) ON DELETE SET NULL,
  phone        TEXT        NOT NULL,
  message      TEXT        NOT NULL,
  channel      TEXT        NOT NULL DEFAULT 'sms',  -- 'sms' | 'whatsapp'
  purpose      TEXT,                                 -- 'birthday' | 'bulk' | 'event' | 'pastoral'
  status       TEXT        NOT NULL DEFAULT 'sent',  -- 'sent' | 'failed' | 'pending'
  termii_id    TEXT,                                 -- Termii message_id for delivery tracking
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error        TEXT                                  -- populated on failure
);

-- Indexes for reporting
CREATE INDEX IF NOT EXISTS idx_sms_log_sent_by   ON public.sms_log (sent_by);
CREATE INDEX IF NOT EXISTS idx_sms_log_purpose   ON public.sms_log (purpose);
CREATE INDEX IF NOT EXISTS idx_sms_log_sent_at   ON public.sms_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_log_recipient ON public.sms_log (recipient_id);

-- RLS: admins read all; users read only their own sends
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all SMS logs" ON public.sms_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workers w
      WHERE w.id = auth.uid()
        AND w.role IN ('developer', 'admin', 'senior_pastor')
    )
  );

CREATE POLICY "Workers read own sends" ON public.sms_log
  FOR SELECT
  USING (sent_by = auth.uid());

-- No client-side INSERT — all inserts go through the /api/send-sms server route
-- (using the Supabase service-role key, not the anon key)


-- ── 5. SMS ANALYTICS VIEW ─────────────────────────────────────
-- Useful for a Reports section: "We've sent 230 messages this month"

CREATE OR REPLACE VIEW public.sms_summary AS
SELECT
  DATE_TRUNC('month', sent_at) AS month,
  channel,
  purpose,
  COUNT(*)                      AS messages_sent,
  COUNT(DISTINCT sent_by)       AS senders,
  COUNT(DISTINCT recipient_id)  AS unique_recipients
FROM public.sms_log
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

GRANT SELECT ON public.sms_summary TO authenticated;


-- ── 6. BIRTHDAY NOTIFICATIONS VIEW ───────────────────────────
-- Easily check who's been wished a birthday already this year:

CREATE OR REPLACE VIEW public.birthday_wishes_this_year AS
SELECT
  w.id,
  w.full_name,
  w.dob,
  w.phone,
  MAX(s.sent_at) AS last_wished_at
FROM public.workers w
LEFT JOIN public.sms_log s
  ON s.recipient_id = w.id
  AND s.purpose = 'birthday'
  AND EXTRACT(YEAR FROM s.sent_at) = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE w.dob IS NOT NULL
GROUP BY w.id, w.full_name, w.dob, w.phone
ORDER BY EXTRACT(MONTH FROM w.dob), EXTRACT(DAY FROM w.dob);

GRANT SELECT ON public.birthday_wishes_this_year TO authenticated;


-- ── 7. RLS POLICY: WORKERS UPDATE OWN DOB ────────────────────
-- Allow workers to update their own date of birth from the profile page

-- Make sure your existing UPDATE policy allows dob to be changed.
-- If you used the "Workers update own safe fields" policy from the password SQL,
-- the dob column will already be included (it doesn't restrict by column, only by row).
-- Nothing extra needed unless you have a column-level UPDATE policy.


-- ── 8. USEFUL ADMIN QUERIES ──────────────────────────────────

-- Count members with DOB on file:
SELECT COUNT(*) AS members_with_dob FROM public.workers WHERE dob IS NOT NULL;

-- Top months for birthdays:
SELECT TO_CHAR(dob, 'Month') AS birth_month, COUNT(*) AS count
FROM public.workers
WHERE dob IS NOT NULL
GROUP BY 1, EXTRACT(MONTH FROM dob)
ORDER BY EXTRACT(MONTH FROM dob);

-- Members with birthdays in next 7 days:
SELECT full_name, phone, dob,
       AGE(
         DATE_TRUNC('year', CURRENT_DATE) +
           (dob - DATE_TRUNC('year', dob)),
         CURRENT_DATE
       ) AS days_until
FROM public.workers
WHERE dob IS NOT NULL
  AND (
    DATE_TRUNC('year', CURRENT_DATE) + (dob - DATE_TRUNC('year', dob))
    BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    OR
    DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' + (dob - DATE_TRUNC('year', dob))
    BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  )
ORDER BY 4;

-- Bulk SMS send count by month:
SELECT TO_CHAR(sent_at, 'YYYY-MM') AS month, COUNT(*) AS messages
FROM public.sms_log
GROUP BY 1
ORDER BY 1 DESC
LIMIT 12;
