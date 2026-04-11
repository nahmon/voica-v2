import { useState } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PricingScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [billing, setBilling] = useState("monthly");

  const credits = [
    { id: "c50",  label: "스타터 팩",   count: 50,  price: 79000,  unit: 1580, badge: null,      highlight: false },
    { id: "c150", label: "스탠다드 팩", count: 150, price: 179000, unit: 1193, badge: "인기",     highlight: true  },
    { id: "c500", label: "볼륨 팩",     count: 500, price: 490000, unit: 980,  badge: "38% 절약", highlight: false },
  ];

  const proMonthly = 99000;
  const proYearlyTotal = Math.round(proMonthly * 12 * 0.8);
  const proDisplayPrice = billing === "yearly"
    ? `${Math.round(proYearlyTotal / 12).toLocaleString()}원/월`
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
        <p style={{ fontSize: 15, color: C.body, margin: 0 }}>건별 충전 · 월간/연간 구독 · 대규모 맞춤 계약</p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── Section 1: 건별 충전 ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 6 }}>건별 충전</div>
            <div style={{ fontSize: 14, color: C.body }}>구독 없이 응답 수를 크레딧으로 구매하세요. 1응답 = 참여자 1명 완료 기준. 유효기간 1년.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {credits.map(c => (
              <div key={c.id} style={{ background: c.highlight ? C.purple : C.white, border: `1px solid ${c.highlight ? C.purple : C.border}`, borderRadius: 16, padding: "28px 26px", boxShadow: c.highlight ? S.elevated : S.standard, position: "relative", overflow: "hidden" }}>
                {c.highlight && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.purpleLight},#f96bee)` }} />}
                {c.badge && (
                  <span style={{ position: "absolute", top: 16, right: 16, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: c.highlight ? "rgba(255,255,255,0.2)" : C.purpleBg, color: c.highlight ? C.white : C.purple }}>
                    {c.badge}
                  </span>
                )}
                <div style={{ fontSize: 12, fontWeight: 600, color: c.highlight ? "rgba(255,255,255,0.6)" : C.body, marginBottom: 8, letterSpacing: 0.5 }}>{c.label.toUpperCase()}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: c.highlight ? C.white : C.navy, lineHeight: 1, marginBottom: 4 }}>
                  {c.count}<span style={{ fontSize: 16, fontWeight: 500, marginLeft: 4 }}>응답</span>
                </div>
                <div style={{ fontSize: 13, color: c.highlight ? "rgba(255,255,255,0.5)" : C.body, marginBottom: 20 }}>응답당 {c.unit.toLocaleString()}원</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: c.highlight ? C.white : C.navy, marginBottom: 4 }}>{c.price.toLocaleString()}원</div>
                <div style={{ fontSize: 11, color: c.highlight ? "rgba(255,255,255,0.45)" : C.body, marginBottom: 24 }}>부가세 별도 · 유효기간 1년</div>
                <Btn full variant={c.highlight ? "white" : "primary"} style={c.highlight ? { color: C.purple, fontWeight: 700 } : {}} onClick={() => go("advertiser_login")}>
                  구매하기
                </Btn>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 2: PRO 구독 ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 6 }}>PRO 구독</div>
            <div style={{ fontSize: 14, color: C.body }}>월 100응답 + AI 심층 분석 + 팀 기능. 정기 리서치 팀에 최적.</div>
          </div>

          {/* Billing toggle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
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

          <div style={{ maxWidth: 480, margin: "0 auto", background: C.white, border: `2px solid ${C.purple}`, borderRadius: 20, padding: "36px 32px", boxShadow: S.elevated, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.purple},#f96bee)` }} />
            <div style={{ position: "absolute", top: 14, right: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: C.purpleBg, color: C.purple, padding: "3px 8px", borderRadius: 4 }}>가장 인기</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 6, letterSpacing: 0.5 }}>PRO</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.navy, lineHeight: 1, marginBottom: 4 }}>{proDisplayPrice}</div>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 24 }}>{proDisplaySub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[
                "월 100응답 포함 (초과 시 응답당 980원)",
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
            <Btn full onClick={() => go("support")}>PRO 시작하기 →</Btn>
          </div>
        </div>

        {/* ── Section 3: 엔터프라이즈 ── */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: isMobile ? "28px 24px" : "40px 44px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap", boxShadow: S.standard }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Badge variant="neutral" style={{ marginBottom: 14 }}>엔터프라이즈</Badge>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: "0 0 10px" }}>대규모 · 그룹사 · 컨설팅</h3>
            <p style={{ fontSize: 14, color: C.body, lineHeight: 1.7, margin: "0 0 18px" }}>
              연간 계약 기반으로 대량 인터뷰를 가장 낮은 단가에 이용하세요.<br />
              전담 CSM · 커스텀 리포트 · SLA 99.9% 보장. 할인율은 볼륨에 따라 협의.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["무제한 인터뷰", "전담 CSM 배정", "커스텀 리포트", "SLA 99.9%", "PPT 슬라이드 자동생성", "Slack·Notion 연동"].map(t => (
                <span key={t} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, background: C.bg, color: C.label, border: `1px solid ${C.border}` }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: isMobile ? "left" : "right", flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: C.body, marginBottom: 6 }}>연간 계약 · 볼륨 할인 협의</div>
            <Btn onClick={() => go("support")}>견적 문의하기 →</Btn>
          </div>
        </div>

      </div>
      <Footer go={go} />
    </div>
  );
}
