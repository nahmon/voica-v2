// GET    /api/interview-members/[id] — list members
// POST   /api/interview-members/[id] — invite by email
// DELETE /api/interview-members/[id]?memberId=xxx — remove member
import { supabase } from "../_supabase.js";
import { rateLimit } from "../_rateLimit.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "interview id required" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

  // Only owner can manage members
  const { data: interview } = await supabase
    .from("interviews")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!interview) return res.status(404).json({ error: "Interview not found" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("interview_members")
      .select("id, email, user_id, role, created_at")
      .eq("interview_id", id)
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: "Failed to load members" });
    return res.status(200).json(data ?? []);
  }

  if (req.method === "POST") {
    if (!await rateLimit(`invite:${user.id}`, 10)) {
      return res.status(429).json({ error: "Too many requests" });
    }
    const { email } = req.body ?? {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      return res.status(400).json({ error: "Cannot invite yourself" });
    }
    const { data, error } = await supabase
      .from("interview_members")
      .insert({ interview_id: id, invited_by: user.id, email: email.toLowerCase() })
      .select()
      .single();
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Already invited" });
    }
    if (error) return res.status(500).json({ error: "Failed to invite" });
    return res.status(201).json(data);
  }

  if (req.method === "DELETE") {
    const { memberId } = req.query;
    if (!memberId) return res.status(400).json({ error: "memberId required" });
    const { error } = await supabase
      .from("interview_members")
      .delete()
      .eq("id", memberId)
      .eq("interview_id", id);
    if (error) return res.status(500).json({ error: "Failed to remove member" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
