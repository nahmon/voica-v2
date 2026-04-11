import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { session_id, question_id, type, value, audio_url, transcript } = req.body;
  if (!session_id || !question_id || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Verify session is valid and in progress before accepting responses
  const { data: session } = await supabase
    .from("sessions")
    .select("id, status, interview_id")
    .eq("id", session_id)
    .single();
  if (!session || session.status !== "in_progress") {
    return res.status(403).json({ error: "Invalid or already completed session" });
  }

  // Verify question belongs to the session's interview
  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("id", question_id)
    .eq("interview_id", session.interview_id)
    .single();
  if (!question) {
    return res.status(400).json({ error: "Invalid question for this session" });
  }

  const { error } = await supabase.from("responses").insert({
    session_id,
    question_id,
    type,
    value: value ?? null,
    audio_url: audio_url ?? null,
    transcript: transcript ?? null,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ ok: true });
}
