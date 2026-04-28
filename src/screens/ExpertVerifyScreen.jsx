import { useState, useEffect, useRef } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

function FilePreview({ fileInfo, onRemove }) {
  const ext = fileInfo.name.split(".").pop().toLowerCase();
  const sizeKb = fileInfo.sizeBytes ? Math.round(fileInfo.sizeBytes / 1024) : null;
  const iconColor = ext === "pdf" ? C.ruby : C.purple;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(21,190,83,0.06)", border: `1px solid ${C.successBorder}`,
      borderRadius: 8, padding: "10px 14px",
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: `${iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: iconColor, textTransform: "uppercase" }}>{ext}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fileInfo.name}</div>
        {sizeKb !== null && <div style={{ fontSize: 11, color: C.body, marginTop: 1 }}>{sizeKb} KB</div>}
      </div>
      {Ic.CheckCircle({ s: 16, c: C.success })}
      <button aria-label="파일 제거" onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: C.body, flexShrink: 0, display: "flex", alignItems: "center" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="3" y1="3" x2="11" y2="11" /><line x1="11" y1="3" x2="3" y2="11" />
        </svg>
      </button>
    </div>
  );
}

function UploadSpinner() {
  return (
    <span style={{
      display: "inline-block", width: 16, height: 16,
      border: `2px solid rgba(110,75,255,0.2)`, borderTopColor: C.purple,
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}

const globalStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes evs-ripple {
    0% { transform: scale(0.85); opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes evs-check-draw {
    0% { stroke-dashoffset: 40; opacity: 0; }
    40% { opacity: 1; }
    100% { stroke-dashoffset: 0; opacity: 1; }
  }
  @keyframes evs-fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes evs-clock-tick {
    0%,100% { transform: rotate(0deg); }
    25% { transform: rotate(90deg); }
    50% { transform: rotate(180deg); }
    75% { transform: rotate(270deg); }
  }
  @keyframes evs-pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.35); }
    70% { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
    100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
  }
`;
if (typeof document !== "undefined") {
  const existing = document.getElementById("__evs_styles");
  if (!existing) {
    const s = document.createElement("style");
    s.id = "__evs_styles";
    s.textContent = globalStyles;
    document.head.appendChild(s);
  }
}

const T = {
  ko: {
    title: "전문가 인증",
    subtitle: "전문 패널로 등록하면 더 많은 인터뷰 기회와 높은 보상을 받을 수 있어요.",
    heroPoints: [
      "전문가 전용 인터뷰 우선 참여",
      "일반 패널 대비 최대 2배 높은 보상",
      "커리어 분야 맞춤 인터뷰 매칭",
    ],
    selectMethod: "인증 방법을 선택해 주세요",
    methods: {
      employment_certificate: {
        icon: "📄",
        title: "재직증명서",
        desc: "현재 재직 중인 회사에서 발급받은 재직증명서를 업로드해 주세요",
        label: "재직증명서",
        uploadPrompt: "클릭하거나 파일을 드래그해 주세요",
        uploadHint: "JPG, PNG, PDF · 최대 2MB · 3개월 이내 발급본",
      },
      health_insurance: {
        icon: "📋",
        title: "건강보험료 납부확인서",
        desc: "국민건강보험공단 앱/사이트에서 발급받은 납부확인서를 업로드해 주세요",
        label: "건강보험료 납부확인서",
        uploadPrompt: "클릭하거나 파일을 드래그해 주세요",
        uploadHint: "JPG, PNG, PDF · 최대 2MB · 3개월 이내 발급본",
      },
    },
    submitBtn: "심사 신청하기",
    submitting: "신청 중…",
    reviewNote: "검토까지 1–3 영업일 소요",
    sizeError: "파일 크기는 2MB 이하여야 해요",
    fileRequired: "파일을 첨부해 주세요",
    emailRequired: "업무용 이메일을 입력해 주세요",
    successTitle: "심사 신청 완료",
    successDesc: "검토 후 결과를 이메일로 알려드릴게요. 보통 1–3 영업일이 소요돼요.",
    pendingTitle: "심사 진행 중",
    pendingDesc: "전문가 인증 심사가 진행 중이에요. 결과는 이메일로 안내드릴게요.",
    verifiedTitle: "전문가 인증 완료",
    verifiedDesc: "전문가 패널로 등록되었어요. 전문가 전용 인터뷰에 참여할 수 있어요.",
    rejectedTitle: "인증이 반려되었어요",
    rejectedDesc: "아쉽게도 이번 인증이 반려되었어요. 다른 방법으로 다시 신청해 보세요.",
    reApply: "다시 신청하기",
    backToPanel: "패널 홈으로",
    note: "검토자 메모:",
  },
  en: {
    title: "Expert Verification",
    subtitle: "Become a verified expert panel member for more interview opportunities and higher rewards.",
    heroPoints: [
      "Priority access to expert-only interviews",
      "Up to 2× higher rewards than standard panels",
      "Interview matching by career expertise",
    ],
    selectMethod: "Choose a verification method",
    methods: {
      employment_certificate: {
        icon: "📄",
        title: "Employment Certificate",
        desc: "Upload an employment certificate issued by your current employer",
        label: "Employment certificate",
        uploadPrompt: "Click or drag a file here",
        uploadHint: "JPG, PNG, PDF · Max 2 MB · Issued within 3 months",
      },
      health_insurance: {
        icon: "📋",
        title: "Health Insurance Statement",
        desc: "Upload a health insurance contribution statement from NHIS (건강보험공단)",
        label: "Health insurance statement",
        uploadPrompt: "Click or drag a file here",
        uploadHint: "JPG, PNG, PDF · Max 2 MB · Issued within 3 months",
      },
    },
    submitBtn: "Submit for review",
    submitting: "Submitting…",
    reviewNote: "Review takes 1–3 business days",
    sizeError: "File must be 2 MB or smaller",
    fileRequired: "Please attach a file",
    emailRequired: "Please enter your work email",
    successTitle: "Application submitted",
    successDesc: "We'll email you the result after reviewing. This usually takes 1–3 business days.",
    pendingTitle: "Under review",
    pendingDesc: "Your expert verification is being reviewed. We'll notify you by email.",
    verifiedTitle: "Expert verified",
    verifiedDesc: "You're now a verified expert panel member and can access expert-only interviews.",
    rejectedTitle: "Verification rejected",
    rejectedDesc: "Unfortunately your verification was rejected. Please try again with a different method.",
    reApply: "Apply again",
    backToPanel: "Back to panel home",
    note: "Reviewer note:",
  },
};

function StatusCard({ status, lang, note, onReApply, go }) {
  const t = T[lang] ?? T.ko;

  if (status === "pending") {
    return (
      <div style={{ textAlign: "center", maxWidth: 400, margin: "0 auto" }}>
        <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="14" cy="14" r="11" />
              <path d="M14 8v6l4 2" />
            </svg>
          </div>
          <span style={{
            position: "absolute", top: 2, right: 2,
            width: 12, height: 12, borderRadius: "50%",
            background: "#f59e0b", border: "2px solid white",
            animation: "pulse-dot 1.4s ease-in-out infinite",
          }} />
        </div>
        <style>{`@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.75)} }`}</style>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 10 }}>{t.pendingTitle}</div>
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 16 }}>{t.pendingDesc}</div>
        <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 28, fontSize: 12, color: "#92650a" }}>
          {lang === "ko" ? "결과는 이메일로 안내드려요 · 보통 1–3 영업일 소요" : "We'll email you the result · usually 1–3 business days"}
        </div>
        <Btn onClick={() => go("panel_board")}>{t.backToPanel}</Btn>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div style={{ textAlign: "center", maxWidth: 400, margin: "0 auto" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.successBg, border: `1px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          {Ic.CheckCircle({ s: 32, c: C.success })}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 10 }}>{t.verifiedTitle}</div>
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 28 }}>{t.verifiedDesc}</div>
        <Btn onClick={() => go("panel_board")}>{t.backToPanel}</Btn>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div style={{ textAlign: "center", maxWidth: 400, margin: "0 auto" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(234,34,97,0.08)", border: "1px solid rgba(234,34,97,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={C.ruby} strokeWidth="2" strokeLinecap="round">
            <circle cx="14" cy="14" r="11" />
            <line x1="9" y1="9" x2="19" y2="19" /><line x1="19" y1="9" x2="9" y2="19" />
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 10 }}>{t.rejectedTitle}</div>
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 12 }}>{t.rejectedDesc}</div>
        {note && (
          <div style={{ background: "rgba(234,34,97,0.04)", border: "1px solid rgba(234,34,97,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.ruby, marginBottom: 4 }}>{t.note}</div>
            <div style={{ fontSize: 13, color: C.body }}>{note}</div>
          </div>
        )}
        <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleLight}`, borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: C.purple }}>
          {lang === "ko" ? "다른 서류를 준비해서 다시 신청할 수 있어요" : "You can re-apply with a different document"}
        </div>
        <Btn full onClick={onReApply}>{t.reApply}</Btn>
      </div>
    );
  }

  return null;
}

