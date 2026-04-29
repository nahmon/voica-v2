import { supabase } from "../_supabase.js";
import { rateLimit, getIp } from "../_rateLimit.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!await rateLimit(`interview:${getIp(req)}`, 30)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "share_code required" });

  // Single query — fetch full interview with status check
  const { data: interview, error } = await supabase
    .from("interviews")
    .select("id, title, description, share_code, status, questions(id, order_num, type, content, options, tts_url)")
    .eq("share_code", code)
    .single();

  if (error || !interview) {
    return res.status(404).json({ error: "Interview not found", code });
  }

  if (interview.status !== "active") {
    return res.status(404).json({ error: "Interview not active", status: interview.status });
  }

  if (!interview.questions || interview.questions.length === 0) {
    return res.status(422).json({ error: "This interview has no questions" });
  }

  interview.questions.sort((a, b) => a.order_num - b.order_num);

  return res.status(200).json(interview);
}
