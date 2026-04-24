-- profiles table for panel members
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_status text NOT NULL DEFAULT 'none' CHECK (expert_status IN ('none', 'pending', 'verified', 'rejected')),
  expert_verify_method text CHECK (expert_verify_method IN ('employment_certificate', 'health_insurance')),
  expert_verify_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- User can read/update their own profile
CREATE POLICY "user_own" ON profiles FOR ALL USING (auth.uid() = id);
-- Add expert_only to interviews
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS expert_only boolean NOT NULL DEFAULT false;
-- Trigger
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
