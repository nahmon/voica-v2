import { useState } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

function TossLogo({ height = 28 }) {
  return <img src="/toss-logo.svg" alt="toss" style={{ height, display: "block" }} />;
}

function TossIcon({ size = 36 }) {
  return <img src="/toss-icon.svg" alt="toss" style={{ width: size, height: size, flexShrink: 0 }} />;
}

function DonutProgress({ pct, size = 72, stroke = 7, color = C.purple }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

const STATUS_MAP_EN = {
  applied:      { label: "Applied",     color: C.body,        bg: C.bg,                    dot: C.body },
  ai_screening: { label: "AI Review",   color: "#92650a",     bg: "rgba(251,191,36,0.12)", dot: "#f59e0b" },
  in_progress:  { label: "In Progress", color: "#d97706",     bg: "rgba(251,191,36,0.12)", dot: "#f59e0b" },
  confirmed:    { label: "Confirmed",   color: C.successText, bg: C.successBg,             dot: C.success },
  completed:    { label: "Completed",   color: C.purple,      bg: C.purpleBg,              dot: C.purple },
};
const STATUS_MAP_KO = {
  applied:      { label: "지원 완료",   color: C.body,        bg: C.bg,                    dot: C.body },
  ai_screening: { label: "AI 심사 중",  color: "#92650a",     bg: "rgba(251,191,36,0.12)", dot: "#f59e0b" },
  in_progress:  { label: "진행 중",     color: "#d97706",     bg: "rgba(251,191,36,0.12)", dot: "#f59e0b" },
  confirmed:    { label: "확정",        color: C.successText, bg: C.successBg,             dot: C.success },
  completed:    { label: "완료",        color: C.purple,      bg: C.purpleBg,              dot: C.purple },
};

const MY_INTERVIEWS_EN = [
  { id: 1, title: "App Usability Interview Q2",       company: "Tech Startup A",   status: "completed",  reward: "₩3,000",  date: "2026.04.05", rewardStatus: "Paid" },
  { id: 2, title: "New Product Concept Test",         company: "Enterprise B",     status: "confirmed",  reward: "₩5,000",  date: "2026.04.09", rewardStatus: null },
  { id: 3, title: "Brand Perception Survey",          company: "Global Brand C",   status: "in_progress",reward: "₩4,000",  date: "2026.04.08", rewardStatus: null, progress: "3/5 questions done" },
  { id: 4, title: "Finance App UX Improvement Study", company: "Fintech D",        status: "applied",    reward: "₩8,000",  date: "2026.04.10", rewardStatus: null },
];
const MY_INTERVIEWS_KO = [
  { id: 1, title: "앱 사용성 인터뷰 2분기",              company: "테크 스타트업 A", status: "completed",  reward: "₩3,000",  date: "2026.04.05", rewardStatus: "지급 완료" },
  { id: 2, title: "신제품 컨셉 테스트",                  company: "엔터프라이즈 B",  status: "confirmed",  reward: "₩5,000",  date: "2026.04.09", rewardStatus: null },
  { id: 3, title: "브랜드 인식 조사",                    company: "글로벌 브랜드 C", status: "in_progress",reward: "₩4,000",  date: "2026.04.08", rewardStatus: null, progress: "3/5 질문 완료" },
  { id: 4, title: "금융 앱 UX 개선 연구",                company: "핀테크 D",        status: "applied",    reward: "₩8,000",  date: "2026.04.10", rewardStatus: null },
];

export default function PanelMyPageScreen({ go, user, logout }) {
  const [lang, setLang] = useState("ko");
  const isKo = lang === "ko";
  const isMobile = useIsMobile();
  const [notifInterview, setNotifInterview] = useState(true);
  const [notifReward, setNotifReward] = useState(true);

  const [tossPhone, setTossPhone] = useState("");
  const [tossSaved, setTossSaved] = useState(false);
  const [showTossSetup, setShowTossSetup] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(null);

  const STATUS_MAP = isKo ? STATUS_MAP_KO : STATUS_MAP_EN;
  const MY_INTERVIEWS = isKo ? MY_INTERVIEWS_KO : MY_INTERVIEWS_EN;

  const warnings = 0;
  const totalEarned  = 3000;
  const pending      = 9000;
  const withdrawable = 3000;
  const tierGoal     = 15000;
  const tierPct      = Math.min(100, Math.round((totalEarned / tierGoal) * 100));
  const monthlyDone  = 2;
  const monthlyGoal  = 5;
  const monthlyPct   = Math.round((monthlyDone / monthlyGoal) * 100);

  const formatPhone = (v) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3)  return digits;
    if (digits.length <= 7)  return `${digits.slice(0,3)}-${digits.slice(3)}`;
    return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`;
  };

  const handleWithdrawClick = () => {
    if (!tossSaved) { setShowTossSetup(true); return; }
    setWithdrawStep("confirm");
  };

  const handleConfirmWithdraw = () => {
    setWithdrawStep("done");
    setTimeout(() => setWithdrawStep(null), 5000);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      <GlobalNav go={go} variant="panel" user={user} logout={logout} lang={lang} />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "20px 16px 48px" : "28px 24px 48px" }}>

        {/* ── Rewards Card ── */}
        <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", borderRadius: 16, padding: "24px", marginBottom: 16, color: C.white, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(40px)", pointerEvents: "none" }} />

          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {isKo ? "출금 가능 포인트" : "Available to Withdraw"}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 2, letterSpacing: "-1px" }}>
            {withdrawable.toLocaleString()}<span style={{ fontSize: 20, fontWeight: 600, marginLeft: 4 }}>pts</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
            {isKo
              ? `총 적립 ${totalEarned.toLocaleString()} · 대기 중 ${pending.toLocaleString()}`
              : `Total earned ${totalEarned.toLocaleString()} · Pending ${pending.toLocaleString()}`}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{isKo ? "프리미엄 등급까지" : "Until Premium tier"}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{totalEarned.toLocaleString()} / {tierGoal.toLocaleString()}</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${tierPct}%`, borderRadius: 3, background: "linear-gradient(90deg, #a78bfa, #6366f1)", transition: "width 0.5s ease" }} />
            </div>
          </div>

          {tossSaved && withdrawStep === null && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,100,255,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, border: "1px solid rgba(0,100,255,0.3)" }}>
              <TossIcon size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{isKo ? "연결된 계좌" : "Linked account"}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{tossPhone}</div>
              </div>
              <button onClick={() => { setTossSaved(false); setTossPhone(""); setShowTossSetup(true); }}
                style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: F }}>
                {isKo ? "변경" : "Change"}
              </button>
            </div>
          )}

          {withdrawStep === "confirm" && (
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>{isKo ? "출금 확인" : "Confirm Withdrawal"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{isKo ? "출금 금액" : "Amount"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{withdrawable.toLocaleString()} pts</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{isKo ? "토스로 송금" : "Send to Toss"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{tossPhone}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setWithdrawStep(null)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 13, cursor: "pointer" }}>
                  {isKo ? "취소" : "Cancel"}
                </button>
                <button onClick={handleConfirmWithdraw}
                  style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: "#0064FF", color: C.white, fontFamily: F, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {isKo ? "출금 확인" : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          )}

          {withdrawStep === "done" && (
            <div style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, padding: "14px", marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#4ade80", marginBottom: 4 }}>{isKo ? "출금 신청 완료" : "Withdrawal Requested"}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                {isKo ? "1~2 영업일 내에 토스 계좌로 지급돼요" : "Funds will be sent to your Toss account within 1–2 business days"}
              </div>
            </div>
          )}

          {withdrawStep === null && (
            <button onClick={handleWithdrawClick}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 10,
                border: "none", cursor: "pointer", fontFamily: F, fontWeight: 700,
                fontSize: 15,
                background: tossSaved ? "#0064FF" : "rgba(255,255,255,0.12)",
                color: C.white,
                transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              {tossSaved ? (
                <>
                  <TossIcon size={20} />
                  {isKo ? `토스로 ${withdrawable.toLocaleString()} pts 출금하기` : `Withdraw ${withdrawable.toLocaleString()} pts via Toss`}
                </>
              ) : (isKo ? "토스 계좌 연결하고 출금하기 →" : "Connect Toss to withdraw →")}
            </button>
          )}

          {!tossSaved && (
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              {isKo ? "토스 전화번호를 등록하면 바로 출금할 수 있어요" : "Register your Toss phone number to withdraw instantly"}
            </div>
          )}
        </div>

        {/* ── Toss Setup Card ── */}
        {showTossSetup && !tossSaved && (
          <div style={{ background: C.white, border: `1px solid #0064FF`, borderRadius: 12, padding: "20px 24px", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,100,255,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <TossIcon size={36} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{isKo ? "토스 연결하기" : "Connect Toss"}</div>
                <div style={{ fontSize: 12, color: C.body }}>{isKo ? "리워드를 토스 계좌로 바로 받을 수 있어요" : "Receive rewards directly to your Toss account"}</div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.body, marginBottom: 6, display: "block" }}>{isKo ? "토스 전화번호" : "Toss Phone Number"}</label>
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={tossPhone}
                onChange={e => setTossPhone(formatPhone(e.target.value))}
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 14px", borderRadius: 8,
                  border: `1px solid ${tossPhone.length > 0 ? "#0064FF" : C.border}`,
                  fontSize: 16, fontFamily: F, color: C.navy, outline: "none",
                  background: C.bg, transition: "border 0.15s",
                  letterSpacing: "0.5px",
                }}
              />
              <div style={{ fontSize: 11, color: C.body, marginTop: 6 }}>
                {isKo ? "토스 앱에 등록된 번호로 리워드가 지급돼요" : "Funds will be sent to the number registered in your Toss app"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowTossSetup(false)}
                style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.body, fontFamily: F, fontSize: 13, cursor: "pointer" }}>
                {isKo ? "나중에" : "Later"}
              </button>
              <button
                onClick={() => { if (tossPhone.replace(/\D/g,"").length === 11) { setTossSaved(true); setShowTossSetup(false); } }}
                disabled={tossPhone.replace(/\D/g,"").length !== 11}
                style={{
                  flex: 2, padding: "11px 0", borderRadius: 8, border: "none",
                  background: tossPhone.replace(/\D/g,"").length === 11 ? "#0064FF" : C.border,
                  color: tossPhone.replace(/\D/g,"").length === 11 ? C.white : C.body,
                  fontFamily: F, fontSize: 14, fontWeight: 700, cursor: tossPhone.replace(/\D/g,"").length === 11 ? "pointer" : "not-allowed",
                  transition: "background 0.15s",
                }}>
                {isKo ? "연결하기" : "Connect"}
              </button>
            </div>
          </div>
        )}

        {/* ── Stats grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: 12, marginBottom: 16 }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", boxShadow: S.ambient }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 2 }}>{isKo ? "나의 활동" : "My Activity"}</div>
                <div style={{ fontSize: 12, color: C.body }}>{isKo ? "참여 현황과 리워드를 확인해보세요" : "Track your participation and rewards"}</div>
              </div>
              <Btn variant="ghost" size="sm" onClick={() => go("panel_entry")}>{isKo ? "프로필 수정" : "Edit Profile"}</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: isKo ? "총 인터뷰" : "Total Interviews", value: "4",                          icon: Ic.Chat },
                { label: isKo ? "경고" : "Warnings",              value: "0",                          icon: Ic.Warning },
                { label: isKo ? "패널 등급" : "Panelist Tier",    value: isKo ? "스탠다드" : "Standard", icon: Ic.Star },
              ].map(s => (
                <div key={s.label} style={{ background: C.bg, borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ marginBottom: 4, display: "flex", justifyContent: "center" }}>{s.icon({ s: 15, c: C.purple })}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.body }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 22px", boxShadow: S.ambient, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: isMobile ? undefined : 156 }}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <DonutProgress pct={monthlyPct} size={80} stroke={8} color={C.purple} />
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{monthlyDone}</div>
                <div style={{ fontSize: 9, color: C.body }}>/ {monthlyGoal}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginTop: 10, textAlign: "center" }}>{isKo ? "이번 달 목표" : "Monthly Goal"}</div>
            <div style={{ fontSize: 11, color: C.body, marginTop: 2, textAlign: "center" }}>{monthlyDone} / {monthlyGoal} {isKo ? "건" : "interviews"}</div>
          </div>
        </div>

        {/* ── Warning notice ── */}
        {warnings > 0 && (
          <div style={{ background: "rgba(234,34,97,0.05)", border: `1px solid rgba(234,34,97,0.2)`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
            {Ic.Warning({ s: 16, c: C.ruby })}
            <div style={{ fontSize: 12, color: C.ruby, lineHeight: 1.6 }}>
              {isKo
                ? <><strong>경고 {warnings}회</strong> — 경고 3회 누적 시 패널 활동이 정지돼요. <span style={{ color: C.body }}>이의 신청은 <button onClick={() => go("support")} style={{ color: C.purple, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 12, padding: 0, textDecoration: "underline" }}>고객 지원</button>으로 문의해 주세요.</span></>
                : <><strong>{warnings} Warning{warnings > 1 ? "s" : ""}</strong> — Panelist access will be suspended at 3 warnings. <span style={{ color: C.body }}>To appeal, please contact <button onClick={() => go("support")} style={{ color: C.purple, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 12, padding: 0, textDecoration: "underline" }}>Support</button>.</span></>
              }
            </div>
          </div>
        )}

        {/* ── Interview timeline ── */}
        <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 12 }}>{isKo ? "참여 내역" : "Participation History"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {MY_INTERVIEWS.map((intv, idx) => {
            const st = STATUS_MAP[intv.status];
            const isLast = idx === MY_INTERVIEWS.length - 1;
            return (
              <div key={intv.id} style={{ display: "flex", gap: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: st.dot, border: `2px solid ${C.white}`, boxShadow: `0 0 0 2px ${st.dot}22`, marginTop: 18, flexShrink: 0, zIndex: 1 }} />
                  {!isLast && <div style={{ width: 2, flex: 1, background: C.border, minHeight: 16 }} />}
                </div>
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
                          <Btn size="sm" onClick={() => alert(isKo ? "리서처가 보낸 인터뷰 링크를 이용해 주세요" : "Please use the interview link sent by the Researcher")}>{isKo ? "이어하기" : "Resume"}</Btn>
                        </div>
                      )}
                      {intv.status === "confirmed" && (
                        <Btn size="sm" onClick={() => go("consent")}>{isKo ? "인터뷰 시작하기" : "Start Interview"}</Btn>
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

        {/* ── Notification preferences ── */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px", marginTop: 20, boxShadow: S.ambient }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 14 }}>{isKo ? "알림 설정" : "Notification Settings"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                label: isKo ? "새 인터뷰 알림" : "New Interview Alerts",
                desc:  isKo ? "나에게 딱 맞는 인터뷰가 올라오면 알려드려요" : "Get notified when high-match interviews are posted",
                value: notifInterview, set: setNotifInterview,
              },
              {
                label: isKo ? "리워드 지급 알림" : "Reward Payment Alerts",
                desc:  isKo ? "리워드가 지급되면 알려드려요" : "Get notified when a reward has been paid out",
                value: notifReward, set: setNotifReward,
              },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.navy }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: C.body, marginTop: 2 }}>{item.desc}</div>
                </div>
                <button onClick={() => item.set(v => !v)}
                  style={{ width: 42, height: 24, borderRadius: 12, border: "none", background: item.value ? C.purple : C.border, cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s", padding: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: item.value ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: C.white, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.18)" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Btn variant="ghost" onClick={() => go("panel_board")}>{isKo ? "인터뷰 더 보기" : "Browse More Interviews"}</Btn>
        </div>
      </div>
      <Footer go={go} lang={lang} onLangChange={setLang} />
    </div>
  );
}
