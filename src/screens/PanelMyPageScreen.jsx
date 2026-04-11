import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PanelMyPageScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const MY_INTERVIEWS = [
    { id: 1, title: "앱 사용성 인터뷰 Q2", company: "테크 스타트업 A", status: "completed", reward: "3,000원", date: "2026.04.05", rewardStatus: "지급 완료" },
    { id: 2, title: "신제품 컨셉 테스트", company: "대기업 B", status: "confirmed", reward: "5,000원", date: "2026.04.09", rewardStatus: null },
    { id: 3, title: "브랜드 인식 조사", company: "글로벌 브랜드 C", status: "in_progress", reward: "4,000원", date: "2026.04.08", rewardStatus: null, progress: "3/5 질문 완료" },
    { id: 4, title: "금융 앱 UX 개선 인터뷰", company: "핀테크 D", status: "applied", reward: "8,000원", date: "2026.04.10", rewardStatus: null },
  ];
  const STATUS_MAP = {
    applied: { label: "지원 완료", color: C.body, bg: C.bg },
    ai_screening: { label: "AI 검토 중", color: "#92650a", bg: "rgba(251,191,36,0.12)" },
    in_progress: { label: "진행 중", color: "#d97706", bg: "rgba(251,191,36,0.12)" },
    confirmed: { label: "참여 확정", color: C.successText, bg: C.successBg },
    completed: { label: "인터뷰 완료", color: C.purple, bg: C.purpleBg },
  };
  const warnings = 0; // 경고 횟수

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      <GlobalNav go={go} variant="panel" user={user} logout={logout} />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Profile summary */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px", marginBottom: 20, boxShadow: S.ambient }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 4 }}>내 활동</div>
              <div style={{ fontSize: 13, color: C.body }}>참여 내역과 리워드를 확인하세요</div>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => go("panel_entry")}>프로필 수정</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "총 참여", value: "4건", icon: Ic.Chat },
              { label: "적립 리워드", value: "3,000원", icon: Ic.Coin },
              { label: "경고 횟수", value: `${warnings}회`, icon: Ic.Warning },
              { label: "패널 등급", value: "일반", icon: Ic.Star },
            ].map(s => (
              <div key={s.label} style={{ background: C.bg, borderRadius: 8, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}>{s.icon({s:16,c:C.purple})}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.body }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning notice */}
        {warnings > 0 && (
          <div style={{ background: "rgba(234,34,97,0.05)", border: `1px solid rgba(234,34,97,0.2)`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
            {Ic.Warning({s:16, c:C.ruby})}
            <div style={{ fontSize: 12, color: C.ruby, lineHeight: 1.6 }}>
              <strong>경고 {warnings}회</strong> — 3회 이상 시 패널 자격이 정지됩니다.
              <span style={{ color: C.body }}> 이의신청은 <button onClick={() => go("support")} style={{ color: C.purple, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 12, padding: 0, textDecoration: "underline" }}>고객센터</button>로 문의해 주세요.</span>
            </div>
          </div>
        )}

        {/* Interview list */}
        <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 12 }}>참여 내역</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MY_INTERVIEWS.map(intv => {
            const st = STATUS_MAP[intv.status];
            return (
              <div key={intv.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px", boxShadow: S.ambient }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.navy, marginBottom: 4 }}>{intv.title}</div>
                    <div style={{ fontSize: 12, color: C.body }}>{intv.company} · {intv.date}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: st.color, background: st.bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{st.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.purple }}>{intv.reward}</span>
                  {intv.status === "in_progress" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#d97706" }}>{intv.progress}</span>
                      <Btn size="sm" onClick={() => alert("리서처가 보낸 인터뷰 링크로 접속해 주세요")}>이어하기 →</Btn>
                    </div>
                  )}
                  {intv.status === "confirmed" && (
                    <Btn size="sm" onClick={() => go("consent")}>인터뷰 시작</Btn>
                  )}
                  {intv.status === "completed" && intv.rewardStatus && (
                    <span style={{ fontSize: 11, color: C.successText, background: C.successBg, padding: "3px 8px", borderRadius: 12 }}>{intv.rewardStatus}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Btn variant="ghost" onClick={() => go("panel_board")}>더 많은 인터뷰 찾아보기</Btn>
        </div>
      </div>
      <Footer go={go} />
    </div>
  );
}
