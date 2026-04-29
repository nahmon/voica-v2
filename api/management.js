import crypto from "crypto";
import { supabase } from "./_supabase.js";
import { rateLimit, getIp } from "./_rateLimit.js";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!rateLimit(`management:${getIp(req)}`, 15)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const resource = req.query.resource;

  if (resource === "billing") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

    const { paymentKey, orderId, amount, billingCycle = "monthly" } = req.body;
    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ error: "paymentKey, orderId, amount required" });
    }

    const VALID_AMOUNTS = { monthly: 199000, yearly: 1908000 };
    const expectedAmount = VALID_AMOUNTS[billingCycle];
    if (!expectedAmount || Number(amount) !== expectedAmount) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    const basicAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
    let tossData;
    try {
      const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });
      tossData = await tossRes.json();
      if (!tossRes.ok) return res.status(400).json({ error: tossData.message || "결제 승인 실패" });
    } catch (e) {
      console.error("[management/billing]", e);
      return res.status(502).json({ error: "결제 서버 연결 실패" });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        plan: "pro",
        billing_cycle: billingCycle,
        status: "active",
        amount,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: "user_id" })
      .select("id")
      .single();

    if (subErr) {
      console.error("[management/billing sub upsert]", subErr);
      return res.status(500).json({ error: "구독 저장 실패" });
    }

    await supabase.from("subscription_payments").insert({
      subscription_id: sub.id,
      user_id: user.id,
      toss_payment_key: tossData.paymentKey,
      toss_order_id: orderId,
      amount,
      status: "done",
      paid_at: tossData.approvedAt ?? now.toISOString(),
    });

    return res.status(200).json({ ok: true, subscriptionId: sub.id, periodEnd: periodEnd.toISOString() });
  }

  if (resource === "admin-rewards") {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user || !ADMIN_IDS.includes(user.id)) return res.status(403).json({ error: "Forbidden" });

    if (req.method === "GET") {
      const status = req.query.status ?? "claimed";
      const { data, error } = await supabase
        .from("participant_rewards")
        .select(`
          id, amount, currency, status, claimed_at, paid_at, note, created_at,
          user_id,
          interviews(title),
          participant_bank_accounts!inner(bank_name, account_number, account_holder)
        `)
        .eq("status", status)
        .order("claimed_at", { ascending: true });
      if (error) return res.status(500).json({ error: "조회 실패" });
      return res.status(200).json({ rewards: data });
    }

    if (req.method === "PATCH") {
      const { rewardIds, note } = req.body;
      if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
        return res.status(400).json({ error: "rewardIds array required" });
      }
      if (note != null && (typeof note !== "string" || note.length > 500)) {
        return res.status(400).json({ error: "note too long" });
      }
      const { error } = await supabase
        .from("participant_rewards")
        .update({ status: "paid", paid_at: new Date().toISOString(), note: note ?? null })
        .in("id", rewardIds)
        .eq("status", "claimed");
      if (error) return res.status(500).json({ error: "정산 처리 실패" });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  }

  // Toss webhook: subscription cancellation / payment failure events
  if (resource === "webhook") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    // Toss signs webhooks with secret — verify header (fail closed if not configured)
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(503).json({ error: "Webhook not configured" });
    const sig = req.headers["toss-payments-signature"];
    const expected = crypto.createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body)).digest("base64");
    if (!sig || !crypto.timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8")))
      return res.status(401).json({ error: "Invalid signature" });

    const { eventType, data } = req.body ?? {};
    if (!eventType || !data) return res.status(400).json({ error: "Invalid webhook payload" });

    // Handle cancellation / expiry
    if (eventType === "PAYMENT_STATUS_CHANGED") {
      const { orderId, status } = data;
      if (!orderId) return res.status(200).json({ ok: true });

      if (["CANCELED", "ABORTED", "EXPIRED"].includes(status)) {
        // Look up user_id from payment record
        const { data: payment } = await supabase
          .from("subscription_payments")
          .select("user_id")
          .eq("toss_order_id", orderId)
          .maybeSingle();

        await supabase
          .from("subscription_payments")
          .update({ status: "cancelled" })
          .eq("toss_order_id", orderId);

        if (payment?.user_id) {
          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("user_id", payment.user_id)
            .eq("status", "active");
        }
      }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "resource required" });
}
