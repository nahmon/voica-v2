import { C, F } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function AboutScreen({ go, user, logout }) {
  const isMobile = useIsMobile();

  const values = [
    { icon: "🎙", title: "음성이 데이터다", desc: "텍스트 설문으로는 잡히지 않는 망설임, 감정, 뉘앙스. Voica는 음성 그대로를 기록합니다." },
    { icon: "⚡", title: "10분이면 충분하다", desc: "AI 인터뷰어가 24시간 패널과 대화합니다. 리서처는 결과만 받으면 됩니다." },
    { icon: "🔍", title: "인사이트, 바로 꺼내라", desc: "녹취록을 읽을 시간이 없습니다. AI가 핵심 주제와 패턴을 즉시 추출합니다." },
  ];

  const timeline = [
    { year: "2024", text: "사용자 인터뷰를 수십 번 하며 느꼈습니다. 일정 조율, 기록, 분석 — 모든 것이 너무 느립니다." },
    { year: "2025 Q1", text: "AI 인터뷰어 프로토타입 첫 시도. 음성 품질과 자연스러운 대화 흐름이 핵심임을 확인했습니다." },
    { year: "2025 Q3", text: "패널 모집 + 인터뷰 + 분석을 하나의 플로우로. Voica v1 내부 출시." },
    { year: "2026", text: "Voica v2 — 더 빠르고, 더 정확하고, 더 많은 팀이 쓸 수 있도록." },
  ];

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

        {/* Values */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>Why We Built This</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {values.map(v => (
              <div key={v.title} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "22px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{v.icon}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 6 }}>{v.title}</div>
                  <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>Story</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {timeline.map((t, i) => (
              <div key={t.year} style={{ display: "flex", gap: 24, paddingBottom: i < timeline.length - 1 ? 28 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 80, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, whiteSpace: "nowrap" }}>{t.year}</div>
                  {i < timeline.length - 1 && <div style={{ width: 1, flex: 1, background: C.border, marginTop: 8 }} />}
                </div>
                <div style={{ fontSize: 14, color: C.body, lineHeight: 1.75, paddingTop: 1 }}>{t.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA + Legal links */}
        <section style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: isMobile ? "28px 20px" : "40px 48px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 10 }}>함께 만들어 가요</div>
          <div style={{ fontSize: 14, color: C.body, marginBottom: 28, lineHeight: 1.7 }}>
            리서처라면 첫 인터뷰를 무료로 시작해보세요.<br />패널이라면 지금 모집 보드를 확인하세요.
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
