// POST /api/report/[id] — generate report via GPT-4o
// GET  /api/report/[id] — fetch existing report
import OpenAI from "openai";
import { supabase } from "../_supabase.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  const { id } = req.query; // interview id
  if (!id) return res.status(400).json({ error: "interview id required" });

  // ── GET: fetch existing report ──
  if (req.method === "GET") {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

    // Verify ownership
    const { data: interview } = await supabase
      .from("interviews")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (!interview) return res.status(404).json({ error: "Interview not found" });

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("interview_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Report not found" });
    return res.status(200).json(data);
  }

  // ── POST: trigger generation ──
  if (req.method === "POST") {
    // Auth check
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

    // Verify ownership
    const { data: interview } = await supabase
      .from("interviews")
      .select("id, title, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (!interview) return res.status(404).json({ error: "Interview not found" });

    // Idempotency: return existing generating report if already in progress
    const { data: existing } = await supabase
      .from("reports")
      .select("id, status")
      .eq("interview_id", id)
      .eq("status", "generating")
      .maybeSingle();
    if (existing) return res.status(409).json({ error: "Report generation already in progress", report_id: existing.id });

    // Create pending report record
    const { data: report, error: reportErr } = await supabase
      .from("reports")
      .insert({ interview_id: id, status: "generating" })
      .select()
      .single();
    if (reportErr) return res.status(500).json({ error: reportErr.message });

    // Fetch all completed sessions + voice transcripts + MC/Likert values
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, respondent, started_at, completed_at, responses(question_id, type, transcript, value, questions(content, order_num))")
      .eq("interview_id", id)
      .eq("status", "completed");

    if (!sessions || sessions.length === 0) {
      await supabase.from("reports").update({ status: "failed", content: { error: "No completed sessions" } }).eq("id", report.id);
      return res.status(422).json({ error: "No completed sessions to analyze" });
    }

    // Build prompt
    // Collect unique voice questions for per-question insights
    const voiceQMap = {};
    sessions.forEach(s => {
      (s.responses ?? []).forEach(r => {
        if (r.type === "voice" && r.question_id && r.questions?.content) {
          voiceQMap[r.question_id] = r.questions.content;
        }
      });
    });

    const transcriptBlock = sessions.map((s, si) => {
      const answers = (s.responses ?? [])
        .sort((a, b) => (a.questions?.order_num ?? 0) - (b.questions?.order_num ?? 0))
        .map(r => {
          const q = r.questions?.content ?? "질문";
          if (r.type === "voice") return `  Q[${r.question_id}]: ${q}\n  A: ${r.transcript ?? "(음성 응답 없음)"}`;
          if (r.type === "multiple_choice") return `  Q: ${q}\n  A: ${Array.isArray(r.value) ? r.value.join(", ") : r.value}`;
          if (r.type === "likert") return `  Q: ${q}\n  A: ${r.value}점`;
          return "";
        }).join("\n");
      const demo = [s.respondent?.gender, s.respondent?.age ? `${s.respondent.age}세` : null].filter(Boolean).join(", ");
      return `[패널 ${si + 1}${demo ? ` (${demo})` : ""}]\n${answers}`;
    }).join("\n\n");

    const voiceQList = Object.entries(voiceQMap).map(([id, content]) => `{ "questionId": "${id}", "question": ${JSON.stringify(content)} }`).join(",\n    ");

    const systemPrompt = `당신은 전문 UX 리서치 분석가입니다. 인터뷰 데이터를 분석하여 구조화된 인사이트를 JSON 형식으로 제공하세요.`;
    const userPrompt = `다음은 "${interview.title}" 인터뷰의 ${sessions.length}명 응답 데이터입니다:\n\n${transcriptBlock}\n\n아래 JSON 형식으로 분석해 주세요:\n{\n  "summary": "2-3문장 핵심 요약",\n  "themes": [\n    {\n      "label": "테마명",\n      "count": 언급횟수,\n      "sentiment": "positive|negative|neutral",\n      "quotes": ["대표 인용문 1", "대표 인용문 2"]\n    }\n  ],\n  "stats": {\n    "total_responses": 응답수,\n    "avg_completion_time": "평균 소요시간 추정"\n  },\n  "recommendations": [{ "title": "제안 제목", "detail": "2-3문장 상세 설명. 왜 이것이 중요한지, 어떻게 개선할 수 있는지 구체적으로 작성.", "priority": "high" }],\n  "demographicInsights": {\n    "summary": "인구통계 전반적 특징 1-2문장",\n    "groups": [{ "group": "남성", "trait": "이 그룹 응답자들의 주요 특징과 의견 패턴 요약" }]\n  },\n  "questionInsights": [\n    ${voiceQList ? voiceQList.replace(/\{[^}]+\}/g, (m) => m.replace("}", ', "insight": "이 질문에 대한 2-3문장 응답 요약 (응답자들이 공통적으로 언급한 내용, 패턴, 핵심 의견 중심으로 작성)" }')) : ''}\n  ]\n}\n\nquestionInsights의 각 insight는 해당 questionId 질문에 대한 응답자들의 발화를 종합한 2-3문장 요약입니다. 공통 패턴과 핵심 의견을 중심으로 작성하세요.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        timeout: 50000,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Empty response from GPT");
      const content = JSON.parse(raw);
      await supabase.from("reports").update({ status: "completed", content }).eq("id", report.id);
      return res.status(200).json({ report_id: report.id, status: "completed", content });
    } catch (e) {
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
