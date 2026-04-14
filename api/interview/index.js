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
  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify auth
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // ── PUT: update existing interview ──
  if (req.method === "PUT") {
    const { id, title, incentive, questions = [] } = req.body;
    if (!id || !title) return res.status(400).json({ error: "id and title required" });

    const { data: existing } = await supabase
      .from("interviews").select("id, share_code")
      .eq("id", id).eq("user_id", user.id).single();
    if (!existing) return res.status(403).json({ error: "Not found or access denied" });

    await supabase.from("interviews").update({ title, incentive: incentive ?? null }).eq("id", id);

    // Get current question IDs in DB
    const { data: currentQs } = await supabase
      .from("questions").select("id").eq("interview_id", id);
    const currentIds = new Set((currentQs ?? []).map(q => q.id));

    const incomingWithDbId = questions.filter(q => q.id && currentIds.has(q.id));
    const incomingNew = questions.filter(q => !q.id || !currentIds.has(q.id));
    const keepIds = new Set(incomingWithDbId.map(q => q.id));
    const toDelete = [...currentIds].filter(id => !keepIds.has(id));

    if (toDelete.length > 0) {
      await supabase.from("questions").delete().in("id", toDelete);
    }
    for (const q of incomingWithDbId) {
      await supabase.from("questions").update({
        order_num: questions.indexOf(q) + 1,
        type: q.type, content: q.content, options: q.options ?? null,
      }).eq("id", q.id);
    }
    if (incomingNew.length > 0) {
      await supabase.from("questions").insert(
        incomingNew.map(q => ({
          interview_id: id,
          order_num: questions.indexOf(q) + 1,
          type: q.type, content: q.content, options: q.options ?? null,
        }))
      );
    }
    return res.status(200).json({ share_code: existing.share_code });
  }

  const { title, description, incentive, questions = [] } = req.body;
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
    .insert({ user_id: user.id, title, description, incentive: incentive ?? null, share_code, status: "active" })
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
