// POST /api/payments/prepare — 일회성 크레딧 주문 생성 (PENDING)
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { getCreditPackageById } from "../lib/plans.js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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

  const { packageId } = req.body ?? {};
  const pkg = getCreditPackageById(packageId);
  if (!pkg) return res.status(400).json({ error: "Invalid packageId" });

  const orderId = `voica_cr_${nanoid(12)}_${Date.now()}`;

  const { error } = await supabase.from("orders").insert({
    id: orderId,
    user_id: user.id,
    package_id: packageId,
    amount: pkg.amount,
    credits: pkg.credits,
    status: "PENDING",
  });
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ orderId, amount: pkg.amount, orderName: pkg.name });
}
