-- Create public stimuli bucket for ad material / prototype image uploads
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'stimuli') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('stimuli', 'stimuli', true);
  END IF;
END $$;

DROP POLICY IF EXISTS "Authenticated users can upload stimuli" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read stimuli" ON storage.objects;

CREATE POLICY "Authenticated users can upload stimuli"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stimuli');

CREATE POLICY "Anyone can read stimuli"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stimuli');
