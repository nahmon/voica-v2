-- Add quality_score to sessions for fraud detection
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS quality_score int2;
