// GET /api/cron/charge-subscriptions
// Vercel Cron: 매일 UTC 00:00 (한국 09:00) 자동 실행
import { supabase } from "../_supabase.js";
import { chargeBillingKey } from "../lib/toss.js";
import { PRO_PLAN, getPlanById } from "../lib/plans.js";
import { nanoid } from "../lib/nanoid.js";

export default async function handler(req, res) {
  // Cron 보호: CRON_SECRET 검증
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = new Date();

  // 오늘 갱신 대상: 기간 만료됐고, cancel_at_period_end=false, active 또는 past_due (재시도)
  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("*")
    .in("status", ["active", "past_due"])
    .eq("cancel_at_period_end", false)
    .lte("current_period_end", now.toISOString());

  if (error) {
    console.error("[cron] DB error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!subs?.length) return res.status(200).json({ charged: 0, failed: 0 });

  let charged = 0;
  let failed = 0;

  for (const sub of subs) {
    const orderId = `voica_sub_${nanoid(12)}_${Date.now()}`;
    const newStart = new Date(sub.current_period_end);
    const newEnd = new Date(newStart);
    if (sub.plan_id === "pro_yearly") {
      newEnd.setFullYear(newEnd.getFullYear() + 1);
    } else {
      newEnd.setMonth(newEnd.getMonth() + 1);
    }

    // 이메일 조회 (Toss API 필요)
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(sub.user_id);
    const customerEmail = authUser?.email ?? "";

    try {
      const charge = await chargeBillingKey({
        billingKey: sub.billing_key,
        customerKey: sub.customer_key,
        orderId,
        orderName: getPlanById(sub.plan_id)?.name ?? PRO_PLAN.name,
        amount: sub.amount,
        customerEmail,
      });

      await supabase.from("subscriptions").update({
        status: "active",
        current_period_start: newStart.toISOString(),
        current_period_end: newEnd.toISOString(),
        retry_count: 0,
        updated_at: now.toISOString(),
      }).eq("id", sub.id);

      await supabase.from("payment_attempts").insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        order_id: orderId,
        amount: sub.amount,
        status: "succeeded",
        toss_payment_key: charge.paymentKey,
      });

      charged++;
    } catch (e) {
      const retryCount = (sub.retry_count ?? 0) + 1;
      // 2번 실패 → unpaid (서비스 차단), 1번 실패 → past_due (3일 그레이스)
      const nextStatus = retryCount >= 2 ? "unpaid" : "past_due";

      await supabase.from("subscriptions").update({
        status: nextStatus,
        retry_count: retryCount,
        updated_at: now.toISOString(),
      }).eq("id", sub.id);

      await supabase.from("payment_attempts").insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        order_id: orderId,
        amount: sub.amount,
        status: "failed",
        error_code: e.code ?? null,
        error_message: e.message ?? null,
      });

      console.error(`[cron] charge failed uid=${sub.user_id} status→${nextStatus}:`, e.code, e.message);
      failed++;
    }
  }

  console.log(`[cron] charged=${charged} failed=${failed}`);
  return res.status(200).json({ charged, failed });
}
