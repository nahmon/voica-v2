import OpenAI from "openai";
import { rateLimit, getIp } from "./_rateLimit.js";
import { supabase } from "./_supabase.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit: 30 TTS calls per minute per IP
  const ip = getIp(req);
  if (!rateLimit(`tts:${ip}`, 30)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const { text, question_id } = req.body;
  if (!text || !question_id) return res.status(400).json({ error: "text and question_id required" });

  // Check cache — also validates question_id exists in DB
  const { data: q } = await supabase
    .from("questions")
    .select("tts_url")
    .eq("id", question_id)
    .single();

  // Reject unknown question IDs to prevent arbitrary TTS generation
  if (!q) return res.status(404).json({ error: "Question not found" });
  if (q.tts_url) return res.status(200).json({ url: q.tts_url });

  // Generate TTS
  const mp3 = await openai.audio.speech.create({ model: "tts-1-hd", voice: "nova", input: text });
  const buffer = Buffer.from(await mp3.arrayBuffer());

  // Upload to Storage
  const path = `${question_id}.mp3`;
  const { error: uploadError } = await supabase.storage
    .from("tts-cache")
    .upload(path, buffer, { contentType: "audio/mpeg", upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: { publicUrl } } = supabase.storage.from("tts-cache").getPublicUrl(path);

  // Update question cache
  await supabase.from("questions").update({ tts_url: publicUrl }).eq("id", question_id);

  return res.status(200).json({ url: publicUrl });
}
