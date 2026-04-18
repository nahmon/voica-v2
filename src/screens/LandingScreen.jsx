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
`;

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
function CounterStat({ end, suffix, label, delay, color, labelColor }) {
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

function AnimatedChatMockup() {
  const [convoIdx, setConvoIdx] = useState(0);
  const [phase, setPhase] = useState("typing"); // typing → question → recording → response

  useEffect(() => {
    const timers = [];
    const advance = (delay, nextPhase, cb) => { const t = setTimeout(() => { setPhase(nextPhase); cb && cb(); }, delay); timers.push(t); return t; };
    if (phase === "typing") { advance(1400, "question"); }
    else if (phase === "question") { advance(2000, "recording"); }
    else if (phase === "recording") { advance(2200, "response"); }
    else if (phase === "response") {
      advance(2800, "typing", () => { setConvoIdx(i => (i + 1) % CHAT_CONVOS.length); });
    }
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const convo = CHAT_CONVOS[convoIdx];
  const isTyping = phase === "typing";
  const isRecording = phase === "recording";
  const showResponse = phase === "response";

  return (
    <div style={{
      width: 460, background: "#fff",
      borderRadius: 16, border: `1px solid ${C.border}`,
      boxShadow: `0 24px 64px -12px rgba(110,75,255,0.18), 0 4px 16px -4px rgba(0,0,0,0.08)`,
      overflow: "hidden", fontFamily: F,
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafbff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: C.body, fontWeight: 500 }}>interview / vs-b2n</span>
          <span style={{ fontSize: 11, color: C.body }}>· Q{convoIdx + 1} of {CHAT_CONVOS.length}</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: C.successText, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
          live
        </span>
      </div>

      {/* Chat area */}
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, minHeight: 220, position: "relative" }}>
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
              <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>Recording…</span>
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
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafbff" }}>
        <span style={{ fontSize: 11, color: C.body }}>🔒 encrypted · end-to-end</span>
        <button style={{ padding: "8px 18px", borderRadius: 8, background: isRecording ? "#dc2626" : C.purple, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.3s" }}>
          {isRecording ? "Stop ■" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

/* ── Comparison section ── */
function BeforeAfterSection({ isMobile }) {
  const metrics = [
    { value: "50×", label: "larger sample" },
    { value: "1/40", label: "the cost" },
    { value: "×144", label: "faster launch" },
  ];
  const rows = [
    { label: "Timeline", before: "~2 weeks", after: "10 minutes to launch" },
    { label: "Cost", before: "$1,500+", after: "$49" },
    { label: "Sample", before: "10 participants", after: "500 parallel" },
    { label: "Analysis", before: "Manual transcription", after: "Automated, by-theme" },
    { label: "Recruiting", before: "Agency dependent", after: "Matched in-platform" },
  ];

  const darkBg = "#120e2e";
  const rowBg = "rgba(255,255,255,0.05)";
  const rowBorder = "rgba(255,255,255,0.08)";

  return (
    <FadeInSection>
      <section style={{ background: darkBg, padding: isMobile ? "60px 20px" : "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(160,140,255,0.7)", marginBottom: 10 }}>Comparison</div>
            <h2 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 700, color: "#fff", margin: "0 0 10px", fontFamily: F }}>
              Traditional flow vs. <span style={{ color: C.purpleLight }}>voicesurvey</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(200,190,255,0.6)", margin: 0 }}>Same research, at one-tenth the cost and ten times the sample.</p>
          </div>

          {/* metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {metrics.map(m => (
              <div key={m.value} style={{ background: "rgba(110,75,255,0.12)", border: "1px solid rgba(110,75,255,0.25)", borderRadius: 12, padding: isMobile ? "20px 18px" : "28px 24px" }}>
                <div style={{ fontSize: isMobile ? 36 : 48, fontWeight: 700, color: C.purpleLight, lineHeight: 1, fontFamily: F }}>{m.value}</div>
                <div style={{ fontSize: 14, color: "rgba(200,190,255,0.65)", marginTop: 10 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* two-table layout */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            {/* Traditional table */}
            <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(220,215,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Traditional</div>
              </div>
              {rows.map((row, i) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none", background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 13, color: "rgba(220,215,255,0.6)", fontWeight: 500 }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: "rgba(220,215,255,0.8)" }}>{row.before}</div>
                </div>
              ))}
            </div>

            {/* voicesurvey table — brighter */}
            <div style={{ borderRadius: 12, border: "1px solid rgba(110,75,255,0.6)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(110,75,255,0.4)", background: "rgba(110,75,255,0.35)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>voicesurvey</div>
                <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", color: "#fff", padding: "2px 8px", borderRadius: 4 }}>Recommended</span>
              </div>
              {rows.map((row, i) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: i < rows.length - 1 ? "1px solid rgba(110,75,255,0.2)" : "none", background: "rgba(110,75,255,0.18)" }}>
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

/* ── Final CTA section ── */
function FinalCtaSection({ go, isMobile }) {
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
            Start today
          </Badge>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 700, color: C.white, margin: "0 0 16px", fontFamily: F, lineHeight: 1.15 }}>
            Get started for free
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,0.72)", margin: "0 0 44px", lineHeight: 1.6 }}>
            {isMobile
              ? "No credit card required."
              : <>No credit card needed — start right away.<br />Your first interview project is completely free.</>}
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
              Start as researcher →
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
              Join as panelist
            </button>
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}

/* ── Main screen ── */
export default function LandingScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [liveCount, setLiveCount] = useState(247);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const refParam = new URLSearchParams(window.location.search).get("ref");
  const fromInterview = refParam === "interview";
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

  return (
    <div className="landing-light" style={{ fontFamily: F, fontFeatureSettings: '"ss01"' }}>
      <style>{GLOBAL_STYLES}</style>
      <GlobalNav go={go} activeTab="landing" variant={user ? "app" : "public"} isMobile={isMobile} user={user} logout={logout} />

      {/* ── Hero ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: isMobile ? "72px 20px 80px" : "88px 24px 96px",
        background: "transparent",
      }}>
        {/* blobs */}
        <div style={{ position: "absolute", top: -80, right: "10%", width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}18, transparent 70%)`, filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.purple}10, transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: isMobile ? 0 : 64, flexDirection: isMobile ? "column" : "row", position: "relative" }}>

          {/* ── Left: text ── */}
          <div style={{ flex: "0 0 auto", maxWidth: isMobile ? "100%" : 520 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Badge variant="purple">✦ AI interviews. AI analyzes. You decide.</Badge>
            </div>

            {(() => {
              const heroMessages = [
                { line1: "Slow, expensive research?", line2: "Interview hundreds with AI" },
                { line1: "Hear from your customers,", line2: "accurately\u00A0and\u00A0fast" },
              ];
              const msg = fromInterview
                ? { line1: "How was your AI interview?", line2: "Interview hundreds with AI" }
                : heroMessages[heroIdx];
              return (
                <h1 style={{
                  fontSize: isMobile ? 32 : 52, fontWeight: 700, lineHeight: 1.2, margin: "0 0 20px",
                  fontFamily: F, wordBreak: "keep-all",
                  opacity: heroVisible ? 1 : 0,
                  transition: "opacity 0.4s ease",
                }}>
                  <span style={{ color: C.navy }}>{msg.line1}</span>
                  <br />
                  <span style={{ background: `linear-gradient(135deg, ${C.purple}, #3d2ab0)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {msg.line2}
                  </span>
                </h1>
              );
            })()}

            <p style={{ fontSize: isMobile ? 15 : 16, color: C.body, lineHeight: 1.65, margin: "0 0 36px", fontFamily: F }}>
              {isMobile
                ? <>Just write your questions — AI handles the rest.<br />Analysis, sentiment, and reports, fully automated.</>
                : <>Design your questions and AI conducts live voice interviews with hundreds of panelists at once.<br />Theme analysis, sentiment tagging, and insight reports are generated automatically.</>}
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
              <button onClick={() => go("advertiser_login")}
                style={{ cursor: "pointer", padding: "13px 24px", borderRadius: 10, background: C.purple, border: "none", fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: F, transition: "background 0.15s, transform 0.15s", display: "inline-flex", alignItems: "center", gap: 8 }}
                onMouseEnter={e => { e.currentTarget.style.background = C.purpleHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.purple; e.currentTarget.style.transform = "none"; }}>
                Researcher / Business →
              </button>
              <button onClick={() => go("panel_entry")}
                style={{ cursor: "pointer", padding: "13px 24px", borderRadius: 10, background: "#fff", border: `1.5px solid ${C.purpleLight}`, fontSize: 15, fontWeight: 600, color: C.purple, fontFamily: F, transition: "border-color 0.15s, transform 0.15s", display: "inline-flex", alignItems: "center", gap: 8 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.purpleLight; e.currentTarget.style.transform = "none"; }}>
                🎙️ Join as Panelist
              </button>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 20, background: "rgba(110,75,255,0.07)", border: `1px solid ${C.purpleLight}` }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, animation: "pulse-dot 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 13, color: C.body }}><strong style={{ fontWeight: 600, color: C.purple }}>{liveCount} people</strong> are in an interview right now</span>
            </div>
          </div>

          {/* ── Right: animated interview mockup ── */}
          {!isMobile && (
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <AnimatedChatMockup />
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <FadeInSection>
        <section style={{ background: "rgba(110,75,255,0.04)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: isMobile ? "48px 20px" : "64px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.purple, marginBottom: 8 }}>Live Numbers</div>
                <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.navy, margin: 0, fontFamily: F }}>What's happening on the platform right now</h2>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(21,190,83,0.1)", border: "1px solid rgba(21,190,83,0.25)", fontSize: 12, fontWeight: 600, color: C.successText }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
                live
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 0 }}>
              {[
                { end: 12400, suffix: "+", label: "Registered panelists", color: C.purple, delay: 0 },
                { end: 4200, suffix: "", label: "Interviews completed this month", color: C.purple, delay: 100 },
                { end: 94, suffix: "%", label: "AI analysis accuracy", color: C.purple, delay: 200 },
                { end: 8, suffix: " min", label: "Average interview length", color: C.purple, delay: 300 },
              ].map(({ label, ...stat }, i) => (
                <div key={label} style={{
                  textAlign: "left",
                  padding: isMobile ? "20px 12px" : "24px 32px",
                  fontSize: isMobile ? 32 : 44,
                  borderRight: (isMobile ? i % 2 === 0 : i < 3) ? `1px solid ${C.border}` : "none",
                  borderBottom: (isMobile && i < 2) ? `1px solid ${C.border}` : "none",
                }}>
                  <CounterStat {...stat} label={label} labelColor={C.body} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* ── Trusted by logos ── */}

      {/* ── Before vs After ── */}
      <BeforeAfterSection isMobile={isMobile} />

      {/* ── Carousels ── */}
      <FadeInSection>
        <VoCCarousel />
      </FadeInSection>
      <FadeInSection>
        <HowItWorksCarousel />
      </FadeInSection>

      {/* ── Final CTA ── */}
      <FinalCtaSection go={go} isMobile={isMobile} />

      <Footer go={go} />
    </div>
  );
}
