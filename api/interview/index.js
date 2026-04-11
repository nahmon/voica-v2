// POST /api/interview — create interview + questions atomically
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function nanoid(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify auth
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { title, description, questions = [] } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });

  // Generate unique share_code
  let share_code, attempts = 0;
  do {
    share_code = nanoid(8);
    const { data } = await supabase.from("interviews").select("id").eq("share_code", share_code).maybeSingle();
    if (!data) break;
    attempts++;
  } while (attempts < 5);

  // Create interview
  const { data: interview, error: ivError } = await supabase
    .from("interviews")
    .insert({ user_id: user.id, title, description, share_code, status: "active" })
    .select()
    .single();

  if (ivError) return res.status(500).json({ error: ivError.message });

  // Insert questions if provided
  if (questions.length > 0) {
    const rows = questions.map((q, i) => ({
      interview_id: interview.id,
      order_num: i + 1,
      type: q.type,
      content: q.content,
      options: q.options ?? null,
    }));
    const { error: qError } = await supabase.from("questions").insert(rows);
    if (qError) return res.status(500).json({ error: qError.message });
  }

  return res.status(201).json({ interview, share_code });
}
