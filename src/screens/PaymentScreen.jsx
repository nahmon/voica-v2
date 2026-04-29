import { useEffect, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { C, F } from "../lib/constants.jsx";
import { GlobalNav } from "../components/shared.jsx";

const VITE_TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

export default function PaymentScreen({ go, user, logout, lang = "ko" }) {
  const [error, setError] = useState(null);
  const isKo = lang === "ko";

  useEffect(() => {
    if (!user) {
      localStorage.setItem("voica_after_login", "payment_subscribe");
      go("advertiser_login");
      return;
    }
    startBillingAuth();
  }, [user]);

  const startBillingAuth = async () => {
    if (!VITE_TOSS_CLIENT_KEY) { setError(isKo ? "결제 설정이 준비 중이에요." : "Payment not configured."); return; }
    try {
      const tossPayments = await loadTossPayments(VITE_TOSS_CLIENT_KEY);
      // customerKey = user.id (UUID) — 서버에서 검증
      const billing = localStorage.getItem("voica_billing") || sessionStorage.getItem("voica_billing") || "monthly";
      const planId = localStorage.getItem("voica_plan_id") || sessionStorage.getItem("voica_plan_id") || null;
      localStorage.removeItem("voica_billing");
      localStorage.removeItem("voica_plan_id");
      const payment = tossPayments.payment({ customerKey: user.id });
      const successUrl = new URL(`${window.location.origin}/payment/success`);
      successUrl.searchParams.set("type", "subscription");
      successUrl.searchParams.set("billing", billing);
      if (planId) successUrl.searchParams.set("planId", planId);
      const customerName = user.user_metadata?.full_name || user.email?.split("@")[0] || "고객";
      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: successUrl.toString(),
        failUrl: `${window.location.origin}/pricing`,
        customerEmail: user.email ?? "",
        customerName,
      });
    } catch (e) {
      if (e?.code === "USER_CANCEL") {
        go("pricing");
      } else {
        console.error("[payment] billingAuth error:", e?.code, e?.message, e);
        const code = e?.code ? ` (${e.code})` : "";
        setError((e?.message || (isKo ? "결제창을 열 수 없습니다." : "Could not open payment.")) + code);
      }
    }
  };

  if (error) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column" }}>
        <GlobalNav go={go} activeTab="pricing" variant="app" user={user} logout={logout} lang={lang} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
          <p style={{ color: C.red ?? "#e53e3e", fontSize: 15 }}>{error}</p>
          <button
            onClick={() => go("pricing")}
            style={{ padding: "10px 24px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontSize: 14, fontFamily: F }}>
            {isKo ? "요금제로 돌아가기" : "Back to pricing"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} activeTab="pricing" variant="app" user={user} logout={logout} lang={lang} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p role="status" style={{ color: C.body, fontSize: 14 }}>{isKo ? "결제창을 여는 중..." : "Opening payment..."}</p>
      </div>
    </div>
  );
}
