// POST /api/report/[id] — generate report via GPT-4o
// GET  /api/report/[id] — fetch existing report
import OpenAI from "openai";
import { supabase } from "../_supabase.js";
import { rateLimit, getIp } from "../_rateLimit.js";

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

    if (error) return res.status(500).json({ error: "Failed to fetch report" });
    if (!data) return res.status(404).json({ error: "Report not found" });
    return res.status(200).json(data);
  }

  // ── POST: trigger generation ──
  if (req.method === "POST") {
    // [Medium] Rate limit report generation to prevent GPT API cost abuse
    if (!rateLimit(`report-generate:${getIp(req)}`, 5)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

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

    // [Medium] Sanitize title before inserting into prompt to prevent prompt injection
    const safeTitle = String(interview.title ?? "").slice(0, 200).replace(/[`"\\]/g, " ").replace(/[\r\n]/g, " ");

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
    if (reportErr) return res.status(500).json({ error: "Failed to create report record" });

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

    const systemPrompt = `당신은 15년 경력의 시니어 UX 리서치 전문가입니다. Fortune 500 기업의 제품 전략 수립에 활용되는 수준의 인터뷰 분석 리포트를 작성합니다.

분석 원칙:
- 데이터에서 발견한 사실만 기술하고, 근거 없는 추론은 배제합니다.
- 수치와 비율을 명시합니다 (예: "응답자 7명 중 5명", "전체의 62%").
- 응답자의 실제 발언을 인용해 인사이트를 뒷받침합니다.
- 다수 의견과 이탈 케이스(소수 의견)를 모두 포착합니다.
- 경영진이 즉시 의사결정에 활용할 수 있는 수준으로 작성합니다.`;

    const userPrompt = `다음은 "${safeTitle}" 인터뷰의 응답 데이터입니다. 총 ${sessions.length}명이 참여했습니다.

=== 응답 데이터 ===
${transcriptBlock}
=== 응답 데이터 끝 ===

아래 JSON 스키마를 정확히 따라 분석 결과를 출력하세요:

{
  "summary": "경영진 브리핑 수준의 요약. 다음 세 가지를 반드시 불렛(•)으로 구분하여 작성: • 핵심 발견 1 (가장 중요한 패턴, 수치 포함) • 핵심 발견 2 (두 번째 중요한 발견, 수치 포함) • 핵심 발견 3 (시사점 또는 주목할 이탈 케이스)",

  "themes": [
    {
      "label": "테마명 (5자 내외, 명확하게)",
      "count": 이 테마를 언급한 응답자 수(숫자),
      "sentiment": "positive|negative|neutral (전체 감성 방향)",
      "sentiment_breakdown": {
        "positive": 긍정적으로 언급한 응답자 수,
        "negative": 부정적으로 언급한 응답자 수,
        "neutral": 중립적으로 언급한 응답자 수
      },
      "key_quote": "이 테마를 가장 잘 대표하는 응답자의 실제 발언 (원문 그대로)",
      "quotes": ["두 번째 대표 발언", "세 번째 대표 발언 (있는 경우)"]
    }
  ],

  "stats": {
    "total_responses": ${sessions.length},
    "avg_completion_time": "세션 시작~완료 시간 기반 추정값 (예: 약 8분)"
  },

  "recommendations": [
    {
      "title": "즉각 조치 필요: 구체적 행동 제목",
      "detail": "응답자 X명 중 Y명(Z%)이 언급한 [구체적 문제]로 인해 [결과]가 발생하고 있습니다. 대표 발언: '[실제 인용]'. 즉시 [구체적 액션]을 실행하세요.",
      "priority": "high"
    },
    {
      "title": "단기 개선: 구체적 행동 제목",
      "detail": "N명의 응답에서 [패턴]이 반복 확인되었습니다. 특히 [세그먼트]에서 두드러지며, [수치 기반 근거]. [구체적 방법론]을 통해 개선을 권장합니다.",
      "priority": "mid"
    },
    {
      "title": "장기 전략: 구체적 행동 제목",
      "detail": "[장기적 기회 또는 위험]. 현재 데이터에서 [관련 신호]가 감지되었으며, [전략적 제안]을 통해 [기대 효과]를 달성할 수 있습니다.",
      "priority": "low"
    }
  ],

  "demographicInsights": {
    "summary": "인구통계 분포와 그에 따른 의견 차이를 1-2문장으로 요약",
    "groups": [
      {
        "group": "그룹명 (예: 20대 여성, 남성)",
        "trait": "이 그룹의 응답 패턴과 특징적 의견. 다른 그룹과의 차이점 포함."
      }
    ]
  },

  "questionInsights": [
    ${voiceQList ? voiceQList.replace(/\{[^}]+\}/g, (m) => m.replace("}", `, "insight": "4-5문장 심층 분석: (1) 응답자들이 공통적으로 언급한 주요 패턴과 비율 (예: N명 중 M명이). (2) 그 패턴의 원인 또는 맥락. (3) 이탈 케이스나 소수 의견이 있다면 명시. (4) 대표 발언을 직접 인용하여 뒷받침. (5) 이 질문 결과가 시사하는 UX/비즈니스 함의." }`)) : ''}
  ]
}

중요 지침:
- questionInsights.insight는 반드시 4-5문장으로 작성합니다. 해당 질문에 대한 발화만 분석하세요.
- recommendations.detail에는 반드시 실제 응답자 수치(X명 중 Y명, Z%)를 포함하세요.
- summary는 반드시 세 개의 불렛(•)으로 구성하세요.
- themes.key_quote는 응답자의 원문 발언을 그대로 인용하세요 (요약 금지).
- 모든 수치는 실제 데이터에서 계산한 값이어야 합니다.`;


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

      // [High] Catch JSON.parse errors separately to avoid leaking GPT raw output
      let content;
      try {
        content = JSON.parse(raw);
      } catch (parseErr) {
        console.error("[report] GPT response parse error:", parseErr.message);
        await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
        return res.status(500).json({ error: "Failed to parse analysis result" });
      }

      await supabase.from("reports").update({ status: "completed", content }).eq("id", report.id);
      return res.status(200).json({ report_id: report.id, status: "completed", content });
    } catch (e) {
      console.error("[report] GPT error:", e.message);
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      // [High] Do not expose internal error messages to the client
      return res.status(500).json({ error: "Report generation failed. Please try again." });
    }
  }

  // ── PATCH: generate or revoke public_report_token ──
  if (req.method === "PATCH") {
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

    // Must have a completed report to share
    const { data: report } = await supabase
      .from("reports")
      .select("id")
      .eq("interview_id", id)
      .eq("status", "completed")
      .maybeSingle();
    if (!report) return res.status(422).json({ error: "No completed report to share" });

    const { action } = req.body ?? {};

    if (action === "revoke") {
      const { error: updateErr } = await supabase
        .from("interviews")
        .update({ public_report_token: null })
        .eq("id", id);
      if (updateErr) return res.status(500).json({ error: "Failed to revoke public link" });
      return res.status(200).json({ public_report_token: null });
    }

    if (action !== undefined && action !== null && action !== "generate") {
      return res.status(400).json({ error: "Invalid action. Use 'revoke' or omit for generate." });
    }

    // Generate a 12-char URL-safe token using Node built-in crypto
    const { randomBytes } = await import("crypto");
    const publicToken = randomBytes(16).toString("base64url").slice(0, 16);

    const { error: updateErr } = await supabase
      .from("interviews")
      .update({ public_report_token: publicToken })
      .eq("id", id);
    if (updateErr) return res.status(500).json({ error: "Failed to generate public link" });

    return res.status(200).json({ public_report_token: publicToken });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
