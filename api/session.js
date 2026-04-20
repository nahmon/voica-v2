import { supabase } from "./_supabase.js";
import { rateLimit, getIp } from "./_rateLimit.js";

export default async function handler(req, res) {
  // Rate limit: 30 session operations per minute per IP
  if (!rateLimit(`sess:${getIp(req)}`, 30)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  if (req.method === "POST") {
    const { interview_id, respondent } = req.body;
    if (!interview_id) return res.status(400).json({ error: "interview_id required" });

    // Verify interview exists and is active before creating a session
    const { data: interview } = await supabase
      .from("interviews")
      .select("id, status")
      .eq("id", interview_id)
      .single();
    if (!interview || interview.status !== "active") {
      return res.status(403).json({ error: "Interview not found or not accepting responses" });
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({ interview_id, respondent: respondent ?? {}, status: "in_progress" })
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: "세션 생성에 실패했습니다." });
    return res.status(201).json({ session_id: data.id });
  }

  if (req.method === "PATCH") {
    const { session_id, status } = req.body;
    if (!session_id || !status) return res.status(400).json({ error: "session_id and status required" });
    if (!["completed", "abandoned"].includes(status)) {
      return res.status(400).json({ error: "status must be 'completed' or 'abandoned'" });
    }

    // Verify session exists before updating
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", session_id)
      .single();
    if (!session) return res.status(404).json({ error: "Session not found" });

    const patch = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("sessions")
      .update(patch)
      .eq("id", session_id);

    if (error) return res.status(500).json({ error: "세션 업데이트에 실패했습니다." });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
