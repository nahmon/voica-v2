import { useState, useEffect } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, Footer, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";



export default function PricingScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const isMobile = useIsMobile();
  const { showToast } = useToast();
  const [billing, setBilling] = useState("monthly");
  const [isPro, setIsPro] = useState(false);

  const isKo = lang === "ko";

  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions")
      .select("status").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setIsPro(data?.status === "active"));
  }, [user]);

  // Starter (3건/mo 포함, 연간 10% 할인) — ₩250k/건 기준
  const starterKrwMonthly = 750000;
  const starterKrwYearlyMonthly = 675000;
  const starterKrwYearlyTotal = starterKrwYearlyMonthly * 12;
  const starterDisplayPrice = isKo
    ? (billing === "yearly" ? `₩${starterKrwYearlyMonthly.toLocaleString("ko-KR")}/월` : `₩${starterKrwMonthly.toLocaleString("ko-KR")}/월`)
    : (billing === "yearly" ? "$490/mo" : "$544/mo");
  const starterDisplaySub = billing === "yearly"
    ? (isKo ? `연 ₩${starterKrwYearlyTotal.toLocaleString("ko-KR")} 결제 · 10% 절약` : `$5,886 billed annually · save 10%`)
    : (isKo ? "월간 결제 · 언제든 취소" : "Billed monthly · cancel anytime");
  const starterPlanId = billing === "yearly" ? "starter_yearly" : "starter_monthly";

  // Pro (8건/mo 포함, 연간 10% 할인) — ₩249k/건 기준
  const proKrwMonthly = 1990000;
  const proKrwYearlyMonthly = 1791000;
  const proKrwYearlyTotal = proKrwYearlyMonthly * 12;
  const proDisplayPrice = isKo
    ? (billing === "yearly" ? `₩${proKrwYearlyMonthly.toLocaleString("ko-KR")}/월` : `₩${proKrwMonthly.toLocaleString("ko-KR")}/월`)
    : (billing === "yearly" ? "$1,298/mo" : "$1,443/mo");
  const proDisplaySub = billing === "yearly"
    ? (isKo ? `연 ₩${proKrwYearlyTotal.toLocaleString("ko-KR")} 결제 · 10% 절약` : `$15,576 billed annually · save 10%`)
    : (isKo ? "월간 결제 · 언제든 자유롭게 취소" : "Billed monthly · cancel anytime");
  const proPlanId = billing === "yearly" ? "pro_yearly" : "pro_monthly";

  const starterFeatures = isKo ? [
    "인터뷰 3건/월 포함",
    "AI 기본 분석 · 키워드 추출",
    "데이터 6개월 보관",
    "이메일 지원",
  ] : [
    "3 interviews/mo included",
    "AI basic analysis · keyword extraction",
    "6 months data retention",
    "Email support",
  ];

  const proFeatures = isKo ? [
    "인터뷰 8건/월 포함",
    "AI 심층 분석 · 주제 드릴다운",
    "대표 인용문 자동 추출",
    "크로스탭 분석 · 세그먼트 비교",
    "CSV / PDF 내보내기",
    "팀원 최대 5명",
    "데이터 1년 보관",
  ] : [
    "8 interviews/mo included",
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

  const handlePlanStart = (planId) => {
    if (!user) {
      localStorage.setItem("voica_after_login", "payment_subscribe");
      go("advertiser_login");
      return;
    }
    sessionStorage.setItem("voica_billing", billing);
    sessionStorage.setItem("voica_plan_id", planId);
    go("payment_subscribe");
  };

  const handleProStart = () => handlePlanStart(proPlanId);


  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, fontFeatureSettings: '"ss01"', display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} activeTab="pricing" variant={user ? "app" : "public"} user={user} logout={logout} lang={lang} />

      <div style={{ textAlign: "center", padding: isMobile ? "32px 16px 28px" : "60px 24px 44px", background: C.white, borderBottom: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.07),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <Badge variant="purple" style={{ marginBottom: 16 }}>{isKo ? "요금제" : "Pricing"}</Badge>
        <h1 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.08, wordBreak: "keep-all" }}>
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
                {val === "yearly" && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: C.success }}>{isKo ? "10% 할인" : "10% off"}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16, alignItems: "stretch", maxWidth: 1000, margin: "0 auto 60px" }}>
          {/* Starter */}
          <div onMouseEnter={() => setHoveredCard("starter")} onMouseLeave={() => setHoveredCard(null)}
            style={{ background: C.white, border: `1.5px solid ${hoveredCard === "starter" ? C.purple : C.border}`, borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", transform: hoveredCard === "starter" ? "scale(1.015)" : "scale(1)", transition: "transform 0.15s ease-out, border-color 0.15s ease-out" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.body, marginBottom: 8, letterSpacing: 0.5 }}>Starter</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.navy, lineHeight: 1, marginBottom: 4 }}>{starterDisplayPrice}</div>
            <div style={{ fontSize: 11, color: C.body, marginBottom: 24 }}>{starterDisplaySub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24, flex: 1 }}>
              {starterFeatures.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.body, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
            <Btn full variant="ghost" onClick={() => handlePlanStart(starterPlanId)}>
              {isKo ? "Starter 시작하기 →" : "Get Started →"}
            </Btn>
          </div>

          {/* Pro */}
          <div onMouseEnter={() => setHoveredCard("pro")} onMouseLeave={() => setHoveredCard(null)}
            style={{ background: C.white, border: `2px solid ${C.purple}`, borderRadius: 20, padding: "28px 24px", position: "relative", display: "flex", flexDirection: "column", transform: hoveredCard === "pro" ? "scale(1.02)" : "scale(1.01)", transition: "transform 0.15s ease-out" }}>
            <div style={{ position: "absolute", top: 14, right: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: C.purpleBg, color: C.purple, padding: "3px 8px", borderRadius: 4 }}>{isKo ? "인기" : "Most popular"}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 8, letterSpacing: 0.5 }}>Pro</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.navy, lineHeight: 1, marginBottom: 4 }}>{proDisplayPrice}</div>
            <div style={{ fontSize: 11, color: C.body, marginBottom: 24 }}>{proDisplaySub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24, flex: 1 }}>
              {proFeatures.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
            <Btn full onClick={isPro ? undefined : handleProStart} disabled={isPro} style={isPro ? { background: C.success, cursor: "default" } : {}}>
              {isPro ? (isKo ? "✓ Pro 구독 중" : "✓ Subscribed") : (isKo ? "Pro 구독 시작하기 →" : "Start Pro →")}
            </Btn>
          </div>

          {/* Enterprise */}
          <div onMouseEnter={() => setHoveredCard("enterprise")} onMouseLeave={() => setHoveredCard(null)}
            style={{ background: C.white, border: `1.5px solid ${hoveredCard === "enterprise" ? C.purple : C.border}`, borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", transform: hoveredCard === "enterprise" ? "scale(1.015)" : "scale(1)", transition: "transform 0.15s ease-out, border-color 0.15s ease-out" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.body, marginBottom: 8, letterSpacing: 0.5 }}>Enterprise</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, lineHeight: 1.2, marginBottom: 4 }}>{isKo ? "맞춤 요금" : "Custom pricing"}</div>
            <div style={{ fontSize: 11, color: C.body, marginBottom: 24 }}>{isKo ? "연간 계약 · 대량 할인" : "Annual contract · volume discounts"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24, flex: 1 }}>
              {enterpriseFeatures.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.body, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
            <Btn full variant="ghost" onClick={() => go("support")}>{isKo ? "영업팀 문의 →" : "Contact sales →"}</Btn>
          </div>
        </div>


      </div>
      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
