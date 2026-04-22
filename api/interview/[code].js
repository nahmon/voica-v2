import { supabase } from "../_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "share_code required" });

  // First check if interview exists at all (regardless of status)
  const { data: anyInterview, error: anyError } = await supabase
    .from("interviews")
    .select("id, status")
    .eq("share_code", code)
    .single();

  if (anyError || !anyInterview) {
    console.error("Interview not found:", code, anyError?.message);
    return res.status(404).json({ error: "Interview not found", code });
  }

  if (anyInterview.status !== "active") {
    console.error("Interview not active:", code, anyInterview.status);
    return res.status(404).json({ error: "Interview not active", status: anyInterview.status });
  }

  const { data: interview, error } = await supabase
    .from("interviews")
    .select("id, title, description, share_code, status, questions(id, order_num, type, content, options, tts_url)")
    .eq("share_code", code)
    .single();

  if (error || !interview) {
    console.error("Interview fetch error:", error?.message);
    return res.status(500).json({ error: "Failed to load interview" });
  }

  if (!interview.questions || interview.questions.length === 0) {
    return res.status(422).json({ error: "This interview has no questions" });
  }

  interview.questions.sort((a, b) => a.order_num - b.order_num);

  return res.status(200).json(interview);
}
