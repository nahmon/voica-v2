import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";
import { toFile } from "openai";
import { rateLimit, getIp } from "./_rateLimit.js";
import { supabase } from "./_supabase.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { api: { bodyParser: false } };

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const type = req.query.type;
  const ip = getIp(req);

  if (type === "stt") {
    if (!rateLimit(`stt:${ip}`, 20)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    const form = formidable({ maxFileSize: 25 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);

    const sessionId = fields.session_id?.[0];
    if (!sessionId) return res.status(400).json({ error: "session_id required" });

    const { data: session } = await supabase
      .from("sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();
    if (!session || session.status !== "in_progress") {
      return res.status(403).json({ error: "Invalid or completed session" });
    }

    const audioFile = files.audio?.[0];
    if (!audioFile) return res.status(400).json({ error: "audio file required" });

    const fileStream = fs.createReadStream(audioFile.filepath);
    try {
      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: await toFile(fileStream, "audio.webm", { type: "audio/webm" }),
        language: "ko",
      });
      return res.status(200).json({ transcript: transcription.text });
    } catch (e) {
      console.error("[speech/stt]", e.message);
      return res.status(500).json({ error: "음성 인식에 실패했습니다. 다시 시도해 주세요." });
    }
  }

  if (type === "tts") {
    if (!rateLimit(`tts:${ip}`, 30)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    let body;
    try { body = await parseJsonBody(req); } catch { return res.status(400).json({ error: "Invalid JSON" }); }

    const { text, question_id } = body;
    if (!text) return res.status(400).json({ error: "text required" });
    if (text.length > 1000) return res.status(400).json({ error: "text too long" });

    // No question_id = bridge phrase, skip cache
    if (!question_id) {
      const session_id = body.session_id ?? req.query.session_id;
      if (session_id) {
        const { data: bridgeSession } = await supabase
          .from("sessions")
          .select("id, status")
          .eq("id", session_id)
          .single();
        if (!bridgeSession || bridgeSession.status !== "in_progress") {
          return res.status(403).json({ error: "Invalid or completed session" });
        }
      }
      const mp3 = await openai.audio.speech.create({ model: "tts-1-hd", voice: "shimmer", input: text });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      return res.status(200).json({ url: `data:audio/mpeg;base64,${buffer.toString("base64")}` });
    }

    const { data: q } = await supabase
      .from("questions")
      .select("tts_url")
      .eq("id", question_id)
      .single();

    if (!q) return res.status(404).json({ error: "Question not found" });
    if (q.tts_url) return res.status(200).json({ url: q.tts_url });

    const mp3 = await openai.audio.speech.create({ model: "tts-1-hd", voice: "shimmer", input: text });
    const buffer = Buffer.from(await mp3.arrayBuffer());

    const path = `${question_id}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("tts-cache")
      .upload(path, buffer, { contentType: "audio/mpeg", upsert: true });
    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from("tts-cache").getPublicUrl(path);
    await supabase.from("questions").update({ tts_url: publicUrl }).eq("id", question_id);

    return res.status(200).json({ url: publicUrl });
  }

  return res.status(400).json({ error: "type must be stt or tts" });
}
