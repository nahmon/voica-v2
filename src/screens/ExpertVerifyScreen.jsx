import { useState, useEffect, useRef } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { supabase } from "../supabase.js";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

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
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>⏳</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 10 }}>{t.pendingTitle}</div>
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 28 }}>{t.pendingDesc}</div>
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
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(234,34,97,0.08)", border: "1px solid rgba(234,34,97,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✕</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 10 }}>{t.rejectedTitle}</div>
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: note ? 12 : 28 }}>{t.rejectedDesc}</div>
        {note && (
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 28, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: C.label, marginBottom: 4 }}>{t.note}</div>
            <div style={{ fontSize: 13, color: C.body }}>{note}</div>
          </div>
        )}
        <Btn onClick={onReApply}>{t.reApply}</Btn>
      </div>
    );
  }

  return null;
}

export default function ExpertVerifyScreen({ go, user, lang = "ko", onLangChange }) {
  const t = T[lang] ?? T.ko;
  const isKo = lang === "ko";

  const [profileStatus, setProfileStatus] = useState(null); // null = loading
  const [reviewerNote, setReviewerNote] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [emailValue, setEmailValue] = useState("");
  const [fileInfo, setFileInfo] = useState(null); // { name, dataUrl }
  const [fileError, setFileError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
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
    const reader = new FileReader();
    reader.onload = (ev) => setFileInfo({ name: file.name, dataUrl: ev.target.result });
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
        body: JSON.stringify({ method: selectedMethod, data }),
      });

      if (!res.ok) throw new Error("Request failed");
      setSubmitted(true);
      setProfileStatus("pending");
    } catch {
      // silently allow retry
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

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 600 }}>

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
                onReApply={() => { setProfileStatus("none"); setSelectedMethod(null); }}
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
              {/* Hero */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.navy, letterSpacing: "-0.01em", marginBottom: 8 }}>{t.title}</div>
                <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 20 }}>{t.subtitle}</div>
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

              {/* Method selection */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.label, marginBottom: 12 }}>{t.selectMethod}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["employment_certificate", "health_insurance"].map((method) => {
                    const m = t.methods[method];
                    const active = selectedMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => handleSelectMethod(method)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "16px 18px",
                          background: C.white,
                          border: `1.5px solid ${active ? C.purple : C.border}`,
                          borderRadius: 10,
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: F,
                          transition: "border-color 0.15s, box-shadow 0.15s",
                          boxShadow: active ? `0 0 0 3px ${C.purpleBg}` : "none",
                          outline: "none",
                          width: "100%",
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = C.purpleLight; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = C.border; }}
                      >
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{m.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: active ? C.purple : C.navy, marginBottom: 2 }}>{m.title}</div>
                          <div style={{ fontSize: 12, color: C.body }}>{m.desc}</div>
                        </div>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? C.purple : C.border}`, background: active ? C.purple : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                          {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input area for selected method */}
              {selectedMethod && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 20px", marginBottom: 20 }}>
                  {selectedMethod === "email" ? (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: C.label, display: "block", marginBottom: 6 }}>
                        {t.methods.email.label} <span style={{ color: "#ea2261" }}>*</span>
                      </label>
                      <input
                        type="email"
                        placeholder={t.methods.email.placeholder}
                        value={emailValue}
                        onChange={e => setEmailValue(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          fontSize: 13,
                          fontFamily: F,
                          color: C.navy,
                          outline: "none",
                          boxSizing: "border-box",
                          transition: "border-color 0.15s",
                        }}
                        onFocus={e => e.target.style.borderColor = C.purple}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: C.label, display: "block", marginBottom: 6 }}>
                        {t.methods[selectedMethod].label} <span style={{ color: "#ea2261" }}>*</span>
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: `1.5px dashed ${fileError ? "#ea2261" : fileInfo ? C.success : C.border}`,
                          borderRadius: 8,
                          padding: "24px 16px",
                          textAlign: "center",
                          cursor: "pointer",
                          background: fileInfo ? C.successBg : C.bg,
                          transition: "all 0.15s",
                        }}
                      >
                        {fileInfo ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            {Ic.Check({ s: 16, c: C.success })}
                            <span style={{ fontSize: 13, color: C.successText, fontWeight: 500 }}>{fileInfo.name}</span>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: 13, color: C.body, marginBottom: 4 }}>{t.methods[selectedMethod].uploadPrompt}</div>
                            <div style={{ fontSize: 11, color: C.body, opacity: 0.7 }}>{t.methods[selectedMethod].uploadHint}</div>
                          </>
                        )}
                      </div>
                      {fileError && <div style={{ fontSize: 11, color: "#ea2261", marginTop: 6 }}>{fileError}</div>}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Review time note */}
              {selectedMethod && (
                <div style={{ fontSize: 12, color: C.body, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>ℹ️</span>
                  <span>{t.reviewNote}</span>
                </div>
              )}

              <Btn
                full
                size="lg"
                disabled={!isFormValid() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? t.submitting : t.submitBtn}
              </Btn>
            </>
          )}

        </div>
      </div>

      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
