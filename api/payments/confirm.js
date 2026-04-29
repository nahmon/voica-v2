// POST /api/payments/confirm — 토스 결제 승인 + 크레딧 적립
import { supabase } from "../_supabase.js";
import { rateLimit, getIp } from "../_rateLimit.js";
import { confirmPayment } from "../lib/toss.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!rateLimit(`payments-confirm:${getIp(req)}`, 10)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { paymentKey, orderId, amount } = req.body ?? {};
  if (!paymentKey || !orderId || !amount) return res.status(400).json({ error: "Missing fields" });

  const { data: order } = await supabase
    .from("orders").select("*").eq("id", orderId).eq("user_id", user.id).single();
  if (!order) return res.status(404).json({ error: "Order not found" });

  // 멱등 처리
  if (order.status === "PAID") return res.status(200).json({ ok: true });

  // 서버에서 금액 검증 (클라이언트 값 신뢰 금지)
  if (order.amount !== amount) return res.status(400).json({ error: "Amount mismatch" });

  try {
    await confirmPayment({ paymentKey, orderId, amount });
  } catch (e) {
    await supabase.from("orders")
      .update({ status: "FAILED", toss_error: e.code, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    return res.status(400).json({ error: e.message });
  }

  const { data: updatedOrder } = await supabase
    .from("orders")
    .update({ status: "PAID", toss_payment_key: paymentKey, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "PENDING")
    .select("id")
    .single();

  // 다른 요청이 이미 처리한 경우 멱등 처리
  if (!updatedOrder) return res.status(200).json({ ok: true });

  await supabase.rpc("add_credits", {
    p_user_id: user.id,
    p_amount: order.credits,
    p_order_id: orderId,
  });

  return res.status(200).json({ ok: true });
}
