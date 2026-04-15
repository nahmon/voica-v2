import { useState, useEffect, useRef } from "react";

// ─── Design Tokens ───
const C = {
  purple: "#533afd", purpleHover: "#4434d4", purpleDeep: "#2e2b8c",
  purpleLight: "#b9b9f9", purpleBg: "rgba(83,58,253,0.05)",
  navy: "#061b31", label: "#273951", body: "#64748d",
  white: "#ffffff", brandDark: "#1c1e54", border: "#e5edf5",
  success: "#15be53", successText: "#108c3d",
  successBg: "rgba(21,190,83,0.18)", successBorder: "rgba(21,190,83,0.4)",
  ruby: "#ea2261", magenta: "#f96bee", bg: "#f8fafc",
  interviewBg: "#07081a",
};
const S = {
  elevated: "rgba(50,50,93,0.25) 0px 30px 45px -30px,rgba(0,0,0,0.1) 0px 18px 36px -18px",
  standard: "rgba(23,23,23,0.08) 0px 15px 35px 0px",
  ambient: "rgba(23,23,23,0.06) 0px 3px 6px",
  deep: "rgba(3,3,39,0.25) 0px 14px 21px -14px,rgba(0,0,0,0.1) 0px 8px 17px -8px",
};
const F = `'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif`;

// ─── Mock Data ───
const PROJECTS = [
  { id: 1, name: "앱 사용성 인터뷰 Q2", status: "진행 중", goal: 300, done: 187, questions: 5, date: "2026.04.08", themes: 4 },
  { id: 2, name: "신제품 컨셉 테스트", status: "모집 중", goal: 500, done: 312, questions: 6, date: "2026.04.05", themes: 0 },
  { id: 3, name: "브랜드 인식 조사 Q1", status: "완료", goal: 200, done: 200, questions: 8, date: "2026.03.28", themes: 6 },
];
const QUESTIONS = [
  { id: 1, text: "안녕하세요! 오늘 인터뷰에 참여해 주셔서 감사합니다. 먼저 본인의 직업과 주로 하시는 업무를 간단히 소개해 주시겠어요?", label: "오프닝", duration: 60, visual: null },
  { id: 2, text: "화면에 보이는 앱 온보딩 화면을 보시면서, 처음 사용하셨을 때 어떤 느낌이었나요? 기억나시는 첫인상을 자유롭게 말씀해 주세요.", label: "첫인상", duration: 90, visual: { type: "screenshot", label: "온보딩 화면", tag: "v2.1", screens: ["splash", "signup", "home"] } },
  { id: 3, text: "지금 보여드리는 화면에서 불편하거나 아쉬웠던 점이 있다면 무엇인가요? 구체적인 상황이 있으시면 더욱 좋습니다.", label: "불편함", duration: 90, visual: { type: "screenshot", label: "메인 대시보드", tag: "현재 버전", screens: ["dashboard"] } },
  { id: 4, text: "이 서비스를 가까운 지인에게 추천한다면, 어떤 점을 가장 먼저 이야기하실 것 같으세요?", label: "추천 포인트", duration: 90, visual: null },
  { id: 5, text: "마지막으로 저희 팀에게 자유롭게 하시고 싶은 말씀이 있으시면 편하게 전해 주세요.", label: "클로징", duration: 120, visual: null },
];
const REPORT_THEMES = [
  { label: "기능 효용성", count: 14, pct: 37, sentiment: "positive", color: C.purple, bg: "rgba(83,58,253,0.08)", border: "rgba(83,58,253,0.18)", icon: "✦" },
  { label: "가격 민감도", count: 11, pct: 29, sentiment: "negative", color: C.ruby, bg: "rgba(234,34,97,0.08)", border: "rgba(234,34,97,0.2)", icon: "💰" },
  { label: "온보딩 경험", count: 8, pct: 21, sentiment: "positive", color: C.success, bg: "rgba(21,190,83,0.08)", border: "rgba(21,190,83,0.2)", icon: "🚀" },
  { label: "데이터 Export", count: 5, pct: 13, sentiment: "negative", color: C.magenta, bg: "rgba(249,107,238,0.08)", border: "rgba(249,107,238,0.2)", icon: "📤" },
];
const MOCK_TRANSCRIPTS = [
  { qId: 1, text: "저는 스타트업에서 UX 리서처로 일하고 있어요. 주로 사용자 인터뷰와 사용성 테스트를 담당합니다.", sentiment: "neutral" },
  { qId: 2, text: "처음에는 생각보다 훨씬 직관적이어서 놀랐어요. 특히 온보딩이 굉장히 매끄럽게 느껴졌습니다.", sentiment: "positive" },
  { qId: 3, text: "가격이 조금 부담스러웠어요. 팀 요금제가 있으면 좋겠고, 데이터 내보내기 기능도 더 다양했으면 합니다.", sentiment: "negative" },
  { qId: 4, text: "시간을 엄청 아껴준다고 이야기할 것 같아요. 예전에는 정리하는 데만 두세 시간이 걸렸거든요.", sentiment: "positive" },
  { qId: 5, text: "계속 잘 만들어 주세요. 리서치 업계에 꼭 필요한 서비스라고 생각합니다.", sentiment: "positive" },
];

// ─── Panel Board Mock Data ───
const PANEL_JOBS = [
  { id: 1, title: "앱 사용성 인터뷰", company: "핀테크 스타트업 A", duration: "약 10분", reward: "3,000원", conditions: ["20~40대", "스마트폰 앱 사용자"], deadline: "2026.04.15", filled: 187, total: 300, category: "테크", urgent: true },
  { id: 2, title: "신제품 브랜드 인식 조사", company: "뷰티 브랜드 B", duration: "약 15분", reward: "5,000원", conditions: ["20~35세 여성", "뷰티 제품 관심자"], deadline: "2026.04.20", filled: 312, total: 500, category: "뷰티", urgent: false },
  { id: 3, title: "OTT 서비스 만족도 인터뷰", company: "엔터테인먼트 C", duration: "약 8분", reward: "2,000원", conditions: ["전 연령", "OTT 구독 경험"], deadline: "2026.04.12", filled: 91, total: 100, category: "미디어", urgent: true },
  { id: 4, title: "식품 소비 패턴 인터뷰", company: "식품 기업 D", duration: "약 12분", reward: "4,000원", conditions: ["30~50대", "주 1회 이상 온라인 장보기"], deadline: "2026.04.25", filled: 78, total: 400, category: "식품", urgent: false },
  { id: 5, title: "금융 앱 UX 리서치", company: "은행 계열사 E", duration: "약 20분", reward: "8,000원", conditions: ["25~45세", "모바일 뱅킹 사용자"], deadline: "2026.04.18", filled: 143, total: 200, category: "금융", urgent: false },
  { id: 6, title: "교육 플랫폼 학습 경험 조사", company: "에듀테크 F", duration: "약 10분", reward: "3,500원", conditions: ["학부모 또는 학생", "온라인 강의 수강 경험"], deadline: "2026.04.30", filled: 34, total: 150, category: "교육", urgent: false },
  { id: 7, title: "의료 AI 진단 보조 도구 평가", company: "헬스케어 스타트업 G", duration: "약 25분", reward: "120,000원", conditions: ["의사·간호사·의료진", "임상 경력 3년 이상"], deadline: "2026.04.22", filled: 18, total: 50, category: "전문가", urgent: false, expert: true, expertTag: "의료" },
  { id: 8, title: "스타트업 투자 의사결정 프로세스 인터뷰", company: "VC 리서치 H", duration: "약 30분", reward: "200,000원", conditions: ["VC·엔젤투자자·심사역", "투자 집행 경험"], deadline: "2026.04.18", filled: 7, total: 30, category: "전문가", urgent: true, expert: true, expertTag: "투자" },
  { id: 9, title: "법률 SaaS 사용성 검토", company: "리걸테크 I", duration: "약 20분", reward: "150,000원", conditions: ["변호사·법무사·로클럭", "기업 법무 경험"], deadline: "2026.04.28", filled: 11, total: 40, category: "전문가", urgent: false, expert: true, expertTag: "법률" },
  { id: 10, title: "B2B SaaS 구매 의사결정 인터뷰", company: "엔터프라이즈 J", duration: "약 20분", reward: "80,000원", conditions: ["IT 구매 담당자·CTO·팀장급 이상", "솔루션 도입 경험"], deadline: "2026.05.02", filled: 29, total: 100, category: "전문가", urgent: false, expert: true, expertTag: "기업 IT" },
];

const PANEL_APPLICANTS = [
  { id: 1, name: "김○○", age: "30대", gender: "여성", applied: "2026.04.07 14:32", status: "신청", score: 92, intv: 3 },
  { id: 2, name: "이○○", age: "20대", gender: "남성", applied: "2026.04.07 15:10", status: "적합", score: 88, intv: 1 },
  { id: 3, name: "박○○", age: "40대", gender: "여성", applied: "2026.04.07 16:44", status: "적합", score: 95, intv: 7 },
  { id: 4, name: "최○○", age: "30대", gender: "남성", applied: "2026.04.08 09:12", status: "신청", score: 74, intv: 0 },
  { id: 5, name: "정○○", age: "20대", gender: "여성", applied: "2026.04.08 10:03", status: "부적합", score: 45, intv: 2 },
  { id: 6, name: "강○○", age: "50대", gender: "남성", applied: "2026.04.08 11:20", status: "완료", score: 91, intv: 5 },
  { id: 7, name: "윤○○", age: "30대", gender: "여성", applied: "2026.04.08 13:05", status: "신청", score: 83, intv: 4 },
];

// ─── Shared UI ───
function Badge({ children, variant = "neutral", style: sx = {} }) {
  const v = {
    neutral: { background: C.white, color: C.navy, border: `1px solid ${C.border}` },
    purple: { background: C.purpleBg, color: C.purple, border: `1px solid ${C.purpleLight}` },
    ai: { background: "linear-gradient(135deg,rgba(83,58,253,0.08),rgba(249,107,238,0.08))", color: C.purpleDeep, border: `1px solid ${C.purpleLight}` },
    success: { background: C.successBg, color: C.successText, border: `1px solid ${C.successBorder}` },
    negative: { background: "rgba(234,34,97,0.1)", color: C.ruby, border: `1px solid rgba(234,34,97,0.25)` },
    warning: { background: "rgba(251,191,36,0.12)", color: "#92650a", border: "1px solid rgba(251,191,36,0.3)" },
    dark: { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" },
  };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 400, fontFamily: F, fontFeatureSettings: '"ss01"', whiteSpace: "nowrap", ...v[variant], ...sx }}>{children}</span>;
}

