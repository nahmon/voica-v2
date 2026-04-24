import { useState, useEffect } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";

const STEPS = ["Overview", "Consent", "Start"];

function StepIndicator({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 28 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? C.success : active ? C.purple : C.border,
                transition: "background 0.2s",
              }}>
                {done
                  ? Ic.Check({ s: 13, c: "#fff" })
                  : <span style={{ fontSize: 12, fontWeight: 700, color: active ? "#fff" : C.body }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: 10, color: active ? C.purple : done ? C.success : C.body, fontWeight: active ? 600 : 400 }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 48, height: 2, background: done ? C.success : C.border, margin: "0 4px", marginBottom: 18, transition: "background 0.2s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Friendly illustration placeholder
function WelcomeIllustration({ isMobile }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(83,58,253,0.07) 0%, rgba(83,58,253,0.03) 100%)",
      border: `1px solid rgba(83,58,253,0.12)`,
      borderRadius: 16,
      padding: isMobile ? "24px 20px" : "28px 32px",
      marginBottom: 24,
      textAlign: "center",
    }}>
      {/* Simple SVG mic illustration */}
      <div style={{ marginBottom: 14 }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="28" fill="rgba(83,58,253,0.08)" />
          <rect x="22" y="12" width="12" height="20" rx="6" fill={C.purple} opacity="0.9" />
          <path d="M16 28c0 6.627 5.373 12 12 12s12-5.373 12-12" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line x1="28" y1="40" x2="28" y2="46" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="46" x2="34" y2="46" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: isMobile ? 17 : 19, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
        Welcome to the interview!
      </div>
      <div style={{ fontSize: 13, color: C.body, lineHeight: 1.7 }}>
        Your AI interviewer will guide you through each question.<br />
        Just a few minutes of your time to share your valuable feedback.
      </div>
      {/* Interview info pills */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "6px 14px", border: `1px solid ${C.border}` }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={C.purple} strokeWidth="1.4" strokeLinecap="round">
            <circle cx="6" cy="6" r="5" /><path d="M6 3.5v2.5l1.5 1.5" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>~10 minutes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "6px 14px", border: `1px solid ${C.border}` }}>
          {Ic.Coin({ s: 12, c: "#15803d" })}
          <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>Reward included</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "6px 14px", border: `1px solid ${C.border}` }}>
          {Ic.Mic({ s: 12, c: C.body })}
          <span style={{ fontSize: 12, color: C.body }}>Voice interview</span>
        </div>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: { ko: "내 음성 데이터는 어떻게 사용되나요?", en: "How will my voice data be used?" },
    a: { ko: "음성은 텍스트로 전환(STT)되어 리서치 분석에만 사용됩니다. 인터뷰 완료 후 1년이 지나면 자동 삭제되며, 제3자에게 판매되지 않습니다.", en: "Your voice is transcribed to text (STT) and used solely for research analysis. It is automatically deleted one year after the interview is completed and will never be sold to third parties." },
  },
  {
    q: { ko: "내 개인정보는 누가 받아보나요?", en: "Who receives my personal information?" },
    a: { ko: "연구자는 음성 및 텍스트 분석 결과만 받아볼 수 있습니다. 이름·연락처 등 식별 정보는 절대 공유되지 않습니다.", en: "Researchers only receive voice and text analysis results. Identifying information such as your name and contact details is never shared." },
  },
  {
    q: { ko: "리워드는 언제 받을 수 있나요?", en: "When will I receive my reward?" },
    a: { ko: "리워드는 인터뷰를 의뢰한 연구자(운영사)가 지급합니다. 지급 방법과 일정은 각 인터뷰 공고에 명시되어 있으니 참여 전 확인하세요.", en: "Rewards are issued by the researcher (operator) who commissioned the interview. The payment method and timeline are specified in each interview listing — please check before participating." },
  },
  {
    q: { ko: "중간에 그만둬도 되나요?", en: "Can I stop partway through?" },
    a: { ko: "언제든지 인터뷰를 중단할 수 있지만, 리워드는 완료 시에만 지급됩니다. 정당한 사유 없이 3회 이상 중도 이탈 시 인터뷰 패널 자격에 영향을 줄 수 있습니다.", en: "You may stop the interview at any time, but rewards are only paid upon completion. Withdrawing without good cause three or more times may affect your panelist standing." },
  },
  {
    q: { ko: "음성 인식이 잘 안 되면 어떻게 하나요?", en: "What if voice recognition isn't working well?" },
    a: { ko: "조용한 환경에서 마이크 가까이 대고 또렷하게 말씀해 주세요. 음성 인식이 어려울 경우 텍스트 입력 옵션도 사용할 수 있습니다.", en: "Please speak clearly in a quiet environment, close to your microphone. If voice recognition is difficult, a text input option is also available." },
  },
];

