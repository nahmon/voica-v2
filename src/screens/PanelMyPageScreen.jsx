import { useState, useEffect } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";

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

export default function PanelMyPageScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const isKo = lang === "ko";
  const isMobile = useIsMobile();
  const { showToast } = useToast();
  const [notifInterview, setNotifInterview] = useState(true);
  const [notifReward, setNotifReward] = useState(true);

  // Bank account state (replaces Toss phone flow)
  const [bankAccount, setBankAccount] = useState(null);
  const [showBankSetup, setShowBankSetup] = useState(false);
  const [bankForm, setBankForm] = useState({ bank_name: "", account_number: "", account_holder: "" });
  const [savingBank, setSavingBank] = useState(false);

  // Rewards state
  const [rewards, setRewards] = useState([]);
  const [claimingAll, setClaimingAll] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(null);

  const STATUS_MAP = isKo ? STATUS_MAP_KO : STATUS_MAP_EN;
  const MY_INTERVIEWS = isKo ? MY_INTERVIEWS_KO : MY_INTERVIEWS_EN;

  const warnings = 0;

  // Load bank account and rewards
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const [bankRes, rewardRes] = await Promise.all([
        fetch("/api/participant", { headers: { Authorization: `Bearer ${token}` } }),
        supabase.from("participant_rewards").select("id, session_id, amount, status, claimed_at, paid_at, interviews(title)").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (bankRes.ok) { const d = await bankRes.json(); setBankAccount(d.account); }
      if (!rewardRes.error) setRewards(rewardRes.data ?? []);
    })();
  }, [user]);

  const totalEarned  = rewards.filter(r => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const pending      = rewards.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);
  const withdrawable = rewards.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);
  const tierGoal     = 100000;
  const tierPct      = Math.min(100, Math.round((totalEarned / tierGoal) * 100));
  const monthlyDone  = rewards.filter(r => {
    const d = new Date(r.created_at ?? 0);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const monthlyGoal = 5;
  const monthlyPct  = Math.round((monthlyDone / monthlyGoal) * 100);

  const handleSaveBank = async () => {
    if (!bankForm.bank_name || !bankForm.account_number || !bankForm.account_holder) return;
    setSavingBank(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/participant?action=bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(bankForm),
      });
      if (res.ok) {
        setBankAccount(bankForm);
        setShowBankSetup(false);
        showToast(isKo ? "계좌가 등록됐어요" : "Account registered", "success");
      } else {
        showToast(isKo ? "계좌 저장 실패" : "Failed to save account", "error");
      }
    } finally { setSavingBank(false); }
  };

  const handleClaimAll = async () => {
    if (!bankAccount) { setShowBankSetup(true); return; }
    const pendingRewards = rewards.filter(r => r.status === "pending");
    if (pendingRewards.length === 0) return;
    setClaimingAll(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await Promise.all(pendingRewards.map(r =>
        fetch("/api/participant?action=reward-claim", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ rewardId: r.id, sessionId: r.session_id }),
        })
      ));
      setRewards(prev => prev.map(r => r.status === "pending" ? { ...r, status: "claimed" } : r));
      setWithdrawStep("done");
      setTimeout(() => setWithdrawStep(null), 5000);
    } catch {
      showToast(isKo ? "정산 신청 중 오류가 발생했어요" : "Failed to submit claim", "error");
    } finally { setClaimingAll(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      <GlobalNav go={go} variant="panel" user={user} logout={logout} lang={lang} />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "20px 16px 48px" : "28px 24px 48px", flex: 1, width: "100%" }}>

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

          {bankAccount && withdrawStep === null && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: 20 }}>🏦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{isKo ? "등록된 계좌" : "Registered account"}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{bankAccount.bank_name} {bankAccount.account_number}</div>
              </div>
              <button onClick={() => setShowBankSetup(true)}
                style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: F }}>
                {isKo ? "변경" : "Change"}
              </button>
            </div>
          )}

          {withdrawStep === "confirm" && (
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>{isKo ? "정산 신청 확인" : "Confirm Claim"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{isKo ? "신청 금액" : "Amount"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>₩{withdrawable.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{isKo ? "입금 계좌" : "Account"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{bankAccount?.bank_name} {bankAccount?.account_number}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setWithdrawStep(null)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 13, cursor: "pointer" }}>
                  {isKo ? "취소" : "Cancel"}
                </button>
                <button onClick={handleClaimAll} disabled={claimingAll}
                  style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: C.purple, color: C.white, fontFamily: F, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {claimingAll ? (isKo ? "신청 중..." : "Submitting...") : (isKo ? "정산 신청" : "Submit Claim")}
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
            <button
              onClick={() => withdrawable > 0 ? (bankAccount ? setWithdrawStep("confirm") : setShowBankSetup(true)) : null}
              disabled={withdrawable === 0}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 10,
                border: "none", cursor: withdrawable > 0 ? "pointer" : "not-allowed",
                fontFamily: F, fontWeight: 700, fontSize: 15,
                background: withdrawable > 0 ? C.purple : "rgba(255,255,255,0.12)",
                color: C.white, transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              {withdrawable > 0
                ? (bankAccount
                    ? (isKo ? `₩${withdrawable.toLocaleString()} 정산 신청하기 →` : `Claim ₩${withdrawable.toLocaleString()} →`)
                    : (isKo ? "계좌 등록하고 정산 신청하기 →" : "Register account to claim →"))
                : (isKo ? "정산 가능한 리워드가 없어요" : "No rewards available")}
            </button>
          )}

          {!bankAccount && withdrawable > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              {isKo ? "계좌를 등록하면 매주 정산돼요" : "Register your bank account for weekly payouts"}
            </div>
          )}
        </div>

        {/* ── Bank Account Setup Card ── */}
        {showBankSetup && (
          <div style={{ background: C.white, border: `1.5px solid ${C.purple}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16, boxShadow: "0 4px 20px rgba(83,58,253,0.1)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{isKo ? "계좌 등록" : "Register Bank Account"}</div>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 16 }}>{isKo ? "리워드 정산을 받을 계좌를 등록해 주세요" : "Enter the account to receive reward payouts"}</div>
            {[
              { key: "bank_name",       label: isKo ? "은행명" : "Bank",           placeholder: isKo ? "예: 카카오뱅크" : "e.g. Kakao Bank" },
              { key: "account_number",  label: isKo ? "계좌번호" : "Account No.",   placeholder: "0000-0000-0000" },
              { key: "account_holder",  label: isKo ? "예금주" : "Account Holder", placeholder: isKo ? "홍길동" : "Full name" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: C.body, marginBottom: 5, display: "block" }}>{label}</label>
                <input
                  value={bankForm[key]}
                  onChange={e => setBankForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 7, border: `1px solid ${bankForm[key] ? C.purple : C.border}`, fontSize: 14, fontFamily: F, color: C.navy, outline: "none", background: C.bg }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => setShowBankSetup(false)}
                style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.body, fontFamily: F, fontSize: 13, cursor: "pointer" }}>
                {isKo ? "나중에" : "Later"}
              </button>
              <button onClick={handleSaveBank} disabled={savingBank || !bankForm.bank_name || !bankForm.account_number || !bankForm.account_holder}
                style={{ flex: 2, padding: "11px 0", borderRadius: 8, border: "none", background: C.purple, color: C.white, fontFamily: F, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {savingBank ? (isKo ? "저장 중..." : "Saving...") : (isKo ? "등록하기" : "Register")}
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
                  style={{ width: 42, height: 24, minHeight: "unset", borderRadius: 12, border: "none", background: item.value ? C.purple : C.border, cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s", padding: 0 }}>
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
      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
