// POST /api/subscription/cancel — 구독 해지 (다음 결제만 막고, 기간까지 사용 가능)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { data: sub } = await supabase
    .from("subscriptions").select("*")
    .eq("user_id", user.id).in("status", ["active", "past_due"]).single();

  if (!sub) return res.status(404).json({ error: "활성 구독이 없습니다." });
  if (sub.cancel_at_period_end) return res.status(200).json({ ok: true, alreadyCanceled: true, periodEnd: sub.current_period_end });

  await supabase.from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("id", sub.id);

  return res.status(200).json({ ok: true, periodEnd: sub.current_period_end });
}
