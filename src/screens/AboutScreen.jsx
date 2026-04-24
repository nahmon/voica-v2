import { useState } from "react";
import { C, F } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function AboutScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const isMobile = useIsMobile();
  const isKo = lang === "ko";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} variant={user ? "app" : "public"} user={user} logout={logout} lang={lang} />

      {/* Hero */}
      <div style={{ background: C.navy, padding: isMobile ? "56px 24px 48px" : "80px 40px 72px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            {isKo ? "voicesurvey 소개" : "About voicesurvey"}
          </div>
          <h1 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 700, color: C.white, lineHeight: 1.2, margin: "0 0 20px" }}>
            {isKo ? <>리서치를 느리게 만드는 것들을<br />전부 없앴어요</> : <>We removed everything<br />that slows research down</>}
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, margin: 0 }}>
            {isKo ? <>voicesurvey는 AI 기반 음성 인터뷰 플랫폼이에요.<br />패널 모집부터 인터뷰 진행, 분석 리포트까지 — 하나로 끝나요.</> : <>voicesurvey is an AI-powered voice interview platform.<br />From panel recruitment to interview execution to analysis reports — one tool for it all.</>}
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "40px 20px 60px" : "64px 24px 80px", flex: 1 }}>

        {/* Mission */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            {isKo ? "미션" : "Mission"}
          </div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, color: C.navy, lineHeight: 1.5, marginBottom: 20 }}>
            {isKo ? <>"모든 팀이 유저를 깊이 이해하고<br />좋은 제품을 만들 수 있도록"</> : <>"So every team can build products<br />grounded in deep user understanding"</>}
          </div>
          <p style={{ fontSize: 15, color: C.body, lineHeight: 1.9, margin: 0 }}>
            {isKo
              ? "좋은 제품은 유저를 진짜로 이해하는 팀에서 나와요. 그런데 유저 리서치는 비용이 커요. 일정 잡고, 녹취 풀고, 패턴 찾는 데만 일주일이 걸리죠. voicesurvey는 그 과정을 10분으로 줄여요. 리서치 예산이 없는 초기 스타트업도, 글로벌 스터디를 돌리는 대기업도 똑같이 쓸 수 있어요."
              : "Great products come from teams that truly understand their users. But user research is expensive. Scheduling, transcribing, and finding patterns can take a week. voicesurvey compresses that into 10 minutes — for the scrappy startup with no research budget and the enterprise running global studies alike."}
          </p>
        </section>

        {/* CTA */}
        <section style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: isMobile ? "28px 20px" : "40px 48px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 10 }}>
            {isKo ? "함께 만들어가요" : "Join the team"}
          </div>
          <div style={{ fontSize: 14, color: C.body, marginBottom: 24, lineHeight: 1.7 }}>
            {isKo ? "voicesurvey와 함께 리서치의 미래를 만들어갈 분을 찾고 있어요." : "We're looking for people to help shape the future of research."}
          </div>
          <a href="mailto:voica.support@gmail.com" style={{ textDecoration: "none" }}>
            <Btn>{isKo ? "팀에 합류하고 싶어요 →" : "Join our team →"}</Btn>
          </a>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {(isKo
              ? [["이용약관", "terms"], ["개인정보처리방침", "privacy"], ["자주 묻는 질문", "faq"], ["고객지원", "support"]]
              : [["Terms of Service", "terms"], ["Privacy Policy", "privacy"], ["FAQ", "faq"], ["Support", "support"]]
            ).map(([label, screen]) => (
              <button key={screen} onClick={() => go(screen)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.body, fontFamily: F, padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}>
                {label}
              </button>
            ))}
          </div>
        </section>
      </main>

      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
