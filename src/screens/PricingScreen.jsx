import { useState } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PricingScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [billing, setBilling] = useState("monthly");

  const proMonthly = 179000;
  const proYearlyMonthly = Math.round(proMonthly * 0.8);
  const proYearlyTotal = proYearlyMonthly * 12;
  const proDisplayPrice = billing === "yearly"
    ? `${proYearlyMonthly.toLocaleString()}원/월`
    : `${proMonthly.toLocaleString()}원/월`;
  const proDisplaySub = billing === "yearly"
    ? `연 ${proYearlyTotal.toLocaleString()}원 청구 · 20% 절약`
    : "매월 청구 · 언제든 해지";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, fontFeatureSettings: '"ss01"' }}>
      <GlobalNav go={go} activeTab="pricing" variant={user ? "app" : "public"} user={user} logout={logout} />

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 24px 44px", background: C.white, borderBottom: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.07),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <Badge variant="purple" style={{ marginBottom: 16 }}>요금제</Badge>
        <h1 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.08 }}>필요한 만큼만, 원하는 방식으로</h1>
        <p style={{ fontSize: 15, color: C.body, margin: 0 }}>팀 규모에 맞는 플랜을 선택하세요</p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Billing toggle — Pro tier only */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
            {[["monthly", "월간 결제"], ["yearly", "연간 결제"]].map(([val, label]) => (
              <button key={val} onClick={() => setBilling(val)}
                style={{ padding: "6px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontFamily: F, fontWeight: billing === val ? 600 : 400, background: billing === val ? C.white : "transparent", color: billing === val ? C.navy : C.body, boxShadow: billing === val ? S.ambient : "none", transition: "all 0.15s" }}>
                {label}
                {val === "yearly" && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: C.success }}>20% 할인</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 2-tier grid */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 20, alignItems: "stretch", maxWidth: 780, margin: "0 auto" }}>

          {/* Tier 1 — Pro (highlighted) */}
          <div style={{ background: C.white, border: `2px solid ${C.purple}`, borderRadius: 20, padding: "32px 28px", boxShadow: S.elevated, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.purple},#f96bee)` }} />
            <div style={{ position: "absolute", top: 14, right: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: C.purpleBg, color: C.purple, padding: "3px 8px", borderRadius: 4 }}>가장 인기</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 8, letterSpacing: 0.5 }}>프로</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.navy, lineHeight: 1, marginBottom: 4 }}>{proDisplayPrice}</div>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 28 }}>{proDisplaySub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {[
                "월 500응답 포함 (초과 시 응답당 490원)",
                "AI 심층 분석 + 테마 드릴다운",
                "대표 발화 인용문 자동 추출",
                "크로스탭 분석 · 세그먼트 비교",
                "CSV / PDF 다운로드",
                "팀 멤버 5명",
                "데이터 보관 1년",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
            <Btn full onClick={() => go("advertiser_login")}>Pro 시작하기 →</Btn>
          </div>

          {/* Tier 2 — Enterprise */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px", boxShadow: S.standard, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.body, marginBottom: 8, letterSpacing: 0.5 }}>엔터프라이즈</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, lineHeight: 1.2, marginBottom: 4 }}>맞춤 견적</div>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 28 }}>연간 계약 · 볼륨 할인 협의</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {[
                "무제한 인터뷰",
                "전담 CSM 배정",
                "커스텀 리포트",
                "SLA 99.9%",
                "PPT 슬라이드 자동생성",
                "Slack·Notion 연동",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
            <Btn full onClick={() => go("support")}>도입 문의하기 →</Btn>
          </div>

        </div>
      </div>
      <Footer go={go} />
    </div>
  );
}
