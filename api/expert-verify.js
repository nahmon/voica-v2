import { supabase } from "./_supabase.js";
import { rateLimit, getIp } from "./_rateLimit.js";
import { sendSlack } from "./lib/slack.js";
import OpenAI from "openai";

// Max base64 file size: 5MB (base64 overhead ~33%, so raw limit ~3.75MB)
const MAX_FILE_DATA_B64_LEN = 5 * 1024 * 1024;

// Allowed MIME types for verification documents
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

// Allowed fields in verifyData to prevent unexpected field injection
const ALLOWED_VERIFY_FIELDS = new Set(["file_data", "mime_type", "file_name"]);

const ALLOWED_CAREER_FIELDS = new Set(["domain", "industry", "years_exp", "job_title", "company_name", "company_size", "degree"]);

async function getAuthUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// Double-check admin status against DB profiles table, not just JWT metadata
async function isAdminUser(supabase, userId) {
  // Primary check: DB-stored role (authoritative)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role === "admin") return true;

  // Fallback: JWT user_metadata (only if DB record missing)
  // Note: user_metadata can be set by service role, so we keep this as
  // secondary signal but do NOT rely on it alone.
  return false;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!rateLimit(`expert-verify:${getIp(req)}`, 10)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  // ── GET: return current user's profile (or admin list) ──────────────────
  if (req.method === "GET") {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Admin: list all pending verifications
    if (req.query.admin === "true") {
      if (!(await isAdminUser(supabase, user.id))) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, expert_status, expert_verify_method, expert_verify_data")
        .eq("expert_status", "pending");
      if (error) return res.status(500).json({ error: "Failed to fetch verifications" });
      return res.status(200).json({ verifications: data ?? [] });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("expert_status, expert_verify_method, expert_verify_data")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: "Failed to fetch profile" });

    return res.status(200).json({
      expert_status: data?.expert_status ?? "none",
      expert_verify_method: data?.expert_verify_method ?? null,
      expert_verify_data: data?.expert_verify_data ?? null,
    });
  }

  // ── POST: submit verification OR admin AI check ─────────────────────────
  if (req.method === "POST") {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Admin AI check action
    if (req.body?.action === "ai_check") {
      if (!(await isAdminUser(supabase, user.id))) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { user_id } = req.body;
      if (!user_id) return res.status(400).json({ error: "user_id required" });

      const { data: profile } = await supabase
        .from("profiles")
        .select("expert_verify_method, expert_verify_data")
        .eq("id", user_id)
        .maybeSingle();

      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const vd = profile.expert_verify_data ?? {};
      const careerInfo = vd.career_info ?? null;
      const filePath = vd.file_path ?? null;
      const mimeType = vd.mime_type ?? "";

      if (!filePath) return res.status(400).json({ error: "No document on file" });
      if (mimeType === "application/pdf") {
        return res.status(200).json({
          ok: true,
          result: { match: null, notes: "PDF 파일은 자동 분석이 지원되지 않아요. 직접 확인해 주세요.", extracted: null },
        });
      }

      // Get short-lived signed URL from Storage (never expose raw base64)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("expert-docs")
        .createSignedUrl(filePath, 120);
      if (signedError || !signedData?.signedUrl) {
        return res.status(500).json({ error: "Failed to access document" });
      }

      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const careerSummary = careerInfo
          ? `직군: ${careerInfo.domain ?? "—"}, 산업: ${careerInfo.industry ?? "—"}, 경력: ${careerInfo.years_exp ?? "—"}, 직함: ${careerInfo.job_title ?? "—"}`
          : "경력 정보 없음";

        const chat = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `다음은 전문가 인증 서류 이미지입니다. 이미지에서 회사명, 직위/직함, 발급일을 추출하고, 아래 신청자가 제출한 경력 정보와 일치하는지 판단해 주세요.\n\n신청자 경력 정보: ${careerSummary}\n\nJSON으로만 응답: { "company": "회사명 또는 null", "title": "직위 또는 null", "issued_date": "발급일 또는 null", "match": true/false/null, "confidence": "high/medium/low", "notes": "한 줄 코멘트" }`,
                },
                { type: "image_url", image_url: { url: signedData.signedUrl, detail: "low" } },
              ],
            },
          ],
        });

        const raw = chat.choices[0]?.message?.content ?? "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        return res.status(200).json({ ok: true, result: parsed ?? { match: null, notes: raw, extracted: null } });
      } catch (e) {
        return res.status(500).json({ error: "AI 분석 실패: " + e.message });
      }
    }

    const { method, data: verifyData } = req.body ?? {};

    const VALID_METHODS = ["employment_certificate", "health_insurance"];
    if (!method || !VALID_METHODS.includes(method)) {
      return res.status(400).json({ error: "method must be one of: employment_certificate, health_insurance" });
    }
    if (!verifyData || typeof verifyData !== "object") {
      return res.status(400).json({ error: "data is required" });
    }

    if (!verifyData.file_data) {
      return res.status(400).json({ error: "data.file_data is required" });
    }

    // [High] Enforce base64 size limit (~3.75MB raw)
    if (typeof verifyData.file_data !== "string" || verifyData.file_data.length > MAX_FILE_DATA_B64_LEN) {
      return res.status(400).json({ error: "file_data exceeds maximum allowed size (5MB)" });
    }

    // [High] Validate MIME type from base64 data URI header
    const mimeMatch = verifyData.file_data.match(/^data:([a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]+\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]+);base64,/);
    if (!mimeMatch || !ALLOWED_MIME_TYPES.has(mimeMatch[1])) {
      return res.status(400).json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" });
    }

    // Sanitize file_name
    let safeFileName = verifyData.file_name !== undefined
      ? String(verifyData.file_name).replace(/\0/g, "").slice(0, 255)
      : undefined;

    const mimeType = mimeMatch[1];
    const ext = mimeType === "application/pdf" ? "pdf"
      : mimeType === "image/png" ? "png"
      : mimeType === "image/webp" ? "webp"
      : "jpg";

    // Upload document to Supabase Storage (never store raw base64 in DB)
    const base64Raw = verifyData.file_data.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(base64Raw, "base64");
    const filePath = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("expert-docs")
      .upload(filePath, fileBuffer, { contentType: mimeType, upsert: true });
    if (uploadError) return res.status(500).json({ error: "Failed to upload document" });

    // Sanitize career_info
    const rawCareerInfo = req.body?.career_info;
    let safeCareerInfo = null;
    if (rawCareerInfo && typeof rawCareerInfo === "object") {
      safeCareerInfo = {};
      for (const key of ALLOWED_CAREER_FIELDS) {
        if (rawCareerInfo[key] !== undefined) {
          safeCareerInfo[key] = typeof rawCareerInfo[key] === "string"
            ? rawCareerInfo[key].replace(/\0/g, "").slice(0, 200)
            : rawCareerInfo[key];
        }
      }
    }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        expert_status: "pending",
        expert_verify_method: method,
        expert_verify_data: {
          file_path: filePath,
          mime_type: mimeType,
          ...(safeFileName ? { file_name: safeFileName } : {}),
          ...(safeCareerInfo ? { career_info: safeCareerInfo } : {}),
          submitted_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      });

    if (upsertError) return res.status(500).json({ error: "Failed to save verification request" });

    // Admin Slack notification
    const domain = safeCareerInfo?.domain ?? "-";
    const jobTitle = safeCareerInfo?.job_title ?? "-";
    await sendSlack(
      process.env.SLACK_ADMIN_WEBHOOK_URL,
      `🔔 전문가 인증 신청\n👤 사용자 ID: ${user.id}\n💼 직군: ${domain} / ${jobTitle}\n📋 방식: ${method}`
    );

    return res.status(200).json({ ok: true });
  }

  // ── PATCH: admin approve/reject ──────────────────────────────────────────
  if (req.method === "PATCH") {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!(await isAdminUser(supabase, user.id))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { user_id, status, note } = req.body ?? {};

    if (!user_id) return res.status(400).json({ error: "user_id is required" });
    if (status !== "verified" && status !== "rejected") {
      return res.status(400).json({ error: "status must be 'verified' or 'rejected'" });
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("expert_verify_data")
      .eq("id", user_id)
      .maybeSingle();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        expert_status: status,
        expert_verify_data: {
          ...(existing?.expert_verify_data ?? {}),
          reviewer_note: note ?? null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id);

    if (updateError) return res.status(500).json({ error: "Failed to update verification status" });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
