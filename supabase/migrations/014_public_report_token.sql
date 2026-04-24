-- Add public_report_token to interviews table for unauthenticated report sharing
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS public_report_token text UNIQUE
    CHECK (public_report_token IS NULL OR (char_length(public_report_token) = 12 AND public_report_token ~ '^[A-Za-z0-9_-]+$'));

-- Index for fast public token lookups (used by /api/report/public/[token])
CREATE INDEX IF NOT EXISTS idx_interviews_public_report_token
  ON interviews (public_report_token)
  WHERE public_report_token IS NOT NULL;
