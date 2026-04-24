import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp } from "./_rateLimit.js";

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

function getServiceClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getAuthUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = getServiceClient();
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

  const supabase = getServiceClient();

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

  // ── POST: submit verification request ───────────────────────────────────
  if (req.method === "POST") {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

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

    // [Medium] Whitelist allowed fields — strip unexpected keys before storing
    const safeVerifyData = {};
    for (const key of ALLOWED_VERIFY_FIELDS) {
      if (verifyData[key] !== undefined) safeVerifyData[key] = verifyData[key];
    }

    // [Medium] Enforce mime_type from data URI header (prevent client-supplied mismatch)
    safeVerifyData.mime_type = mimeMatch[1];

    // [Low] Sanitize file_name: strip null bytes, limit length
    if (safeVerifyData.file_name !== undefined) {
      safeVerifyData.file_name = String(safeVerifyData.file_name).replace(/\0/g, "").slice(0, 255);
    }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        expert_status: "pending",
        expert_verify_method: method,
        expert_verify_data: {
          ...safeVerifyData,
          submitted_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      });

    if (upsertError) return res.status(500).json({ error: "Failed to save verification request" });

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
