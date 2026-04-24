import OpenAI from "openai";
import { rateLimit, getIp } from "./_rateLimit.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit: 30 follow-up generations per minute per IP
  if (!rateLimit(`followup:${getIp(req)}`, 30)) {
    return res.status(429).json({ followup: null });
  }

  const { question_content, transcript, interview_title, session_id } = req.body;

  if (!question_content?.trim()) return res.status(400).json({ error: "question_content required" });
  if (!transcript?.trim() || transcript.trim().length < 10) {
    return res.status(400).json({ error: "transcript must be at least 10 characters" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content:
            "You are an expert qualitative researcher conducting a voice interview. Generate ONE concise, open-ended follow-up question (max 2 sentences) based on the respondent's answer. The follow-up should dig deeper into a specific point they mentioned. If the answer is complete and no follow-up is needed, respond with exactly: NO_FOLLOWUP. Respond ONLY with the follow-up question in Korean, nothing else.",
        },
        {
          role: "user",
          content: `인터뷰 주제: ${interview_title ?? "없음"}\n\n질문: ${question_content.trim()}\n\n응답자 답변: ${transcript.trim()}`,
        },
      ],
    });

    const text = completion.choices[0].message.content?.trim() ?? "";

    if (text === "NO_FOLLOWUP") return res.status(200).json({ followup: null });

    return res.status(200).json({ followup: text });
  } catch (e) {
    console.error("[followup]", e.message);
    return res.status(200).json({ followup: null });
  }
}
