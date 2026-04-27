// GET /api/export?id=<interviewId> — CSV download of all responses
import { supabase } from "./_supabase.js";
import { rateLimit, getIp } from "./_rateLimit.js";

async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user ?? null;
}

function escapeCsv(val) {
  if (val == null) return "";
  const str = String(val).replace(/"/g, '""');
  return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!rateLimit(`export:${getIp(req)}`, 20)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "id required" });

  // Verify ownership
  const { data: interview } = await supabase
    .from("interviews").select("id, title, user_id").eq("id", id).single();
  if (!interview) return res.status(404).json({ error: "Not found" });
  if (interview.user_id !== user.id) return res.status(403).json({ error: "Forbidden" });

  // Fetch sessions + responses
  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      id, created_at, status, panelist_name, panelist_email,
      responses(question_id, transcript, value, created_at)
    `)
    .eq("interview_id", id)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  const { data: questions } = await supabase
    .from("questions")
    .select("id, order_num, content, type")
    .eq("interview_id", id)
    .order("order_num", { ascending: true });

  if (!sessions?.length) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="responses.csv"`);
    return res.status(200).send("No completed sessions");
  }

  const qMap = Object.fromEntries((questions ?? []).map(q => [q.id, q]));
  const sortedQIds = (questions ?? []).map(q => q.id);

  // Header row
  const headers = [
    "session_id", "panelist_name", "panelist_email", "completed_at",
    ...sortedQIds.map(qid => {
      const q = qMap[qid];
      return `Q${q?.order_num ?? "?"}: ${(q?.content ?? "").slice(0, 40)}`;
    }),
  ];

  const rows = sessions.map(s => {
    const respByQ = Object.fromEntries(
      (s.responses ?? []).map(r => [r.question_id, r.transcript ?? r.value ?? ""])
    );
    return [
      s.id, s.panelist_name ?? "", s.panelist_email ?? "",
      s.created_at ? new Date(s.created_at).toISOString() : "",
      ...sortedQIds.map(qid => respByQ[qid] ?? ""),
    ];
  });

  const csv = [headers, ...rows].map(row => row.map(escapeCsv).join(",")).join("\n");
  const filename = `${interview.title.replace(/[^a-zA-Z0-9가-힣]/g, "_")}_responses.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send("\uFEFF" + csv); // BOM for Excel compatibility
}
