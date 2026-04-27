import { supabase } from "../_supabase.js";
import { rateLimit, getIp } from "../_rateLimit.js";
// POST /api/subscription/cancel — 구독 해지 (다음 결제만 막고, 기간까지 사용 가능)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!rateLimit(`subscription-cancel:${getIp(req)}`, 5)) {
    return res.status(429).json({ error: "Too many requests" });
  }

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
