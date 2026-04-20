import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp } from "./_rateLimit.js";

const ALLOWED_AUDIO_EXT = new Set(["webm", "mp3", "ogg", "wav", "m4a", "mp4"]);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit: 30 upload URL requests per minute per IP
  if (!rateLimit(`upload:${getIp(req)}`, 30)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const { sessionId, questionId, ext } = req.body;
  if (!sessionId || !questionId || !ext) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Allowlist audio extensions only
  if (!ALLOWED_AUDIO_EXT.has(ext.toLowerCase())) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  // Verify session is active before issuing upload URL
  const { data: session } = await supabase
    .from("sessions")
    .select("id, status")
    .eq("id", sessionId)
    .single();
  if (!session || session.status !== "in_progress") {
    return res.status(403).json({ error: "Invalid or completed session" });
  }

  const path = `${sessionId}/${questionId}.${ext.toLowerCase()}`;

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
