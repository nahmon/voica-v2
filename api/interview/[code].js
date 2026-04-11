import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "share_code required" });

  const { data: interview, error } = await supabase
    .from("interviews")
    .select("id, title, description, share_code, status, questions(id, order_num, type, content, options, tts_url)")
    .eq("share_code", code)
    .eq("status", "active")
    .single();

  if (error || !interview) return res.status(404).json({ error: "Interview not found" });

  interview.questions.sort((a, b) => a.order_num - b.order_num);

  return res.status(200).json(interview);
}
