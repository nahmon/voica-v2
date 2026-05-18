// GET /api/report/public/[token] — fetch completed report by public token (no auth required)
import { supabase } from "../../_supabase.js";
import { rateLimit, getIp } from "../../_rateLimit.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { token } = req.query;
  if (!token) return res.status(404).json({ error: "Not found" });

  // Validate token format: base64url chars, exactly 16 characters
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{16}$/.test(token)) {
    return res.status(404).json({ error: "Not found" });
  }

  // Rate limit: 60 req/min per token (using token as key suffix to isolate per-report)
  const ip = getIp(req);
  if (!await rateLimit(`public-report:${token}:${ip}`, 60)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  // Look up interview by token
  const { data: interview, error: ivErr } = await supabase
    .from("interviews")
    .select("id, title, status, public_report_token")
    .eq("public_report_token", token)
    .single();

  if (ivErr || !interview) return res.status(404).json({ error: "Not found" });

  // Fetch latest completed report
  const { data: report, error: repErr } = await supabase
    .from("reports")
    .select("id, status, content, created_at")
    .eq("interview_id", interview.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (repErr || !report) return res.status(404).json({ error: "Report not ready" });

  return res.status(200).json({
    interview_title: interview.title,
    report_id: report.id,
    content: report.content,
    created_at: report.created_at,
  });
}
