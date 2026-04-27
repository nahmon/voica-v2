import { supabase } from "./_supabase.js";
import { rateLimit, getIp } from "./_rateLimit.js";

async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user ?? null;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!rateLimit(`participant:${getIp(req)}`, 20)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const action = req.query.action;

  // GET /api/participant — fetch bank account
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("participant_bank_accounts")
      .select("id, bank_name, account_number, account_holder, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return res.status(500).json({ error: "조회 실패" });
    return res.status(200).json({ account: data });
  }

  if (req.method === "POST" && action === "bank-account") {
    const { bank_name, account_number, account_holder } = req.body;
    if (!bank_name || !account_number || !account_holder) {
      return res.status(400).json({ error: "bank_name, account_number, account_holder required" });
    }
    const { error } = await supabase
      .from("participant_bank_accounts")
      .upsert({ user_id: user.id, bank_name, account_number, account_holder, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) return res.status(500).json({ error: "계좌 저장 실패" });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "POST" && action === "reward-claim") {
    const { rewardId, sessionId } = req.body;
    if (!rewardId || !sessionId) return res.status(400).json({ error: "rewardId and sessionId required" });

    const { data: account } = await supabase
      .from("participant_bank_accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!account) return res.status(400).json({ error: "계좌를 먼저 등록해 주세요" });

    // Verify reward belongs to this session (ownership proof without pre-auth)
    const { data: reward } = await supabase
      .from("participant_rewards")
      .select("id, user_id, status")
      .eq("id", rewardId)
      .eq("session_id", sessionId)
      .maybeSingle();
    if (!reward) return res.status(404).json({ error: "보상을 찾을 수 없습니다" });
    if (reward.status !== "pending") return res.status(400).json({ error: "이미 신청된 보상입니다" });
    if (reward.user_id && reward.user_id !== user.id) return res.status(403).json({ error: "Forbidden" });

    const { error } = await supabase
      .from("participant_rewards")
      .update({ user_id: user.id, status: "claimed", claimed_at: new Date().toISOString() })
      .eq("id", rewardId);

    if (error) return res.status(500).json({ error: "정산 신청 실패" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
