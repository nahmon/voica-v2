import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabase.js";
import { C, F, S } from "../lib/constants.jsx";
import { Btn, GlobalNav, useToast } from "../components/shared.jsx";

export default function BillingSuccessScreen({ go, user, logout, lang = "ko" }) {
  const [params] = useSearchParams();
  const { showToast } = useToast();
  const isKo = lang === "ko";

  const paymentKey  = params.get("paymentKey");
  const orderId     = params.get("orderId");
  const amount      = Number(params.get("amount"));
  const billingCycle = params.get("billingCycle") ?? "monthly";

  const [status, setStatus] = useState("confirming"); // confirming | done | error
  const [periodEnd, setPeriodEnd] = useState(null);
  const [errMsg, setErrMsg]   = useState("");

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrMsg(isKo ? "결제 정보가 올바르지 않아요." : "Invalid payment parameters.");
      return;
    }
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/management?resource=billing", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ paymentKey, orderId, amount, billingCycle }),
        });
        const data = await res.json();
        if (!res.ok) { setErrMsg(data.error || "오류"); setStatus("error"); return; }
        setPeriodEnd(data.periodEnd);
        setStatus("done");
      } catch (e) {
        console.error("[BillingSuccess]", e);
        setErrMsg(isKo ? "네트워크 오류가 발생했어요." : "Network error.");
        setStatus("error");
      }
    })();
  }, []);

  return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} variant="app" user={user} logout={logout} lang={lang} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ background: C.white, borderRadius: 20, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: S.elevated }}>

          {status === "confirming" && (
            <>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>⏳</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: C.navy, marginBottom: 8 }}>
                {isKo ? "결제 확인 중..." : "Confirming payment..."}
              </div>
              <div style={{ fontSize: 13, color: C.body }}>{isKo ? "잠시만 기다려 주세요." : "Please wait a moment."}</div>
            </>
          )}

          {status === "done" && (
            <>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 26 }}>✓</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                {isKo ? "구독이 시작됐어요!" : "Subscription active!"}
              </div>
              <div style={{ fontSize: 13, color: C.body, marginBottom: 8 }}>
                {isKo ? "Pro 플랜에 오신 걸 환영해요." : "Welcome to the Pro plan."}
              </div>
              {periodEnd && (
                <div style={{ fontSize: 12, color: C.body, marginBottom: 28, padding: "10px 16px", background: C.bg, borderRadius: 8 }}>
                  {isKo ? `다음 결제일: ${new Date(periodEnd).toLocaleDateString("ko-KR")}` : `Next billing: ${new Date(periodEnd).toLocaleDateString("en-US")}`}
                </div>
              )}
              <Btn full onClick={() => go("dashboard")}>{isKo ? "대시보드로 →" : "Go to dashboard →"}</Btn>
            </>
          )}

          {status === "error" && (
            <>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(217,48,37,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>✕</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: C.navy, marginBottom: 8 }}>
                {isKo ? "결제 확인에 실패했어요" : "Payment confirmation failed"}
              </div>
              <div style={{ fontSize: 13, color: C.body, marginBottom: 24 }}>{errMsg}</div>
              <Btn full variant="ghost" onClick={() => go("pricing")}>{isKo ? "요금제로 돌아가기" : "Back to pricing"}</Btn>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
