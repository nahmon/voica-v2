import { useState, useEffect } from "react";
import { C, F } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, GlobalNav, VoCCarousel, HowItWorksCarousel } from "../components/shared.jsx";

export default function LandingScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [liveCount, setLiveCount] = useState(247);
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
              시간과 비용이 많이 들었던 인터뷰
            </span>
            <span style={{ background: `linear-gradient(135deg, ${C.purple}, #1a1a2e)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block" }}>
              AI로 수백 명의 인터뷰를 동시에<span className="cursor-blink" style={{ background: `linear-gradient(135deg, ${C.purple}, #1a1a2e)` }} />
            </span>
          </h1>

          <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 400, color: "rgba(10,11,13,0.56)", lineHeight: 1.6, letterSpacing: "0.16px", margin: "0 0 44px", fontFamily: F }}>
            AI와 질문만 설계하세요. AI가 수백 명의 패널과 보이스 인터뷰를 진행하고<br style={{ display: isMobile ? "none" : "block" }} />사용자들의 반응에 기반한 테마 분석 · 감정 분류 · 인사이트 리포트까지 자동으로 완성해드립니다.
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 32 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, color: C.body }}>지금 <strong style={{ fontWeight: 600, color: C.navy }}>{liveCount}명</strong>이 인터뷰에 참여하고 있습니다</span>
          </div>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <div onClick={() => go("advertiser_login")} style={{ cursor: "pointer", padding: "24px", borderRadius: 16, background: C.white, border: `1px solid rgba(23,23,23,0.2)`, width: isMobile ? "100%" : "auto", minWidth: isMobile ? 0 : 220, transition: "border-color 0.18s", textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.purple}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(23,23,23,0.2)"}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>🎯</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 6, letterSpacing: "0.16px" }}>리서처 / 기업</div>
              <div style={{ fontSize: 14, color: "rgba(10,11,13,0.56)", lineHeight: 1.5, letterSpacing: "0.16px" }}>인터뷰 설계부터 리포트 받기까지</div>
              <div style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: C.purple }}>시작하기 →</div>
            </div>
            <div onClick={() => go("panel_entry")} style={{ cursor: "pointer", padding: "24px", borderRadius: 16, background: C.white, border: `1px solid rgba(23,23,23,0.2)`, width: isMobile ? "100%" : "auto", minWidth: isMobile ? 0 : 220, transition: "border-color 0.18s", textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.purple}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(23,23,23,0.2)"}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>🎙️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 6, letterSpacing: "0.16px" }}>Voica 패널</div>
              <div style={{ fontSize: 14, color: "rgba(10,11,13,0.56)", lineHeight: 1.5, letterSpacing: "0.16px" }}>보이스로 인터뷰 참여하고 리워드 받기</div>
              <div style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: C.purple }}>참여하기 →</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: C.bg, padding: isMobile ? "40px 20px" : "48px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? "28px 16px" : 28, justifyItems: "center" }}>
          {[
            ["12,400+", "등록된 패널", "#533afd"],
            ["4,200건", "이번 달 완료 인터뷰", "#061b31"],
            ["94%", "AI 분석 정확도", "#15be53"],
            ["8분", "평균 인터뷰 시간", "#ea2261"],
          ].map(([v, l, color]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 28 : 40, fontWeight: 600, color, lineHeight: 1.10, fontFamily: F }}>{v}</div>
              <div style={{ fontSize: 14, color: "rgba(10,11,13,0.56)", marginTop: 6, letterSpacing: "0.16px", lineHeight: 1.43 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <VoCCarousel />
      <HowItWorksCarousel />

      {/* Footer */}
      <footer style={{ background: C.brandDark, padding: isMobile ? "40px 20px" : "48px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-start", gap: 28, marginBottom: 28 }}>
            <div>
              <span style={{ fontSize: 17, fontWeight: 600, color: C.white, letterSpacing: "0.16px" }}><span style={{ color: C.purpleLight }}>Vo</span>ica</span>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: "0.16px", lineHeight: 1.5 }}>AI가 인터뷰하고, AI가 분석합니다</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? "12px 24px" : "8px 28px" }}>
              {[["서비스 소개", "landing"], ["요금제", "pricing"], ["패널 참여", "panel_board"], ["고객센터", "support"]].map(([l, target]) => (
                <a key={l} href="#" onClick={e => { e.preventDefault(); if (target) go(target); }}
                  style={{ fontSize: 14, color: "rgba(255,255,255,0.48)", textDecoration: "none", letterSpacing: "0.16px" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.88)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.48)"}>{l}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16px" }}>Copyright © 2026 Voica Inc. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
