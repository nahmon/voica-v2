import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp } from "./_rateLimit.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit: 10 AI generations per minute per IP
  if (!rateLimit(`genq:${getIp(req)}`, 10)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  // Auth required — only authenticated researchers may generate questions
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: "prompt required" });
  if (prompt.length > 600) return res.status(400).json({ error: "prompt too long" });

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: `You are an expert UX researcher and voice interview designer. Create professional interview question sets in Korean. Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Research goal: ${prompt.trim()}

Generate 10-12 interview questions as JSON: { "questions": [...] }

Each question object:
- "type": "voice" | "multiple_choice" | "likert"
- "content": question text in Korean, conversational tone, max 150 chars
- "options": array of 3-5 Korean strings for multiple_choice only; omit for voice/likert

Structure:
1. 2-3 multiple_choice (warm-up: role, usage frequency, relevant context)
2. 1 likert (satisfaction or importance rating)
3. 5-6 voice (open-ended, experiential — ask for stories and specifics, not yes/no)
4. 1-2 multiple_choice (preferences or choices)
5. 1 final voice (open reflection or wish)

Make questions specific to the research goal. Voice questions should invite storytelling.`,
        },
      ],
    });
  } catch (e) {
    console.error("[generate-questions] OpenAI error:", e?.message);
    const msg = e?.status === 429 ? "AI 할당량 초과. 잠시 후 다시 시도해주세요." : "AI 서비스 연결 실패. 잠시 후 다시 시도해주세요.";
    return res.status(502).json({ error: msg });
  }

  let questions;
  try {
    const parsed = JSON.parse(completion.choices[0].message.content);
    questions = Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
  } catch {
    return res.status(500).json({ error: "AI 응답 파싱 실패" });
  }

  if (!questions.length) return res.status(500).json({ error: "질문 생성 실패" });

  return res.status(200).json({ questions });
}
