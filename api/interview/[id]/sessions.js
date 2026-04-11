import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { id: interviewId } = req.query;
  if (!interviewId) return res.status(400).json({ error: "interviewId required" });

  // Verify researcher owns this interview via JWT
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid token" });

  const { data: interview, error: ivError } = await supabase
    .from("interviews")
    .select("id, title, status")
    .eq("id", interviewId)
    .eq("user_id", user.id)
    .single();
  if (ivError || !interview) return res.status(403).json({ error: "Interview not found or access denied" });

  // Fetch all sessions (service role bypasses RLS)
  const { data: sessions, error: sessError } = await supabase
    .from("sessions")
    .select("id, respondent, status, completed_at, created_at")
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: false });
  if (sessError) return res.status(500).json({ error: sessError.message });

  // Fetch all responses for all sessions in one query
  const sessionIds = (sessions ?? []).map(s => s.id);
  let responses = [];
  if (sessionIds.length > 0) {
    const { data: resp } = await supabase
      .from("responses")
      .select("*")
      .in("session_id", sessionIds);
    responses = resp ?? [];
  }

  return res.status(200).json({ interview, sessions: sessions ?? [], responses });
}
