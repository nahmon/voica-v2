import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sessionId, questionId, ext } = req.body;
  if (!sessionId || !questionId || !ext) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const path = `${sessionId}/${questionId}.${ext}`;

  const { data, error } = await supabase.storage
    .from("audio-responses")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[upload-url]", error);
    return res.status(500).json({ error: error?.message ?? "Failed to create upload URL" });
  }

  // Also pre-generate a 90-day download signed URL (returned after client upload completes)
  const { data: dlData } = await supabase.storage
    .from("audio-responses")
    .createSignedUrl(path, 7776000);

  return res.status(200).json({
    signedUrl: data.signedUrl,
    path,
    token: data.token,
    downloadUrl: dlData?.signedUrl ?? null,
  });
}
