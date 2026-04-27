import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabase.js";
import { C, F } from "../lib/constants.jsx";
import { GlobalNav } from "../components/shared.jsx";

export default function PaymentSuccessScreen({ go, user, logout, lang = "ko" }) {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("processing"); // processing | success | error
  const [error, setError] = useState(null);
  const isKo = lang === "ko";

  useEffect(() => {
    handleRedirect();
  }, []);

  const handleRedirect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { go("auth"); return; }
    const token = session.access_token;

    const type = searchParams.get("type");

    try {
      if (type === "subscription") {
        const authKey = searchParams.get("authKey");
        const customerKey = searchParams.get("customerKey");
        const billing = searchParams.get("billing") || "monthly";
        const res = await fetch("/api/subscription/start", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ authKey, customerKey, billing }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "구독 시작 실패");
      } else {
        // type === "credit"
        const paymentKey = searchParams.get("paymentKey");
        const orderId = searchParams.get("orderId");
        const amount = parseInt(searchParams.get("amount"), 10);
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "결제 확인 실패");
      }
      setStatus("success");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  };

  const isSubscription = searchParams.get("type") === "subscription";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} activeTab="pricing" variant={user ? "app" : "public"} user={user} logout={logout} lang={lang} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 40 }}>
        {status === "processing" && (
          <p style={{ color: C.body, fontSize: 15 }}>{isKo ? "결제를 확인하는 중..." : "Confirming payment..."}</p>
        )}
        {status === "success" && (
          <>
            <div style={{ fontSize: 48 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: 0 }}>
              {isKo
                ? (isSubscription ? "Pro 구독이 시작됐어요!" : "크레딧이 충전됐어요!")
                : (isSubscription ? "Pro subscription started!" : "Credits added!")}
            </h2>
            <p style={{ color: C.body, fontSize: 14, margin: 0 }}>
              {isKo ? "대시보드에서 확인하세요." : "Check your dashboard."}
            </p>
            <button
              onClick={() => go("dashboard")}
              style={{ marginTop: 8, padding: "12px 28px", borderRadius: 10, border: "none", background: C.purple, color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              {isKo ? "대시보드로 →" : "Go to dashboard →"}
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 48 }}>❌</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: 0 }}>
              {isKo ? "결제 확인 중 오류가 발생했어요" : "Payment confirmation failed"}
            </h2>
            <p style={{ color: C.body, fontSize: 14, margin: 0 }}>{error}</p>
            <button
              onClick={() => go("pricing")}
              style={{ marginTop: 8, padding: "12px 28px", borderRadius: 10, border: "none", background: C.purple, color: C.white, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              {isKo ? "다시 시도" : "Try again"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
