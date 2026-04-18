import { useState } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PricingScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [billing, setBilling] = useState("monthly");
  const [lang, setLang] = useState("ko");
  const isKo = lang === "ko";

  const proMonthly = 149;
  const proYearlyMonthly = Math.round(proMonthly * 0.8);
  const proYearlyTotal = proYearlyMonthly * 12;
  const proKrwMonthly = 199000;
  const proKrwYearlyMonthly = 159000;
  const proKrwYearlyTotal = proKrwYearlyMonthly * 12;
  const proDisplayPrice = isKo
    ? (billing === "yearly"
        ? `₩${proKrwYearlyMonthly.toLocaleString("ko-KR")}/월`
        : `₩${proKrwMonthly.toLocaleString("ko-KR")}/월`)
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
    "무제한 인터뷰",
    "전담 CSM",
    "맞춤 리포트",
    "99.9% SLA",
    "PPT 슬라이드 자동 생성",
    "Slack & Notion 연동",
  ] : [
    "Unlimited interviews",
    "Dedicated CSM",
    "Custom reports",
    "99.9% SLA",
    "Auto-generated PPT slides",
    "Slack & Notion integration",
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, fontFeatureSettings: '"ss01"' }}>
      <GlobalNav go={go} activeTab="pricing" variant={user ? "app" : "public"} user={user} logout={logout} lang={lang} />

      <div style={{ textAlign: "center", padding: "60px 24px 44px", background: C.white, borderBottom: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.07),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <Badge variant="purple" style={{ marginBottom: 16 }}>{isKo ? "요금제" : "Pricing"}</Badge>
        <h1 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.08 }}>
          {isKo ? "팀이 커질수록 함께 커지는 요금제" : "Simple pricing that scales with you"}
        </h1>
        <p style={{ fontSize: 15, color: C.body, margin: 0 }}>
          {isKo ? "우리 팀에 딱 맞는 플랜을 골라보세요" : "Choose the plan that fits your team"}
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 20, alignItems: "stretch", maxWidth: 780, margin: "0 auto" }}>

          <div style={{ background: C.white, border: `2px solid ${C.purple}`, borderRadius: 20, padding: "32px 28px", boxShadow: S.elevated, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.purple},#f96bee)` }} />
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
            <Btn full onClick={() => go("advertiser_login")}>{isKo ? "Pro 시작하기 →" : "Start Pro →"}</Btn>
          </div>

          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px", boxShadow: S.standard, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
      </div>
      <Footer go={go} lang={lang} onLangChange={setLang} />
    </div>
  );
}
