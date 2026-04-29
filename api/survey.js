import { supabase } from "./_supabase.js";
import { sendSlack } from "./lib/slack.js";
import { rateLimit, getIp } from "./_rateLimit.js";

function calcQualityScore(session, responses) {
  if (!responses.length) return 0;

  let score = 100;
  const voiceResponses = responses.filter(r => r.type === "voice");

  // 1. Response length penalty (skip if no voice questions in this interview)
  if (voiceResponses.length > 0) {
    const avgLen = voiceResponses.reduce((sum, r) => sum + (r.transcript?.trim().length ?? 0), 0) / voiceResponses.length;
    if (avgLen < 10) score -= 40;
    else if (avgLen < 30) score -= 20;
    else if (avgLen < 60) score -= 10;
  }

  // 2. Completion time penalty (too fast = suspicious)
  if (session.started_at && session.completed_at) {
    const durationMs = new Date(session.completed_at) - new Date(session.started_at);
    const durationMin = durationMs / 60000;
    if (durationMin < 1) score -= 30;
    else if (durationMin < 2) score -= 15;
  }

  // 3. Meaningless response detection
  const junkPatterns = /^[ㄱ-ㅎㅏ-ㅣ\s.]{1,5}$|^(모름|없음|없어요|네|아니요|ㅇ|ㄴ)$/;
  const junkCount = voiceResponses.filter(r => junkPatterns.test(r.transcript?.trim() ?? "")).length;
  if (junkCount > 0) score -= junkCount * 15;

  // 4. Completion bonus
  if (responses.length >= 3) score += 5;

  return Math.max(0, Math.min(100, score));
}

export default async function handler(req, res) {
  const resource = req.query.resource;
  const ip = getIp(req);

  if (!await rateLimit(`survey:${ip}`, 60)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  // Interview meta fetch (GET) — used by ConsentScreen to check expert_only
  if (resource === "interview" && req.method === "GET") {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "code required" });
    const { data, error } = await supabase
      .from("interviews")
      .select("id, title, expert_only, status")
      .eq("share_code", code)
      .single();
    if (error || !data) return res.status(404).json({ error: "Interview not found" });
    return res.status(200).json({ id: data.id, title: data.title, expert_only: data.expert_only ?? false, status: data.status });
  }

  // Session create (POST) and update (PATCH)
  if (resource === "session") {
    if (req.method === "POST") {
      const { interview_id, respondent } = req.body;
      if (!interview_id) return res.status(400).json({ error: "interview_id required" });

      const { data: interview } = await supabase
        .from("interviews")
        .select("id, status")
        .eq("id", interview_id)
        .single();
      if (!interview || interview.status !== "active") {
        return res.status(403).json({ error: "Interview not found or not accepting responses" });
      }

      const { data, error } = await supabase
        .from("sessions")
        .insert({ interview_id, respondent: respondent ?? {}, status: "in_progress" })
        .select("id")
        .single();

      if (error) return res.status(500).json({ error: "세션 생성에 실패했습니다." });
      return res.status(201).json({ session_id: data.id });
    }

    if (req.method === "PATCH") {
      const { session_id, status } = req.body;
      if (!session_id || !status) return res.status(400).json({ error: "session_id and status required" });
      if (!["completed", "abandoned"].includes(status)) {
        return res.status(400).json({ error: "status must be 'completed' or 'abandoned'" });
      }

      const { data: session } = await supabase
        .from("sessions")
        .select("id, status, interview_id, started_at, completed_at, interviews(reward_amount, slack_webhook_url, title)")
        .eq("id", session_id)
        .single();
      if (!session) return res.status(404).json({ error: "Session not found" });

      // [High] Prevent replaying completed/abandoned sessions
      if (session.status !== "in_progress") {
        return res.status(409).json({ error: "Session is already finalized" });
      }

      const patch = { status };
      if (status === "completed") {
        patch.completed_at = new Date().toISOString();

        // Calculate quality score (0-100)
        try {
          const { data: sessionResponses } = await supabase
            .from("responses")
            .select("type, transcript, value")
            .eq("session_id", session_id);

          const sessionWithCompletion = { ...session, completed_at: patch.completed_at };
          patch.quality_score = calcQualityScore(sessionWithCompletion, sessionResponses ?? []);
        } catch (_) {
          // quality_score 계산 실패해도 세션 완료는 정상 처리
        }
      }

      const { error } = await supabase
        .from("sessions")
        .update(patch)
        .eq("id", session_id);

      if (error) return res.status(500).json({ error: "세션 업데이트에 실패했습니다." });

      // Auto-create reward record when interview has reward_amount set
      if (status === "completed") {
        const rewardAmount = session.interviews?.reward_amount ?? 0;
        if (rewardAmount > 0) {
          await supabase.from("participant_rewards").upsert({
            session_id,
            interview_id: session.interview_id,
            amount: rewardAmount,
            currency: "KRW",
            status: "pending",
          }, { onConflict: "session_id", ignoreDuplicates: true });
        }
      }

      // Slack notification on session completion
      const webhookUrl = session.interviews?.slack_webhook_url;
      const interviewTitle = session.interviews?.title ?? "인터뷰";
      await sendSlack(webhookUrl, `✅ 새 응답이 도착했어요!\n📋 인터뷰: ${interviewTitle}\n🔗 세션 ID: ${session_id}`);

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  }

  // Response save
  if (resource === "response" && req.method === "POST") {
    const { session_id, question_id, type, value, audio_url, transcript } = req.body;
    if (!session_id || !question_id || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // [Low] Validate response type to prevent unexpected values being stored
    const VALID_RESPONSE_TYPES = new Set(["voice", "multiple_choice", "likert", "creative", "prototype"]);
    if (!VALID_RESPONSE_TYPES.has(type)) {
      return res.status(400).json({ error: "type must be one of: voice, multiple_choice, likert, creative, prototype" });
    }
    if (transcript != null && (typeof transcript !== "string" || transcript.length > 5000)) {
      return res.status(400).json({ error: "transcript too long or invalid" });
    }
    if (value != null && typeof value === "string" && value.length > 500) {
      return res.status(400).json({ error: "value too long" });
    }

    // [Medium] Validate audio_url is a Supabase storage URL, not an arbitrary external URL
    if (audio_url !== undefined && audio_url !== null) {
      const supabaseHost = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
      if (typeof audio_url !== "string" || !audio_url.startsWith(`${supabaseHost}/storage/`)) {
        return res.status(400).json({ error: "Invalid audio_url: must be a Supabase storage URL" });
      }
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("id, status, interview_id")
      .eq("id", session_id)
      .single();
    if (!session || session.status !== "in_progress") {
      return res.status(403).json({ error: "Invalid or already completed session" });
    }

    const { data: question } = await supabase
      .from("questions")
      .select("id")
      .eq("id", question_id)
      .eq("interview_id", session.interview_id)
      .single();
    if (!question) {
      return res.status(400).json({ error: "Invalid question for this session" });
    }

    const { error } = await supabase.from("responses").upsert({
      session_id,
      question_id,
      type,
      value: value ?? null,
      audio_url: audio_url ?? null,
      transcript: transcript ?? null,
    }, { onConflict: "session_id,question_id", ignoreDuplicates: false });

    if (error) return res.status(500).json({ error: "응답 저장에 실패했습니다." });
    return res.status(201).json({ ok: true });
  }

  return res.status(400).json({ error: "resource and valid method required" });
}
