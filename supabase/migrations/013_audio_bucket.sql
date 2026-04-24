-- Create audio-responses storage bucket for voice interview recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-responses', 'audio-responses', false)
ON CONFLICT (id) DO NOTHING;
