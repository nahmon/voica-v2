// POST /api/interview — create interview + questions atomically
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function prewarmTts(supabase, questions) {
  const voiceQs = questions.filter(q => q.type === "voice" && q.content?.trim());
  await Promise.all(voiceQs.map(async (q) => {
    try {
      const mp3 = await openai.audio.speech.create({ model: "tts-1-hd", voice: "nova", input: q.content });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      const { error } = await supabase.storage.from("tts-cache").upload(`${q.id}.mp3`, buffer, { contentType: "audio/mpeg", upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("tts-cache").getPublicUrl(`${q.id}.mp3`);
        await supabase.from("questions").update({ tts_url: publicUrl }).eq("id", q.id);
      }
    } catch {}
  }));
}

function nanoid(len = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(len);
  return Array.from(bytes, b => chars[b % chars.length]).join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // Verify auth
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // ── PUT: update existing interview ──
  if (req.method === "PUT") {
    const { id, title, incentive, reward_amount, questions = [] } = req.body;
    if (!id || !title) return res.status(400).json({ error: "id and title required" });

    const { data: existing } = await supabase
      .from("interviews").select("id, share_code")
      .eq("id", id).eq("user_id", user.id).single();
    if (!existing) return res.status(403).json({ error: "Not found or access denied" });

    await supabase.from("interviews").update({ title, incentive: incentive ?? null, reward_amount: reward_amount ?? 0, status: "active" }).eq("id", id);

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
      const { data: newQs } = await supabase.from("questions").insert(
        incomingNew.map(q => ({
          interview_id: id,
          order_num: questions.indexOf(q) + 1,
          type: q.type, content: q.content, options: q.options ?? null,
        }))
      ).select("id, type, content");
      if (newQs?.length) prewarmTts(supabase, newQs);
    }
    // Also prewarm updated voice questions whose tts_url was cleared
    const updatedVoice = incomingWithDbId.filter(q => q.type === "voice");
    if (updatedVoice.length) {
      const { data: dbQs } = await supabase.from("questions").select("id, type, content, tts_url").in("id", updatedVoice.map(q => q.id));
      const needsRegen = dbQs?.filter(q => !q.tts_url) ?? [];
      if (needsRegen.length) prewarmTts(supabase, needsRegen);
    }
    return res.status(200).json({ share_code: existing.share_code });
  }

  const { title, description, incentive, reward_amount, questions = [] } = req.body;
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
    .insert({ user_id: user.id, title, description, incentive: incentive ?? null, reward_amount: reward_amount ?? 0, share_code, status: "active" })
    .select()
    .single();

  if (ivError) return res.status(500).json({ error: "인터뷰 생성에 실패했습니다." });

  // Insert questions if provided
  if (questions.length > 0) {
    const rows = questions.map((q, i) => ({
      interview_id: interview.id,
      order_num: i + 1,
      type: q.type,
      content: q.content,
      options: q.options ?? null,
    }));
    const { data: insertedQs, error: qError } = await supabase.from("questions").insert(rows).select("id, type, content");
    if (qError) return res.status(500).json({ error: qError.message });
    // Pre-generate TTS for all voice questions so participants hear audio immediately
    if (insertedQs?.length) await prewarmTts(supabase, insertedQs);
  }

  return res.status(201).json({ interview, share_code });
}