function Btn({ children, variant = "primary", size = "md", onClick, disabled, full, style: sx = {} }) {
  const [hov, setHov] = useState(false);
  const sz = { sm: { padding: "5px 12px", fontSize: 13 }, md: { padding: "8px 16px", fontSize: 15 }, lg: { padding: "12px 28px", fontSize: 16 } };
  const vr = {
    primary: { background: disabled ? "#a09de8" : hov ? C.purpleHover : C.purple, color: C.white, border: "none" },
    ghost: { background: hov ? C.purpleBg : "transparent", color: C.purple, border: `1px solid ${C.purpleLight}` },
    dark: { background: hov ? "#2a2d6a" : C.brandDark, color: C.white, border: "none" },
    white: { background: hov ? "rgba(255,255,255,0.9)" : C.white, color: C.navy, border: "none" },
    kakao: { background: hov ? "#e6c200" : "#FEE500", color: "#191919", border: "none" },
    naver: { background: hov ? "#02b351" : "#03C75A", color: C.white, border: "none" },
    toss: { background: hov ? "#0057e0" : "#0064FF", color: C.white, border: "none" },
    naverpay: { background: hov ? "#02b351" : "#03C75A", color: C.white, border: "none" },
    tossspay: { background: hov ? "#0057e0" : "#0064FF", color: C.white, border: "none" },
    stripe: { background: hov ? "#5851d8" : "#635bff", color: C.white, border: "none" },
  };
  return (
    <button disabled={disabled} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer", fontFamily: F, fontFeatureSettings: '"ss01"', fontWeight: 400, transition: "all 0.18s", width: full ? "100%" : "auto", ...sz[size], ...vr[variant], ...sx }}>
      {children}
    </button>
  );
}

function NavTab({ label, onClick, active }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: "relative", display: "flex", alignItems: "center", padding: "0 16px", fontSize: 14, fontFamily: F, fontWeight: active ? 500 : 400, color: active ? C.navy : hov ? C.navy : C.body, background: "transparent", border: "none", cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap" }}>
      {label}
      {/* underline indicator */}
      <span style={{ position: "absolute", bottom: 0, left: 16, right: 16, height: 2, borderRadius: "2px 2px 0 0", background: active ? C.purple : hov ? C.border : "transparent", transition: "background 0.15s" }} />
    </button>
  );
}

function Input({ label, type = "text", placeholder, value, onChange, helper }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 6, fontFamily: F }}>{label}</label>}
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 4, border: `1px solid ${focused ? C.purple : C.border}`, fontSize: 14, fontFamily: F, color: C.navy, outline: "none", boxSizing: "border-box", background: C.white, transition: "border-color 0.15s", boxShadow: focused ? `0 0 0 3px rgba(83,58,253,0.08)` : "none" }}
      />
      {helper && <div style={{ fontSize: 11, color: C.body, marginTop: 4, fontFamily: F }}>{helper}</div>}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 12, color: C.body, fontFamily: F }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function BackBtn({ onClick, label = "홈으로", dark = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontSize: 13, fontFamily: F, fontWeight: 500, color: dark ? (hov ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)") : (hov ? C.navy : C.body), transition: "color 0.15s" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {label}
    </button>
  );
}

function VoicaMark({ size = 20 }) {
  return (
    <svg width={Math.round(size * 0.88)} height={size} viewBox="0 0 28 32" fill="none" style={{ flexShrink: 0, display: "block" }}>
      <defs>
        <linearGradient id="voica-vmark" x1="0" y1="0" x2="28" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#533afd"/>
          <stop offset="55%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#f96bee"/>
        </linearGradient>
      </defs>
      {/* Solid filled V — outer triangle with rounded top corners, inner triangle cut out */}
      <path
        fillRule="evenodd"
        fill="url(#voica-vmark)"
        d="M 4,0 H 24 A 4,4 0 0,1 28,4 L 14,31 L 0,4 A 4,4 0 0,1 4,0 Z M 9.5,0 L 14,25.5 L 18.5,0 Z"
      />
    </svg>
  );
}

