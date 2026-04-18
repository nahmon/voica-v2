import { useState } from "react";
import { C, F } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function AboutScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [lang, setLang] = useState("ko");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} variant={user ? "app" : "public"} user={user} logout={logout} lang={lang} />

      {/* Hero */}
      <div style={{ background: C.navy, padding: isMobile ? "56px 24px 48px" : "80px 40px 72px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>About Voice Survey</div>
          <h1 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 700, color: C.white, lineHeight: 1.2, margin: "0 0 20px" }}>
            We removed everything<br />that slows research down
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, margin: 0 }}>
            Voice Survey is an AI-powered voice interview platform.<br />
            From panel recruitment to interview execution to analysis reports — one tool for it all.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "40px 20px 60px" : "64px 24px 80px" }}>

        {/* Mission */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Mission</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, color: C.navy, lineHeight: 1.5, marginBottom: 20 }}>
            "So every team can build products<br />grounded in deep user understanding"
          </div>
          <p style={{ fontSize: 15, color: C.body, lineHeight: 1.9, margin: 0 }}>
            Great products come from teams that truly understand their users. But user research is expensive. Scheduling, transcribing, and finding patterns can take a week. Voice Survey compresses that into 10 minutes — for the scrappy startup with no research budget and the enterprise running global studies alike.
          </p>
        </section>

        {/* CTA + Legal links */}
        <section style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: isMobile ? "28px 20px" : "40px 48px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Let's build together</div>
          <div style={{ fontSize: 14, color: C.body, marginBottom: 28, lineHeight: 1.7 }}>
            Your first interview is free — no credit card needed.<br />If you're a panelist, browse the interview board now.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={() => go("advertiser_login")}>Start as researcher</Btn>
            <Btn variant="ghost" onClick={() => go("panel_board")}>Browse panel board</Btn>
          </div>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[["Terms of Service", "terms"], ["Privacy Policy", "privacy"], ["FAQ", "faq"], ["Support", "support"]].map(([label, screen]) => (
              <button key={screen} onClick={() => go(screen)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.body, fontFamily: F, padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}>
                {label}
              </button>
            ))}
          </div>
        </section>
      </main>

      <Footer go={go} lang={lang} onLangChange={setLang} />
    </div>
  );
}
