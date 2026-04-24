// GET    /api/comments/[reportId] — list comments
// POST   /api/comments/[reportId] — add comment
// DELETE /api/comments/[reportId]?commentId=xxx — delete own comment
import { supabase } from "../_supabase.js";
import { rateLimit } from "../_rateLimit.js";

export default async function handler(req, res) {
  const { reportId } = req.query;
  if (!reportId) return res.status(400).json({ error: "reportId required" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

  // Get report to find interview_id
  const { data: rep } = await supabase
    .from("reports")
    .select("id, interview_id")
    .eq("id", reportId)
    .maybeSingle();
  if (!rep) return res.status(404).json({ error: "Report not found" });

  // Verify interview ownership
  const { data: iv } = await supabase
    .from("interviews")
    .select("id")
    .eq("id", rep.interview_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!iv) return res.status(404).json({ error: "Report not found" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("report_comments")
      .select("id, content, created_at, user_id")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: "Failed to load comments" });
    return res.status(200).json(data ?? []);
  }

  if (req.method === "POST") {
    if (!rateLimit(`comment:${user.id}`, 20)) {
      return res.status(429).json({ error: "Too many requests" });
    }
    const { content } = req.body ?? {};
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "content required" });
    }
    const safe = content.trim().slice(0, 2000);
    const { data, error } = await supabase
      .from("report_comments")
      .insert({ report_id: reportId, interview_id: rep.interview_id, user_id: user.id, content: safe })
      .select()
      .single();
    if (error) return res.status(500).json({ error: "Failed to save comment" });
    return res.status(201).json(data);
  }

  if (req.method === "DELETE") {
    const { commentId } = req.query;
    if (!commentId) return res.status(400).json({ error: "commentId required" });
    const { error } = await supabase
      .from("report_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);
    if (error) return res.status(500).json({ error: "Failed to delete comment" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
