import { useState, useEffect, useRef } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, GlobalNav, VoCCarousel, HowItWorksCarousel, Footer } from "../components/shared.jsx";
import { track } from "../lib/analytics.js";

/* ── Keyframe styles injected once ── */
const GLOBAL_STYLES = `
@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
@keyframes hero-gradient-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes badge-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(83,58,253,0.25); }
  50%     { box-shadow: 0 0 0 6px rgba(83,58,253,0); }
}
@keyframes bubble-in { from { opacity:0; transform:translateY(10px) scale(0.96); } to { opacity:1; transform:none; } }
@keyframes rec-ring { 0%{box-shadow:0 0 0 0 rgba(220,38,38,0.5)} 70%{box-shadow:0 0 0 10px rgba(220,38,38,0)} 100%{box-shadow:0 0 0 0 rgba(220,38,38,0)} }
@keyframes wave-bar { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }
@keyframes typing-dot { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-4px);opacity:1} }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

/* ── Translations ── */
const TRANSLATIONS = {
  en: {
    badge: "✦ AI interviews. AI analyzes. You decide.",
    hero: {
      messages: [
        { line1: "Slow, expensive research?", line2: "Interview hundreds with AI" },
        { line1: "Hear from your customers,", line2: "accurately\u00A0and\u00A0fast" },
      ],
      fromInterview: { line1: "How was your AI interview?", line2: "Interview hundreds with AI" },
      subtitleDesktop: <>Design your questions and AI conducts live voice interviews with hundreds of panelists at once.<br />Theme analysis, sentiment tagging, and insight reports are generated automatically.</>,
      subtitleMobile: <>Just write your questions — AI handles the rest.<br />Analysis, sentiment, and reports, fully automated.</>,
      cta1: "Researcher / Business →",
      cta2: "Join as Panelist",
      liveCounter: (n) => <><strong style={{ fontWeight: 600, color: C.purple }}>{n} people</strong> are in an interview right now</>,
    },
    stats: {
      label: "Live Numbers",
      title: "What's happening on the platform right now",
      items: [
        { end: 12400, suffix: "+", label: "Registered panelists" },
        { end: 4200, suffix: "", label: "Interviews completed this month" },
        { end: 94, suffix: "%", label: "AI analysis accuracy" },
        { end: 8, suffix: " min", label: "Average interview length" },
      ],
    },
    comparison: {
      label: "Comparison",
      title: (purpleLight) => <>Traditional flow vs. <span style={{ color: purpleLight }}>voicesurvey</span></>,
      subtitle: "Same research — fifty times the sample, at one-fortieth the cost.",
      metrics: [
        { value: "×50", label: "larger sample" },
        { value: "1/40", label: "the cost" },
        { value: "×144", label: "faster to launch" },
        { value: "500+", label: "parallel panelists" },
      ],
      rows: [
        { label: "Timeline", before: "~2 weeks", after: "10 minutes to launch" },
        { label: "Cost", before: "$2,000+/project", after: "$149~/mo" },
        { label: "Sample", before: "10 participants", after: "500 parallel" },
        { label: "Analysis", before: "Manual transcription", after: "Automated, by-theme" },
        { label: "Recruiting", before: "Agency dependent", after: "Matched in-platform" },
      ],
      headerTraditional: "Traditional",
      headerVS: "voicesurvey",
      recommended: "Recommended",
    },
    useCases: {
      label: "Use cases",
      title: "Interview for anything",
      subtitle: "Discover the numerous ways companies are using voicesurvey.",
      items: [
        { icon: "ShoppingCart", label: "Consumer goods testing" },
        { icon: "Pencil",       label: "Creative testing" },
        { icon: "Chat",         label: "Message testing" },
        { icon: "Target",       label: "Prototype testing" },
        { icon: "Globe",        label: "Website testing" },
        { icon: "Phone",        label: "Mobile app testing" },
        { icon: "Sparkle",      label: "AI quality evals" },
        { icon: "CheckCircle",  label: "Product & UX evals" },
        { icon: "Star",         label: "Brand perception" },
        { icon: "Map",          label: "Customer journey map" },
        { icon: "BarChart",     label: "Customer segmentation" },
        { icon: "Users",        label: "Employee experience" },
      ],
    },
    cta: {
      badge: "Start today",
      title: "Get started for free",
      subtitleDesktop: <>No credit card needed — start right away.<br />Your first interview project is completely free.</>,
      subtitleMobile: "No credit card required.",
      cta1: "Start as researcher →",
      cta2: "Join as panelist",
    },
  },
  ko: {
    badge: "✦ AI가 인터뷰하고, AI가 분석해요.",
    hero: {
      messages: [
        { line0: "비싸고 오래 걸리는", line1: "사용자 조사,", line2: "AI로 수백 명을 한 번에" },
        { line1: "고객의 목소리를", line2: "정확하고\u00A0빠르게" },
      ],
      fromInterview: { line1: "AI 인터뷰는 어떠셨나요?", line2: "AI로 수백 명과 인터뷰하세요" },
      subtitleDesktop: <>질문만 작성하면 AI가 수백 명의 인터뷰 패널과 동시에 인터뷰를 진행합니다.<br />주제 분석, 감성 태깅, 인사이트 리포트까지 AI가 알아서 만들어줘요.</>,
      subtitleMobile: <>질문만 작성하면 AI가 나머지를 처리합니다.<br />분석, 감성, 리포트 모두 AI가 자동으로 처리해요.</>,
      cta1: "인터뷰 만들기 →",
      cta2: "패널로 참여하기",
      liveCounter: (n) => <><strong style={{ fontWeight: 600, color: C.purple }}>지금 {n}명</strong>이 인터뷰 중입니다</>,
    },
    stats: {
      label: "Live",
      title: <>지금 많은 인터뷰가<br />진행 중이에요</>,
      items: [
        { end: 12400, suffix: "+", label: "등록된 인터뷰 패널" },
        { end: 4200, suffix: "", label: "이번 달 완료된 인터뷰" },
        { end: 94, suffix: "%", label: "AI 분석 정확도" },
        { end: 8, suffix: " min", label: "평균 인터뷰 시간" },
      ],
    },
    comparison: {
      label: "비교",
      title: (purpleLight) => <>기존 방식 vs. <span style={{ color: purpleLight }}>voicesurvey</span></>,
      subtitle: "같은 조사를, 50배 더 많은 표본으로, 40분의 1 비용으로.",
      metrics: [
        { value: "×50", label: "더 큰 표본" },
        { value: "1/40", label: "비용 절감" },
        { value: "×144", label: "더 빠른 출시" },
        { value: "500+", label: "동시 패널 참여" },
      ],
      rows: [
        { label: "기간", before: "약 2주", after: "10분 안에 시작" },
        { label: "비용", before: "₩2,600,000+/프로젝트", after: "₩199,000~/월" },
        { label: "표본", before: "10명", after: "500명 동시" },
        { label: "분석", before: "직접 전사", after: "자동화, 주제별" },
        { label: "모집", before: "대행사 의존", after: "플랫폼 내 매칭" },
      ],
      headerTraditional: "기존 방식",
      headerVS: "voicesurvey",
      recommended: "추천",
    },
    useCases: {
      label: "활용 사례",
      title: "무엇이든 인터뷰할 수 있어요",
      subtitle: "다양한 기업들이 voicesurvey로 조사를 진행하는 방식을 확인해보세요.",
      items: [
        { icon: "ShoppingCart", label: "소비재 인터뷰" },
        { icon: "Pencil",       label: "광고·크리에이티브 테스트" },
        { icon: "Chat",         label: "메시지 테스트" },
        { icon: "Target",       label: "프로토타입 테스트" },
        { icon: "Globe",        label: "웹사이트 테스트" },
        { icon: "Phone",        label: "모바일 앱 테스트" },
        { icon: "Sparkle",      label: "AI 품질 평가" },
        { icon: "CheckCircle",  label: "제품·UX 평가" },
        { icon: "Star",         label: "브랜드 인식 조사" },
        { icon: "Map",          label: "고객 여정 분석" },
        { icon: "BarChart",     label: "고객 세분화" },
        { icon: "Users",        label: "직원 경험 조사" },
      ],
    },
    cta: {
      badge: "지금 시작하기",
      title: "무료로 시작하세요",
      subtitleDesktop: <>신용카드 없이 바로 시작할 수 있어요.<br />첫 번째 인터뷰 프로젝트는 완전 무료예요.</>,
      subtitleMobile: "빠르게 인터뷰를 시작해보세요.",
      cta1: "리서치 시작하기 →",
      cta2: "패널로 참여하기",
    },
  },
};

/* ── Fade-in-on-scroll wrapper (local, no shared.jsx changes) ── */
function FadeInSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ── CounterStat (unchanged) ── */
function CounterStat({ end, suffix, label, delay = 0, color, labelColor }) {
  const [val, setVal] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const duration = 1400;
    let raf;
    const startTs = performance.now() + delay;
    const tick = (now) => {
      if (now < startTs) { raf = requestAnimationFrame(tick); return; }
      const t = Math.min((now - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * end));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, end, delay]);

  const display = !visible ? "—" : (val >= 1000 ? val.toLocaleString("ko-KR") : String(val));

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontSize: "inherit", fontWeight: 700, color, lineHeight: 1.1, fontFamily: F, letterSpacing: "-0.5px", fontFeatureSettings: '"tnum"' }}>
        {display}{suffix}
      </div>
      <div style={{ fontSize: 13, color: labelColor, marginTop: 6, letterSpacing: "0.16px", lineHeight: 1.4 }}>
        {label}
      </div>
    </div>
  );
}


/* ── Animated chat mockup ── */
const CHAT_CONVOS = [
  { q: "What part of running research feels heaviest right now?", a: "Honestly — recruiting. Two weeks to find ten people, and by then the question's already moved on." },
  { q: "How many user interviews do you run per quarter?", a: "Maybe 3 or 4. I wish it were more, but it's just too slow and expensive." },
  { q: "What would faster research unlock for your team?", a: "We'd ship with way more confidence. No more guessing what users actually want." },
];
const CHAT_CONVOS_KO = [
  { q: "지금 리서치에서 가장 부담스러운 부분이 어디인가요?", a: "솔직히 말하면 섭외요. 10명 찾는 데 2주 걸리는데, 그때쯤엔 이미 질문 자체가 바뀌어 있어요." },
  { q: "분기에 사용자 인터뷰를 몇 번이나 진행하시나요?", a: "3~4번 정도요. 더 하고 싶은데 너무 느리고 비용도 많이 들어서요." },
  { q: "리서치가 빨라지면 팀에서 뭘 가장 먼저 바꾸고 싶으세요?", a: "훨씬 자신감 있게 출시할 수 있을 것 같아요. 유저가 뭘 원하는지 더 이상 추측하지 않아도 되니까요." },
];

function AnimatedChatMockup({ lang = "en" }) {
  const [convoIdx, setConvoIdx] = useState(0);
  const [phase, setPhase] = useState("typing"); // typing → question → recording → response
  const isKo = lang === "ko";
  const convos = isKo ? CHAT_CONVOS_KO : CHAT_CONVOS;

  useEffect(() => {
    const timers = [];
    const advance = (delay, nextPhase, cb) => { const t = setTimeout(() => { setPhase(nextPhase); cb && cb(); }, delay); timers.push(t); return t; };
    if (phase === "typing") { advance(1400, "question"); }
    else if (phase === "question") { advance(2000, "recording"); }
    else if (phase === "recording") { advance(2200, "response"); }
    else if (phase === "response") {
      advance(2800, "typing", () => { setConvoIdx(i => (i + 1) % convos.length); });
    }
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const convo = convos[convoIdx];
  const isTyping = phase === "typing";
  const isRecording = phase === "recording";
  const showResponse = phase === "response";

  return (
    <div style={{
      width: 460, background: "#fff",
      borderRadius: 16, border: `1px solid ${C.border}`,
      boxShadow: `0 24px 64px -12px rgba(110,75,255,0.18), 0 4px 16px -4px rgba(0,0,0,0.08)`,
      overflow: "hidden", fontFamily: F,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafbff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: C.body, fontWeight: 500 }}>interview / vs-b2n</span>
          <span style={{ fontSize: 11, color: C.body }}>· Q{convoIdx + 1} {isKo ? "/ " : "of "}{convos.length}</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: C.successText, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
          {isKo ? "라이브" : "live"}
        </span>
      </div>

      {/* Chat area — fixed height prevents layout shift */}
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, height: 240, flexShrink: 0, position: "relative", overflow: "hidden" }}>
        {/* AI bubble */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(110,75,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={14} height={14} viewBox="0 0 20 20" fill="none" stroke={C.purple} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="1" width="6" height="11" rx="3"/><path d="M3.5 10a6.5 6.5 0 0013 0"/><line x1="10" y1="16.5" x2="10" y2="19"/><line x1="7" y1="19" x2="13" y2="19"/></svg>
          </div>
          <div style={{ background: "#f4f1fe", borderRadius: "4px 12px 12px 12px", padding: "11px 14px", maxWidth: 310, minHeight: 44, display: "flex", alignItems: "center" }}>
            {isTyping ? (
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.purple, animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: C.navy, lineHeight: 1.5, animation: "bubble-in 0.35s ease" }}>
                {convo.q}
              </div>
            )}
          </div>
        </div>

        {/* Recording state */}
        {isRecording && (
          <div style={{ display: "flex", justifyContent: "flex-end", animation: "bubble-in 0.3s ease" }}>
            <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626", animation: "rec-ring 1.2s ease infinite, pulse-dot 1.2s ease infinite" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 3, height: 24 }}>
                {[0,1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ width: 3, borderRadius: 2, background: "#dc2626", transformOrigin: "bottom", height: `${10 + (i % 3) * 5}px`, animation: `wave-bar 0.6s ease-in-out ${(i * 0.08).toFixed(2)}s infinite` }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>{isKo ? "녹음 중…" : "Recording…"}</span>
            </div>
          </div>
        )}

        {/* User response */}
        {showResponse && (
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", gap: 10, animation: "bubble-in 0.35s ease" }}>
            <div style={{ background: C.purple, borderRadius: "12px 4px 12px 12px", padding: "11px 14px", fontSize: 14, color: "#fff", lineHeight: 1.5, maxWidth: 310 }}>
              {convo.a}
            </div>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.purpleBg, border: `1px solid ${C.purpleLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.purple, flexShrink: 0 }}>U</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafbff", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: C.body }}>🔒 {isKo ? "종단간 암호화" : "encrypted · end-to-end"}</span>
        <button style={{ padding: "8px 18px", borderRadius: 8, background: isRecording ? "#dc2626" : C.purple, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.3s" }}>
          {isRecording ? (isKo ? "중지 ■" : "Stop ■") : (isKo ? "계속하기 →" : "Continue →")}
        </button>
      </div>
    </div>
  );
}

