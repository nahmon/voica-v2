import { useState, useRef, useEffect } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { PANEL_APPLICANTS } from "../lib/mockData.js";
import { Btn, GlobalNav, Footer, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
    setShow(true);
  };

  return (
    <span ref={triggerRef} style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 4 }}
      onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(83,58,253,0.12)", color: C.purple, fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "default", lineHeight: 1 }}>i</span>
      {show && (
        <div style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateX(-50%) translateY(-100%)", background: C.navy, color: C.white, fontSize: 11, lineHeight: 1.65, padding: "10px 14px", borderRadius: 8, whiteSpace: "normal", width: 240, zIndex: 9999, boxShadow: "0 6px 20px rgba(0,0,0,0.25)", pointerEvents: "none" }}>
          {text.split("\n").map((line, i) => <div key={i}>{line}</div>)}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${C.navy}` }} />
        </div>
      )}
    </span>
  );
}

export default function RecruiterAdminScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(new Set());
  const [activeTab, setActiveTab] = useState("applicants");
  const [rewards, setRewards] = useState([]);
  const [rewardSelected, setRewardSelected] = useState(new Set());
  const [payingRewards, setPayingRewards] = useState(false);
  const [expertVerifications, setExpertVerifications] = useState([]);
  const [expertLoading, setExpertLoading] = useState(false);
  const [expertActioning, setExpertActioning] = useState(null);
  const [aiChecking, setAiChecking] = useState(null);
  const [aiResults, setAiResults] = useState({});
  const [aiConsentPending, setAiConsentPending] = useState(null);
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const filters = ["All", "Applied", "Qualified", "Unqualified", "Completed"];
  const isKo = lang === "ko";

  useEffect(() => {
    if (activeTab !== "rewards" || !user) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/management?resource=admin-rewards&status=claimed", { headers: { Authorization: `Bearer ${session?.access_token}` } });
      if (res.ok) { const d = await res.json(); setRewards(d.rewards ?? []); }
    })();
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== "expert_verify" || !user) return;
    setExpertLoading(true);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/expert-verify?admin=true", { headers: { Authorization: `Bearer ${session?.access_token}` } });
        if (res.ok) { const d = await res.json(); setExpertVerifications(d.verifications ?? []); }
      } finally { setExpertLoading(false); }
    })();
  }, [activeTab, user]);

  const handleAiCheckConfirmed = async (userId) => {
    setAiConsentPending(null);
    setAiChecking(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/expert-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ action: "ai_check", user_id: userId }),
      });
      const d = await res.json();
      if (res.ok) {
        setAiResults(prev => ({ ...prev, [userId]: d.result }));
      } else {
        showToast(d.error ?? "AI 분석 실패", "error");
      }
    } finally { setAiChecking(null); }
  };

  const handleExpertAction = async (userId, status) => {
    setExpertActioning(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/expert-verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ user_id: userId, status }),
      });
      if (res.ok) {
        setExpertVerifications(prev => prev.filter(v => v.id !== userId));
        showToast(status === "verified" ? (isKo ? "승인됐어요" : "Approved") : (isKo ? "반려됐어요" : "Rejected"), "success");
      } else {
        showToast(isKo ? "처리 실패" : "Failed", "error");
      }
    } finally { setExpertActioning(null); }
  };

  const handleMarkPaid = async () => {
    if (rewardSelected.size === 0) return;
    setPayingRewards(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/management?resource=admin-rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ rewardIds: [...rewardSelected] }),
      });
      if (res.ok) {
        setRewards(prev => prev.filter(r => !rewardSelected.has(r.id)));
        setRewardSelected(new Set());
        showToast(isKo ? "정산 처리 완료" : "Marked as paid", "success");
      } else {
        showToast(isKo ? "처리 실패" : "Failed", "error");
      }
    } finally { setPayingRewards(false); }
  };

  const statusMap = { "All": "All", "Applied": "Applied", "Qualified": "Qualified", "Unqualified": "Not Qualified", "Completed": "Completed" };
  const statusLabel = {
    "Applied":       isKo ? "검토 중" : "Applied",
    "Qualified":     isKo ? "적격" : "Qualified",
    "Not Qualified": isKo ? "부적격" : "Not Qualified",
    "Completed":     isKo ? "완료" : "Completed",
  };
  const statusStyle = {
    "Applied":       { color: "#92650a", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
    "Qualified":     { color: C.successText, bg: C.successBg, border: C.successBorder },
    "Not Qualified": { color: C.ruby, bg: "rgba(217,48,37,0.08)", border: "rgba(217,48,37,0.2)" },
    "Completed":     { color: C.body, bg: C.bg, border: C.border },
  };
  const filtered = filter === "All" ? PANEL_APPLICANTS : PANEL_APPLICANTS.filter(p => p.status === statusMap[filter]);
  const counts = filters.slice(1).reduce((acc, f) => ({ ...acc, [f]: PANEL_APPLICANTS.filter(p => p.status === statusMap[f]).length }), {});

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} variant="app" user={user} logout={logout} lang={lang} />
      <div style={{ padding: "10px 24px", background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← {isKo ? "대시보드" : "Dashboard"}</Btn>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onLangChange && (
            <div style={{ display: "flex", gap: 2, marginRight: 4 }}>
              {[["ko", "KO"], ["en", "EN"]].map(([code, label]) => (
                <button key={code} onClick={() => onLangChange(code)}
                  style={{ fontSize: 11, fontWeight: lang === code ? 600 : 400, color: lang === code ? C.purple : C.body, background: lang === code ? C.purpleBg : "transparent", border: `1px solid ${lang === code ? C.purpleLight : C.border}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontFamily: F, transition: "all 0.12s" }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          <Btn variant="ghost" size="sm" onClick={() => go("editor")}>{isKo ? "인터뷰 편집" : "Edit interview"}</Btn>
          <Btn size="sm" onClick={() => go("report")}>{isKo ? "리포트 보기" : "View report"}</Btn>
        </div>
      </div>

      {/* Tab switcher */}
      <div role="tablist" style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", gap: 0 }}>
        {[
          ["applicants", isKo ? "패널 지원자" : "Applicants"],
          ["rewards", isKo ? "리워드 정산" : "Rewards"],
          ["expert_verify", isKo ? "전문가 인증 심사" : "Expert Verification"],
        ].map(([tab, label]) => (
          <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
            style={{ padding: "12px 16px", border: "none", background: "none", fontFamily: F, fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? C.purple : C.body, borderBottom: activeTab === tab ? `2px solid ${C.purple}` : "2px solid transparent", cursor: "pointer", transition: "color 0.15s" }}>
            {label}
            {tab === "rewards" && rewards.length > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: C.ruby, color: "#fff", padding: "1px 5px", borderRadius: 8, fontWeight: 700 }}>{rewards.length}</span>}
          </button>
        ))}
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", flex: 1, width: "100%" }}>
        {activeTab === "expert_verify" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{isKo ? "전문가 인증 심사" : "Expert Verification Review"}</div>
              <div style={{ fontSize: 13, color: C.body, marginTop: 4 }}>{isKo ? "심사 대기 중인 전문가 인증 신청 목록이에요." : "Pending expert verification requests."}</div>
            </div>
            {expertLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.body, fontSize: 14 }}>{isKo ? "불러오는 중…" : "Loading…"}</div>
            ) : expertVerifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.body, fontSize: 14 }}>{isKo ? "심사 대기 중인 신청이 없어요" : "No pending verifications"}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {expertVerifications.map(v => {
                  const ci = v.expert_verify_data?.career_info;
                  const aiResult = aiResults[v.id];
                  const domainLabels = { it_dev: "IT/개발", marketing: "마케팅/광고", design: "디자인/UX", finance: "금융/회계", medical: "의료/헬스케어", education: "교육", legal: "법률", manufacturing: "제조/엔지니어링", other: "기타" };
                  const industryLabels = { startup: "스타트업/중소기업", large_corp: "대기업/중견기업", public: "공공기관/비영리", freelance: "프리랜서/자영업" };
                  const yearsLabels = { lt2: "~2년", "3to5": "3~5년", "6to10": "6~10년", gt10: "10년+" };
                  return (
                    <div key={v.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: C.body, fontFamily: "monospace", marginBottom: 6, wordBreak: "break-all" }}>{v.id}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                            {ci?.domain && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: C.purpleBg, color: C.purple, fontWeight: 500 }}>{domainLabels[ci.domain] ?? ci.domain}</span>}
                            {ci?.industry && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "#f0f9ff", color: "#0369a1", fontWeight: 500 }}>{industryLabels[ci.industry] ?? ci.industry}</span>}
                            {ci?.years_exp && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: C.bg, color: C.body, border: `1px solid ${C.border}` }}>{yearsLabels[ci.years_exp] ?? ci.years_exp}</span>}
                          </div>
                          {ci?.job_title && <div style={{ fontSize: 12, color: C.navy, fontWeight: 500, marginBottom: 4 }}>{ci.job_title}</div>}
                          <div style={{ fontSize: 12, color: C.body }}>
                            {isKo ? "서류" : "Method"}: <span style={{ fontWeight: 500, color: C.navy }}>{v.expert_verify_method === "employment_certificate" ? "재직증명서" : v.expert_verify_method === "health_insurance" ? "건강보험료 납부확인서" : v.expert_verify_method ?? "—"}</span>
                            {v.expert_verify_data?.file_name && <span style={{ color: C.body }}> · {v.expert_verify_data.file_name}</span>}
                          </div>
                          {v.expert_verify_data?.submitted_at && (
                            <div style={{ fontSize: 11, color: C.body, marginTop: 3 }}>
                              신청: {new Date(v.expert_verify_data.submitted_at).toLocaleDateString("ko-KR")}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button disabled={expertActioning === v.id} onClick={() => handleExpertAction(v.id, "verified")}
                              style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: `1px solid ${C.successBorder}`, background: C.successBg, color: C.successText, cursor: "pointer", fontFamily: F, fontWeight: 500, opacity: expertActioning === v.id ? 0.6 : 1 }}>
                              승인
                            </button>
                            <button disabled={expertActioning === v.id} onClick={() => handleExpertAction(v.id, "rejected")}
                              style={{ padding: "6px 12px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(217,48,37,0.25)", background: "rgba(217,48,37,0.06)", color: C.ruby, cursor: "pointer", fontFamily: F, fontWeight: 500, opacity: expertActioning === v.id ? 0.6 : 1 }}>
                              반려
                            </button>
                          </div>
                          <button disabled={aiChecking === v.id} onClick={() => setAiConsentPending(v.id)}
                            style={{ padding: "5px 12px", fontSize: 11, borderRadius: 6, border: `1px solid ${C.purpleLight}`, background: C.purpleBg, color: C.purple, cursor: "pointer", fontFamily: F, fontWeight: 500, opacity: aiChecking === v.id ? 0.6 : 1 }}>
                            {aiChecking === v.id ? "분석 중…" : "AI 검수"}
                          </button>
                        </div>
                      </div>
                      {aiResult && (
                        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: aiResult.match === true ? C.successBg : aiResult.match === false ? "rgba(217,48,37,0.06)" : C.bg, border: `1px solid ${aiResult.match === true ? C.successBorder : aiResult.match === false ? "rgba(217,48,37,0.2)" : C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: aiResult.notes ? 6 : 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: aiResult.match === true ? C.successText : aiResult.match === false ? C.ruby : C.body }}>
                              {aiResult.match === true ? "✓ 정보 일치" : aiResult.match === false ? "✗ 불일치 감지" : "분석 결과"}
                            </span>
                            {aiResult.confidence && <span style={{ fontSize: 10, color: C.body, background: C.bg, border: `1px solid ${C.border}`, padding: "1px 6px", borderRadius: 10 }}>{aiResult.confidence}</span>}
                            {aiResult.company && <span style={{ fontSize: 11, color: C.navy, fontWeight: 500 }}>{aiResult.company}</span>}
                            {aiResult.title && <span style={{ fontSize: 11, color: C.body }}>{aiResult.title}</span>}
                          </div>
                          {aiResult.notes && <div style={{ fontSize: 12, color: C.body }}>{aiResult.notes}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === "rewards" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{isKo ? "정산 대기 목록" : "Pending Payouts"}</div>
                <div style={{ fontSize: 13, color: C.body, marginTop: 4 }}>{isKo ? "정산 신청한 참여자 목록이에요. 계좌이체 후 완료 처리하세요." : "Participants who claimed their reward. Mark as paid after bank transfer."}</div>
              </div>
              {rewardSelected.size > 0 && (
                <Btn onClick={handleMarkPaid} disabled={payingRewards}>
                  {payingRewards ? (isKo ? "처리 중..." : "Processing...") : (isKo ? `${rewardSelected.size}건 지급 완료 처리` : `Mark ${rewardSelected.size} as paid`)}
                </Btn>
              )}
            </div>
            {rewards.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.body, fontSize: 14 }}>{isKo ? "정산 대기 중인 항목이 없어요" : "No pending payouts"}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rewards.map(r => (
                  <div key={r.id} role="checkbox" aria-checked={rewardSelected.has(r.id)} tabIndex={0}
                    onClick={() => setRewardSelected(prev => { const s = new Set(prev); s.has(r.id) ? s.delete(r.id) : s.add(r.id); return s; })}
                    onKeyDown={e => (e.key === " " || e.key === "Enter") && setRewardSelected(prev => { const s = new Set(prev); s.has(r.id) ? s.delete(r.id) : s.add(r.id); return s; })}
                    style={{ background: C.white, border: `1.5px solid ${rewardSelected.has(r.id) ? C.purple : C.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, boxShadow: S.ambient }}>
                    <input type="checkbox" aria-hidden="true" checked={rewardSelected.has(r.id)} readOnly style={{ accentColor: C.purple, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.navy, marginBottom: 2 }}>{r.interviews?.title ?? "—"}</div>
                      <div style={{ fontSize: 12, color: C.body }}>
                        {r.participant_bank_accounts?.bank_name} {r.participant_bank_accounts?.account_number} · {r.participant_bank_accounts?.account_holder}
                      </div>
                      <div style={{ fontSize: 11, color: C.body, marginTop: 2 }}>{isKo ? "신청일" : "Claimed"}: {r.claimed_at ? new Date(r.claimed_at).toLocaleDateString("ko-KR") : "—"}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.purple }}>₩{r.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "applicants" && (<>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total applicants", value: PANEL_APPLICANTS.length, color: C.navy },
            { label: "Qualified", value: counts["Qualified"] || 0, color: C.success },
            { label: "Needs review", value: counts["Applied"] || 0, color: "#f59e0b" },
            { label: "Interviews done", value: counts["Completed"] || 0, color: C.purple },
            { label: "Unqualified", value: counts["Unqualified"] || 0, color: C.ruby },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, borderRadius: 16, padding: "16px 18px", border: `1px solid ${C.border}`, boxShadow: S.ambient }}>
              <div style={{ fontSize: 11, color: C.body, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: s.color, fontFeatureSettings: '"tnum"' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 13, fontFamily: F, border: "none", cursor: "pointer", background: filter === f ? C.purpleBg : "transparent", color: filter === f ? C.purple : C.body, fontWeight: filter === f ? 400 : 300 }}>
                {f} {f !== "All" && counts[f] !== undefined && <span style={{ fontSize: 11 }}>({counts[f]})</span>}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.body }}>{selected.size} selected</span>
              <Btn size="sm" style={{ background: C.success }} onClick={() => { setSelected(new Set()); alert(`Approved ${selected.size} applicant(s).`); }}>Approve all</Btn>
              <Btn size="sm" style={{ background: C.ruby }} onClick={() => { setSelected(new Set()); alert(`Rejected ${selected.size} applicant(s).`); }}>Reject all</Btn>
            </div>
          )}
        </div>

        {/* Mobile: card list */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((p) => {
              const ss = statusStyle[p.status];
              const scoreColor = p.score >= 85 ? C.success : p.score >= 70 ? "#f59e0b" : C.ruby;
              return (
                <div key={p.id} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 16px", boxShadow: S.ambient }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: C.navy }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.body, marginTop: 2 }}>{p.age} · {p.gender} · {p.intv} interviews</div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{statusLabel[p.status]}</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.body }}>AI Fit Score</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>{p.score}</span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${p.score}%`, background: scoreColor, borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.body, marginBottom: 12 }}>{p.applied}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {p.status === "Applied" && (
                      <>
                        <button style={{ flex: 1, padding: "6px 14px", fontSize: 13, borderRadius: 8, border: `1px solid ${C.successBorder}`, background: C.successBg, color: C.successText, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>Approve</button>
                        <button style={{ flex: 1, padding: "6px 14px", fontSize: 13, borderRadius: 8, border: "1px solid rgba(217,48,37,0.25)", background: "rgba(217,48,37,0.06)", color: C.ruby, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>Reject</button>
                      </>
                    )}
                    {p.status === "Qualified" && <Btn size="sm" onClick={() => go("interview")}>Start interview</Btn>}
                    {p.status === "Completed" && <Btn variant="ghost" size="sm" onClick={() => go("report")}>Report</Btn>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        /* Desktop: table */
        <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, overflowX: "auto", overflowY: "visible", boxShadow: S.ambient }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 72px 72px 168px 130px 116px 180px", columnGap: 16, alignItems: "center", padding: "0 24px", height: 40, borderBottom: `1px solid ${C.border}`, background: C.bg, minWidth: 980 }}>
            {["", "Applicant", "Age", "Gender", "Applied on"].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: C.body, letterSpacing: "0.3px", textTransform: "uppercase" }}>{h}</div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 600, color: C.body, letterSpacing: "0.3px", textTransform: "uppercase", display: "flex", alignItems: "center" }}>
              AI Fit Score
              <InfoTooltip text={"프로필 매칭 40% + 인터뷰 이력 30% + 응답 품질 30%\n세 항목을 가중 합산해 0~100점으로 산출해요.\n85점 이상 적격 · 70~84점 검토 · 70점 미만 부적격"} />
            </div>
            {["Status", "Actions"].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: C.body, letterSpacing: "0.3px", textTransform: "uppercase", paddingLeft: i === 1 ? 16 : 0 }}>{h}</div>
            ))}
          </div>

          {/* Table rows */}
          {filtered.map((p, i) => {
            const ss = statusStyle[p.status];
            const isSelected = selected.has(p.id);
            const scoreColor = p.score >= 85 ? C.success : p.score >= 70 ? "#f59e0b" : C.ruby;
            return (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr 72px 72px 168px 130px 116px 180px", columnGap: 16, alignItems: "center", padding: "0 24px", minHeight: 60, minWidth: 980, borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", background: isSelected ? C.purpleBg : "transparent", transition: "background 0.15s" }}>
                <div onClick={() => setSelected(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}
                  style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${isSelected ? C.purple : C.border}`, background: isSelected ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  {isSelected && <span style={{ color: C.white, fontSize: 10 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: C.navy, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.body, marginTop: 2 }}>{p.intv} interview{p.intv !== 1 ? "s" : ""} completed</div>
                </div>
                <div style={{ fontSize: 13, color: C.navy }}>{p.age}</div>
                <div style={{ fontSize: 13, color: C.navy }}>{p.gender}</div>
                <div style={{ fontSize: 12, color: C.body, fontFeatureSettings: '"tnum"', lineHeight: 1.4 }}>{p.applied}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: scoreColor, marginBottom: 5, fontFeatureSettings: '"tnum"' }}>{p.score}</div>
                  <div style={{ height: 3, background: C.border, borderRadius: 2, width: "80%" }}>
                    <div style={{ height: "100%", width: `${p.score}%`, background: scoreColor, borderRadius: 2 }} />
                  </div>
                </div>
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, whiteSpace: "nowrap" }}>{p.status}</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 16 }}>
                  {p.status === "Applied" && (
                    <>
                      <button style={{ padding: "4px 12px", fontSize: 12, borderRadius: 6, border: `1px solid ${C.successBorder}`, background: C.successBg, color: C.successText, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>Approve</button>
                      <button style={{ padding: "4px 12px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(217,48,37,0.25)", background: "rgba(217,48,37,0.06)", color: C.ruby, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>Reject</button>
                    </>
                  )}
                  {p.status === "Qualified" && <Btn size="sm" onClick={() => go("interview")}>Start interview</Btn>}
                  {p.status === "Completed" && <Btn variant="ghost" size="sm" onClick={() => go("report")}>Report</Btn>}
                  {p.status === "Not Qualified" && <span style={{ fontSize: 13, color: C.body }}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
        )}</>)}
      </main>
      <Footer go={go} lang={lang} onLangChange={onLangChange} />

      {/* AI consent modal */}
      {aiConsentPending && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: "28px 24px", maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 10 }}>AI 검수 전 안내</div>
            <div style={{ fontSize: 13, color: C.body, lineHeight: 1.7, marginBottom: 20 }}>
              이 서류 이미지는 내용 검토를 위해 <strong>OpenAI API</strong>로 전송됩니다. 전송된 이미지는 분석 후 즉시 삭제되며 모델 학습에 사용되지 않습니다.
              <br /><br />계속 진행하시겠습니까?
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setAiConsentPending(null)} style={{ padding: "8px 18px", fontSize: 13, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.body, cursor: "pointer", fontFamily: F }}>취소</button>
              <button onClick={() => handleAiCheckConfirmed(aiConsentPending)} style={{ padding: "8px 18px", fontSize: 13, borderRadius: 8, border: "none", background: C.purple, color: "#fff", cursor: "pointer", fontFamily: F, fontWeight: 600 }}>AI 검수 진행</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