const EXPERT_DOMAINS = [
  { value: "it_dev", label: "IT/개발" },
  { value: "marketing", label: "마케팅/광고" },
  { value: "design", label: "디자인/UX" },
  { value: "finance", label: "금융/회계" },
  { value: "medical", label: "의료/헬스케어" },
  { value: "education", label: "교육" },
  { value: "legal", label: "법률" },
  { value: "manufacturing", label: "제조/엔지니어링" },
  { value: "other", label: "기타" },
];
const EXPERT_INDUSTRIES = [
  { value: "startup", label: "스타트업/중소기업" },
  { value: "large_corp", label: "대기업/중견기업" },
  { value: "public", label: "공공기관/비영리" },
  { value: "freelance", label: "프리랜서/자영업" },
];
const EXPERT_YEARS = [
  { value: "lt2", label: "~2년" },
  { value: "3to5", label: "3~5년" },
  { value: "6to10", label: "6~10년" },
  { value: "gt10", label: "10년+" },
];

function EVPill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${active ? C.purple : C.border}`, background: active ? C.purpleBg : C.white, color: active ? C.purple : C.navy, fontSize: 13, fontFamily: F, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
      {children}
    </button>
  );
}

function EVStepSection({ title, children, style: sx }) {
  return (
    <div style={sx}>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.label, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
    </div>
  );
}

export default function ExpertVerifyScreen({ go, user, lang = "ko", onLangChange }) {
  const t = T[lang] ?? T.ko;
  const isKo = lang === "ko";
  const isMobile = useIsMobile();
  const { showToast } = useToast();

  const [profileStatus, setProfileStatus] = useState(null); // null = loading
  const [reviewerNote, setReviewerNote] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [emailValue, setEmailValue] = useState("");
  const [fileInfo, setFileInfo] = useState(null); // { name, sizeBytes, dataUrl }
  const [fileReading, setFileReading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState(null);
  const [industry, setIndustry] = useState(null);
  const [yearsExp, setYearsExp] = useState(null);
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    if (!user) { setProfileStatus("none"); return; }
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { setProfileStatus("none"); return; }

        const res = await fetch("/api/expert-verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setProfileStatus("none"); return; }
        const json = await res.json();
        setProfileStatus(json.expert_status ?? "none");
        setReviewerNote(json.expert_verify_data?.reviewer_note ?? null);
      } catch {
        setProfileStatus("none");
      }
    })();
  }, [user]);

  function handleSelectMethod(method) {
    setSelectedMethod(method);
    setEmailValue("");
    setFileInfo(null);
    setFileError(null);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError(t.sizeError);
      setFileInfo(null);
      return;
    }
    setFileError(null);
    setFileReading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileInfo({ name: file.name, sizeBytes: file.size, dataUrl: ev.target.result });
      setFileReading(false);
    };
    reader.onerror = () => {
      setFileError(isKo ? "파일을 읽는 중 오류가 발생했어요" : "Error reading file");
      setFileReading(false);
    };
    reader.readAsDataURL(file);
  }

  function isFormValid() {
    if (!selectedMethod) return false;
    if (selectedMethod === "email") return emailValue.trim().includes("@");
    return fileInfo !== null;
  }

  async function handleSubmit() {
    if (!isFormValid() || submitting) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      let data = {};
      if (selectedMethod === "email") {
        data = { email: emailValue.trim() };
      } else {
        data = { file_name: fileInfo.name, file_data: fileInfo.dataUrl };
      }

      const res = await fetch("/api/expert-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ method: selectedMethod, data, career_info: { domain, industry, years_exp: yearsExp, job_title: jobTitle.trim() || null } }),
      });

      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
      setProfileStatus("pending");
    } catch {
      showToast(isKo ? "제출 중 오류가 발생했어요. 다시 시도해주세요." : "Submission failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const showStatusCard =
    profileStatus !== null &&
    profileStatus !== "none" &&
    !submitted;

  const showSuccess = submitted || (profileStatus === "pending" && !showStatusCard);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      <GlobalNav go={go} activeTab="" variant="panel" user={user} lang={lang} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: isMobile ? "24px 16px 48px" : "32px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 600, boxSizing: "border-box" }}>

          {/* Loading */}
          {profileStatus === null && (
            <div style={{ textAlign: "center", padding: "80px 0", color: C.body, fontSize: 14 }}>
              {isKo ? "불러오는 중…" : "Loading…"}
            </div>
          )}

          {/* Status states (pending / verified / rejected) */}
          {profileStatus !== null && showStatusCard && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
              <StatusCard
                status={profileStatus}
                lang={lang}
                note={reviewerNote}
                onReApply={() => { setProfileStatus("none"); setSelectedMethod(null); setStep(1); setDomain(null); setIndustry(null); setYearsExp(null); setJobTitle(""); }}
                go={go}
              />
            </div>
          )}

          {/* Post-submit success */}
          {submitted && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
              <div style={{ textAlign: "center", maxWidth: 400, margin: "0 auto" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.successBg, border: `1px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  {Ic.CheckCircle({ s: 32, c: C.success })}
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 10 }}>{t.successTitle}</div>
                <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 28 }}>{t.successDesc}</div>
                <Btn onClick={() => go("panel_board")}>{t.backToPanel}</Btn>
              </div>
            </div>
          )}

          {/* Main form (none / re-apply) */}
          {profileStatus !== null && (profileStatus === "none") && !submitted && (
            <>
              {/* Hero - step 1 only */}
              {step === 1 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: C.navy, letterSpacing: "-0.01em", marginBottom: 8, wordBreak: "keep-all" }}>{t.title}</div>
                  <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 20, wordBreak: "keep-all" }}>{t.subtitle}</div>
                  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {t.heroPoints.map((point, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {Ic.Check({ s: 11, c: C.purple })}
                        </div>
                        <span style={{ fontSize: 13, color: C.navy }}>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step indicator */}
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 28 }}>
                {[1, 2, 3].map((n, i) => {
                  const stepLabels = isKo ? ["전문 분야", "경력 정보", "서류 업로드"] : ["Domain", "Career", "Documents"];
                  return (
                    <div key={n} style={{ display: "flex", alignItems: "flex-start", flex: i < 2 ? "1 1 0" : "0 0 auto" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= n ? C.purple : "#f1f0ff", border: `2px solid ${step >= n ? C.purple : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: step >= n ? "#fff" : C.body }}>
                          {step > n ? "✓" : n}
                        </div>
                        <span style={{ fontSize: 10, color: step === n ? C.purple : C.body, fontWeight: step === n ? 600 : 400, whiteSpace: "nowrap" }}>{stepLabels[i]}</span>
                      </div>
                      {i < 2 && <div style={{ flex: 1, height: 2, background: step > n ? C.purple : C.border, alignSelf: "flex-start", marginTop: 13, margin: "13px 6px 0" }} />}
                    </div>
                  );
                })}
              </div>

              {/* Step 1: Domain & Industry */}
              {step === 1 && (
                <div>
                  <EVStepSection title={isKo ? "직군을 선택해 주세요" : "Select your field"}>
                    {EXPERT_DOMAINS.map(d => <EVPill key={d.value} active={domain === d.value} onClick={() => setDomain(d.value)}>{d.label}</EVPill>)}
                  </EVStepSection>
                  <EVStepSection title={isKo ? "소속 산업군을 선택해 주세요" : "Select your industry"} style={{ marginTop: 20 }}>
                    {EXPERT_INDUSTRIES.map(d => <EVPill key={d.value} active={industry === d.value} onClick={() => setIndustry(d.value)}>{d.label}</EVPill>)}
                  </EVStepSection>
                  <Btn full size="lg" disabled={!domain || !industry} onClick={() => setStep(2)} style={{ marginTop: 24 }}>
                    {isKo ? "다음" : "Next"}
                  </Btn>
                </div>
              )}

              {/* Step 2: Career info */}
              {step === 2 && (
                <div>
                  <EVStepSection title={isKo ? "총 경력 연수를 선택해 주세요" : "Total experience"}>
                    {EXPERT_YEARS.map(y => <EVPill key={y.value} active={yearsExp === y.value} onClick={() => setYearsExp(y.value)}>{y.label}</EVPill>)}
                  </EVStepSection>
                  <div style={{ marginTop: 20 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: C.label, display: "block", marginBottom: 6 }}>
                      {isKo ? "현 직함/직위 (선택)" : "Job title (optional)"}
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      placeholder={isKo ? "예: 시니어 프로덕트 매니저" : "e.g. Senior Product Manager"}
                      maxLength={80}
                      style={{ width: "100%", padding: "10px 12px", minHeight: 44, borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = C.purple}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                    <Btn variant="ghost" size="lg" onClick={() => setStep(1)} style={{ flex: 1 }}>{isKo ? "이전" : "Back"}</Btn>
                    <Btn size="lg" disabled={!yearsExp} onClick={() => setStep(3)} style={{ flex: 2 }}>{isKo ? "다음" : "Next"}</Btn>
                  </div>
                </div>
              )}

              {/* Step 3: Document upload */}
              {step === 3 && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.label, marginBottom: 12 }}>{t.selectMethod}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {["employment_certificate", "health_insurance"].map((method) => {
                        const m = t.methods[method];
                        const active = selectedMethod === method;
                        return (
                          <button key={method} onClick={() => handleSelectMethod(method)}
                            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: C.white, border: `1.5px solid ${active ? C.purple : C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "left", fontFamily: F, transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: active ? `0 0 0 3px ${C.purpleBg}` : "none", outline: "none", width: "100%" }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = C.purpleLight; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = C.border; }}
                          >
                            <span style={{ fontSize: 24, flexShrink: 0 }}>{m.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: active ? C.purple : C.navy, marginBottom: 2 }}>{m.title}</div>
                              <div style={{ fontSize: 12, color: C.body, wordBreak: "keep-all" }}>{m.desc}</div>
                            </div>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? C.purple : C.border}`, background: active ? C.purple : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                              {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedMethod && (
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px", marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: C.label, display: "block", marginBottom: 6 }}>
                        {t.methods[selectedMethod].label} <span style={{ color: "#ea2261" }}>*</span>
                      </label>
                      {fileInfo ? (
                        <FilePreview fileInfo={fileInfo} onRemove={() => { setFileInfo(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} />
                      ) : (
                        <div role="button" tabIndex={fileReading ? -1 : 0}
                          aria-label={isKo ? "파일 업로드 영역, 클릭하여 파일 선택" : "File upload area, click to select file"}
                          onClick={() => !fileReading && fileInputRef.current?.click()}
                          onKeyDown={e => (e.key === "Enter" || e.key === " ") && !fileReading && fileInputRef.current?.click()}
                          style={{ border: `1.5px dashed ${fileError ? "#ea2261" : C.border}`, borderRadius: 8, padding: "28px 16px", textAlign: "center", cursor: fileReading ? "default" : "pointer", background: "#fafbfc", transition: "all 0.15s" }}
                          onMouseEnter={e => { if (!fileReading) e.currentTarget.style.borderColor = C.purpleLight; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = fileError ? "#ea2261" : C.border; }}
                        >
                          {fileReading ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                              <UploadSpinner />
                              <div style={{ fontSize: 12, color: C.body }}>{isKo ? "파일 읽는 중…" : "Reading file…"}</div>
                            </div>
                          ) : (
                            <>
                              <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>{Ic.Clip({ s: 20, c: C.body })}</div>
                              <div style={{ fontSize: 13, color: C.navy, fontWeight: 500, marginBottom: 4 }}>{t.methods[selectedMethod].uploadPrompt}</div>
                              <div style={{ fontSize: 11, color: C.body, opacity: 0.8 }}>PDF, JPG, PNG · {isKo ? "최대 2MB · 3개월 이내 발급본" : "Max 2 MB · Issued within 3 months"}</div>
                            </>
                          )}
                        </div>
                      )}
                      {fileError && <div style={{ fontSize: 11, color: "#ea2261", marginTop: 6 }}>{fileError}</div>}
                      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }} onChange={handleFileChange} />
                    </div>
                  )}

                  {selectedMethod && (
                    <div style={{ fontSize: 12, color: C.body, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>ℹ️</span><span>{t.reviewNote}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <Btn variant="ghost" size="lg" onClick={() => setStep(2)} style={{ flex: 1 }}>{isKo ? "이전" : "Back"}</Btn>
                    <Btn size="lg" disabled={!isFormValid() || submitting} onClick={handleSubmit} style={{ flex: 2 }}>
                      {submitting ? t.submitting : t.submitBtn}
                    </Btn>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