/* ── Comparison section ── */
function BeforeAfterSection({ isMobile, t }) {
  const { label, title, subtitle, metrics, rows, headerTraditional, headerVS, recommended } = t.comparison;

  const darkBg = "#120e2e";

  return (
    <FadeInSection>
      <section style={{ background: darkBg, padding: isMobile ? "60px 20px" : "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(160,140,255,0.7)", marginBottom: 10 }}>{label}</div>
            <h2 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 700, color: "#fff", margin: "0 0 10px", fontFamily: F, letterSpacing: "-0.02em" }}>
              {title(C.purpleLight)}
            </h2>
            <p style={{ fontSize: 15, color: "rgba(200,190,255,0.6)", margin: 0 }}>{subtitle}</p>
          </div>

          {/* metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {(isMobile ? metrics : metrics.slice(0, 3)).map(m => (
              <div key={m.value} style={{ background: "rgba(110,75,255,0.12)", border: "1px solid rgba(110,75,255,0.25)", borderRadius: 12, padding: isMobile ? "20px 18px" : "28px 24px" }}>
                <div style={{ fontSize: isMobile ? 36 : 48, fontWeight: 700, color: C.purpleLight, lineHeight: 1, fontFamily: F }}>{m.value}</div>
                <div style={{ fontSize: 14, color: "rgba(220,210,255,0.9)", marginTop: 10 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* two-table layout */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            {/* Traditional table */}
            <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(220,215,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{headerTraditional}</div>
              </div>
              {rows.map((row, i) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <div style={{ fontSize: 13, color: "rgba(220,215,255,0.6)", fontWeight: 500 }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: "rgba(220,215,255,0.8)" }}>{row.before}</div>
                </div>
              ))}
            </div>

            {/* voicesurvey table — brighter */}
            <div style={{ borderRadius: 12, border: "1px solid rgba(110,75,255,0.6)", overflow: "hidden", background: "rgba(110,75,255,0.28)" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(110,75,255,0.4)", background: "rgba(110,75,255,0.35)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>{headerVS}</div>
                <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", color: "#fff", padding: "2px 8px", borderRadius: 4 }}>{recommended}</span>
              </div>
              {rows.map((row, i) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: i < rows.length - 1 ? "1px solid rgba(110,75,255,0.25)" : "none" }}>
                  <div style={{ fontSize: 13, color: "rgba(220,210,255,0.7)", fontWeight: 500 }}>{row.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{row.after}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}

/* ── Use cases section ── */
function UseCasesSection({ isMobile, t }) {
  const { label, title, subtitle, items } = t.useCases;
  return (
    <section style={{ padding: isMobile ? "60px 20px" : "80px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.purple, marginBottom: 10 }}>{label}</div>
          <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 700, color: C.navy, margin: "0 auto 10px", fontFamily: F, letterSpacing: "-0.02em" }}>{title}</h2>
          <p style={{ fontSize: 15, color: C.body, margin: "0 auto", maxWidth: 600 }}>{subtitle}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: isMobile ? "2px 4px" : "2px 8px" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 12px" }}>
              {Ic[item.icon] && Ic[item.icon]({ s: 15, c: C.body })}
              <span style={{ fontSize: 14, color: C.body }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA section ── */
function FinalCtaSection({ go, isMobile, t }) {
  const { badge: badgeText, title, subtitleDesktop, subtitleMobile, cta1, cta2 } = t.cta;
  return (
    <FadeInSection>
      <section style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #1c1e54 50%, ${C.purple} 100%)`,
        backgroundSize: "200% 200%",
        animation: "hero-gradient-shift 8s ease infinite",
        padding: isMobile ? "72px 20px" : "100px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <Badge variant="purple" style={{ marginBottom: 20, background: "rgba(255,255,255,0.12)", color: C.white, border: "1px solid rgba(255,255,255,0.2)" }}>
            {badgeText}
          </Badge>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 700, color: C.white, margin: "0 0 16px", fontFamily: F, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            {title}
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,0.72)", margin: "0 0 44px", lineHeight: 1.6 }}>
            {isMobile ? subtitleMobile : subtitleDesktop}
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => go("advertiser_login")}
              style={{
                cursor: "pointer", padding: "14px 32px", borderRadius: 12,
                background: C.white, border: "none",
                fontSize: 15, fontWeight: 700, color: C.purple,
                fontFamily: F, letterSpacing: "0.02em",
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; }}
            >
              {cta1}
            </button>
            <button
              onClick={() => go("panel_entry")}
              style={{
                cursor: "pointer", padding: "14px 32px", borderRadius: 12,
                background: "transparent", border: "1.5px solid rgba(255,255,255,0.45)",
                fontSize: 15, fontWeight: 600, color: C.white,
                fontFamily: F, letterSpacing: "0.02em",
                transition: "transform 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = "transparent"; }}
            >
              {cta2}
            </button>
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}

/* ── Main screen ── */
export default function LandingScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const isMobile = useIsMobile();
  const [liveCount, setLiveCount] = useState(247);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const refParam = new URLSearchParams(window.location.search).get("ref");
  const fromInterview = refParam === "interview";
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (fromInterview) track("referral_from_interview", { ref: refParam });
  }, []);
  useEffect(() => {
    const cycle = setInterval(() => {
      setHeroVisible(false);
      setTimeout(() => {
        setHeroIdx(i => (i + 1) % 2);
        setHeroVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(cycle);
  }, []);
  useEffect(() => {
    const tick = () => {
      setLiveCount(prev => {
        const delta = Math.random() < 0.4 ? 1 : (Math.random() < 0.15 ? -1 : 0);
        return Math.max(230, Math.min(280, prev + delta));
      });
    };
    const interval = setInterval(tick, 3200);
    return () => clearInterval(interval);
  }, []);

  const heroMsg = fromInterview ? t.hero.fromInterview : t.hero.messages[heroIdx];

  return (
    <div className="landing-light" style={{ fontFamily: F, fontFeatureSettings: '"ss01"' }}>
      <style>{GLOBAL_STYLES}</style>
      <GlobalNav go={go} activeTab="landing" variant={user ? "app" : "public"} isMobile={isMobile} user={user} logout={logout} lang={lang} />

      {/* ── Hero ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: isMobile ? "72px 20px 80px" : "88px 24px 96px",
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(110,75,255,0.12) 0%, transparent 70%)",
      }}>

        <div style={{ maxWidth: 1200, margin: "0 auto", display: isMobile ? "flex" : "grid", gridTemplateColumns: "520px 1fr", alignItems: "center", gap: isMobile ? 0 : 64, flexDirection: isMobile ? "column" : "row", position: "relative", minHeight: isMobile ? "auto" : 580 }}>

          {/* ── Left: text ── */}
          <div style={{ width: isMobile ? "100%" : "100%", minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Badge variant="purple">{t.badge}</Badge>
            </div>

            <h1 style={{
              fontSize: isMobile ? 32 : 52, fontWeight: 700, lineHeight: 1.2, margin: "0 0 20px",
              fontFamily: F, wordBreak: "keep-all", letterSpacing: "-0.02em",
              minHeight: isMobile ? 120 : 260, overflow: "hidden",
              opacity: heroVisible ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}>
              {heroMsg.line0 && <><span style={{ color: C.navy }}>{heroMsg.line0}</span><br /></>}
              <span style={{ color: C.navy }}>{heroMsg.line1}</span>
              <br />
              <span style={{ background: `linear-gradient(135deg, ${C.purple}, #3d2ab0)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {heroMsg.line2}
              </span>
            </h1>

            <p style={{ fontSize: isMobile ? 15 : 16, color: C.body, lineHeight: 1.65, margin: "0 0 36px", fontFamily: F }}>
              {isMobile ? t.hero.subtitleMobile : t.hero.subtitleDesktop}
            </p>

            <div style={{ display: "flex", gap: 12, flexDirection: isMobile ? "column" : "row", marginBottom: 28, maxWidth: isMobile ? "100%" : 480 }}>
              <button onClick={() => go("advertiser_login")}
                style={{ cursor: "pointer", padding: "13px 24px", borderRadius: 10, background: C.purple, border: "none", fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: F, transition: "background 0.15s, transform 0.15s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = C.purpleHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.purple; e.currentTarget.style.transform = "none"; }}>
                {t.hero.cta1}
              </button>
              <button onClick={() => go("panel_entry")}
                style={{ cursor: "pointer", padding: "13px 24px", borderRadius: 10, background: "#fff", border: `1.5px solid ${C.purpleLight}`, fontSize: 15, fontWeight: 600, color: C.purple, fontFamily: F, transition: "border-color 0.15s, transform 0.15s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.purpleLight; e.currentTarget.style.transform = "none"; }}>
                {t.hero.cta2}
              </button>
            </div>

          </div>

          {/* ── Right: animated interview mockup ── */}
          {!isMobile && (
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <AnimatedChatMockup lang={lang} />
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: "70%", borderTop: `1px solid ${C.border}` }} /></div>
      <FadeInSection>
        <section style={{ background: "transparent", borderBottom: `1px solid ${C.border}`, padding: isMobile ? "48px 20px" : "64px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.purple }}>{t.stats.label}</span>
              </div>
              <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.navy, margin: "0 0 14px", fontFamily: F }}>{t.stats.title}</h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: "rgba(110,75,255,0.07)", border: `1px solid ${C.purpleLight}`, fontSize: 13, color: C.body }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, animation: "pulse-dot 2s ease-in-out infinite", flexShrink: 0 }} />
                {t.hero.liveCounter(liveCount)}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 0 }}>
              {t.stats.items.map(({ label, ...stat }, i) => (
                <div key={label} style={{
                  textAlign: "left",
                  padding: isMobile ? "20px 12px" : "24px 32px",
                  fontSize: isMobile ? 32 : 44,
                  borderRight: (isMobile ? i % 2 === 0 : i < 3) ? `1px solid ${C.border}` : "none",
                  borderBottom: (isMobile && i < 2) ? `1px solid ${C.border}` : "none",
                }}>
                  <CounterStat {...stat} label={label} color={C.purple} labelColor={C.body} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ── Before vs After ── */}
      <BeforeAfterSection isMobile={isMobile} t={t} />

      <div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: "70%", borderTop: `1px solid ${C.border}` }} /></div>

      {/* ── Carousels ── */}
      <FadeInSection>
        <VoCCarousel lang={lang} />
      </FadeInSection>

      <div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: "70%", borderTop: `1px solid ${C.border}` }} /></div>

      {/* ── Use cases ── */}
      <FadeInSection>
        <UseCasesSection isMobile={isMobile} t={t} />
      </FadeInSection>

      <div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: "70%", borderTop: `1px solid ${C.border}` }} /></div>

      <FadeInSection>
        <HowItWorksCarousel lang={lang} />
      </FadeInSection>

      {/* ── Final CTA ── */}
      <FinalCtaSection go={go} isMobile={isMobile} t={t} />

      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
