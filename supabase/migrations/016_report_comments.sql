CREATE TABLE IF NOT EXISTS report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;

-- Interview owner can read all comments on their interviews
CREATE POLICY "owner_read" ON report_comments FOR SELECT
  USING (
    interview_id IN (
      SELECT id FROM interviews WHERE user_id = auth.uid()
    )
  );

-- Authenticated user can insert their own comment
CREATE POLICY "insert_own" ON report_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User can delete their own comment
CREATE POLICY "delete_own" ON report_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_report_comments_report_id ON report_comments(report_id, created_at DESC);
