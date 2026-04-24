CREATE TABLE IF NOT EXISTS interview_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (char_length(email) <= 320),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(interview_id, email)
);

ALTER TABLE interview_members ENABLE ROW LEVEL SECURITY;

-- Interview owner can manage members
CREATE POLICY "owner_manage" ON interview_members FOR ALL
  USING (
    interview_id IN (SELECT id FROM interviews WHERE user_id = auth.uid())
  );

-- Member can read their own membership (for joined interviews)
CREATE POLICY "member_read_own" ON interview_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_interview_members_interview ON interview_members(interview_id);
CREATE INDEX idx_interview_members_user ON interview_members(user_id) WHERE user_id IS NOT NULL;

-- Auto-link user_id when a matching auth user exists
CREATE OR REPLACE FUNCTION link_interview_member_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE interview_members
  SET user_id = (SELECT id FROM auth.users WHERE email = NEW.email LIMIT 1)
  WHERE id = NEW.id AND user_id IS NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER link_member_user
  AFTER INSERT ON interview_members
  FOR EACH ROW EXECUTE FUNCTION link_interview_member_user();
