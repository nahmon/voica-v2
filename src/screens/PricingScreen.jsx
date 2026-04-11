import { C, S, F } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PricingScreen({ go, user, logout }) {
  const isMobile = useIsMobile();

  const plans = [
    {
      id: "starter", name: "스타터", desc: "검증 단계 · 소규모 팀",
      price: "무료", priceSub: "신용카드 불필요",
      sessions: "월 5건",
      panelRecruit: "셀프 모집",
      aiReport: "기본 요약",
      recordTime: "질문당 2분",
      teamMembers: "1명",
      dataRetention: "30일",
      features: [
        "테마 자동 분류 (최대 5개)",
        "감성 분석 (긍정 / 부정 / 중립)",
        "주요 키워드 클라우드",
        "응답 원문 열람",
        "CSV 다운로드",
      ],
      cta: "무료 시작", ctaAction: "advertiser_login",
      highlight: false, color: C.navy,
    },
    {
      id: "pro", name: "프로", desc: "정기 리서치 · 브랜드 · 에이전시",
      price: "월 99,000원", priceSub: "연간 결제 시 20% 할인",
      sessions: "월 20건",
      panelRecruit: "AI 매칭 + 셀프",
      aiReport: "심층 분석 + 인사이트",
      recordTime: "질문당 5분",
      teamMembers: "5명",
      dataRetention: "1년",
      features: [
        "테마 분류 + 하위 테마 드릴다운",
        "감성 분석 + 세그먼트 비교",
        "대표 발화 인용문 자동 추출",
        "크로스탭 분석 (조건별 비교)",
        "인사이트 요약 내러티브",
        "CSV / PDF 다운로드",
      ],
      cta: "문의하기", ctaAction: "support",
      highlight: true, color: C.purple,
    },
    {
      id: "enterprise", name: "엔터프라이즈", desc: "대규모 리서치 · 그룹사 · 컨설팅",
      price: "별도 문의", priceSub: "맞춤 견적 제공",
      sessions: "무제한",
      panelRecruit: "전담 리크루팅",
      aiReport: "커스텀 리포트",
      recordTime: "무제한",
      teamMembers: "무제한",
      dataRetention: "영구",
      features: [
        "프로 전체 포함",
        "트렌드 추이 비교 (기간별)",
        "경쟁 브랜드 언급 분석",
        "세그먼트별 리포트 분리 출력",
        "PPT / PDF 슬라이드 자동 생성",
        "Slack · Notion API 연동",
        "전용 CSM 배정",
        "SLA 99.9%",
      ],
      cta: "문의하기", ctaAction: "support",
      highlight: false, color: C.purpleDeep,
    },
  ];

  const specRows = [
    { label: "인터뷰 수", key: "sessions" },
    { label: "패널 모집", key: "panelRecruit" },
    { label: "AI 분석 리포트", key: "aiReport" },
    { label: "녹음 시간", key: "recordTime" },
    { label: "팀 멤버", key: "teamMembers" },
    { label: "데이터 보관", key: "dataRetention" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, fontFeatureSettings: '"ss01"' }}>
      <GlobalNav go={go} activeTab="pricing" variant={user ? "app" : "public"} user={user} logout={logout} />

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 24px 44px", background: C.white, position: "relative", overflow: "hidden", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ position: "absolute", top: -80, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.07),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(87,139,250,0.06),transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <Badge variant="purple" style={{ marginBottom: 16 }}>요금제</Badge>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.08 }}>
          팀에 맞는 플랜을 선택하세요
        </h1>
        <p style={{ fontSize: 15, color: C.body, margin: 0 }}>
          리서치 규모와 필요한 기능에 따라 최적의 플랜을 찾아보세요
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── 플랜 카드 ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16, marginBottom: 64 }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ background: plan.highlight ? C.purple : C.white, border: `1px solid ${plan.highlight ? C.purple : C.border}`, borderRadius: 16, padding: "28px 26px", boxShadow: plan.highlight ? S.elevated : S.standard, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              {plan.highlight && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.purpleLight},${C.magenta})` }} />}
              {plan.highlight && <div style={{ position: "absolute", top: 14, right: 14 }}><span style={{ fontSize: 10, fontWeight: 600, background: "rgba(255,255,255,0.2)", color: C.white, padding: "3px 8px", borderRadius: 4 }}>가장 인기</span></div>}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.6)" : C.body, marginBottom: 6, letterSpacing: 0.5 }}>{plan.name.toUpperCase()}</div>
                <div style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.7)" : C.body, lineHeight: 1.5, marginBottom: 12 }}>{plan.desc}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: plan.highlight ? C.white : C.navy, lineHeight: 1.1 }}>{plan.price}</div>
                <div style={{ fontSize: 11, color: plan.highlight ? "rgba(255,255,255,0.5)" : C.body, marginTop: 4 }}>{plan.priceSub}</div>
              </div>

              {/* Spec rows */}
              <div style={{ marginBottom: 18 }}>
                {specRows.map(row => (
                  <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${plan.highlight ? "rgba(255,255,255,0.1)" : C.border}` }}>
                    <span style={{ fontSize: 12, color: plan.highlight ? "rgba(255,255,255,0.5)" : C.body }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: plan.highlight ? C.white : C.navy }}>{plan[row.key]}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div style={{ marginBottom: 22, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.5)" : C.label, marginBottom: 9 }}>포함 기능</div>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: plan.highlight ? C.purpleLight : C.success, marginTop: 2, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 12, color: plan.highlight ? "rgba(255,255,255,0.8)" : C.body, lineHeight: 1.45 }}>{f}</span>
                  </div>
                ))}
              </div>

              <Btn full variant={plan.highlight ? "white" : "primary"} style={{ marginTop: "auto", ...(plan.highlight ? { color: C.purple, fontWeight: 600 } : {}) }}
                onClick={() => go(plan.ctaAction)}>
                {plan.cta}
              </Btn>
            </div>
          ))}
        </div>

        {/* ── 기능 비교표 ── */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: C.navy, textAlign: "center", marginBottom: 28 }}>플랜별 상세 비교</h2>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: S.standard }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    <th style={{ textAlign: "left", padding: "14px 20px", color: C.body, fontWeight: 500, minWidth: 160 }}>기능</th>
                    {plans.map(p => (
                      <th key={p.id} style={{ textAlign: "center", padding: "14px 16px", color: p.highlight ? C.purple : C.navy, fontWeight: 700, minWidth: 120 }}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specRows.map((row, i) => (
                    <tr key={row.key} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.white }}>
                      <td style={{ padding: "12px 20px", color: C.label, fontWeight: 500 }}>{row.label}</td>
                      {plans.map(p => (
                        <td key={p.id} style={{ textAlign: "center", padding: "12px 16px", color: C.navy, fontWeight: 600 }}>{p[row.key]}</td>
                      ))}
                    </tr>
                  ))}
                  {[
                    { label: "테마 분류", vals: ["기본 (5개)", "하위 테마 드릴다운", "하위 테마 드릴다운"] },
                    { label: "감성 분석", vals: ["긍정/부정/중립", "+ 세그먼트 비교", "+ 세그먼트 비교"] },
                    { label: "인용문 추출", vals: ["—", "✓", "✓"] },
                    { label: "크로스탭 분석", vals: ["—", "✓", "✓"] },
                    { label: "트렌드 비교", vals: ["—", "—", "✓"] },
                    { label: "경쟁사 언급 분석", vals: ["—", "—", "✓"] },
                    { label: "PPT/PDF 슬라이드", vals: ["—", "—", "자동 생성"] },
                    { label: "API 연동", vals: ["—", "—", "Slack · Notion"] },
                    { label: "전용 CSM", vals: ["—", "—", "✓"] },
                    { label: "SLA", vals: ["—", "—", "99.9%"] },
                  ].map((row, i) => (
                    <tr key={row.label} style={{ borderBottom: `1px solid ${C.border}`, background: (specRows.length + i) % 2 === 0 ? C.bg : C.white }}>
                      <td style={{ padding: "12px 20px", color: C.label, fontWeight: 500 }}>{row.label}</td>
                      {row.vals.map((v, j) => (
                        <td key={j} style={{ textAlign: "center", padding: "12px 16px", color: v === "—" ? C.border : v === "✓" ? C.success : C.navy, fontWeight: v === "—" ? 400 : 600, fontSize: v === "✓" ? 16 : 13 }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 전문 분석가 애드온 ── */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap", boxShadow: S.standard }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Badge variant="purple" style={{ marginBottom: 14 }}>애드온</Badge>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: "0 0 10px" }}>전문 분석가 심층 리뷰</h3>
            <p style={{ fontSize: 13, color: C.body, lineHeight: 1.7, margin: "0 0 18px" }}>
              AI 리포트에 전담 분석가가 직접 붙어 맥락을 읽고 전략적 인사이트를 제공합니다.<br />
              경쟁사 포지셔닝, 전략적 함의, 후속 액션까지 코멘트해 드립니다.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["리포트 심층 코멘트", "전략적 시사점 도출", "후속 리서치 제안", "화상 브리핑 (선택)"].map(t => (
                <span key={t} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 4, background: "rgba(83,58,253,0.08)", color: C.purple, border: "1px solid rgba(83,58,253,0.2)" }}>{t}</span>
              ))}
            </div>
          </div>
          <Btn onClick={() => go("support")}>문의하기</Btn>
        </div>

      </div>
    </div>
  );
}
