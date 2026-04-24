-- Add onboarding_completed_at to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
