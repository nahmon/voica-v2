import { useState } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

// SVG donut ring progress indicator
function DonutProgress({ pct, size = 72, stroke = 7, color = C.purple }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

const STATUS_MAP = {
  applied: { label: "지원 완료", color: C.body, bg: C.bg, dot: C.body },
  ai_screening: { label: "AI 검토 중", color: "#92650a", bg: "rgba(251,191,36,0.12)", dot: "#f59e0b" },
  in_progress: { label: "진행 중", color: "#d97706", bg: "rgba(251,191,36,0.12)", dot: "#f59e0b" },
  confirmed: { label: "참여 확정", color: C.successText, bg: C.successBg, dot: C.success },
  completed: { label: "인터뷰 완료", color: C.purple, bg: C.purpleBg, dot: C.purple },
};

export default function PanelMyPageScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [notifInterview, setNotifInterview] = useState(true);
  const [notifReward, setNotifReward] = useState(true);

  const MY_INTERVIEWS = [
    { id: 1, title: "앱 사용성 인터뷰 Q2", company: "테크 스타트업 A", status: "completed", reward: "3,000원", date: "2026.04.05", rewardStatus: "지급 완료" },
    { id: 2, title: "신제품 컨셉 테스트", company: "대기업 B", status: "confirmed", reward: "5,000원", date: "2026.04.09", rewardStatus: null },
    { id: 3, title: "브랜드 인식 조사", company: "글로벌 브랜드 C", status: "in_progress", reward: "4,000원", date: "2026.04.08", rewardStatus: null, progress: "3/5 질문 완료" },
    { id: 4, title: "금융 앱 UX 개선 인터뷰", company: "핀테크 D", status: "applied", reward: "8,000원", date: "2026.04.10", rewardStatus: null },
  ];

  const warnings = 0;

  // Rewards data
  const totalEarned = 3000;
  const pending = 4000 + 5000; // in_progress + confirmed
  const withdrawable = 3000;
  const tierGoal = 15000;
  const tierPct = Math.min(100, Math.round((totalEarned / tierGoal) * 100));

  // Monthly stats
  const monthlyDone = 2;
  const monthlyGoal = 5;
  const monthlyPct = Math.round((monthlyDone / monthlyGoal) * 100);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      <GlobalNav go={go} variant="panel" user={user} logout={logout} />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "20px 16px 48px" : "28px 24px 48px" }}>

        {/* Rewards Summary Card */}
        <div style={{ background: C.navy, borderRadius: 12, padding: "22px 24px", marginBottom: 16, color: C.white }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>총 적립 리워드</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>{totalEarned.toLocaleString()}원</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
              { label: "정산 대기", value: `${pending.toLocaleString()}원`, color: "#fbbf24" },
              { label: "출금 가능", value: `${withdrawable.toLocaleString()}원`, color: "#4ade80" },
            ].map(item => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          {/* Tier progress bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>다음 등급까지</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{totalEarned.toLocaleString()} / {tierGoal.toLocaleString()}원</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${tierPct}%`, borderRadius: 3,
                background: "linear-gradient(90deg, #a78bfa, #6366f1)",
                transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 5 }}>
              {tierGoal - totalEarned > 0 ? `${(tierGoal - totalEarned).toLocaleString()}원 더 적립하면 우수 등급 달성!` : "우수 등급 달성!"}
            </div>
          </div>
        </div>

        {/* Profile summary + Monthly donut */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: 12, marginBottom: 16 }}>
          {/* Stats grid */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", boxShadow: S.ambient }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 2 }}>내 활동</div>
                <div style={{ fontSize: 12, color: C.body }}>참여 내역과 리워드를 확인해요</div>
              </div>
              <Btn variant="ghost" size="sm" onClick={() => go("panel_entry")}>프로필 수정</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "총 참여", value: "4건", icon: Ic.Chat },
                { label: "경고 횟수", value: `${warnings}회`, icon: Ic.Warning },
                { label: "패널 등급", value: "일반", icon: Ic.Star },
              ].map(s => (
                <div key={s.label} style={{ background: C.bg, borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ marginBottom: 4, display: "flex", justifyContent: "center" }}>{s.icon({ s: 15, c: C.purple })}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.body }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly donut */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 22px", boxShadow: S.ambient, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: isMobile ? undefined : 156 }}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <DonutProgress pct={monthlyPct} size={80} stroke={8} color={C.purple} />
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{monthlyDone}</div>
                <div style={{ fontSize: 9, color: C.body }}>/ {monthlyGoal}건</div>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginTop: 10, textAlign: "center" }}>이번 달 목표</div>
            <div style={{ fontSize: 11, color: C.body, marginTop: 2, textAlign: "center" }}>
              {monthlyDone}건 참여 / 목표 {monthlyGoal}건
            </div>
          </div>
        </div>

        {/* Warning notice */}
        {warnings > 0 && (
          <div style={{ background: "rgba(234,34,97,0.05)", border: `1px solid rgba(234,34,97,0.2)`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
            {Ic.Warning({ s: 16, c: C.ruby })}
            <div style={{ fontSize: 12, color: C.ruby, lineHeight: 1.6 }}>
              <strong>경고 {warnings}회</strong> — 3회 이상이 되면 패널 자격이 정지돼요.
              <span style={{ color: C.body }}> 이의신청은 <button onClick={() => go("support")} style={{ color: C.purple, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 12, padding: 0, textDecoration: "underline" }}>고객센터</button>로 문의해 주세요.</span>
            </div>
          </div>
        )}

        {/* Interview list — timeline style */}
        <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 12 }}>참여 내역</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {MY_INTERVIEWS.map((intv, idx) => {
            const st = STATUS_MAP[intv.status];
            const isLast = idx === MY_INTERVIEWS.length - 1;
            return (
              <div key={intv.id} style={{ display: "flex", gap: 0 }}>
                {/* Timeline left rail */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: st.dot, border: `2px solid ${C.white}`, boxShadow: `0 0 0 2px ${st.dot}22`, marginTop: 18, flexShrink: 0, zIndex: 1 }} />
                  {!isLast && <div style={{ width: 2, flex: 1, background: C.border, minHeight: 16 }} />}
                </div>
                {/* Card */}
                <div style={{ flex: 1, marginBottom: isLast ? 0 : 8 }}>
                  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", boxShadow: S.ambient, borderLeft: `3px solid ${st.dot}` }}>
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
                          <Btn size="sm" onClick={() => alert("리서처가 보낸 인터뷰 링크로 접속해 주세요")}>이어서 하기</Btn>
                        </div>
                      )}
                      {intv.status === "confirmed" && (
                        <Btn size="sm" onClick={() => go("consent")}>인터뷰 시작할게요</Btn>
                      )}
                      {intv.status === "completed" && intv.rewardStatus && (
                        <span style={{ fontSize: 11, color: C.successText, background: C.successBg, padding: "3px 8px", borderRadius: 12 }}>{intv.rewardStatus}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notification preferences */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px", marginTop: 20, boxShadow: S.ambient }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 14 }}>알림 설정</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "새 인터뷰 알림", desc: "매칭률 높은 신규 공고가 올라오면 알려드려요", value: notifInterview, set: setNotifInterview },
              { label: "리워드 지급 알림", desc: "리워드 지급 완료 시 알림을 받아요", value: notifReward, set: setNotifReward },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.navy }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: C.body, marginTop: 2 }}>{item.desc}</div>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => item.set(v => !v)}
                  style={{
                    width: 42, height: 24, borderRadius: 12, border: "none",
                    background: item.value ? C.purple : C.border,
                    cursor: "pointer", position: "relative", flexShrink: 0,
                    transition: "background 0.2s",
                    padding: 0,
                  }}
                >
                  <div style={{
                    position: "absolute", top: 3, left: item.value ? 21 : 3,
                    width: 18, height: 18, borderRadius: "50%", background: C.white,
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Btn variant="ghost" onClick={() => go("panel_board")}>인터뷰 더 찾아보기</Btn>
        </div>
      </div>
      <Footer go={go} />
    </div>
  );
}
