import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { interview_id, respondent } = req.body;
    if (!interview_id) return res.status(400).json({ error: "interview_id required" });

    const { data, error } = await supabase
      .from("sessions")
      .insert({ interview_id, respondent: respondent ?? {}, status: "in_progress" })
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ session_id: data.id });
  }

  if (req.method === "PATCH") {
    const { session_id, status } = req.body;
    if (!session_id || !status) return res.status(400).json({ error: "session_id and status required" });
    if (!["completed", "abandoned"].includes(status)) {
      return res.status(400).json({ error: "status must be 'completed' or 'abandoned'" });
    }

    const patch = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("sessions")
      .update(patch)
      .eq("id", session_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
