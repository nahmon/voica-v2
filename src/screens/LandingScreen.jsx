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

  const display = val >= 1000 ? val.toLocaleString("ko-KR") : String(val);

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
        {side === "before" ? "기존 방식" : "✦ Voice Survey"}
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
            <Badge variant="purple" style={{ marginBottom: 12 }}>비교</Badge>
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, color: C.navy, margin: "0 0 12px", fontFamily: F }}>
              기존 방식 vs <span style={{ color: C.purple }}>Voice Survey</span>
            </h2>
            <p style={{ fontSize: 15, color: C.body, margin: 0 }}>같은 인사이트, <span style={{ color: C.purple, fontWeight: 600 }}>훨씬 빠르고 저렴하게</span></p>
          </div>

          <div style={{ display: "flex", gap: isMobile ? 12 : 20, flexDirection: isMobile ? "column" : "row", alignItems: "stretch" }}>
            {col("before", [
              { icon: "⏳", bold: "2주", rest: "소요" },
              { icon: "💸", bold: "200만원", rest: "비용" },
              { icon: "👤", bold: "10명", rest: "인터뷰" },
            ])}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: C.body, flexShrink: 0 }}>
              {isMobile ? "↓" : "→"}
            </div>

            {col("after", [
              { icon: "⚡", bold: "10분", rest: "완료" },
              { icon: "💡", bold: "5만원", rest: "비용" },
              { icon: "🎙️", bold: "500명", rest: "동시 인터뷰" },
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
            지금 바로 시작
          </Badge>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 700, color: C.white, margin: "0 0 16px", fontFamily: F, lineHeight: 1.15 }}>
            지금 무료로 시작하기
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,0.72)", margin: "0 0 44px", lineHeight: 1.6 }}>
            {isMobile
              ? "신용카드 없이, 지금 바로."
              : <>신용카드 없이도 즉시 시작할 수 있어요.<br />첫 인터뷰 프로젝트는 무료로 진행해 드립니다.</>}
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
              리서처 시작 →
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
              패널 참여
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
  const refParam = new URLSearchParams(window.location.search).get("ref");
  const fromInterview = refParam === "interview";
  useEffect(() => {
    if (fromInterview) track("referral_from_interview", { ref: refParam });
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
    <div style={{ fontFamily: F, fontFeatureSettings: '"ss01"' }}>
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
            <Badge variant="purple">✦ AI 보이스 인터뷰 플랫폼</Badge>
          </div>

          <h1 style={{ fontSize: isMobile ? 34 : 52, fontWeight: 700, lineHeight: 1.15, margin: "0 0 24px", fontFamily: F }}>
            <span style={{ color: C.navy, display: "block" }}>
              {fromInterview
                ? "AI 인터뷰를 경험하셨나요?"
                : isMobile
                  ? "인터뷰, 비싸고 오래 걸리죠?"
                  : "시간과 비용이 많이 들었던 인터뷰"}
            </span>
            <span style={{ background: `linear-gradient(135deg, ${C.purple}, #1a1a2e)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block" }}>
              {isMobile ? "AI로 수백 명을 동시에" : "AI로 수백 명의 인터뷰를 동시에"}
            </span>
          </h1>

          <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 400, color: "rgba(10,11,13,0.56)", lineHeight: 1.6, letterSpacing: "0.16px", margin: "0 0 44px", fontFamily: F }}>
            {isMobile
              ? <>질문만 만들면 AI가 다 해요.<br />분석 · 감정 · 리포트까지 자동으로.</>
              : <>질문만 설계하면 AI가 수백 명의 패널과 보이스 인터뷰를 직접 진행해요.<br />테마 분석 · 감정 분류 · 인사이트 리포트까지 자동으로 완성돼요.</>}
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 32 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, color: C.body }}>지금 <strong style={{ fontWeight: 600, color: C.purple }}>{liveCount}명</strong>이 인터뷰에 참여하고 있어요</span>
          </div>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => go("advertiser_login")}
              style={{ cursor: "pointer", padding: "22px 24px", borderRadius: 16, background: C.white, border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)", width: isMobile ? "100%" : "auto", minWidth: isMobile ? 0 : 230, transition: "box-shadow 0.2s, transform 0.2s", textAlign: "left", fontFamily: F }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(83,58,253,0.14), 0 8px 28px rgba(83,58,253,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(83,58,253,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 5, letterSpacing: "0.16px" }}>리서처 / 기업</div>
              <div style={{ fontSize: 13, color: "rgba(10,11,13,0.56)", lineHeight: 1.55, letterSpacing: "0.16px" }}>{isMobile ? "인터뷰 만들고 리포트 받기" : "인터뷰 설계부터 리포트 받기까지"}</div>
              <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.purple, background: "rgba(83,58,253,0.07)", padding: "5px 10px", borderRadius: 6 }}>시작하기 →</div>
            </button>
            <button onClick={() => go("panel_entry")}
              style={{ cursor: "pointer", padding: "22px 24px", borderRadius: 16, background: C.white, border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)", width: isMobile ? "100%" : "auto", minWidth: isMobile ? 0 : 230, transition: "box-shadow 0.2s, transform 0.2s", textAlign: "left", fontFamily: F }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(83,58,253,0.14), 0 8px 28px rgba(83,58,253,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(83,58,253,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>🎙️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 5, letterSpacing: "0.16px" }}>Voice Survey 패널</div>
              <div style={{ fontSize: 13, color: "rgba(10,11,13,0.56)", lineHeight: 1.55, letterSpacing: "0.16px" }}>{isMobile ? "말하고 리워드 받기" : "보이스로 인터뷰 참여하고 리워드 받기"}</div>
              <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.purple, background: "rgba(83,58,253,0.07)", padding: "5px 10px", borderRadius: 6 }}>참여하기 →</div>
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <FadeInSection>
        <section style={{ background: C.white, padding: isMobile ? "40px 20px" : "52px 24px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}>
            {[
              { end: 12400, suffix: "+", label: "등록된 패널", color: C.purple, delay: 0 },
              { end: 4200, suffix: "건", label: "이번 달 완료 인터뷰", color: C.navy, delay: 100 },
              { end: 94, suffix: "%", label: "AI 분석 정확도", color: C.successText, delay: 200 },
              { end: 8, suffix: "분", label: "평균 인터뷰 시간", color: C.ruby, delay: 300 },
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
