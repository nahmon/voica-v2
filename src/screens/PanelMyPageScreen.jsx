import { useState } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

// Toss logo (full: icon + wordmark)
function TossLogo({ height = 28 }) {
  return <img src="/toss-logo.svg" alt="toss" style={{ height, display: "block" }} />;
}

// Toss icon only (blob mark)
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

const STATUS_MAP = {
  applied:      { label: "Applied",            color: C.body,        bg: C.bg,                        dot: C.body },
  ai_screening: { label: "AI Review",          color: "#92650a",     bg: "rgba(251,191,36,0.12)",     dot: "#f59e0b" },
  in_progress:  { label: "In Progress",        color: "#d97706",     bg: "rgba(251,191,36,0.12)",     dot: "#f59e0b" },
  confirmed:    { label: "Confirmed",          color: C.successText, bg: C.successBg,                 dot: C.success },
  completed:    { label: "Completed",          color: C.purple,      bg: C.purpleBg,                  dot: C.purple },
};

export default function PanelMyPageScreen({ go, user, logout }) {
  const [lang, setLang] = useState("ko");
  const isMobile = useIsMobile();
  const [notifInterview, setNotifInterview] = useState(true);
  const [notifReward, setNotifReward] = useState(true);

  // Toss account state
  const [tossPhone, setTossPhone] = useState("");
  const [tossSaved, setTossSaved] = useState(false);
  const [showTossSetup, setShowTossSetup] = useState(false);

  // Withdrawal flow: null | "confirm" | "done"
  const [withdrawStep, setWithdrawStep] = useState(null);

  const MY_INTERVIEWS = [
    { id: 1, title: "App Usability Interview Q2",       company: "Tech Startup A",   status: "completed",  reward: "$3.00",  date: "2026.04.05", rewardStatus: "Paid" },
    { id: 2, title: "New Product Concept Test",         company: "Enterprise B",     status: "confirmed",  reward: "$5.00",  date: "2026.04.09", rewardStatus: null },
    { id: 3, title: "Brand Perception Survey",          company: "Global Brand C",   status: "in_progress",reward: "$4.00",  date: "2026.04.08", rewardStatus: null, progress: "3/5 questions done" },
    { id: 4, title: "Finance App UX Improvement Study", company: "Fintech D",        status: "applied",    reward: "$8.00",  date: "2026.04.10", rewardStatus: null },
  ];

  const warnings = 0;
  const totalEarned  = 3000;
  const pending      = 9000; // in_progress + confirmed
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
          {/* subtle glow */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(40px)", pointerEvents: "none" }} />

          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>Available to Withdraw</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 2, letterSpacing: "-1px" }}>
            {withdrawable.toLocaleString()}<span style={{ fontSize: 20, fontWeight: 600, marginLeft: 4 }}>pts</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
            Total earned {totalEarned.toLocaleString()} · Pending {pending.toLocaleString()}
          </div>

          {/* Tier progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Until Premium tier</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{totalEarned.toLocaleString()} / {tierGoal.toLocaleString()}</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${tierPct}%`, borderRadius: 3, background: "linear-gradient(90deg, #a78bfa, #6366f1)", transition: "width 0.5s ease" }} />
            </div>
          </div>

          {/* Toss connected badge OR withdraw button */}
          {tossSaved && withdrawStep === null && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,100,255,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, border: "1px solid rgba(0,100,255,0.3)" }}>
              <TossIcon size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Linked account</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{tossPhone}</div>
              </div>
              <button onClick={() => { setTossSaved(false); setTossPhone(""); setShowTossSetup(true); }}
                style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: F }}>Change</button>
            </div>
          )}

          {/* Withdraw confirm step */}
          {withdrawStep === "confirm" && (
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>Confirm Withdrawal</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Amount</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{withdrawable.toLocaleString()} pts</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Send to Toss</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{tossPhone}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setWithdrawStep(null)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleConfirmWithdraw}
                  style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: "#0064FF", color: C.white, fontFamily: F, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Confirm Withdrawal
                </button>
              </div>
            </div>
          )}

          {/* Success state */}
          {withdrawStep === "done" && (
            <div style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, padding: "14px", marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#4ade80", marginBottom: 4 }}>Withdrawal Requested</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Funds will be sent to your Toss account within 1–2 business days</div>
            </div>
          )}

          {/* Main CTA */}
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
                  Withdraw {withdrawable.toLocaleString()} pts via Toss
                </>
              ) : "Connect Toss to withdraw →"}
            </button>
          )}

          {!tossSaved && (
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              Register your Toss phone number to withdraw instantly
            </div>
          )}
        </div>

        {/* ── Toss Setup Card (shown when needed) ── */}
        {showTossSetup && !tossSaved && (
          <div style={{ background: C.white, border: `1px solid #0064FF`, borderRadius: 12, padding: "20px 24px", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,100,255,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <TossIcon size={36} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Connect Toss</div>
                <div style={{ fontSize: 12, color: C.body }}>Receive rewards directly to your Toss account</div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.body, marginBottom: 6, display: "block" }}>Toss Phone Number</label>
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
                Funds will be sent to the number registered in your Toss app
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowTossSetup(false)}
                style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.body, fontFamily: F, fontSize: 13, cursor: "pointer" }}>
                Later
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
                Connect
              </button>
            </div>
          </div>
        )}

        {/* ── Stats grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: 12, marginBottom: 16 }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", boxShadow: S.ambient }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 2 }}>My Activity</div>
                <div style={{ fontSize: 12, color: C.body }}>Track your participation and rewards</div>
              </div>
              <Btn variant="ghost" size="sm" onClick={() => go("panel_entry")}>Edit Profile</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Total Interviews", value: "4",       icon: Ic.Chat },
                { label: "Warnings",         value: "0",       icon: Ic.Warning },
                { label: "Panelist Tier",    value: "Standard", icon: Ic.Star },
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
            <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginTop: 10, textAlign: "center" }}>Monthly Goal</div>
            <div style={{ fontSize: 11, color: C.body, marginTop: 2, textAlign: "center" }}>{monthlyDone} / {monthlyGoal} interviews</div>
          </div>
        </div>

        {/* ── Warning notice ── */}
        {warnings > 0 && (
          <div style={{ background: "rgba(234,34,97,0.05)", border: `1px solid rgba(234,34,97,0.2)`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
            {Ic.Warning({ s: 16, c: C.ruby })}
            <div style={{ fontSize: 12, color: C.ruby, lineHeight: 1.6 }}>
              <strong>{warnings} Warning{warnings > 1 ? "s" : ""}</strong> — Panelist access will be suspended at 3 warnings.
              <span style={{ color: C.body }}> To appeal, please contact <button onClick={() => go("support")} style={{ color: C.purple, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 12, padding: 0, textDecoration: "underline" }}>Support</button>.</span>
            </div>
          </div>
        )}

        {/* ── Interview timeline ── */}
        <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 12 }}>Participation History</div>
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
                          <Btn size="sm" onClick={() => alert("Please use the interview link sent by the Researcher")}>Resume</Btn>
                        </div>
                      )}
                      {intv.status === "confirmed" && (
                        <Btn size="sm" onClick={() => go("consent")}>Start Interview</Btn>
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
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 14 }}>Notification Settings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "New Interview Alerts",  desc: "Get notified when high-match interviews are posted", value: notifInterview, set: setNotifInterview },
              { label: "Reward Payment Alerts", desc: "Get notified when a reward has been paid out",       value: notifReward,    set: setNotifReward },
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
          <Btn variant="ghost" onClick={() => go("panel_board")}>Browse More Interviews</Btn>
        </div>
      </div>
      <Footer go={go} lang={lang} onLangChange={setLang} />
    </div>
  );
}
