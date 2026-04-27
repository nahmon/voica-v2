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
  if (question_content.length > 500) return res.status(400).json({ error: "question_content too long" });
  if (!transcript?.trim() || transcript.trim().length < 10) {
    return res.status(400).json({ error: "transcript must be at least 10 characters" });
  }
  if (transcript.length > 3000) return res.status(400).json({ error: "transcript too long" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content:
            "당신은 숙련된 정성조사 인터뷰어입니다. 응답자의 답변을 바탕으로 자연스러운 후속 질문 하나를 생성하세요.\n\n규칙:\n- 응답자가 언급한 구체적인 내용을 짚어 더 깊이 파고드세요\n- 인터뷰어가 실제로 말하듯 자연스러운 구어체 한국어로 작성하세요\n- 한 문장으로 간결하게, 35자 이내로 작성하세요\n- 답변이 충분히 완결되어 추가 질문이 불필요하면 정확히 NO_FOLLOWUP 라고만 답하세요\n- 후속 질문 텍스트만 출력하고 다른 말은 일절 하지 마세요",
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
