import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";
import { toFile } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable({ maxFileSize: 25 * 1024 * 1024 });
  const [, files] = await form.parse(req);
  const audioFile = files.audio?.[0];
  if (!audioFile) return res.status(400).json({ error: "audio file required" });

  const fileStream = fs.createReadStream(audioFile.filepath);
  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: await toFile(fileStream, audioFile.originalFilename || "audio.webm", { type: audioFile.mimetype }),
    language: "ko",
  });

  return res.status(200).json({ transcript: transcription.text });
}
