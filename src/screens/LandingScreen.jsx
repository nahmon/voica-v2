import { useState, useEffect, useRef } from "react";
import { C, F } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, GlobalNav, VoCCarousel, HowItWorksCarousel, Footer } from "../components/shared.jsx";
import { track } from "../lib/analytics.js";

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
      <GlobalNav go={go} activeTab="landing" variant={user ? "app" : "public"} isMobile={isMobile} user={user} logout={logout} />

      {/* Hero — white background, blue gradient accent */}
      <section style={{ background: C.white, padding: isMobile ? "80px 20px 90px" : "100px 24px 110px", position: "relative", overflow: "hidden" }}>
        <style>{`@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>
        <div style={{ position: "absolute", top: -60, left: "5%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(83,58,253,0.06), transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <Badge variant="purple" style={{ marginBottom: 20 }}>✦ AI 보이스 인터뷰 플랫폼</Badge>

          <h1 style={{ fontSize: isMobile ? 36 : 52, fontWeight: 700, lineHeight: 1.1, margin: "0 0 24px", fontFamily: F }}>
            <span style={{ color: "#061b31", display: "block" }}>
              {fromInterview ? "AI 인터뷰를 경험하셨나요?" : "시간과 비용이 많이 들었던 인터뷰"}
            </span>
            <span style={{ background: `linear-gradient(135deg, ${C.purple}, #1a1a2e)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block" }}>
              AI로 수백 명의 인터뷰를 동시에<span className="cursor-blink" style={{ background: `linear-gradient(135deg, ${C.purple}, #1a1a2e)` }} />
            </span>
          </h1>

          <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 400, color: "rgba(10,11,13,0.56)", lineHeight: 1.6, letterSpacing: "0.16px", margin: "0 0 44px", fontFamily: F }}>
            질문만 설계하면 AI가 수백 명의 패널과 보이스 인터뷰를 직접 진행해요.<br style={{ display: isMobile ? "none" : "block" }} />테마 분석 · 감정 분류 · 인사이트 리포트까지 자동으로 완성돼요.
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 32 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, color: C.body }}>지금 <strong style={{ fontWeight: 600, color: C.navy }}>{liveCount}명</strong>이 인터뷰에 참여하고 있어요</span>
          </div>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => go("advertiser_login")}
              style={{ cursor: "pointer", padding: "22px 24px", borderRadius: 16, background: C.white, border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)", width: isMobile ? "100%" : "auto", minWidth: isMobile ? 0 : 230, transition: "box-shadow 0.2s, transform 0.2s", textAlign: "left", fontFamily: F }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(83,58,253,0.14), 0 8px 28px rgba(83,58,253,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(83,58,253,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 5, letterSpacing: "0.16px" }}>리서처 / 기업</div>
              <div style={{ fontSize: 13, color: "rgba(10,11,13,0.56)", lineHeight: 1.55, letterSpacing: "0.16px" }}>인터뷰 설계부터 리포트 받기까지</div>
              <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.purple, background: "rgba(83,58,253,0.07)", padding: "5px 10px", borderRadius: 6 }}>시작하기 →</div>
            </button>
            <button onClick={() => go("panel_entry")}
              style={{ cursor: "pointer", padding: "22px 24px", borderRadius: 16, background: C.white, border: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)", width: isMobile ? "100%" : "auto", minWidth: isMobile ? 0 : 230, transition: "box-shadow 0.2s, transform 0.2s", textAlign: "left", fontFamily: F }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(83,58,253,0.14), 0 8px 28px rgba(83,58,253,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(83,58,253,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>🎙️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 5, letterSpacing: "0.16px" }}>Voica 패널</div>
              <div style={{ fontSize: 13, color: "rgba(10,11,13,0.56)", lineHeight: 1.55, letterSpacing: "0.16px" }}>보이스로 인터뷰 참여하고 리워드 받기</div>
              <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.purple, background: "rgba(83,58,253,0.07)", padding: "5px 10px", borderRadius: 6 }}>참여하기 →</div>
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: C.white, padding: isMobile ? "40px 20px" : "52px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}>
          {[
            { end: 12400, suffix: "+", label: "등록된 패널", color: C.purple, delay: 0 },
            { end: 4200, suffix: "건", label: "이번 달 완료 인터뷰", color: C.navy, delay: 100 },
            { end: 94, suffix: "%", label: "AI 분석 정확도", color: C.successText, delay: 200 },
            { end: 8, suffix: "분", label: "평균 인터뷰 시간", color: "#b91c4a", delay: 300 },
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

      <VoCCarousel />
      <HowItWorksCarousel />

      <Footer go={go} />
    </div>
  );
}
