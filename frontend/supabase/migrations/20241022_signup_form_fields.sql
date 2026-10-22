-- Migration: custom signup form fields + extra_fields on workers
-- Run in Supabase → SQL Editor

-- 1. Add signup_fields JSONB column to organisations table
--    Stores array of SignupField objects (see orgSettings.ts)
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS signup_fields JSONB DEFAULT NULL;

-- 2. Add extra_fields JSONB column to workers table
--    Stores key/value responses to custom signup form fields
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS extra_fields JSONB DEFAULT NULL;

-- 3. Update DOB column comment — we now store MM-DD (no year)
COMMENT ON COLUMN workers.dob IS 'Date of birth stored as MM-DD string (no year). Example: 03-15 for March 15.';

-- 4. Index for querying extra_fields if needed
CREATE INDEX IF NOT EXISTS workers_extra_fields_gin
  ON workers USING gin (extra_fields)
  WHERE extra_fields IS NOT NULL;
