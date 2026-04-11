import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, question_id } = req.body;
  if (!text || !question_id) return res.status(400).json({ error: "text and question_id required" });

  // Check cache
  const { data: q } = await supabase
    .from("questions")
    .select("tts_url")
    .eq("id", question_id)
    .single();
  if (q?.tts_url) return res.status(200).json({ url: q.tts_url });

  // Generate TTS
  const mp3 = await openai.audio.speech.create({ model: "tts-1", voice: "nova", input: text });
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