export default function ConsentScreen({ go, user, logout, shareCode, lang = "ko", onLangChange }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0); // 0=Overview, 1=Consent, 2=Start
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [agreed3, setAgreed3] = useState(false);
  const [open, setOpen] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [expertGate, setExpertGate] = useState(null); // null=loading, false=no gate, true=gated
  const [userExpertStatus, setUserExpertStatus] = useState("none");

  useEffect(() => {
    if (!shareCode) { setExpertGate(false); return; }
    (async () => {
      try {
        const r = await fetch(`/api/survey?resource=interview&code=${shareCode}`);
        const data = r.ok ? await r.json() : null;
        if (!data?.expert_only) { setExpertGate(false); return; }
        // expert_only interview — check user status
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { setExpertGate(true); setUserExpertStatus("none"); return; }
        const pr = await fetch("/api/expert-verify", { headers: { Authorization: `Bearer ${token}` } });
        const profile = pr.ok ? await pr.json() : { expert_status: "none" };
        setUserExpertStatus(profile.expert_status ?? "none");
        setExpertGate(profile.expert_status !== "verified");
      } catch {
        setExpertGate(false);
      }
    })();
  }, [shareCode]);

  const allRequired = agreed1 && agreed2;

  const toggle = (k) => setOpen(p => p === k ? null : k);

  // Expert gate loading
  if (expertGate === null) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
        <GlobalNav go={go} variant="panel" user={user} logout={logout} lang={lang} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 13, color: C.body }}>확인 중...</div>
        </div>
      </div>
    );
  }

  // Expert gate screen
  if (expertGate === true) {
    const statusInfo = {
      pending:  { label: "심사 중",   color: "#92650a",     bg: "rgba(251,191,36,0.12)", msg: "심사 중입니다. 보통 1-3 영업일 내 결과를 알려드려요." },
      rejected: { label: "심사 반려", color: C.ruby,         bg: "rgba(217,48,37,0.08)", msg: "심사가 반려됐어요. 다시 신청하거나 고객 지원에 문의해 주세요." },
      none:     { label: "인증 필요", color: C.body,         bg: C.bg,                   msg: null },
    };
    const si = statusInfo[userExpertStatus] ?? statusInfo.none;
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
        <GlobalNav go={go} variant="panel" user={user} logout={logout} lang={lang} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
          <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.purpleBg, border: `1.5px solid ${C.purpleLight}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 10 }}>전문가 패널 전용 인터뷰입니다</div>
            <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 20 }}>
              이 인터뷰는 전문가 인증을 완료한 패널 회원만 참여할 수 있어요.
            </div>
            {userExpertStatus !== "none" && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, background: si.bg, color: si.color, fontSize: 13, fontWeight: 600, marginBottom: 16, border: `1px solid ${si.color}33` }}>
                {si.label}
              </div>
            )}
            {si.msg && (
              <div style={{ fontSize: 13, color: C.body, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20, lineHeight: 1.65 }}>
                {si.msg}
              </div>
            )}
            {userExpertStatus !== "pending" && (
              <Btn full size="lg" onClick={() => go("expert_verify")}>
                전문가 인증 신청하기 →
              </Btn>
            )}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => go("panel_board")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.body, fontFamily: F, textDecoration: "underline" }}>
                다른 인터뷰 둘러보기
              </button>
            </div>
          </div>
        </div>
        <Footer go={go} lang={lang} onLangChange={onLangChange} />
      </div>
    );
  }

  const REQUIRED = [
    {
      id: "privacy",
      label: "Consent to collection and use of personal information",
      required: true,
      checked: agreed1,
      setChecked: setAgreed1,
      detail: isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Data collected", value: "Name, email, voice recording data, transcribed text (STT)" },
            { label: "Purpose of collection", value: "Conducting voice interviews and research analysis" },
            { label: "Retention period", value: "1 year from interview completion date, then deleted" },
          ].map(row => (
            <div key={row.label} style={{ background: "rgba(26,115,232,0.03)", borderRadius: 6, padding: "8px 10px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 3 }}>{row.label}</div>
              <div style={{ fontSize: 12, color: C.body, lineHeight: 1.6 }}>{row.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 420, fontSize: 12, borderCollapse: "collapse", lineHeight: 1.7 }}>
          <thead>
            <tr style={{ background: "rgba(26,115,232,0.05)" }}>
              {["Data collected", "Purpose of collection", "Retention period"].map(h => (
                <th key={h} style={{ padding: "6px 10px", fontWeight: 600, color: C.label, borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.body, verticalAlign: "top" }}>Name, email, voice recording data, transcribed text (STT)</td>
              <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.body, verticalAlign: "top" }}>Conducting voice interviews and research analysis</td>
              <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.body, verticalAlign: "top" }}>1 year from interview completion date, then deleted</td>
            </tr>
          </tbody>
        </table></div>
      ),
    },
    {
      id: "voice",
      label: "Consent to voice recording and AI processing",
      required: true,
      checked: agreed2,
      setChecked: setAgreed2,
      detail: (
        <div style={{ fontSize: 12, color: C.body, lineHeight: 1.8 }}>
          <p style={{ margin: "0 0 8px" }}>This interview will be <strong>recorded via voice</strong>. Collected audio is processed as follows.</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Voice data is transcribed to text (STT) and used for AI analysis.</li>
            <li>Speech-to-text conversion is processed via OpenAI Whisper (OpenAI, LLC, USA). Per their API terms, your audio is not used to train AI models.</li>
            <li>Voice data is transmitted to OpenAI servers in the USA for transcription (international transfer).</li>
            <li>Voice files and transcription data are encrypted and stored on Supabase Inc. (USA) servers; the service is operated via Vercel Inc. (USA) infrastructure (international transfer).</li>
            <li>Original voice files are retained for 1 year from interview completion, then permanently deleted.</li>
          </ul>
        </div>
      ),
    },
  ];

  // Step 0: Overview (welcome + info)
  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
        <GlobalNav go={go} variant="panel" user={user} logout={logout} lang={lang} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
          <div style={{ width: "100%", maxWidth: 540 }}>
            <StepIndicator current={0} />
            <WelcomeIllustration isMobile={isMobile} />

            {/* Recording notice banner */}
            <div style={{ background: "rgba(110,75,255,0.05)", border: `1px solid rgba(110,75,255,0.15)`, borderRadius: 8, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
              {Ic.Mic({ s: 18, c: C.purple })}
              <div style={{ fontSize: 13, color: C.purple, lineHeight: 1.6 }}>
                <strong>Recording notice:</strong> This interview will be recorded. Please find a quiet environment before starting.
              </div>
            </div>

            {/* FAQ accordion */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 10 }}>{lang === "ko" ? "자주 묻는 질문" : "Frequently Asked Questions"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} style={{ background: C.white, border: `1px solid ${faqOpen === i ? "rgba(83,58,253,0.2)" : C.border}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.15s" }}>
                    <button
                      onClick={() => setFaqOpen(p => p === i ? null : i)}
                      style={{
                        width: "100%", padding: "13px 16px", background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontFamily: F,
                      }}
                    >
                      <span style={{ fontSize: 13, color: C.navy, fontWeight: 500, textAlign: "left" }}>{item.q[lang] ?? item.q.en}</span>
                      <span style={{ transform: faqOpen === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, display: "flex" }}>
                        {Ic.ChevronDown({ s: 15, c: C.body })}
                      </span>
                    </button>
                    {faqOpen === i && (
                      <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                        <div style={{ fontSize: 12, color: C.body, lineHeight: 1.75 }}>{item.a[lang] ?? item.a.en}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Btn full size="lg" onClick={() => setStep(1)}>
              Next — Review Consent
            </Btn>
          </div>
        </div>
        <Footer go={go} lang={lang} onLangChange={onLangChange} />
      </div>
    );
  }

  // Step 1: Consent
  if (step === 1) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
        <GlobalNav go={go} variant="panel" user={user} logout={logout} lang={lang} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
          <div style={{ width: "100%", maxWidth: 540 }}>
            <StepIndicator current={1} />

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 6 }}>Before you begin</div>
              <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7 }}>Please review the items below and provide your consent to start the interview. Required consents must be agreed to in order to participate.</div>
            </div>

            {/* Agree to all */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
              onClick={() => { const next = !(agreed1 && agreed2 && agreed3); setAgreed1(next); setAgreed2(next); setAgreed3(next); }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${agreed1 && agreed2 && agreed3 ? C.purple : C.border}`, background: agreed1 && agreed2 && agreed3 ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                {agreed1 && agreed2 && agreed3 && Ic.Check({ s: 12, c: "white" })}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Agree to all</span>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0 12px" }} />

            {/* Required items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {REQUIRED.map(item => (
                <div key={item.id} style={{ background: C.white, border: `1px solid ${open === item.id ? "rgba(26,115,232,0.25)" : C.border}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.15s" }}>
                  <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${item.checked ? C.purple : C.border}`, background: item.checked ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}
                      onClick={() => item.setChecked(p => !p)}>
                      {item.checked && Ic.Check({ s: 12, c: "white" })}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, color: C.navy, cursor: "pointer" }} onClick={() => item.setChecked(p => !p)}>
                      {item.label}
                      <span style={{ fontSize: 11, color: C.ruby, marginLeft: 5 }}>Required</span>
                    </span>
                    <button onClick={() => toggle(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: C.body, transform: open === item.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      {Ic.ChevronDown({ s: 16, c: C.body })}
                    </button>
                  </div>
                  {open === item.id && (
                    <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                      {item.detail}
                    </div>
                  )}
                </div>
              ))}

              {/* Optional marketing */}
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${agreed3 ? C.purple : C.border}`, background: agreed3 ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}
                  onClick={() => setAgreed3(p => !p)}>
                  {agreed3 && Ic.Check({ s: 12, c: "white" })}
                </div>
                <span style={{ flex: 1, fontSize: 13, color: C.navy, cursor: "pointer" }} onClick={() => setAgreed3(p => !p)}>
                  Receive marketing communications (new interview listings, promotions)
                  <span style={{ fontSize: 11, color: C.body, marginLeft: 5 }}>Optional</span>
                </span>
              </div>
            </div>

            {/* Important notice */}
            <div style={{ background: "rgba(217,48,37,0.04)", border: `1px solid rgba(217,48,37,0.15)`, borderRadius: 8, padding: "12px 16px", marginBottom: 24, marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ruby, marginBottom: 6 }}>Important participation guidelines</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#c5221f", lineHeight: 1.8 }}>
                <li>Repeated low-effort responses (one-word answers, trolling) will result in withheld rewards and a warning.</li>
                <li>Withdrawing without good cause three or more times may result in being blacklisted.</li>
                <li>Participating under false qualifications may result in clawback of any rewards paid.</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(0)} style={{ padding: "13px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 14, color: C.body, cursor: "pointer", fontFamily: F }}>Back</button>
              <Btn full size="lg" disabled={!allRequired} onClick={() => setStep(2)}>
                Confirm and Continue
              </Btn>
            </div>
          </div>
        </div>
        <Footer go={go} lang={lang} onLangChange={onLangChange} />
      </div>
    );
  }

  // Step 2: Start
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      <GlobalNav go={go} variant="panel" user={user} logout={logout} lang={lang} />
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 540 }}>
          <StepIndicator current={2} />

          <div style={{ textAlign: "center", padding: isMobile ? "24px 0 32px" : "32px 0 40px" }}>
            <div style={{ marginBottom: 20 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="rgba(21,190,83,0.1)" />
                <circle cx="32" cy="32" r="22" fill="rgba(21,190,83,0.15)" />
                <path d="M22 33l7 7 13-14" stroke={C.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: C.navy, marginBottom: 8 }}>You're all set!</div>
            <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 28 }}>
              Press the button below to start your AI interview.<br />
              Please find a quiet space and have your microphone ready.
            </div>

            {/* Summary pills */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "7px 16px", border: `1px solid ${C.border}` }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={C.purple} strokeWidth="1.4" strokeLinecap="round">
                  <circle cx="6" cy="6" r="5" /><path d="M6 3.5v2.5l1.5 1.5" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>~10 minutes</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "7px 16px", border: `1px solid ${C.border}` }}>
                {Ic.Coin({ s: 12, c: "#15803d" })}
                <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>Reward paid on completion</span>
              </div>
            </div>

            <Btn full size="lg" onClick={() => go(shareCode ? "interview" : "panel_board")}>
              {Ic.Mic({ s: 16, c: "white" })} {shareCode ? "Start Interview" : "Go to Recruitment Board"}
            </Btn>
            <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 10 }}>
              {shareCode ? "Your AI interview will begin immediately" : "Find an interview to participate in on the recruitment board"}
            </div>
          </div>
        </div>
      </div>
      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