// ─── How It Works Carousel ───
function HowItWorksCarousel() {
  const researcherSteps = [
    { icon: "📝", step: "01", title: "질문 설계", desc: "인터뷰 목적과 질문 흐름을 설정합니다. AI가 자연스러운 대화 구조를 제안해 줍니다." },
    { icon: "👥", step: "02", title: "패널 모집", desc: "조건에 맞는 패널을 공고로 모집하고 AI 매칭으로 적합한 참여자를 선정합니다." },
    { icon: "🤖", step: "03", title: "AI 인터뷰 자동 진행", desc: "AI가 24시간 보이스 인터뷰를 진행합니다. 리서처 개입 없이 자동 수집됩니다." },
    { icon: "📊", step: "04", title: "리포트 수령", desc: "테마 분석 · 감성 분류 · 인사이트 요약이 담긴 리포트를 즉시 받아보세요." },
  ];
  const panelSteps = [
    { icon: "🔍", step: "01", title: "모집 공고 탐색", desc: "패널 모집 보드에서 관심 있는 인터뷰 기회를 찾아보세요." },
    { icon: "✅", step: "02", title: "신청 & 선정", desc: "조건을 확인하고 신청합니다. AI가 적합성을 평가해 빠르게 선정합니다." },
    { icon: "🎙️", step: "03", title: "보이스 인터뷰 참여", desc: "링크를 통해 AI와 자연스럽게 대화합니다. 장소 무관, 평균 8분 소요." },
    { icon: "🎁", step: "04", title: "리워드 수령", desc: "인터뷰 완료 후 포인트 리워드가 즉시 지급됩니다." },
  ];

  function Row({ steps, title, sub, accent, scrollRef }) {
    const ref = scrollRef || useRef(null);
    const scroll = (dir) => { ref.current.scrollBy({ left: dir * 260, behavior: "smooth" }); };
    return (
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 500, color: C.navy, letterSpacing: -0.3, marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 13, color: C.body }}>{sub}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["←", "→"].map((arrow, i) => (
              <button key={arrow} onClick={() => scroll(i === 0 ? -1 : 1)}
                style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", fontSize: 13, color: C.body, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.body; }}>
                {arrow}
              </button>
            ))}
          </div>
        </div>
        <div ref={ref} style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: "0 0 240px", background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "22px 20px", boxShadow: S.ambient, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}10, ${S.ambient}`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = S.ambient; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: accent, fontFeatureSettings: '"tnum"' }}>{s.step}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 400, color: C.navy, marginBottom: 8, letterSpacing: -0.2 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rRef = useRef(null);
  const pRef = useRef(null);

  return (
    <section style={{ background: "linear-gradient(180deg,#ffffff 0%,#f0f1ff 40%,#f8fafc 100%)", padding: "72px 24px", borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 500, color: C.navy, letterSpacing: "-0.64px", margin: "0 0 12px", lineHeight: 1.1, fontFamily: F, fontFeatureSettings: '"ss01"' }}>
            Voica를 통해 소비자의 목소리를<br />정확하고 빠르게 들어보세요
          </h2>
          <p style={{ fontSize: 15, color: C.body, margin: 0 }}>리서처와 패널 모두를 위한 완전 자동화 인터뷰 플랫폼</p>
        </div>
        <Row steps={researcherSteps} title="인터뷰를 설계하고 싶다면" sub="질문만 만들면 AI가 수천 명과 대화하고 리포트를 드립니다" accent={C.purple} scrollRef={rRef} />
        <Row steps={panelSteps} title="내 의견을 나누고 리워드를 받고 싶다면" sub="짧은 보이스 인터뷰로 참여하고 즉시 포인트를 받으세요" accent={C.magenta} scrollRef={pRef} />
      </div>
    </section>
  );
}

// ─── SCREEN: 랜딩 ───
function LandingScreen({ go }) {
  return (
    <div style={{ fontFamily: F, fontFeatureSettings: '"ss01"' }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "0 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "stretch", justifyContent: "space-between", height: 56 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, paddingRight: 32, cursor: "pointer" }} onClick={() => go("landing")}>
            <VoicaMark size={20} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><VoicaMark size={20} /><span style={{ fontSize: 19, fontWeight: 500, color: C.navy, letterSpacing: -0.4 }}><span style={{ color: C.purple }}>Vo</span>ica</span></div>
          </div>
          {/* Tab links */}
          <div style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
            {[
              ["서비스 소개", "landing"],
              ["패널 모집 보드", "panel_board"],
              ["요금제", "pricing"],
            ].map(([label, target]) => (
              <NavTab key={label} label={label} onClick={() => go(target)} />
            ))}
          </div>
          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => go("panel_entry")}>패널 등록하기</Btn>
            <Btn size="sm" onClick={() => go("advertiser_login")}>광고주 로그인</Btn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: "linear-gradient(160deg,#fafaff 0%,#f5f0ff 30%,#fff0f8 60%,#ffffff 100%)", padding: "80px 24px 90px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle at 60% 40%,rgba(83,58,253,0.18),rgba(249,107,238,0.10),transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle at 40% 60%,rgba(83,58,253,0.13),rgba(46,43,140,0.08),transparent 70%)", filter: "blur(90px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "40%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(234,34,97,0.06),transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <Badge variant="purple" style={{ marginBottom: 20 }}>✦ AI 보이스 인터뷰 플랫폼</Badge>
          <h1 style={{ fontSize: 50, fontWeight: 700, color: C.navy, lineHeight: 1.15, letterSpacing: "-1.4px", margin: "0 0 18px" }}>
            시간과 비용이 많이 들던<br />
            <span style={{ color: C.body, fontWeight: 500 }}>사용자 인터뷰,</span><br />
            <span style={{ background: `linear-gradient(135deg,${C.purple},${C.magenta})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI로 수천 명을 한 번에.</span>
          </h1>
          <p style={{ fontSize: 17, fontWeight: 400, color: C.body, lineHeight: 1.65, margin: "0 0 40px" }}>
            질문만 설계하세요. AI가 수천 명의 패널과 보이스 인터뷰를 진행하고<br />테마 분석 · 감성 분류 · 인사이트 리포트까지 자동으로 완성합니다.
          </p>
          {/* Two CTA paths */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <div onClick={() => go("advertiser_login")} style={{ cursor: "pointer", padding: "20px 28px", borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, minWidth: 200, transition: "all 0.2s", textAlign: "left", boxShadow: S.ambient }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.purpleLight; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(83,58,253,0.08), ${S.ambient}`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = S.ambient; }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>🎯</div>
              <div style={{ fontSize: 15, fontWeight: 400, color: C.navy, marginBottom: 4 }}>리서처 / 기업</div>
              <div style={{ fontSize: 12, color: C.body, lineHeight: 1.5 }}>인터뷰 설계부터<br />리포트 수령까지</div>
              <div style={{ marginTop: 12, fontSize: 12, color: C.purple }}>시작하기 →</div>
            </div>
            <div onClick={() => go("panel_entry")} style={{ cursor: "pointer", padding: "20px 28px", borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, minWidth: 200, transition: "all 0.2s", textAlign: "left", boxShadow: S.ambient }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(249,107,238,0.4)"; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(249,107,238,0.06), ${S.ambient}`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = S.ambient; }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 15, fontWeight: 400, color: C.navy, marginBottom: 4 }}>Voica 패널</div>
              <div style={{ fontSize: 12, color: C.body, lineHeight: 1.5 }}>보이스로 인터뷰 참여하고<br />리워드 받기</div>
              <div style={{ marginTop: 12, fontSize: 12, color: C.magenta }}>참여하기 →</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "linear-gradient(180deg,#f0f1ff 0%,#f8fafc 100%)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "32px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
          {[["12,400+", "등록된 패널", C.purple], ["4,200건", "이번 달 완료 인터뷰", C.navy], ["94%", "AI 분석 정확도", C.success], ["8분", "평균 인터뷰 시간", C.ruby]].map(([v, l, color]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 600, color, letterSpacing: -0.7, fontFeatureSettings: '"tnum"' }}>{v}</div>
              <div style={{ fontSize: 13, color: C.body, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — Carousel */}
      <HowItWorksCarousel />

      {/* Footer */}
      <footer style={{ background: C.brandDark, padding: "36px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><VoicaMark size={18} /><span style={{ fontSize: 18, fontWeight: 400, color: C.white, letterSpacing: -0.3 }}><span style={{ color: C.purpleLight }}>Vo</span>ica</span></div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>AI가 인터뷰하고, AI가 분석합니다</div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["서비스 소개", "요금제", "패널 참여", "고객 지원"].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── SCREEN: 광고주 로그인 ───
function AdvertiserLoginScreen({ go }) {
  const [tab, setTab] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      {/* Top nav */}
      <div style={{ padding: "0 24px", borderBottom: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
        <BackBtn onClick={() => go("landing")} label="홈으로" />
        <div onClick={() => go("landing")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><VoicaMark size={19} /><span style={{ fontSize: 18, fontWeight: 500, color: C.navy, letterSpacing: -0.4 }}><span style={{ color: C.purple }}>Vo</span>ica</span></div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: C.purpleBg, border: `1px solid ${C.purpleLight}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>🎯</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: C.navy, letterSpacing: -0.4, marginBottom: 6, fontFeatureSettings: '"ss01"' }}>
              {tab === "login" ? "광고주 로그인" : "광고주 회원가입"}
            </div>
            <div style={{ fontSize: 14, color: C.body }}>{tab === "login" ? "인터뷰를 설계하고 인사이트를 받아보세요" : "Voica로 AI 인터뷰를 시작하세요"}</div>
          </div>

          {/* Card */}
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px 28px", boxShadow: S.standard }}>
            {/* Social login */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
              <Btn variant="kakao" full size="md">
                <span style={{ fontSize: 16 }}>💬</span> 카카오로 계속하기
              </Btn>
              <Btn variant="naver" full size="md">
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.5 }}>N</span> 네이버로 계속하기
              </Btn>
              <Btn variant="toss" full size="md">
                <span style={{ fontSize: 13, fontWeight: 800 }}>T</span> 토스로 계속하기
              </Btn>
              <Btn variant="white" full size="md" style={{ border: `1px solid ${C.border}` }}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google로 계속하기
              </Btn>
            </div>

            <Divider label="또는 이메일로" />

            {/* Tab toggle */}
            <div style={{ display: "flex", background: C.bg, borderRadius: 6, padding: 3, marginBottom: 20, marginTop: 16 }}>
              {["login", "signup"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "6px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 13, fontFamily: F, fontWeight: 400, transition: "all 0.15s", background: tab === t ? C.white : "transparent", color: tab === t ? C.navy : C.body, boxShadow: tab === t ? S.ambient : "none" }}>
                  {t === "login" ? "로그인" : "회원가입"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {tab === "signup" && (
                <>
                  <Input label="이름" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} />
                  <Input label="회사 / 브랜드명" placeholder="(주)브랜드랩" value={company} onChange={e => setCompany(e.target.value)} />
                </>
              )}
              <Input label="이메일" type="email" placeholder="hello@brand.com" value={email} onChange={e => setEmail(e.target.value)} />
              <Input label="비밀번호" type="password" placeholder="8자 이상" value={pw} onChange={e => setPw(e.target.value)} helper={tab === "signup" ? "영문, 숫자, 특수문자 포함 8자 이상" : ""} />
            </div>

            {tab === "login" && (
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <a href="#" style={{ fontSize: 12, color: C.purple, textDecoration: "none" }}>비밀번호 찾기</a>
              </div>
            )}

            <Btn full size="lg" style={{ marginTop: 20 }} onClick={() => go("dashboard")}>
              {tab === "login" ? "로그인" : "가입하고 시작하기"}
            </Btn>

            {tab === "signup" && (
              <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                가입 시 <a href="#" style={{ color: C.purple }}>서비스 이용약관</a> 및 <a href="#" style={{ color: C.purple }}>개인정보처리방침</a>에 동의하게 됩니다.
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.body }}>
            {tab === "login" ? (
              <>계정이 없으신가요? <span onClick={() => setTab("signup")} style={{ color: C.purple, cursor: "pointer" }}>회원가입</span></>
            ) : (
              <>이미 계정이 있으신가요? <span onClick={() => setTab("login")} style={{ color: C.purple, cursor: "pointer" }}>로그인</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: 광고주 대시보드 ───
function DashboardScreen({ go }) {
  const statusStyle = {
    "진행 중": { variant: "success", dot: C.success },
    "모집 중": { variant: "warning", dot: "#f59e0b" },
    "완료": { variant: "neutral", dot: C.body },
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      {/* Nav */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><VoicaMark size={20} /><span style={{ fontSize: 19, fontWeight: 500, color: C.navy, letterSpacing: -0.4 }}><span style={{ color: C.purple }}>Vo</span>ica</span></div>
            <div style={{ display: "flex", gap: 2 }}>
              {[["대시보드", "dashboard"], ["프로젝트", "editor"], ["패널 관리", "recruiter_admin"], ["패널 보드", "panel_board"], ["설정", "dashboard"]].map(([m, target], i) => (
                <button key={m} onClick={() => go(target)} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 13, fontFamily: F, border: "none", cursor: "pointer", background: i === 0 ? C.purpleBg : "transparent", color: i === 0 ? C.purple : C.body }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 13, color: C.body }}>김민준 · (주)리서치랩</div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.purpleBg, border: `1px solid ${C.purpleLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: C.purple, cursor: "pointer" }}>김</div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Welcome + new project */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 500, color: C.navy, letterSpacing: -0.5, lineHeight: 1.12, marginBottom: 4, fontFeatureSettings: '"ss01"' }}>안녕하세요, 민준님 👋</div>
            <div style={{ fontSize: 14, color: C.body }}>진행 중인 인터뷰 <strong style={{ fontWeight: 400, color: C.navy }}>1건</strong>, 이번 달 완료 <strong style={{ fontWeight: 400, color: C.navy }}>19건</strong></div>
          </div>
          <Btn onClick={() => go("editor")}>+ 새 프로젝트</Btn>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 32 }}>
          {[
            { label: "전체 프로젝트", value: "3", sub: "이번 달 +1", color: C.purple },
            { label: "누적 인터뷰", value: "31", sub: "패널 응답 완료", color: C.success },
            { label: "평균 완료율", value: "89%", sub: "모집 목표 대비", color: C.navy },
            { label: "이번 달 비용", value: "₩47,000", sub: "전월 대비 +12%", color: C.ruby },
          ].map(stat => (
            <div key={stat.label} style={{ background: C.white, borderRadius: 6, padding: "18px 20px", border: `1px solid ${C.border}`, boxShadow: S.ambient }}>
              <div style={{ fontSize: 11, color: C.body, marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: stat.color, letterSpacing: -0.5, fontFeatureSettings: '"tnum"', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: C.body }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { icon: "👥", title: "패널 리쿠르팅", desc: "지원자 검토 및 승인", screen: "recruiter_admin", badge: "신청 3건", badgeColor: "#f59e0b" },
            { icon: "📋", title: "패널 모집 보드", desc: "공개 모집 공고 관리", screen: "panel_board", badge: "6개 공고", badgeColor: C.purple },
          ].map(item => (
            <div key={item.title} onClick={() => go(item.screen)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px 18px", boxShadow: S.ambient, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.purpleLight; e.currentTarget.style.boxShadow = S.elevated; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = S.ambient; }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 400, color: C.navy, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: C.body }}>{item.desc}</div>
              </div>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: `${item.badgeColor}18`, color: item.badgeColor, border: `1px solid ${item.badgeColor}40`, whiteSpace: "nowrap" }}>{item.badge}</span>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 400, color: C.label }}>프로젝트</div>
          <Btn variant="ghost" size="sm">전체 보기</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PROJECTS.map(p => {
            const pct = Math.round((p.done / p.goal) * 100);
            const st = statusStyle[p.status];
            return (
              <div key={p.id} onClick={() => go(p.status === "완료" ? "report" : "editor")} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: "18px 20px", boxShadow: S.ambient, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = S.elevated; e.currentTarget.style.borderColor = C.purpleLight; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = S.ambient; e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 400, color: C.navy, fontFeatureSettings: '"ss01"' }}>{p.name}</span>
                    <Badge variant={st.variant}>{p.status}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: C.body }}>질문 {p.questions}개 · {p.date}</div>
                </div>
                <div style={{ minWidth: 160 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: C.body }}>패널 달성률</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: pct >= 100 ? C.success : C.navy, fontFeatureSettings: '"tnum"' }}>{p.done}/{p.goal}명</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? C.success : C.purple, borderRadius: 2, transition: "width 0.5s" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {p.status !== "완료" && <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); go("editor"); }}>편집</Btn>}
                  {p.themes > 0 && <Btn size="sm" onClick={e => { e.stopPropagation(); go("report"); }}>리포트</Btn>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ─── SCREEN: 패널 등록 ───
function PanelEntryScreen({ go }) {
  const [step, setStep] = useState(0); // 0: 기본정보, 1: 매칭프로필, 2: 동의
  const [form, setForm] = useState({
    name: "", phone: "", region: "", gender: "", age: "",
    job: "", income: "", interests: [],
  });
  const [agreed, setAgreed] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleInterest = (v) => setForm(f => ({
    ...f,
    interests: f.interests.includes(v) ? f.interests.filter(i => i !== v) : [...f.interests, v],
  }));

  const REGIONS = ["서울", "경기/인천", "부산/경남", "대구/경북", "광주/전라", "대전/충청", "강원", "제주", "해외 거주"];
  const GENDERS = ["남성", "여성", "응답 안 함"];
  const AGES = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
  const JOBS = ["직장인 (대기업/중견)", "직장인 (중소기업)", "프리랜서/자영업", "전문직 (의사·변호사·회계사 등)", "공무원/공기업", "학생", "주부", "구직 중", "기타"];
  const INCOMES = ["없음", "100만원 미만", "100~300만원", "300~500만원", "500~700만원", "700만원 이상", "응답 안 함"];
  const INTERESTS = ["테크/IT", "뷰티/패션", "식품/요식업", "금융/투자", "의료/헬스케어", "교육", "여행/레저", "미디어/엔터테인먼트", "부동산", "자동차/모빌리티", "쇼핑/유통", "스포츠/피트니스", "환경/지속가능성", "법률/세무"];

  const STEPS = ["기본 정보", "매칭 프로필", "동의 및 완료"];
  const step0Valid = form.name && form.phone && form.region && form.gender && form.age;
  const step1Valid = form.job && form.income && form.interests.length > 0;

  function FieldLabel({ children }) {
    return <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.label, marginBottom: 8, fontFamily: F }}>{children}</label>;
  }
  function ChipGroup({ options, value, onSelect, multi }) {
    return (
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {options.map(o => {
          const active = multi ? value.includes(o) : value === o;
          return (
            <button key={o} onClick={() => onSelect(o)}
              style={{ padding: "7px 13px", borderRadius: 6, fontSize: 13, fontFamily: F, cursor: "pointer", border: `1.5px solid ${active ? C.purple : C.border}`, background: active ? C.purple : C.white, color: active ? C.white : C.body, transition: "all 0.15s", fontWeight: active ? 500 : 400 }}>
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  // Progress bar
  function StepBar() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, background: i < step ? C.purple : i === step ? C.purple : C.border, color: i <= step ? C.white : C.body, transition: "all 0.3s" }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === step ? C.purple : C.body, whiteSpace: "nowrap", fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? C.purple : C.border, margin: "0 6px", marginBottom: 18, transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>
    );
  }

  const navBar = (
    <div style={{ padding: "0 24px", borderBottom: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
      {step === 0
        ? <BackBtn onClick={() => go("landing")} label="홈으로" />
        : <BackBtn onClick={() => setStep(s => s - 1)} label="이전" />}
      <div onClick={() => go("landing")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><VoicaMark size={19} /><span style={{ fontSize: 18, fontWeight: 500, color: C.navy, letterSpacing: -0.4 }}><span style={{ color: C.purple }}>Vo</span>ica</span></div>
      <span style={{ fontSize: 13, color: C.body }}>패널 등록</span>
    </div>
  );

  // ── Step 0: 기본 정보 ──
  if (step === 0) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: -0.5, marginBottom: 6 }}>기본 정보를 입력해 주세요</div>
            <div style={{ fontSize: 13, color: C.body }}>리워드 지급 및 인터뷰 매칭에 사용됩니다</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard, display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input label="이름 (실명)" placeholder="홍길동" value={form.name} onChange={e => upd("name", e.target.value)} />
              <Input label="연락처" type="tel" placeholder="010-0000-0000" value={form.phone} onChange={e => upd("phone", e.target.value)} />
            </div>
            <div>
              <FieldLabel>거주 지역</FieldLabel>
              <ChipGroup options={REGIONS} value={form.region} onSelect={v => upd("region", v)} />
            </div>
            <div>
              <FieldLabel>성별</FieldLabel>
              <ChipGroup options={GENDERS} value={form.gender} onSelect={v => upd("gender", v)} />
            </div>
            <div>
              <FieldLabel>연령대</FieldLabel>
              <ChipGroup options={AGES} value={form.age} onSelect={v => upd("age", v)} />
            </div>
            <Btn full size="lg" disabled={!step0Valid} onClick={() => setStep(1)}>다음 →</Btn>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 1: 매칭 프로필 ──
  if (step === 1) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: -0.5, marginBottom: 6 }}>매칭 프로필을 설정해 주세요</div>
            <div style={{ fontSize: 13, color: C.body }}>리서처가 적합한 패널을 선택할 때 활용됩니다</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard, display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <FieldLabel>직업</FieldLabel>
              <ChipGroup options={JOBS} value={form.job} onSelect={v => upd("job", v)} />
            </div>
            <div>
              <FieldLabel>월 소득</FieldLabel>
              <ChipGroup options={INCOMES} value={form.income} onSelect={v => upd("income", v)} />
            </div>
            <div>
              <FieldLabel>전문분야 / 관심분야 <span style={{ fontWeight: 400, color: C.body }}>(복수 선택)</span></FieldLabel>
              <ChipGroup options={INTERESTS} value={form.interests} onSelect={toggleInterest} multi />
              {form.interests.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.purple }}>{form.interests.length}개 선택됨</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => setStep(0)}>← 이전</Btn>
              <Btn size="lg" style={{ flex: 2 }} disabled={!step1Valid} onClick={() => setStep(2)}>다음 →</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 2: 동의 ──
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: -0.5, marginBottom: 6 }}>개인정보 수집 및 이용 동의</div>
            <div style={{ fontSize: 13, color: C.body }}>아래 내용을 확인하고 동의해 주세요</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard }}>
            {/* Profile summary */}
            <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleLight}`, borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 8 }}>입력하신 프로필 요약</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                {[
                  ["이름", form.name], ["지역", form.region],
                  ["연령/성별", `${form.age} · ${form.gender}`], ["직업", form.job],
                  ["월 소득", form.income], ["관심분야", form.interests.slice(0, 3).join(", ") + (form.interests.length > 3 ? ` 외 ${form.interests.length - 3}개` : "")],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={{ fontSize: 11, color: C.body }}>{k} </span>
                    <span style={{ fontSize: 12, color: C.navy, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: C.label, marginBottom: 12 }}>수집 및 이용 안내</div>
            {[
              ["수집 항목", "성함, 연락처, 거주지역, 성별, 연령, 직업, 소득, 관심분야, 음성 답변"],
              ["이용 목적", "인터뷰 패널 매칭, 리서치 분석 및 리포트 작성"],
              ["보유 기간", "서비스 탈퇴 시 또는 마지막 인터뷰 완료 후 2년"],
              ["제3자 제공", "의뢰 기업에게 익명화된 분석 데이터 제공 (개인 식별 불가)"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.body, minWidth: 72, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, color: C.navy, lineHeight: 1.5 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.body, lineHeight: 1.75 }}>
                ✦ 음성은 AI 전사 후 즉시 삭제됩니다<br />
                ✦ 개인 식별 정보는 광고주에게 공유되지 않습니다<br />
                ✦ 동의 철회 시 언제든 탈퇴 가능합니다
              </div>
            </div>

            <div onClick={() => setAgreed(a => !a)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${agreed ? C.purple : C.border}`, background: agreed ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                {agreed && <span style={{ color: C.white, fontSize: 12, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: C.navy }}>위 내용을 모두 읽었으며 동의합니다</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => setStep(1)}>← 이전</Btn>
              <Btn size="lg" style={{ flex: 2 }} disabled={!agreed} onClick={() => go("panel_board")}>
                패널 등록 완료 →
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: 광고주 패널 리쿠르팅 어드민 ───
function RecruiterAdminScreen({ go }) {
  const [filter, setFilter] = useState("전체");
  const [selected, setSelected] = useState(new Set());
  const filters = ["전체", "신청", "적합", "부적합", "완료"];
  const statusStyle = {
    신청:  { color: "#92650a", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
    적합:  { color: C.successText, bg: C.successBg, border: C.successBorder },
    부적합: { color: C.ruby, bg: "rgba(234,34,97,0.08)", border: "rgba(234,34,97,0.2)" },
    완료:  { color: C.body, bg: C.bg, border: C.border },
  };
  const filtered = filter === "전체" ? PANEL_APPLICANTS : PANEL_APPLICANTS.filter(p => p.status === filter);
  const counts = filters.slice(1).reduce((acc, f) => ({ ...acc, [f]: PANEL_APPLICANTS.filter(p => p.status === f).length }), {});

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => go("dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><VoicaMark size={20} /><span style={{ fontSize: 19, fontWeight: 500, color: C.navy, letterSpacing: -0.4 }}><span style={{ color: C.purple }}>Vo</span>ica</span></div>
            <span style={{ fontSize: 12, color: C.body, borderLeft: `1px solid ${C.border}`, paddingLeft: 12 }}>앱 사용성 인터뷰 Q2 · 패널 관리</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
            <Btn size="sm">+ 직접 초대</Btn>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { label: "총 지원자", value: PANEL_APPLICANTS.length, color: C.navy },
            { label: "적합 패널", value: counts["적합"] || 0, color: C.success },
            { label: "검토 필요", value: counts["신청"] || 0, color: "#f59e0b" },
            { label: "인터뷰 완료", value: counts["완료"] || 0, color: C.purple },
            { label: "부적합", value: counts["부적합"] || 0, color: C.ruby },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, borderRadius: 6, padding: "16px 18px", border: `1px solid ${C.border}`, boxShadow: S.ambient }}>
              <div style={{ fontSize: 11, color: C.body, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: s.color, fontFeatureSettings: '"tnum"' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs + bulk actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 13, fontFamily: F, border: "none", cursor: "pointer", background: filter === f ? C.purpleBg : "transparent", color: filter === f ? C.purple : C.body, fontWeight: filter === f ? 400 : 300 }}>
                {f} {f !== "전체" && counts[f] !== undefined && <span style={{ fontSize: 11 }}>({counts[f]})</span>}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.body }}>{selected.size}명 선택됨</span>
              <Btn size="sm" style={{ background: C.success }}>일괄 승인</Btn>
              <Btn size="sm" style={{ background: C.ruby }}>일괄 거절</Btn>
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: S.ambient }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 80px 80px 150px 100px 80px 160px", gap: 0, padding: "10px 16px", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
            {["", "패널", "연령", "성별", "지원일시", "AI 적합도", "상태", "액션"].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 400, color: C.body }}>{h}</div>
            ))}
          </div>

          {filtered.map((p, i) => {
            const ss = statusStyle[p.status];
            const isSelected = selected.has(p.id);
            return (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 80px 80px 150px 100px 80px 160px", gap: 0, padding: "12px 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", background: isSelected ? C.purpleBg : "transparent", alignItems: "center", transition: "background 0.15s" }}>
                {/* Checkbox */}
                <div onClick={() => setSelected(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}
                  style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${isSelected ? C.purple : C.border}`, background: isSelected ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  {isSelected && <span style={{ color: C.white, fontSize: 10 }}>✓</span>}
                </div>
                {/* Name + history */}
                <div>
                  <div style={{ fontSize: 14, color: C.navy }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.body }}>인터뷰 {p.intv}회 참여</div>
                </div>
                <div style={{ fontSize: 13, color: C.navy }}>{p.age}</div>
                <div style={{ fontSize: 13, color: C.navy }}>{p.gender}</div>
                <div style={{ fontSize: 12, color: C.body, fontFeatureSettings: '"tnum"' }}>{p.applied}</div>
                {/* Score bar */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 400, color: p.score >= 85 ? C.success : p.score >= 70 ? "#f59e0b" : C.ruby, marginBottom: 4, fontFeatureSettings: '"tnum"' }}>{p.score}점</div>
                  <div style={{ height: 3, background: C.border, borderRadius: 2, width: 60 }}>
                    <div style={{ height: "100%", width: `${p.score}%`, background: p.score >= 85 ? C.success : p.score >= 70 ? "#f59e0b" : C.ruby, borderRadius: 2 }} />
                  </div>
                </div>
                {/* Status badge */}
                <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 400, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{p.status}</span>
                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  {p.status === "신청" && (
                    <>
                      <button style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: `1px solid ${C.successBorder}`, background: C.successBg, color: C.successText, cursor: "pointer", fontFamily: F }}>승인</button>
                      <button style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: "1px solid rgba(234,34,97,0.25)", background: "rgba(234,34,97,0.06)", color: C.ruby, cursor: "pointer", fontFamily: F }}>거절</button>
                    </>
                  )}
                  {p.status === "적합" && <Btn size="sm" onClick={() => go("interview")}>인터뷰 시작</Btn>}
                  {p.status === "완료" && <Btn variant="ghost" size="sm" onClick={() => go("report")}>리포트</Btn>}
                  {p.status === "부적합" && <span style={{ fontSize: 12, color: C.body }}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ─── SCREEN: 패널 모집 보드 ───
// 지원 단계: none → applied → ai_screening → confirmed
const APPLY_STEPS = ["none", "applied", "ai_screening", "confirmed"];
const APPLY_CONFIG = {
  none:         { label: (reward) => `지원하기 · ${reward}`, variant: "primary",  statusBadge: null },
  applied:      { label: () => "✓ 지원 완료",               variant: "ghost",    statusBadge: { text: "AI 적합성 검토 중", color: C.purple } },
  ai_screening: { label: () => "AI 검토 완료",               variant: "ghost",    statusBadge: { text: "리서처 최종 검토 대기", color: "#f59e0b" } },
  confirmed:    { label: () => "🎉 참여 확정",               variant: "ghost",    statusBadge: { text: "인터뷰 진행 예정", color: C.success } },
};

function PanelBoardScreen({ go }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("전체");
  const [applyState, setApplyState] = useState({}); // { [jobId]: "applied" | "ai_screening" | "confirmed" }
  const categories = ["전체", "전문가", "테크", "뷰티", "미디어", "식품", "금융", "교육"];

  const filtered = PANEL_JOBS.filter(j =>
    (catFilter === "전체" || j.category === catFilter) &&
    (search === "" || j.title.includes(search) || j.company.includes(search))
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      {/* Nav */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <BackBtn onClick={() => go("landing")} label="홈으로" />
            <div onClick={() => go("landing")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><VoicaMark size={20} /><span style={{ fontSize: 19, fontWeight: 500, color: C.navy, letterSpacing: -0.4 }}><span style={{ color: C.purple }}>Vo</span>ica</span></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={() => go("panel_entry")}>내 인터뷰</Btn>
          </div>
        </div>
      </nav>

      {/* Hero banner */}
      <div style={{ background: "linear-gradient(135deg,#061b31 0%,#1c1e54 35%,#2e2b8c 65%,#533afd 100%)", padding: "36px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,107,238,0.28),rgba(234,34,97,0.12),transparent 70%)", filter: "blur(45px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -20, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.22),transparent 70%)", filter: "blur(55px)", pointerEvents: "none" }} />
        <Badge variant="dark" style={{ background: "rgba(185,185,249,0.18)", color: C.purpleLight, border: "1px solid rgba(185,185,249,0.35)", marginBottom: 14 }}>🎙️ Voica 패널 모집 보드</Badge>
        <div style={{ fontSize: 28, fontWeight: 500, color: C.white, letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 8, fontFeatureSettings: '"ss01"' }}>보이스로 참여하고 리워드 받기</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>지원 → AI 적합성 검토 → 리서처 최종 확정 → 보이스 인터뷰 진행</div>

        {/* Search */}
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="인터뷰 주제 또는 기업명 검색"
            style={{ width: "100%", padding: "12px 44px 12px 16px", borderRadius: 6, border: "1px solid rgba(185,185,249,0.3)", background: "rgba(255,255,255,0.08)", color: C.white, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.5 }}>🔍</span>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {/* Category filter + stats */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 13, fontFamily: F, cursor: "pointer", border: `1px solid ${catFilter === c ? C.purple : C.border}`, background: catFilter === c ? C.purpleBg : C.white, color: catFilter === c ? C.purple : C.body, transition: "all 0.15s" }}>{c}</button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: C.body }}>{filtered.length}개 모집 중</span>
        </div>

        {/* Job cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {filtered.map(job => {
            const pct = Math.round((job.filled / job.total) * 100);
            const status = applyState[job.id] || "none";
            const cfg = APPLY_CONFIG[status];
            const remaining = job.total - job.filled;
            const isConfirmed = status === "confirmed";

            const handleApply = () => {
              if (status === "none") {
                setApplyState(prev => ({ ...prev, [job.id]: "applied" }));
              }
              // subsequent steps are changed via demo stepper below
            };

            // Demo: allow cycling through stages for prototype purposes
            const cycleDemoStep = () => {
              const idx = APPLY_STEPS.indexOf(status);
              const next = APPLY_STEPS[Math.min(idx + 1, APPLY_STEPS.length - 1)];
              setApplyState(prev => ({ ...prev, [job.id]: next }));
            };

            const expertBorder = job.expert ? "rgba(234,34,97,0.25)" : (isConfirmed ? C.success : C.border);
            const expertShadow = job.expert ? "rgba(234,34,97,0.06) 0px 0px 0px 3px" : (isConfirmed ? `0 0 0 3px ${C.successBg}` : S.ambient);
            return (
              <div key={job.id} style={{ background: job.expert ? "rgba(234,34,97,0.02)" : C.white, border: `1px solid ${expertBorder}`, borderRadius: 8, padding: "20px", boxShadow: expertShadow, display: "flex", flexDirection: "column", gap: 0, transition: "all 0.2s" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {job.expert
                      ? <Badge variant="negative" style={{ fontSize: 10 }}>⭐ 전문가 · {job.expertTag}</Badge>
                      : <Badge variant="neutral" style={{ fontSize: 10 }}>{job.category}</Badge>}
                    {job.urgent && <Badge variant="negative" style={{ fontSize: 10 }}>⚡ 마감임박</Badge>}
                  </div>
                  <span style={{ fontSize: 11, color: C.body, fontFeatureSettings: '"tnum"' }}>~{job.deadline}</span>
                </div>

                <div style={{ fontSize: 17, fontWeight: 400, color: C.navy, letterSpacing: -0.2, marginBottom: 4, fontFeatureSettings: '"ss01"' }}>{job.title}</div>
                <div style={{ fontSize: 12, color: C.body, marginBottom: 14 }}>{job.company}</div>

                {/* Info row — reward prominently shown */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 13 }}>⏱</span>
                    <span style={{ fontSize: 13, color: C.body }}>{job.duration}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: job.expert ? "rgba(234,34,97,0.07)" : "rgba(21,190,83,0.08)", border: `1px solid ${job.expert ? "rgba(234,34,97,0.2)" : "rgba(21,190,83,0.2)"}`, borderRadius: 4, padding: "3px 8px" }}>
                    <span style={{ fontSize: 13 }}>🎁</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: job.expert ? C.ruby : C.successText }}>{job.reward}</span>
                  </div>
                </div>

                {/* Conditions */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {job.conditions.map(c => (
                    <span key={c} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: C.purpleBg, color: C.purple, border: `1px solid ${C.purpleLight}` }}>{c}</span>
                  ))}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: C.body }}>모집 현황</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: remaining <= 3 ? C.ruby : C.navy, fontFeatureSettings: '"tnum"' }}>{job.filled}/{job.total}명 {remaining <= 3 && `(${remaining}자리 남음)`}</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? C.ruby : C.purple, borderRadius: 2, transition: "width 0.5s" }} />
                  </div>
                </div>

                {/* Apply flow */}
                <div style={{ marginTop: "auto" }}>
                  {isConfirmed ? (
                    /* ── 참여 확정 상태 ── */
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 6 }}>
                        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.success, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.successText }}>참여 확정</span>
                        <span style={{ fontSize: 11, color: C.successText, opacity: 0.7, marginLeft: 2 }}>— 인터뷰 준비 완료</span>
                      </div>
                      <Btn full size="md" onClick={() => go("interview")}
                        style={{ background: `linear-gradient(135deg,${C.purple},${C.purpleDeep})`, border: "none", fontWeight: 600, boxShadow: `0 4px 14px rgba(83,58,253,0.35)` }}>
                        🎙️ 지금 인터뷰 시작하기
                      </Btn>
                    </div>
                  ) : (
                    <>
                      <Btn full variant={cfg.variant} size="sm"
                        disabled={status !== "none"}
                        onClick={handleApply}>
                        {cfg.label(job.reward)}
                      </Btn>

                      {/* Status badge + progress stepper */}
                      {cfg.statusBadge && (
                        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: cfg.statusBadge.color, boxShadow: `0 0 0 3px ${cfg.statusBadge.color}22` }} />
                            <span style={{ fontSize: 11, color: cfg.statusBadge.color, fontWeight: 500 }}>{cfg.statusBadge.text}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            {[["지원", "applied"], ["AI검토", "ai_screening"], ["확정", "confirmed"]].map(([lbl, st], i) => {
                              const stepIdx = APPLY_STEPS.indexOf(st);
                              const curIdx  = APPLY_STEPS.indexOf(status);
                              const done    = curIdx >= stepIdx;
                              return (
                                <div key={st} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  {i > 0 && <div style={{ width: 14, height: 1, background: done ? C.purple : C.border }} />}
                                  <div style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, background: done ? C.purple : C.border, color: done ? C.white : C.body, transition: "all 0.3s" }}>{done ? "✓" : i + 1}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Demo stepper */}
                      <button onClick={cycleDemoStep} style={{ marginTop: 6, width: "100%", padding: "4px", fontSize: 10, color: C.body, background: "transparent", border: "none", cursor: "pointer", opacity: 0.4, fontFamily: F }}>
                        [데모] 다음 단계 →
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ─── SCREEN: 요금제 ───
function PaymentModal({ plan, billing, onClose, onDone }) {
  const [method, setMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const price = plan.price[billing];

  const methods = [
    { id: "naverpay", label: "네이버페이", color: "#03C75A", icon: <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>N Pay</span> },
    { id: "tosspay",  label: "토스페이",   color: "#0064FF", icon: <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>toss</span> },
    { id: "stripe",   label: "신용/체크카드 (Stripe)", color: "#635bff", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg> },
  ];

  const confirm = () => {
    if (!method) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,27,49,0.6)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 8, padding: "32px", width: "100%", maxWidth: 440, boxShadow: S.elevated, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: C.body, lineHeight: 1 }}>✕</button>

        {done ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.successBg, border: `1px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 8 }}>결제 완료!</div>
            <div style={{ fontSize: 14, color: C.body, marginBottom: 24 }}>{plan.name} 플랜이 시작되었습니다</div>
            <Btn full onClick={() => { onClose(); onDone(); }}>대시보드로 이동</Btn>
          </div>
        ) : (
          <>
            {/* Plan summary */}
            <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleLight}`, borderRadius: 8, padding: "14px 16px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{plan.name} 플랜 · {billing === "annual" ? "연 결제" : "월 결제"}</div>
                  <div style={{ fontSize: 12, color: C.body, marginTop: 3 }}>{plan.interviews ? `월 ${plan.interviews.toLocaleString()}건 슬롯` : "무제한 인터뷰"} · {plan.report} 리포트</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.purple, fontFeatureSettings: '"tnum"' }}>₩{price.toLocaleString()}</div>
              </div>
            </div>

            {/* Payment methods */}
            <div style={{ fontSize: 13, fontWeight: 600, color: C.label, marginBottom: 12 }}>결제 수단 선택</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {methods.map(m => (
                <div key={m.id} onClick={() => setMethod(m.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 8, border: `2px solid ${method === m.id ? m.color : C.border}`, cursor: "pointer", background: method === m.id ? `${m.color}08` : C.white, transition: "all 0.15s" }}>
                  <div style={{ width: 40, height: 26, borderRadius: 6, background: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {m.icon}
                  </div>
                  <span style={{ fontSize: 14, color: C.navy, fontWeight: method === m.id ? 500 : 400 }}>{m.label}</span>
                  <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === m.id ? m.color : C.border}`, background: method === m.id ? m.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {method === m.id && <span style={{ color: C.white, fontSize: 10 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <Btn full size="lg" disabled={!method || processing} onClick={confirm}>
              {processing ? "결제 처리 중..." : `₩${price.toLocaleString()} 결제하기`}
            </Btn>
            <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 10 }}>
              SSL 암호화 보안 결제 · 언제든 해지 가능
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PricingScreen({ go }) {
  const [billing, setBilling] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: "free", name: "무료", desc: "소규모 팀 · 첫 인터뷰 체험",
      price: { monthly: 0, annual: 0 },
      sessions: 3,
      report: "기본",
      reportFeatures: [
        "테마 자동 분류 (최대 5개)",
        "감성 분석 (긍정 / 부정 / 중립)",
        "주요 키워드 클라우드",
        "응답 원문 열람",
      ],
      extras: ["월 3회 인터뷰", "회당 최대 10명", "CSV 다운로드"],
      highlight: false, color: C.navy,
    },
    {
      id: "pro", name: "Pro", desc: "정기 리서치 · 브랜드 · 에이전시",
      price: { monthly: 99000, annual: 79200 },
      sessions: null,
      report: "심화",
      reportFeatures: [
        "테마 분류 + 하위 테마 드릴다운",
        "감성 분석 + 세그먼트 비교",
        "대표 발화 인용문 자동 추출",
        "크로스탭 분석 (조건별 비교)",
        "인사이트 요약 내러티브",
      ],
      extras: ["프로젝트 무제한", "패널 모집 공고 무제한", "CSV / PDF 다운로드", "팀 멤버 3인"],
      highlight: true, color: C.purple,
    },
    {
      id: "enterprise", name: "엔터프라이즈", desc: "대규모 리서치 · 그룹사 · 컨설팅",
      price: { monthly: null, annual: null },
      sessions: null,
      report: "풀 패키지",
      reportFeatures: [
        "Pro 전체 포함",
        "트렌드 추이 비교 (기간별)",
        "경쟁 브랜드 언급 분석",
        "세그먼트별 리포트 분리 출력",
        "PPT / PDF 슬라이드 자동 생성",
        "Slack · Notion API 연동",
      ],
      extras: ["팀 멤버 무제한", "전용 CSM 배정", "SLA 99.9%"],
      highlight: false, color: C.purpleDeep,
    },
  ];


  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, fontFeatureSettings: '"ss01"' }}>
      {selectedPlan && <PaymentModal plan={selectedPlan} billing={billing} onClose={() => setSelectedPlan(null)} onDone={() => go("dashboard")} />}
      {/* Nav */}
      <nav style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "stretch", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingRight: 8 }}>
            <BackBtn onClick={() => go("landing")} label="홈으로" />
            <div onClick={() => go("landing")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><VoicaMark size={20} /><span style={{ fontSize: 19, fontWeight: 500, color: C.navy, letterSpacing: -0.4 }}><span style={{ color: C.purple }}>Vo</span>ica</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
            {[["서비스 소개","landing"],["패널 모집 보드","panel_board"],["요금제","pricing"]].map(([label, target]) => (
              <NavTab key={label} label={label} active={label === "요금제"} onClick={() => go(target)} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => go("panel_entry")}>패널 등록하기</Btn>
            <Btn size="sm" onClick={() => go("advertiser_login")}>광고주 로그인</Btn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 24px 44px", background: "linear-gradient(180deg,#f0f1ff 0%,#f8fafc 60%,transparent 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.1),rgba(249,107,238,0.06),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(46,43,140,0.08),transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <Badge variant="purple" style={{ marginBottom: 16 }}>요금제</Badge>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: C.navy, letterSpacing: "-1.0px", margin: "0 0 12px", lineHeight: 1.08 }}>
          필요한 만큼만, 투명하게
        </h1>
        <p style={{ fontSize: 15, color: C.body, margin: "0 0 8px" }}>
          구독료는 플랫폼 이용료입니다. 패널 리워드는 별도 충전 후 인터뷰 완료 시 자동 지급됩니다.
        </p>
        <p style={{ fontSize: 13, color: C.body, margin: "0 0 28px", opacity: 0.7 }}>리워드 수수료 20% 포함 — 패널에게 돌아가는 금액은 리서처가 직접 설정합니다</p>
        <div style={{ display: "inline-flex", background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: 3 }}>
          {[["monthly","월 결제"],["annual","연 결제"]].map(([key, label]) => (
            <button key={key} onClick={() => setBilling(key)}
              style={{ padding: "6px 18px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 13, fontFamily: F, background: billing === key ? C.purple : "transparent", color: billing === key ? C.white : C.body, transition: "all 0.15s" }}>
              {label}{key === "annual" && <span style={{ marginLeft: 5, fontSize: 10, color: billing === "annual" ? "rgba(255,255,255,0.75)" : C.success, fontWeight: 600 }}>20% 할인</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── 플랫폼 구독 ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: C.navy, letterSpacing: "-0.44px", marginBottom: 8 }}>플랫폼 구독 — AI 분석 · 리포트 · 패널 관리</h2>
            <p style={{ fontSize: 13, color: C.body, margin: 0 }}>월 정기 과금 · 패널 리워드 별도 · 리워드 수수료 20%</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ background: plan.highlight ? C.purple : C.white, border: `1px solid ${plan.highlight ? C.purple : C.border}`, borderRadius: 8, padding: "28px 26px", boxShadow: plan.highlight ? S.elevated : S.standard, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
                {plan.highlight && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.purpleLight},${C.magenta})` }} />}
                {plan.highlight && <div style={{ position: "absolute", top: 14, right: 14 }}><span style={{ fontSize: 10, fontWeight: 600, background: "rgba(255,255,255,0.2)", color: C.white, padding: "3px 8px", borderRadius: 4 }}>가장 인기</span></div>}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.6)" : C.body, marginBottom: 6, letterSpacing: 0.5 }}>{plan.name.toUpperCase()}</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 34, fontWeight: 700, color: plan.highlight ? C.white : C.navy, letterSpacing: -1, fontFeatureSettings: '"tnum"' }}>
                      {plan.price[billing] === null ? "맞춤 견적" : plan.price[billing] === 0 ? "무료" : `₩${plan.price[billing].toLocaleString()}`}
                    </span>
                    {plan.price[billing] !== null && plan.price[billing] !== 0 && <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.5)" : C.body, marginBottom: 5 }}>/월</span>}
                  </div>
                  {plan.id !== "enterprise" && <div style={{ fontSize: 12, color: plan.highlight ? "rgba(255,255,255,0.5)" : C.body }}>패널 리워드 별도 · 리워드의 20% 수수료</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 6, background: plan.highlight ? "rgba(255,255,255,0.1)" : C.purpleBg, marginBottom: 18 }}>
                  <span style={{ fontSize: 15 }}>🎙️</span>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: plan.highlight ? C.white : C.purple }}>{plan.sessions ? `월 ${plan.sessions}건` : "인터뷰 무제한"}</span>
                    <span style={{ fontSize: 11, color: plan.highlight ? "rgba(255,255,255,0.45)" : C.body, marginLeft: 6 }}>{plan.id === "free" ? "회당 최대 10명" : "회당 최대 인원 맞춤"}</span>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.5)" : C.label }}>AI 리포트</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: plan.highlight ? "rgba(255,255,255,0.15)" : `${plan.color}15`, color: plan.highlight ? C.white : plan.color, border: `1px solid ${plan.highlight ? "rgba(255,255,255,0.2)" : `${plan.color}30`}` }}>{plan.report}</span>
                  </div>
                  {plan.reportFeatures.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: plan.highlight ? C.purpleLight : C.success, marginTop: 2, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 12, color: plan.highlight ? "rgba(255,255,255,0.8)" : C.body, lineHeight: 1.45 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 22, paddingTop: 12, borderTop: `1px solid ${plan.highlight ? "rgba(255,255,255,0.12)" : C.border}` }}>
                  {plan.extras.map(e => (
                    <div key={e} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: plan.highlight ? "rgba(255,255,255,0.25)" : C.border }}>—</span>
                      <span style={{ fontSize: 12, color: plan.highlight ? "rgba(255,255,255,0.55)" : C.body }}>{e}</span>
                    </div>
                  ))}
                </div>
                <Btn full variant={plan.highlight ? "white" : "primary"} style={{ marginTop: "auto", ...(plan.highlight ? { color: C.purple, fontWeight: 600 } : {}) }}
                  onClick={() => plan.id === "enterprise" ? go("advertiser_login") : setSelectedPlan(plan)}>
                  {plan.id === "enterprise" ? "문의하기" : "시작하기"}
                </Btn>
              </div>
            ))}
          </div>
        </div>

        {/* ── 전문 분석가 애드온 ── */}
        <div style={{ background: "linear-gradient(135deg,#061b31 0%,#1c1e54 30%,#2a2060 60%,#3d1d6e 85%,#5c1a4a 100%)", borderRadius: 8, padding: "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap", boxShadow: S.elevated }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Badge variant="dark" style={{ background: "rgba(185,185,249,0.18)", color: C.purpleLight, border: "1px solid rgba(185,185,249,0.3)", marginBottom: 14 }}>애드온</Badge>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: C.white, letterSpacing: -0.5, margin: "0 0 10px" }}>전문 분석가 심층 리뷰</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: "0 0 18px" }}>
              AI 리포트에 전담 분석가가 직접 붙어 맥락을 읽고 전략적 인사이트를 제공합니다.<br />
              경쟁사 포지셔닝, 전략적 함의, 후속 액션까지 코멘트해 드립니다.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["리포트 심층 코멘트", "전략적 시사점 도출", "후속 리서치 제안", "화상 브리핑 (선택)"].map(t => (
                <span key={t} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 4, background: "rgba(185,185,249,0.12)", color: C.purpleLight, border: "1px solid rgba(185,185,249,0.2)" }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 220 }}>
            {[
              { label: "기본 리뷰", desc: "리포트 코멘트 + 전략적 시사점", price: "150,000원" },
              { label: "심화 리뷰", desc: "기본 + 화상 브리핑 50분", price: "350,000원" },
            ].map(item => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.purpleLight, fontFeatureSettings: '"tnum"' }}>{item.price}</span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.desc}</div>
              </div>
            ))}
            <Btn variant="white" size="sm" style={{ color: C.purple, fontWeight: 600 }} onClick={() => go("advertiser_login")}>문의하기</Btn>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── SCREEN: 인터뷰 룸 ───
function WaveAnimation({ active }) {
  const bars = [3, 5, 8, 6, 4, 9, 7, 5, 8, 4, 6, 9, 5, 7, 4];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 32 }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: 3, borderRadius: 2, background: active ? `rgba(185,185,249,0.8)` : "rgba(255,255,255,0.15)", height: active ? `${h * 3}px` : "4px", transition: `height ${0.3 + i * 0.03}s ease-in-out`, animation: active ? `wave-${i % 3} 0.${7 + i % 4}s ease-in-out infinite alternate` : "none" }} />
      ))}
    </div>
  );
}

// 앱 화면 목업 컴포넌트
function MockAppScreen({ screenType }) {
  const screens = {
    splash: (
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#533afd,#2e2b8c)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✦</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>AppName</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>v2.1.0</div>
      </div>
    ),
    signup: (
      <div style={{ width: "100%", height: "100%", background: "#fff", borderRadius: 16, padding: "20px 16px", boxSizing: "border-box" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#061b31", marginBottom: 16 }}>회원가입</div>
        {["이름", "이메일", "비밀번호"].map(f => (
          <div key={f} style={{ height: 32, borderRadius: 6, border: "1px solid #e5edf5", marginBottom: 8, padding: "0 10px", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#aab" }}>{f}</span>
          </div>
        ))}
        <div style={{ height: 32, borderRadius: 6, background: "#533afd", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 12 }}>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>가입하기</span>
        </div>
      </div>
    ),
    home: (
      <div style={{ width: "100%", height: "100%", background: "#f8fafc", borderRadius: 16, padding: "14px 12px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#061b31" }}>홈</span>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e5edf5" }} />
        </div>
        {[0.7, 0.5, 0.85].map((w, i) => (
          <div key={i} style={{ height: 52, borderRadius: 8, background: "#fff", border: "1px solid #e5edf5", marginBottom: 8, padding: "8px 10px" }}>
            <div style={{ height: 8, borderRadius: 4, background: "#e5edf5", width: `${w * 100}%`, marginBottom: 5 }} />
            <div style={{ height: 6, borderRadius: 4, background: "#f0f4f8", width: "50%" }} />
          </div>
        ))}
      </div>
    ),
    dashboard: (
      <div style={{ width: "100%", height: "100%", background: "#f8fafc", borderRadius: 16, padding: "14px 12px", boxSizing: "border-box" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#061b31", marginBottom: 10 }}>대시보드</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          {[["#533afd", "38%"], ["#15be53", "신규"], ["#ea2261", "↓12%"], ["#f59e0b", "94%"]].map(([c, v], i) => (
            <div key={i} style={{ height: 40, borderRadius: 6, background: "#fff", border: "1px solid #e5edf5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 60, borderRadius: 8, background: "#fff", border: "1px solid #e5edf5", padding: "8px 10px" }}>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: "100%" }}>
            {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 2, background: i === 5 ? "#533afd" : "#e5edf5", height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    ),
  };
  return screens[screenType] || screens.home;
}

function InterviewScreen({ go }) {
  const [qIndex, setQIndex] = useState(0);
  // phase: ai_speaking → ready → recording → ai_review → review_fail | review_warn | next
  const [phase, setPhase] = useState("ai_speaking");
  const [recordTime, setRecordTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [reviewResult, setReviewResult] = useState(null); // null | "pass" | "short" | "irrelevant"
  const [activeScreen, setActiveScreen] = useState(0); // index into visual.screens
  const timerRef = useRef(null);
  const MIN_RECORD_SECS = 8;

  const q = QUESTIONS[qIndex];

  useEffect(() => {
    if (phase === "ai_speaking") { const t = setTimeout(() => setPhase("ready"), 3200); return () => clearTimeout(t); }
    if (phase === "ai_review") {
      const t = setTimeout(() => {
        // 데모: < MIN_RECORD_SECS → short, otherwise pass
        if (recordTime < MIN_RECORD_SECS) {
          setReviewResult("short");
          setPhase("review_fail");
        } else {
          setReviewResult("pass");
          setPhase("review_pass");
        }
      }, 2200);
      return () => clearTimeout(t);
    }
    if (phase === "review_pass") {
      const t = setTimeout(() => {
        if (qIndex < QUESTIONS.length - 1) { setQIndex(qi => qi + 1); setPhase("ai_speaking"); setRecordTime(0); setActiveScreen(0); setReviewResult(null); }
        else setCompleted(true);
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [phase, qIndex, recordTime]);

  useEffect(() => {
    if (phase === "recording") { timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const stopAndReview = () => { clearInterval(timerRef.current); setPhase("ai_review"); };
  const reRecord = () => { setRecordTime(0); setReviewResult(null); setPhase("ready"); };

  const hasVisual = !!q.visual;

  if (completed) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#07081a 0%,#0d0a2e 40%,#1a0a2e 70%,#07081a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: F, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "15%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.2),rgba(249,107,238,0.08),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(21,190,83,0.12),transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(21,190,83,0.2)", border: "1px solid rgba(21,190,83,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✓</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.white, letterSpacing: -0.6, marginBottom: 10, fontFeatureSettings: '"ss01"' }}>인터뷰 완료!</div>
          <div style={{ fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.55)", marginBottom: 20, lineHeight: 1.7 }}>소중한 의견 감사합니다.<br />AI가 답변을 검토한 후 리워드가 지급됩니다.</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 6, background: "rgba(21,190,83,0.15)", border: "1px solid rgba(21,190,83,0.3)", marginBottom: 28 }}>
            <span style={{ color: C.success, fontSize: 14 }}>🎁 리워드 AI 검토 후 지급 예정</span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Btn variant="ghost" style={{ borderColor: "rgba(185,185,249,0.3)", color: C.purpleLight }} onClick={() => go("panel_board")}>← 모집 보드</Btn>
            <Btn onClick={() => { setQIndex(0); setPhase("ai_speaking"); setCompleted(false); setRecordTime(0); }}>다시 체험</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#07081a 0%,#0d0a2e 45%,#1a0820 80%,#07081a 100%)", display: "flex", flexDirection: "column", fontFamily: F, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -100, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.2),rgba(46,43,140,0.1),transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,107,238,0.15),rgba(234,34,97,0.06),transparent", filter: "blur(70px)", pointerEvents: "none" }} />

      {/* Progress */}
      <div style={{ position: "relative", padding: "18px 32px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <BackBtn onClick={() => go("panel_board")} label="나가기" dark />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>앱 사용성 인터뷰 Q2</span>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFeatureSettings: '"tnum"' }}>{qIndex + 1} / {QUESTIONS.length}</span>
          </div>
          <div style={{ height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1 }}>
            <div style={{ height: "100%", width: `${((qIndex + (phase !== "ai_speaking" ? 0.5 : 0)) / QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg,${C.purple},${C.magenta})`, borderRadius: 1, transition: "width 0.5s ease" }} />
          </div>
        </div>
      </div>

      {/* Main content — split if visual present */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 32px" }}>
        <div style={{ width: "100%", maxWidth: 900, display: "flex", gap: 28, alignItems: "flex-start" }}>

          {/* Visual panel */}
          {hasVisual && (
            <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, color: C.purpleLight, fontWeight: 500, marginBottom: 2 }}>📎 {q.visual.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{q.visual.tag}</div>
                </div>
                {q.visual.screens.length > 1 && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {q.visual.screens.map((_, i) => (
                      <button key={i} onClick={() => setActiveScreen(i)}
                        style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${i === activeScreen ? C.purple : "rgba(255,255,255,0.15)"}`, background: i === activeScreen ? C.purple : "transparent", color: i === activeScreen ? C.white : "rgba(255,255,255,0.4)", fontSize: 9, cursor: "pointer", fontFamily: F }}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Phone frame */}
              <div style={{ width: 220, margin: "0 auto", background: "#111", borderRadius: 32, padding: "12px 8px", boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 24px 48px rgba(0,0,0,0.6)" }}>
                <div style={{ width: "100%", aspectRatio: "9/16", borderRadius: 24, overflow: "hidden", position: "relative" }}>
                  <MockAppScreen screenType={q.visual.screens[activeScreen]} />
                </div>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>화면을 참고하여 답변해 주세요</div>
            </div>
          )}

          {/* Question + recording */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#533afd,#f96bee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, boxShadow: phase === "ai_speaking" ? "0 0 20px rgba(83,58,253,0.5)" : "none", transition: "box-shadow 0.5s" }}>✦</div>
              <div>
                <div style={{ fontSize: 11, color: C.purpleLight, marginBottom: 2 }}>AI 인터뷰어 · Voica</div>
                {phase === "ai_speaking" ? <WaveAnimation active /> : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>질문을 완료했습니다</span>}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "28px 28px", marginBottom: 28, backdropFilter: "blur(8px)" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <Badge variant="dark">Q{qIndex + 1}</Badge>
                <Badge variant="dark">{q.label}</Badge>
                {hasVisual && <Badge variant="dark" style={{ background: "rgba(83,58,253,0.2)", color: C.purpleLight, border: "1px solid rgba(83,58,253,0.3)" }}>📎 자료 첨부</Badge>}
              </div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 400, color: C.white, lineHeight: 1.7, letterSpacing: -0.3, fontFeatureSettings: '"ss01"' }}>{q.text}</p>
            </div>

            {/* Recording controls */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

              {/* ai_review */}
              {phase === "ai_review" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0,1,2,3,4].map(i => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.purple, opacity: 0.4, animation: `wave-${i%3} 0.6s ease-in-out ${i*0.12}s infinite alternate` }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>AI가 답변을 검토하고 있습니다...</div>
                </div>
              )}

              {/* review_fail */}
              {phase === "review_fail" && (
                <div style={{ width: "100%", background: "rgba(234,34,97,0.1)", border: "1px solid rgba(234,34,97,0.3)", borderRadius: 8, padding: "18px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#f9a8c4", marginBottom: 6 }}>
                    {reviewResult === "short" ? "답변이 너무 짧습니다" : "관련 없는 답변이 감지되었습니다"}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 16, lineHeight: 1.6 }}>
                    {reviewResult === "short"
                      ? `최소 ${MIN_RECORD_SECS}초 이상 답변해 주세요. 짧은 답변은 리워드 지급이 제한될 수 있습니다.`
                      : "질문과 관련된 내용으로 답변해 주세요. 반복 감지 시 인터뷰가 중단됩니다."}
                  </div>
                  <Btn variant="ghost" style={{ borderColor: "rgba(234,34,97,0.4)", color: "#f9a8c4" }} onClick={reRecord}>
                    다시 답변하기
                  </Btn>
                </div>
              )}

              {/* review_pass */}
              {phase === "review_pass" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(21,190,83,0.8)" }}>
                  <span>✓</span><span>답변이 확인되었습니다. 다음 질문으로 이동합니다...</span>
                </div>
              )}

              {/* recording waveform */}
              {phase === "recording" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 36 }}>
                    {Array.from({ length: 22 }).map((_, i) => (
                      <div key={i} style={{ width: 3, borderRadius: 2, background: recordTime < MIN_RECORD_SECS ? "rgba(234,34,97,0.6)" : C.ruby, height: `${4 + Math.random() * 26}px`, transition: "height 0.1s" }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "rgba(234,34,97,0.8)", fontFeatureSettings: '"tnum"' }}>● {fmt(recordTime)}</span>
                    {recordTime < MIN_RECORD_SECS && (
                      <span style={{ fontSize: 11, color: "rgba(255,200,100,0.7)" }}>최소 {MIN_RECORD_SECS - recordTime}초 더 답변해 주세요</span>
                    )}
                  </div>
                </div>
              )}

              {/* mic button */}
              {(phase === "ready" || phase === "recording") && (
                <button
                  onClick={() => phase === "ready" ? setPhase("recording") : stopAndReview()}
                  style={{ width: 68, height: 68, borderRadius: "50%", border: "none", cursor: "pointer", background: phase === "recording" ? C.ruby : C.purple, boxShadow: phase === "recording" ? "0 0 0 8px rgba(234,34,97,0.2),0 0 0 16px rgba(234,34,97,0.08)" : "0 0 0 8px rgba(83,58,253,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, transition: "all 0.25s" }}>
                  {phase === "recording" ? "⏹" : "🎤"}
                </button>
              )}

              {phase === "ready" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>버튼을 눌러 답변을 시작하세요</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>최소 {MIN_RECORD_SECS}초 이상 · 최대 {q.duration}초 · 완료 후 다시 누르세요</div>
                </div>
              )}
              {phase === "ai_speaking" && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>AI가 질문을 읽고 있습니다...</div>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "12px 24px 20px" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>답변은 암호화 저장 · AI 품질 검토 후 리워드 지급</span>
      </div>
    </div>
  );
}

