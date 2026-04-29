// POST /api/interview — create interview + questions atomically
import OpenAI from "openai";
import { supabase } from "../_supabase.js";
import { rateLimit, getIp } from "../_rateLimit.js";
import { nanoid } from "../lib/nanoid.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function prewarmTts(supabase, questions) {
  const voiceQs = questions.filter(q => q.type === "voice" && q.content?.trim());
  await Promise.all(voiceQs.map(async (q) => {
    try {
      const mp3 = await openai.audio.speech.create({ model: "tts-1-hd", voice: "shimmer", input: q.content });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      const { error } = await supabase.storage.from("tts-cache").upload(`${q.id}.mp3`, buffer, { contentType: "audio/mpeg", upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("tts-cache").getPublicUrl(`${q.id}.mp3`);
        await supabase.from("questions").update({ tts_url: publicUrl }).eq("id", q.id);
      }
    } catch (e) {
      console.error("[prewarmTts] failed for q=", q.id, e.message);
    }
  }));
}


export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!await rateLimit(`interview-write:${getIp(req)}`, 30)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  // Verify auth
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // ── PUT: update existing interview ──
  if (req.method === "PUT") {
    const { id, title, incentive, reward_amount, slack_webhook_url, questions = [] } = req.body;
    if (!id || !title) return res.status(400).json({ error: "id and title required" });

    const { data: existing } = await supabase
      .from("interviews").select("id, share_code")
      .eq("id", id).eq("user_id", user.id).single();
    if (!existing) return res.status(403).json({ error: "Not found or access denied" });

    const interviewUpdate = { title, incentive: incentive ?? null, expert_only: req.body.expert_only ?? false, status: "active" };
    if (slack_webhook_url !== undefined) interviewUpdate.slack_webhook_url = slack_webhook_url || null;
    if (reward_amount !== undefined) interviewUpdate.reward_amount = reward_amount;
    await supabase.from("interviews").update(interviewUpdate).eq("id", id);

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
    if (incomingWithDbId.length > 0) {
      const upsertData = incomingWithDbId.map(q => {
        const upd = { id: q.id, order_num: questions.indexOf(q) + 1, type: q.type, content: q.content };
        if (q.options != null) upd.options = q.options;
        if (q.stimulus != null) upd.stimulus = q.stimulus;
        if (q.followup_enabled === false) upd.followup_enabled = false;
        return upd;
      });
      await supabase.from("questions").upsert(upsertData);
    }
    if (incomingNew.length > 0) {
      const { data: newQs } = await supabase.from("questions").insert(
        incomingNew.map(q => {
          const row = { interview_id: id, order_num: questions.indexOf(q) + 1, type: q.type, content: q.content };
          if (q.options != null) row.options = q.options;
          if (q.stimulus != null) row.stimulus = q.stimulus;
          if (q.followup_enabled === false) row.followup_enabled = false;
          return row;
        })
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

  const { title, description, incentive, reward_amount, expert_only, questions = [] } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });

  // Generate unique share_code
  let share_code;
  for (let attempts = 0; attempts < 5; attempts++) {
    const candidate = nanoid(8);
    const { data } = await supabase.from("interviews").select("id").eq("share_code", candidate).maybeSingle();
    if (!data) { share_code = candidate; break; }
  }
  if (!share_code) return res.status(500).json({ error: "Failed to generate unique share code. Please try again." });

  // Create interview
  const { data: interview, error: ivError } = await supabase
    .from("interviews")
    .insert({ user_id: user.id, title, description, incentive: incentive ?? null, expert_only: expert_only ?? false, share_code, status: "active" })
    .select()
    .single();

  if (ivError) {
    console.error("[interview] insert error:", ivError.code, ivError.message, ivError.details);
    return res.status(500).json({ error: "인터뷰 생성에 실패했습니다." });
  }

  // Insert questions if provided
  if (questions.length > 0) {
    const rows = questions.map((q, i) => {
      const row = { interview_id: interview.id, order_num: i + 1, type: q.type, content: q.content };
      if (q.options != null) row.options = q.options;
      if (q.stimulus != null) row.stimulus = q.stimulus;
      if (q.followup_enabled === false) row.followup_enabled = false;
      return row;
    });
    const { data: insertedQs, error: qError } = await supabase.from("questions").insert(rows).select("id, type, content");
    if (qError) {
      console.error("[interview] questions insert error:", qError.code, qError.message, qError.details);
      return res.status(500).json({ error: qError.message });
    }
    // Pre-generate TTS for all voice questions so participants hear audio immediately
    if (insertedQs?.length) {
      Promise.race([
        prewarmTts(supabase, insertedQs),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000))
      ]).catch((e) => console.warn("[prewarmTts]", e.message));
    }
  }

  return res.status(201).json({ interview, share_code });
}
