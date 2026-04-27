import { useState, useEffect } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { C, S, F } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, Footer, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";

const VITE_TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || "test_ck_ma60RZblrqzZEv0P4E1z8wzYWBn1";

const CREDIT_PACKAGES = [
  { id: "credit_100k",  label: "100,000원", labelEn: "$75",  amount: 100000,  credits: "100,000크레딧", creditsEn: "100,000 credits" },
  { id: "credit_300k",  label: "300,000원", labelEn: "$220", amount: 300000,  credits: "300,000크레딧", creditsEn: "300,000 credits", badge: "인기", badgeEn: "Popular" },
  { id: "credit_1m",    label: "1,000,000원", labelEn: "$750", amount: 1000000, credits: "1,000,000크레딧", creditsEn: "1,000,000 credits", badge: "대용량", badgeEn: "Bulk" },
];

export default function PricingScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const isMobile = useIsMobile();
  const { showToast } = useToast();
  const [billing, setBilling] = useState("monthly");
  const [paying, setPaying] = useState(null); // null | "pro" | packageId
  const [isPro, setIsPro] = useState(false);

  const isKo = lang === "ko";

  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions")
      .select("status").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setIsPro(data?.status === "active"));
  }, [user]);

  const proKrwMonthly = 199000;
  const proKrwYearlyMonthly = 159000;
  const proKrwYearlyTotal = proKrwYearlyMonthly * 12;
  const proMonthly = 149;
  const proYearlyMonthly = Math.round(proMonthly * 0.8);
  const proYearlyTotal = proYearlyMonthly * 12;

  const proDisplayPrice = isKo
    ? (billing === "yearly" ? `₩${proKrwYearlyMonthly.toLocaleString("ko-KR")}/월` : `₩${proKrwMonthly.toLocaleString("ko-KR")}/월`)
    : (billing === "yearly" ? `$${proYearlyMonthly}/mo` : `$${proMonthly}/mo`);
  const proDisplaySub = billing === "yearly"
    ? (isKo ? `연 ₩${proKrwYearlyTotal.toLocaleString("ko-KR")} 결제 · 20% 절약` : `$${proYearlyTotal} billed annually · save 20%`)
    : (isKo ? "월간 결제 · 언제든 자유롭게 취소" : "Billed monthly · cancel anytime");

  const proFeatures = isKo ? [
    "월 500개 응답 포함 (초과 시 응답당 ₩660)",
    "AI 심층 분석 · 주제 드릴다운",
    "대표 인용문 자동 추출",
    "크로스탭 분석 · 세그먼트 비교",
    "CSV / PDF 내보내기",
    "팀원 최대 5명",
    "데이터 1년 보관",
  ] : [
    "500 responses/mo included (then $0.49 per response)",
    "AI deep analysis + theme drill-down",
    "Auto-extracted representative quotes",
    "Cross-tab analysis & segment comparison",
    "CSV / PDF export",
    "Up to 5 team members",
    "1 year data retention",
  ];

  const enterpriseFeatures = isKo ? [
    "무제한 인터뷰", "전담 CSM", "맞춤 리포트",
    "99.9% SLA", "PPT 슬라이드 자동 생성", "Slack & Notion 연동",
  ] : [
    "Unlimited interviews", "Dedicated CSM", "Custom reports",
    "99.9% SLA", "Auto-generated PPT slides", "Slack & Notion integration",
  ];

  const handleProStart = () => {
    if (!user) { go("auth"); return; }
    sessionStorage.setItem("voica_billing", billing);
    go("payment_subscribe");
  };

  const handleCreditPurchase = async (pkg) => {
    if (!user) { go("auth"); return; }
    if (!VITE_TOSS_CLIENT_KEY) { showToast("결제 설정이 준비 중이에요.", "error"); return; }
    setPaying(pkg.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { go("auth"); return; }

      // 서버에서 주문 생성
      const prepRes = await fetch("/api/payments/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const { orderId, amount, orderName, error: prepError } = await prepRes.json();
      if (!prepRes.ok) throw new Error(prepError || "주문 생성 실패");

      // 토스 결제창 오픈
      const tossPayments = await loadTossPayments(VITE_TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: "ANONYMOUS" });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName,
        customerEmail: user.email ?? "",
        successUrl: `${window.location.origin}/payment/success?type=credit`,
        failUrl: `${window.location.origin}/pricing`,
      });
    } catch (e) {
      if (e?.code !== "USER_CANCEL") showToast(e?.message || "결제 오류가 발생했어요.", "error");
    } finally {
      setPaying(null);
    }
  };

  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, fontFeatureSettings: '"ss01"', display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} activeTab="pricing" variant={user ? "app" : "public"} user={user} logout={logout} lang={lang} />

      <div style={{ textAlign: "center", padding: "60px 24px 44px", background: C.white, borderBottom: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.07),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <Badge variant="purple" style={{ marginBottom: 16 }}>{isKo ? "요금제" : "Pricing"}</Badge>
        <h1 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.08 }}>
          {isKo ? "빠르고 저렴하게 인터뷰를 시작해보세요" : "Simple pricing that scales with you"}
        </h1>
        <p style={{ fontSize: 15, color: C.body, margin: 0 }}>
          {isKo ? "딱 맞는 플랜을 골라보세요" : "Choose the plan that fits your team"}
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px", flex: 1 }}>

        {/* 구독 플랜 */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
            {[["monthly", isKo ? "월간" : "Monthly"], ["yearly", isKo ? "연간" : "Annually"]].map(([val, label]) => (
              <button key={val} onClick={() => setBilling(val)}
                style={{ padding: "6px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontFamily: F, fontWeight: billing === val ? 600 : 400, background: billing === val ? C.white : "transparent", color: billing === val ? C.navy : C.body, boxShadow: billing === val ? S.ambient : "none", transition: "all 0.15s" }}>
                {label}
                {val === "yearly" && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: C.success }}>{isKo ? "20% 할인" : "20% off"}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 20, alignItems: "stretch", maxWidth: 780, margin: "0 auto 60px" }}>
          {/* Pro */}
          <div onMouseEnter={() => setHoveredCard("pro")} onMouseLeave={() => setHoveredCard(null)}
            style={{ background: C.white, border: `2px solid ${C.purple}`, borderRadius: 20, padding: "32px 28px", boxShadow: S.elevated, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", transform: hoveredCard === "pro" ? "scale(1.015)" : "scale(1)", filter: hoveredCard === "pro" ? "brightness(1.03)" : "brightness(1)", transition: "transform 0.15s ease-out, filter 0.15s ease-out" }}>
            <div style={{ position: "absolute", top: 14, right: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: C.purpleBg, color: C.purple, padding: "3px 8px", borderRadius: 4 }}>{isKo ? "인기" : "Most popular"}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 8, letterSpacing: 0.5 }}>Pro</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.navy, lineHeight: 1, marginBottom: 4 }}>{proDisplayPrice}</div>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 28 }}>{proDisplaySub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {proFeatures.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
            <Btn full
              onClick={isPro ? undefined : handleProStart}
              disabled={isPro || paying === "pro"}
              style={isPro ? { background: C.success, cursor: "default" } : {}}>
              {isPro
                ? (isKo ? "✓ Pro 구독 중" : "✓ Subscribed")
                : paying === "pro" ? (isKo ? "연결 중..." : "Loading...") : (isKo ? "Pro 구독 시작하기 →" : "Start Pro →")}
            </Btn>
          </div>

          {/* Enterprise */}
          <div onMouseEnter={() => setHoveredCard("enterprise")} onMouseLeave={() => setHoveredCard(null)}
            style={{ background: C.white, border: `1.5px solid ${hoveredCard === "enterprise" ? C.purple : C.border}`, borderRadius: 20, padding: "32px 28px", boxShadow: S.standard, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", transform: hoveredCard === "enterprise" ? "scale(1.015)" : "scale(1)", filter: hoveredCard === "enterprise" ? "brightness(1.03)" : "brightness(1)", transition: "transform 0.15s ease-out, filter 0.15s ease-out, border-color 0.15s ease-out" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.body, marginBottom: 8, letterSpacing: 0.5 }}>Enterprise</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, lineHeight: 1.2, marginBottom: 4 }}>{isKo ? "맞춤 요금" : "Custom pricing"}</div>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 28 }}>{isKo ? "연간 계약 · 대량 할인 가능" : "Annual contract · volume discounts available"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {enterpriseFeatures.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
            <Btn full onClick={() => go("support")}>{isKo ? "영업팀 문의 →" : "Contact sales →"}</Btn>
          </div>
        </div>

        {/* 크레딧 추가 구매 */}
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: "0 0 8px" }}>
              {isKo ? "크레딧 추가 구매" : "Buy more credits"}
            </h2>
            <p style={{ fontSize: 13, color: C.body, margin: 0 }}>
              {isKo ? "일회성 결제로 크레딧을 충전하세요. 구독과 별개로 사용할 수 있어요." : "One-time purchase, use anytime alongside your subscription."}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {CREDIT_PACKAGES.map(pkg => (
              <div key={pkg.id}
                style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
                {(isKo ? pkg.badge : pkg.badgeEn) && (
                  <span style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 700, background: C.purpleBg, color: C.purple, padding: "2px 7px", borderRadius: 4 }}>
                    {isKo ? pkg.badge : pkg.badgeEn}
                  </span>
                )}
                <div style={{ fontSize: 11, fontWeight: 600, color: C.body, letterSpacing: 0.4, marginBottom: 4 }}>
                  {isKo ? "크레딧 충전" : "Credit Pack"}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.navy }}>{isKo ? pkg.label : pkg.labelEn}</div>
                <div style={{ fontSize: 12, color: C.body, marginBottom: 16 }}>{isKo ? pkg.credits : pkg.creditsEn}</div>
                <button
                  disabled={!!paying}
                  onClick={() => handleCreditPurchase(pkg)}
                  style={{ padding: "10px 0", borderRadius: 8, border: `1.5px solid ${C.purple}`, background: paying === pkg.id ? C.purpleBg : "transparent", color: C.purple, fontSize: 13, fontWeight: 600, cursor: paying ? "wait" : "pointer", fontFamily: F, transition: "background 0.15s" }}>
                  {paying === pkg.id ? (isKo ? "결제창 열기..." : "Opening...") : (isKo ? "충전하기" : "Buy now")}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
