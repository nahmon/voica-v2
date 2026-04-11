import { C, F } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function AboutScreen({ go, user, logout }) {
  const isMobile = useIsMobile();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} variant={user ? "app" : "public"} user={user} logout={logout} />

      {/* Hero */}
      <div style={{ background: C.navy, padding: isMobile ? "56px 24px 48px" : "80px 40px 72px", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>About Voica</div>
          <h1 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 700, color: C.white, lineHeight: 1.2, margin: "0 0 20px" }}>
            리서치를 느리게 만드는<br />모든 것을 없앴습니다
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, margin: 0 }}>
            Voica는 AI 보이스 인터뷰 플랫폼입니다.<br />
            패널 모집부터 인터뷰 진행, 분석 리포트까지 — 하나의 도구로.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "40px 20px 60px" : "64px 24px 80px" }}>

        {/* Mission */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Mission</div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, color: C.navy, lineHeight: 1.5, marginBottom: 20 }}>
            "모든 팀이 깊은 사용자 이해를 바탕으로<br />제품을 만들 수 있도록"
          </div>
          <p style={{ fontSize: 15, color: C.body, lineHeight: 1.9, margin: 0 }}>
            좋은 제품은 사용자를 이해하는 팀에서 나옵니다. 하지만 인터뷰는 비쌉니다. 일정을 맞추고, 녹취를 풀고, 패턴을 찾는 데 일주일이 걸립니다. Voica는 그 비용을 10분으로 압축합니다. 리서치 인프라가 없는 스타트업도, 글로벌 리서치를 돌리는 대기업도 — 같은 도구로.
          </p>
        </section>

        {/* CTA + Legal links */}
        <section style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: isMobile ? "28px 20px" : "40px 48px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 10 }}>함께 만들어 가요</div>
          <div style={{ fontSize: 14, color: C.body, marginBottom: 28, lineHeight: 1.7 }}>
            첫 인터뷰를 무료로 시작할 수 있어요.<br />패널이라면 지금 모집 보드를 둘러보세요.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={() => go("advertiser_login")}>리서처로 시작하기</Btn>
            <Btn variant="ghost" onClick={() => go("panel_board")}>패널 보드 보기</Btn>
          </div>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[["이용약관", "terms"], ["개인정보처리방침", "privacy"], ["FAQ", "faq"], ["고객지원", "support"]].map(([label, screen]) => (
              <button key={screen} onClick={() => go(screen)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.body, fontFamily: F, padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}>
                {label}
              </button>
            ))}
          </div>
        </section>
      </main>

      <Footer go={go} />
    </div>
  );
}
