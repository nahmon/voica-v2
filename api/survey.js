import { supabase } from "./_supabase.js";
import { rateLimit, getIp } from "./_rateLimit.js";

export default async function handler(req, res) {
  const resource = req.query.resource;
  const ip = getIp(req);

  if (!rateLimit(`survey:${ip}`, 60)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  // Session create (POST) and update (PATCH)
  if (resource === "session") {
    if (req.method === "POST") {
      const { interview_id, respondent } = req.body;
      if (!interview_id) return res.status(400).json({ error: "interview_id required" });

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

      const { data: session } = await supabase
        .from("sessions")
        .select("id, interview_id")
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

  // Response save
  if (resource === "response" && req.method === "POST") {
    const { session_id, question_id, type, value, audio_url, transcript } = req.body;
    if (!session_id || !question_id || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("id, status, interview_id")
      .eq("id", session_id)
      .single();
    if (!session || session.status !== "in_progress") {
      return res.status(403).json({ error: "Invalid or already completed session" });
    }

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

    if (error) return res.status(500).json({ error: "응답 저장에 실패했습니다." });
    return res.status(201).json({ ok: true });
  }

  return res.status(400).json({ error: "resource and valid method required" });
}
