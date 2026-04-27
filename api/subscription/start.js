// POST /api/subscription/start — 빌링키 발급 + 첫 결제 + 구독 레코드 생성
import { randomBytes } from "crypto";
import { supabase } from "../_supabase.js";
import { issueBillingKey, chargeBillingKey } from "../lib/toss.js";
import { PRO_PLAN, PRO_PLAN_YEARLY } from "../lib/plans.js";

function nanoid(len = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(randomBytes(len), b => chars[b % chars.length]).join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { authKey, customerKey, billing } = req.body ?? {};
  if (!authKey || !customerKey) return res.status(400).json({ error: "authKey, customerKey 필요" });
  const plan = billing === "yearly" ? PRO_PLAN_YEARLY : PRO_PLAN;

  // customerKey는 반드시 user.id여야 함
  if (customerKey !== user.id) return res.status(400).json({ error: "Invalid customerKey" });

  // 기존 활성 구독 확인
  const { data: existing } = await supabase
    .from("subscriptions").select("id, status").eq("user_id", user.id).single();
  if (existing?.status === "active") return res.status(409).json({ error: "이미 활성 구독이 있습니다." });

  let billingResult;
  try {
    billingResult = await issueBillingKey(authKey, customerKey);
  } catch (e) {
    return res.status(400).json({ error: `빌링키 발급 실패: ${e.message}` });
  }

  const orderId = `voica_sub_${nanoid(12)}_${Date.now()}`;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  let charge;
  try {
    charge = await chargeBillingKey({
      billingKey: billingResult.billingKey,
      customerKey,
      orderId,
      orderName: plan.name,
      amount: plan.amount,
      customerEmail: user.email ?? "",
    });
  } catch (e) {
    return res.status(400).json({ error: `첫 결제 실패: ${e.message}` });
  }

  await supabase.from("subscriptions").upsert({
    user_id: user.id,
    plan_id: plan.id,
    billing_key: billingResult.billingKey,
    customer_key: customerKey,
    status: "active",
    amount: PRO_PLAN.amount,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
    retry_count: 0,
    updated_at: now.toISOString(),
  }, { onConflict: "user_id" });

  await supabase.from("payment_attempts").insert({
    user_id: user.id,
    order_id: orderId,
    amount: plan.amount,
    status: "succeeded",
    toss_payment_key: charge.paymentKey,
  });

  return res.status(200).json({ ok: true, periodEnd: periodEnd.toISOString() });
}