// ─── SCREEN: 리포트 ───
function ReportScreen({ go }) {
  const [exportDone, setExportDone] = useState(false);
  const participants = [
    { name: "패널 A", done: true, time: "8분 12초", sentiment: "positive" },
    { name: "패널 B", done: true, time: "11분 30초", sentiment: "positive" },
    { name: "패널 C", done: true, time: "7분 44초", sentiment: "negative" },
    { name: "패널 D", done: false, time: "진행 중", sentiment: null },
    { name: "패널 E", done: true, time: "9분 03초", sentiment: "neutral" },
  ];
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => go("dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}><VoicaMark size={20} /><span style={{ fontSize: 19, fontWeight: 500, color: C.navy, letterSpacing: -0.4 }}><span style={{ color: C.purple }}>Vo</span>ica</span></div>
            <span style={{ fontSize: 12, color: C.body, borderLeft: `1px solid ${C.border}`, paddingLeft: 12 }}>앱 사용성 인터뷰 Q2 · 리포트</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
            <Btn size="sm" onClick={() => setExportDone(true)}>{exportDone ? "✓ 완료" : "PDF 다운로드"}</Btn>
          </div>
        </div>
      </nav>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: `linear-gradient(135deg,rgba(83,58,253,0.05),rgba(249,107,238,0.04))`, border: `1px solid rgba(83,58,253,0.1)`, borderRadius: 8, padding: "20px 22px", marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 400, color: C.purple, marginBottom: 10 }}>✦ AI 종합 요약</div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 400, color: C.navy, lineHeight: 1.7, fontFeatureSettings: '"ss01"' }}>4명의 패널 인터뷰에서 <strong style={{ fontWeight: 400 }}>핵심 기능 만족도(37%)</strong>가 가장 두드러졌습니다. 그러나 <strong style={{ fontWeight: 400 }}>가격 부담(29%)과 데이터 내보내기 부재(13%)</strong>가 전환 장벽으로 반복 언급되었습니다. 스타트업 요금제 도입이 이탈 방지에 가장 직접적인 효과를 가져올 것으로 판단됩니다.</p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 14 }}>발견된 테마</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14 }}>
                {REPORT_THEMES.map(t => (
                  <div key={t.label} style={{ background: C.white, border: `1px solid ${t.border}`, borderRadius: 6, padding: 18, boxShadow: S.ambient }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{t.icon}</div>
                      <Badge variant={t.sentiment === "positive" ? "success" : "negative"} style={{ fontSize: 10 }}>{t.sentiment === "positive" ? "긍정" : "부정"}</Badge>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 400, color: C.navy, marginBottom: 4, fontFeatureSettings: '"ss01"' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: C.body, marginBottom: 12 }}>언급 {t.count}회</div>
                    <div style={{ height: 3, background: C.border, borderRadius: 2 }}><div style={{ height: "100%", width: `${t.pct}%`, background: t.color, borderRadius: 2 }} /></div>
                    <div style={{ fontSize: 10, color: C.body, marginTop: 4, textAlign: "right", fontFeatureSettings: '"tnum"' }}>{t.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 14 }}>질문별 주요 답변</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {QUESTIONS.map((q, i) => {
                  const tr = MOCK_TRANSCRIPTS[i];
                  const sc = { positive: C.success, negative: C.ruby, neutral: C.body };
                  return (
                    <div key={q.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px 18px", boxShadow: S.ambient }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <Badge variant="purple">Q{i + 1}</Badge>
                        <span style={{ fontSize: 12, color: C.body }}>{q.label}</span>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc[tr.sentiment], marginLeft: "auto" }} />
                      </div>
                      <div style={{ fontSize: 12, color: C.body, marginBottom: 8, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{q.text}</div>
                      <div style={{ borderLeft: `3px solid ${sc[tr.sentiment]}`, paddingLeft: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 400, color: C.navy, lineHeight: 1.6, fontFeatureSettings: '"ss01"' }}>"{tr.text}"</div>
                        <div style={{ fontSize: 11, color: C.body, marginTop: 4 }}>패널 A</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ width: 250, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, boxShadow: S.ambient }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 12 }}>패널 현황</div>
              {participants.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < participants.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: p.done ? C.purpleBg : C.bg, border: `1px solid ${p.done ? C.purpleLight : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: p.done ? C.purple : C.body, flexShrink: 0 }}>{p.done ? "✓" : "…"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.navy }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: C.body, fontFeatureSettings: '"tnum"' }}>{p.time}</div>
                  </div>
                  {p.sentiment && <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: p.sentiment === "positive" ? C.success : p.sentiment === "negative" ? C.ruby : C.body }} />}
                </div>
              ))}
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, boxShadow: S.ambient }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 14 }}>전체 감성 분포</div>
              {[["긍정", 54, C.success], ["중립", 27, C.body], ["부정", 19, C.ruby]].map(([l, p, c]) => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.body }}>{l}</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: c, fontFeatureSettings: '"tnum"' }}>{p}%</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2 }}><div style={{ height: "100%", width: `${p}%`, background: c, borderRadius: 2 }} /></div>
                </div>
              ))}
            </div>
            <div style={{ background: "linear-gradient(135deg,#061b31 0%,#1c1e54 40%,#2e2b8c 70%,#533afd 100%)", borderRadius: 8, padding: 18, boxShadow: S.deep, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,107,238,0.25),transparent 70%)", filter: "blur(25px)", pointerEvents: "none" }} />
              <div style={{ fontSize: 11, color: "rgba(185,185,249,0.8)", marginBottom: 6 }}>✦ 보고서 완성</div>
              <div style={{ fontSize: 15, fontWeight: 400, color: C.white, marginBottom: 12, fontFeatureSettings: '"ss01"' }}>리포트 다운로드</div>
              {["AI 요약 리포트 (PDF)", "전체 녹취록 (TXT)", "PPT 발표 초안"].map(item => (
                <div key={item} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.success }}>✓</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{item}</span>
                </div>
              ))}
              <Btn full size="sm" style={{ marginTop: 14, background: exportDone ? C.success : C.purple }} onClick={() => setExportDone(true)}>
                {exportDone ? "✓ 다운로드 완료" : "9,900원으로 다운받기"}
              </Btn>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Main App ───
export default function Voica() {
  const [screen, setScreen] = useState("landing");
  const go = (s) => setScreen(s);

  return (
    <div style={{ fontFamily: F, fontFeatureSettings: '"ss01"', color: C.navy }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes wave-0 { from { height: 4px } to { height: 20px } }
        @keyframes wave-1 { from { height: 6px } to { height: 26px } }
        @keyframes wave-2 { from { height: 8px } to { height: 22px } }
      `}</style>
      {screen === "landing" && <LandingScreen go={go} />}
      {screen === "advertiser_login" && <AdvertiserLoginScreen go={go} />}
      {screen === "dashboard" && <DashboardScreen go={go} />}
      {screen === "editor" && (
        <div>
          <div style={{ padding: "12px 24px", background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
          </div>
          <EditorScreenInner go={go} />
        </div>
      )}
      {screen === "panel_entry" && <PanelEntryScreen go={go} />}
      {screen === "interview" && <InterviewScreen go={go} />}
      {screen === "report" && <ReportScreen go={go} />}
      {screen === "recruiter_admin" && <RecruiterAdminScreen go={go} />}
      {screen === "panel_board" && <PanelBoardScreen go={go} />}
      {screen === "pricing" && <PricingScreen go={go} />}
    </div>
  );
}

function EditorScreenInner({ go }) {
  const [selectedQ, setSelectedQ] = useState(0);
  const q = QUESTIONS[selectedQ];
  return (
    <div style={{ display: "flex", height: "calc(100vh - 49px)", fontFamily: F }}>
      <div style={{ width: 270, borderRight: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 400, color: C.label, marginBottom: 8 }}>질문 목록 ({QUESTIONS.length}개)</div>
          <Btn size="sm" full>+ 질문 추가</Btn>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {QUESTIONS.map((q, i) => (
            <div key={q.id} onClick={() => setSelectedQ(i)} style={{ padding: "10px 12px", borderRadius: 6, marginBottom: 6, cursor: "pointer", border: `1px solid ${selectedQ === i ? C.purpleLight : "transparent"}`, background: selectedQ === i ? C.purpleBg : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: selectedQ === i ? C.purple : C.body }}>Q{i + 1}</span>
                <Badge variant={selectedQ === i ? "purple" : "neutral"} style={{ fontSize: 10 }}>{q.label}</Badge>
              </div>
              <div style={{ fontSize: 12, color: selectedQ === i ? C.navy : C.body, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{q.text}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 16 }}>
        <div style={{ fontSize: 12, color: C.body }}>참여자에게 보이는 화면 미리보기</div>
        <div style={{ width: "100%", maxWidth: 520, background: C.interviewBg, borderRadius: 8, padding: "44px 36px", boxShadow: S.elevated, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.15),transparent)", filter: "blur(40px)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#533afd,#f96bee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>AI 인터뷰어 · Voica</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Q{selectedQ + 1}/{QUESTIONS.length}</span>
            </div>
            <p style={{ fontSize: 19, fontWeight: 400, color: C.white, lineHeight: 1.65, letterSpacing: -0.3, margin: "0 0 28px", fontFeatureSettings: '"ss01"' }}>{q.text}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(83,58,253,0.25)", border: "1px solid rgba(83,58,253,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎤</div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>버튼을 눌러 답변해 주세요</span>
            </div>
          </div>
        </div>
        <Btn size="sm" variant="ghost" onClick={() => go("panel_entry")}>▶ 패널 입장 체험</Btn>
      </div>
      <div style={{ width: 250, borderLeft: `1px solid ${C.border}`, background: C.white, padding: 18, overflowY: "auto" }}>
        <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 14 }}>질문 설정</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: C.body, display: "block", marginBottom: 6 }}>질문 텍스트</label>
          <textarea defaultValue={q.text} rows={4} style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: C.body, display: "block", marginBottom: 6 }}>AI 보이스 톤</label>
          {["친근하고 따뜻하게", "전문적이고 중립적으로", "간결하고 명확하게"].map((tone, i) => (
            <div key={tone} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 4, border: `1px solid ${i === 0 ? C.purple : C.border}`, background: i === 0 ? C.purpleBg : "transparent", cursor: "pointer", marginBottom: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${i === 0 ? C.purple : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i === 0 && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple }} />}
              </div>
              <span style={{ fontSize: 12, color: i === 0 ? C.purple : C.body }}>{tone}</span>
            </div>
          ))}
        </div>
        <div>
          <label style={{ fontSize: 12, color: C.body, display: "block", marginBottom: 6 }}>최대 답변 시간</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["30초", "1분", "2분", "3분"].map((t, i) => (
              <button key={t} style={{ padding: "5px 10px", borderRadius: 4, fontSize: 12, fontFamily: F, cursor: "pointer", border: `1px solid ${i === 1 ? C.purple : C.border}`, background: i === 1 ? C.purpleBg : "transparent", color: i === 1 ? C.purple : C.body }}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
