import { supabase } from "./_supabase.js";
import { rateLimit, getIp } from "./_rateLimit.js";

const ALLOWED_AUDIO_EXT = new Set(["webm", "mp3", "ogg", "wav", "m4a", "mp4"]);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

    const { response_id } = req.query;
    if (!response_id) return res.status(400).json({ error: "response_id required" });

    const { data: response, error } = await supabase
      .from("responses")
      .select("id, audio_url, session:sessions(interview:interviews(user_id))")
      .eq("id", response_id)
      .single();

    if (error || !response) return res.status(404).json({ error: "Response not found" });
    if (response.session?.interview?.user_id !== user.id) return res.status(403).json({ error: "Forbidden" });
    if (!response.audio_url) return res.status(404).json({ error: "No audio for this response" });

    const match = response.audio_url.match(/\/audio-responses\/(.+?)(\?|$)/);
    if (!match) return res.status(400).json({ error: "Could not extract storage path" });

    const storagePath = decodeURIComponent(match[1]);

    // [High] Prevent path traversal in extracted storage path
    if (storagePath.includes("..") || storagePath.startsWith("/")) {
      return res.status(400).json({ error: "Invalid storage path" });
    }
    const { data: signedData, error: signError } = await supabase.storage
      .from("audio-responses")
      .createSignedUrl(storagePath, 3600);

    if (signError || !signedData) return res.status(500).json({ error: "Failed to create signed URL" });
    return res.status(200).json({ audio_url: signedData.signedUrl });
  }

  if (req.method === "POST") {
    if (!rateLimit(`upload:${getIp(req)}`, 30)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    const { sessionId, questionId, ext } = req.body;
    if (!sessionId || !questionId || !ext) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!ALLOWED_AUDIO_EXT.has(ext.toLowerCase())) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    // [High] Prevent path traversal: sessionId and questionId must be safe identifiers
    const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
    if (!SAFE_ID_RE.test(sessionId) || !SAFE_ID_RE.test(questionId)) {
      return res.status(400).json({ error: "Invalid sessionId or questionId format" });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("id, status, interview_id, interviews(user_id)")
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
      return res.status(500).json({ error: "Failed to create upload URL" });
    }

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

  return res.status(405).json({ error: "Method not allowed" });
}
