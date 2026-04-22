import { supabase } from "./_supabase.js";

async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user ?? null;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

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
    const { rewardId } = req.body;
    if (!rewardId) return res.status(400).json({ error: "rewardId required" });

    const { data: account } = await supabase
      .from("participant_bank_accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!account) return res.status(400).json({ error: "계좌를 먼저 등록해 주세요" });

    const { error } = await supabase
      .from("participant_rewards")
      .update({ status: "claimed", claimed_at: new Date().toISOString() })
      .eq("id", rewardId)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) return res.status(500).json({ error: "정산 신청 실패" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
