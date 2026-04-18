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


/* ── Before vs After comparison ── */
function BeforeAfterSection({ isMobile }) {
  const col = (side, items, accent) => (
    <div style={{
      flex: 1,
      borderRadius: 16,
      padding: isMobile ? "24px 20px" : "32px 28px",
      background: side === "after" ? `linear-gradient(135deg, ${C.purple} 0%, #2e2b8c 100%)` : C.white,
      border: side === "after" ? "none" : `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: side === "after" ? "rgba(255,255,255,0.65)" : C.body, marginBottom: 16 }}>
        {side === "before" ? "Traditional approach" : "✦ Voice Survey"}
      </div>
      {items.map(({ icon, bold, rest }) => (
        <div key={bold} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: isMobile ? 15 : 16, color: side === "after" ? C.white : C.navy, lineHeight: 1.4 }}>
            <strong style={{ fontWeight: 700, color: side === "after" ? C.white : C.purple }}>{bold}</strong>{" "}{rest}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <FadeInSection>
      <section style={{ background: C.white, padding: isMobile ? "60px 20px" : "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Badge variant="purple" style={{ marginBottom: 12 }}>Comparison</Badge>
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: C.navy, margin: "0 0 12px", fontFamily: F }}>
              Old way vs <span style={{ color: C.purple }}>Voice Survey</span>
            </h2>
            <p style={{ fontSize: 15, color: C.body, margin: 0 }}>Hear from your customers<br />accurately and fast</p>
          </div>

          <div style={{ display: "flex", gap: isMobile ? 12 : 20, flexDirection: isMobile ? "column" : "row", alignItems: "stretch" }}>
            {col("before", [
              { icon: "⏳", bold: "2 weeks", rest: "to complete" },
              { icon: "💸", bold: "$1,500+", rest: "cost" },
              { icon: "👤", bold: "10 people", rest: "interviewed" },
            ])}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: C.body, flexShrink: 0 }}>
              {isMobile ? "↓" : "→"}
            </div>

            {col("after", [
              { icon: "⚡", bold: "10 minutes", rest: "to complete" },
              { icon: "💡", bold: "$49", rest: "cost" },
              { icon: "🎙️", bold: "500 people", rest: "interviewed simultaneously" },
            ])}
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

      {/* ── Hero — animated gradient background ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: isMobile ? "80px 20px 90px" : "100px 24px 110px",
        background: "linear-gradient(135deg, #ffffff 0%, rgba(83,58,253,0.04) 50%, #ffffff 100%)",
        backgroundSize: "300% 300%",
        animation: "hero-gradient-shift 10s ease infinite",
      }}>
        {/* Radial blob */}
        <div style={{ position: "absolute", top: -60, left: "5%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(83,58,253,0.07), transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: "8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(83,58,253,0.05), transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
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
                fontSize: isMobile ? 30 : 52, fontWeight: 700, lineHeight: 1.3, margin: "0 0 24px",
                fontFamily: F, wordBreak: "keep-all",
                opacity: heroVisible ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}>
                <span style={{ color: C.navy }}>{msg.line1}</span>
                <br />
                <span style={{
                  whiteSpace: "nowrap",
                  ...(isMobile
                    ? { color: C.purple }
                    : { background: `linear-gradient(135deg, ${C.purple}, #1a1a2e)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" })
                }}>{msg.line2}</span>
              </h1>
            );
          })()}

          <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 400, color: "rgba(10,11,13,0.56)", lineHeight: 1.6, letterSpacing: "0.16px", margin: "0 0 44px", fontFamily: F }}>
            {isMobile
              ? <>Just write your questions — AI handles the rest.<br />Analysis, sentiment, and reports, fully automated.</>
              : <>Design your questions and AI conducts live voice interviews with hundreds of panelists at once.<br />Theme analysis, sentiment tagging, and insight reports are generated automatically.</>}
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 32 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, color: C.body }}><strong style={{ fontWeight: 600, color: C.purple }}>{liveCount} people</strong> are in an interview right now</span>
          </div>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => go("advertiser_login")}
              style={{ cursor: "pointer", padding: "22px 24px", borderRadius: 16, background: C.white, border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)", width: isMobile ? "100%" : "auto", minWidth: isMobile ? 0 : 230, transition: "box-shadow 0.2s, transform 0.2s", textAlign: "left", fontFamily: F }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(83,58,253,0.14), 0 8px 28px rgba(83,58,253,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(83,58,253,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 5, letterSpacing: "0.16px" }}>Researcher / Business</div>
              <div style={{ fontSize: 13, color: "rgba(10,11,13,0.56)", lineHeight: 1.55, letterSpacing: "0.16px" }}>{isMobile ? "Build interviews and get reports" : "Design interviews and receive full reports"}</div>
              <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.purple, background: "rgba(83,58,253,0.07)", padding: "5px 10px", borderRadius: 6 }}>Get started →</div>
            </button>
            <button onClick={() => go("panel_entry")}
              style={{ cursor: "pointer", padding: "22px 24px", borderRadius: 16, background: C.white, border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)", width: isMobile ? "100%" : "auto", minWidth: isMobile ? 0 : 230, transition: "box-shadow 0.2s, transform 0.2s", textAlign: "left", fontFamily: F }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(83,58,253,0.14), 0 8px 28px rgba(83,58,253,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(83,58,253,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>🎙️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 5, letterSpacing: "0.16px" }}>Voice Survey Panel</div>
              <div style={{ fontSize: 13, color: "rgba(10,11,13,0.56)", lineHeight: 1.55, letterSpacing: "0.16px" }}>{isMobile ? "Speak up and earn rewards" : "Join voice interviews and earn rewards"}</div>
              <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.purple, background: "rgba(83,58,253,0.07)", padding: "5px 10px", borderRadius: 6 }}>Join now →</div>
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <FadeInSection>
        <section style={{ background: C.white, padding: isMobile ? "40px 20px" : "52px 24px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}>
            {[
              { end: 12400, suffix: "+", label: "Registered panelists", color: C.purple, delay: 0 },
              { end: 4200, suffix: "", label: "Interviews completed this month", color: C.navy, delay: 100 },
              { end: 94, suffix: "%", label: "AI analysis accuracy", color: C.successText, delay: 200 },
              { end: 8, suffix: " min", label: "Average interview length", color: C.ruby, delay: 300 },
            ].map(({ label, ...stat }, i) => (
              <div key={label} style={{
                textAlign: "center",
                padding: isMobile ? "20px 12px" : "24px 20px",
                fontSize: isMobile ? 26 : 34,
                borderRight: (isMobile ? i % 2 === 0 : i < 3) ? `1px solid ${C.border}` : "none",
                borderBottom: (isMobile && i < 2) ? `1px solid ${C.border}` : "none",
              }}>
                <CounterStat {...stat} label={label} labelColor="rgba(10,11,13,0.56)" />
              </div>
            ))}
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
