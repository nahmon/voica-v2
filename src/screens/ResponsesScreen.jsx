import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, VoicePlayer, Skeleton, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

// ── Funnel visualization (enhanced with colored bars + % labels) ──────────────
function FunnelCard({ funnel, compact }) {
  if (!funnel) return null;
  const opened    = funnel.interview_link_opened    || 0;
  const started   = funnel.interview_info_submitted || 0;
  const completed = funnel.interview_completed      || 0;
  const abandoned = funnel.interview_abandoned      || 0;
  if (opened === 0) return null;

  const pct = (n) => opened > 0 ? Math.round(n / opened * 100) : 0;
  const steps = [
    { label: "링크 접속",  count: opened,    color: C.purple,   bg: C.purpleBg },
    { label: "정보 입력",  count: started,   color: "#1a73e8",  bg: "rgba(26,115,232,0.08)" },
    { label: "완료",       count: completed, color: C.success,  bg: C.successBg },
  ];

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderBottom: `1px solid ${C.border}`, background: C.white, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.5, marginRight: 4 }}>참여 깔때기</span>
        {steps.map((s, i) => (
          <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span style={{ color: C.border, fontSize: 10 }}>›</span>}
            <span style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 4, background: s.bg }}>
              <span style={{ fontSize: 11, color: C.navy }}>{s.label} <strong style={{ color: s.color }}>{s.count}</strong></span>
              {i > 0 && <span style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{pct(s.count)}%</span>}
            </span>
          </span>
        ))}
        {abandoned > 0 && <span style={{ fontSize: 10, color: "#b45309", marginLeft: 4, padding: "2px 6px", borderRadius: 4, background: "rgba(180,83,9,0.08)" }}>이탈 {abandoned}명</span>}
      </div>
    );
  }

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 14 }}>참여 깔때기</div>
      {steps.map((step, i) => {
        const p = pct(step.count);
        return (
          <div key={step.label} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: step.color }} />
                <span style={{ color: C.body }}>{step.label}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: step.color, fontSize: 14 }}>{step.count}명</span>
                <span style={{ fontSize: 11, color: C.body, background: step.bg, padding: "1px 6px", borderRadius: 4 }}>{p}%</span>
              </div>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%",
                width: `${p}%`,
                background: `linear-gradient(90deg, ${step.color}, ${step.color}cc)`,
                borderRadius: 4,
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        );
      })}
      {abandoned > 0 && (
        <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(180,83,9,0.06)", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
          {Ic.Warning({ s: 13, c: "#b45309" })}
          <span style={{ fontSize: 11, color: "#b45309" }}>이탈 {abandoned}명 ({pct(abandoned)}%)</span>
        </div>
      )}
    </div>
  );
}

// ── CSV export ────────────────────────────────────────────────────────────────
function buildCsv(sessions, questions, allResponses) {
  const headers = ["응답자", "상태", "시작 시간", "완료 시간", ...questions.map((q, i) => `Q${i + 1}: ${q.content}`)];
  const rows = sessions.map((s, si) => {
    const statusLabel = s.status === "completed" ? "완료" : "진행 중";
    const started = s.started_at ? new Date(s.started_at).toLocaleString("ko-KR") : "";
    const completed = s.completed_at ? new Date(s.completed_at).toLocaleString("ko-KR") : "";
    const answers = questions.map(q => {
      const r = allResponses.find(r => r.session_id === s.id && r.question_id === q.id);
      if (!r) return "";
      if (q.type === "voice") return r.transcript ?? "(음성 응답)";
      if (Array.isArray(r.value)) return r.value.join("; ");
      return String(r.value ?? "");
    });
    return [`응답자 ${si + 1}`, statusLabel, started, completed, ...answers];
  });

  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers, ...rows].map(row => row.map(escape).join(","));
  return "\uFEFF" + lines.join("\n"); // BOM for Excel Korean
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ sessions, allResponses }) {
  const total = sessions.length;
  const completed = sessions.filter(s => s.status === "completed").length;
  const inProgress = sessions.filter(s => s.status !== "completed").length;
  const avgMs = (() => {
    const timed = sessions.filter(s => s.completed_at && s.started_at);
    if (!timed.length) return null;
    return timed.reduce((sum, s) => sum + (new Date(s.completed_at) - new Date(s.started_at)), 0) / timed.length;
  })();
  const avgMin = avgMs !== null ? Math.round(avgMs / 60000) : null;

  const items = [
    { label: "전체", value: total, color: C.navy },
    { label: "완료", value: completed, color: C.success },
    { label: "진행 중", value: inProgress, color: "#b45309" },
    ...(avgMin !== null ? [{ label: "평균 완료", value: `${avgMin}분`, color: "#1a73e8" }] : []),
  ];

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
      {items.map(item => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: C.body }}>{item.label}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ResponsesScreen({ go, user, logout, interviewId }) {
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [allResponses, setAllResponses] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "completed" | "in_progress"
  const [viewMode, setViewMode] = useState("expanded"); // "expanded" | "compact"
  const isMobile = useIsMobile();
  const { showToast } = useToast();

  useEffect(() => {
    if (!interviewId) return;
    (async () => {
      try {
        const [{ data: qs }, { data: iv }, { data: ss }] = await Promise.all([
          supabase.from("questions").select("*").eq("interview_id", interviewId).order("order_num"),
          supabase.from("interviews").select("*").eq("id", interviewId).single(),
          supabase.from("sessions").select("*").eq("interview_id", interviewId).order("started_at", { ascending: false }),
        ]);
        setQuestions(qs ?? []);
        setInterview(iv ?? null);

        if (iv?.share_code) {
          const { data: fRows } = await supabase
            .from("funnel_events").select("event_name").eq("share_code", iv.share_code);
          const fc = {};
          (fRows ?? []).forEach(r => { fc[r.event_name] = (fc[r.event_name] || 0) + 1; });
          setFunnel(fc);
        }

        const sorted = (ss ?? []).sort((a, b) => {
          if (a.status === "completed" && b.status !== "completed") return -1;
          if (a.status !== "completed" && b.status === "completed") return 1;
          return new Date(b.started_at) - new Date(a.started_at);
        });
        setSessions(sorted);

        if (sorted.length > 0) {
          const sessionIds = sorted.map(s => s.id);
          const { data: resp } = await supabase
            .from("responses").select("*").in("session_id", sessionIds);
          setAllResponses(resp ?? []);
          if (window.innerWidth >= 768) setSelectedSession(sorted[0]);
        }
      } catch (e) {
        console.error("[ResponsesScreen load]", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId]);

  const handleExportCsv = () => {
    if (sessions.length === 0) { showToast("내보낼 응답이 없어요", "error"); return; }
    const csv = buildCsv(sessions, questions, allResponses);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${interview?.title ?? "responses"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV 파일이 다운로드됩니다", "success");
  };

  const filteredSessions = sessions.filter(s => {
    if (filterStatus === "completed") return s.status === "completed";
    if (filterStatus === "in_progress") return s.status !== "completed";
    return true;
  });

  const responses = selectedSession
    ? allResponses.filter(r => r.session_id === selectedSession.id)
    : [];

  const completedCount = sessions.filter(s => s.status === "completed").length;

  if (loading) return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <Skeleton width={200} height={28} borderRadius={8} style={{ marginBottom: 8 }} />
        <Skeleton width={140} height={16} borderRadius={6} style={{ marginBottom: 32 }} />
        {[1,2,3].map(i => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
            <Skeleton width={36} height={36} borderRadius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton width="40%" height={14} borderRadius={5} style={{ marginBottom: 6 }} />
              <Skeleton width="25%" height={12} borderRadius={5} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Mobile: detail view ── */
  if (isMobile && selectedSession) {
    const sessionIdx = sessions.indexOf(selectedSession) + 1;
    const dt = selectedSession.completed_at
      ? new Date(selectedSession.completed_at).toLocaleString("ko-KR")
      : "인터뷰 진행 중";
    return (
      <div style={{ fontFamily: F, minHeight: "100vh", background: C.bg }}>
        <GlobalNav go={go} variant="app" user={user} logout={logout} />
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 48, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSelectedSession(null)}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.navy, padding: "0 4px", lineHeight: 1 }}>←</button>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            응답자 {sessionIdx}
          </div>
          <Btn size="sm" onClick={() => go("report", interviewId)}>리포트</Btn>
        </div>
        <div style={{ padding: "16px" }}>
          <div style={{ marginBottom: 16, fontSize: 12, color: C.body }}>{dt} · {responses.length}개 응답</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q, qi) => {
              const r = responses.find(r => r.question_id === q.id);
              return <QuestionAnswer key={q.id} question={q} response={r} index={qi} />;
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── Mobile: list view ── */
  if (isMobile) {
    return (
      <div style={{ fontFamily: F, minHeight: "100vh", background: C.bg }}>
        <GlobalNav go={go} variant="app" user={user} logout={logout} />
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 48, display: "flex", alignItems: "center", gap: 10 }}>
          <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {interview?.title ?? "인터뷰"}
          </div>
          <div style={{ fontSize: 12, color: C.body, whiteSpace: "nowrap" }}>완료 {completedCount}명</div>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <StatsBar sessions={sessions} allResponses={allResponses} />
          <FunnelCard funnel={funnel} />

          {/* Filter + export toolbar */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <FilterTabs value={filterStatus} onChange={setFilterStatus} />
            <button onClick={handleExportCsv} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, fontSize: 11, color: C.purple, fontFamily: F, cursor: "pointer", fontWeight: 500 }}>
              {Ic.BarChart({ s: 12, c: C.purple })} CSV 내보내기
            </button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: C.body, marginBottom: 10, letterSpacing: 0.5 }}>
            응답자 목록 ({filteredSessions.length})
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🎙️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 6 }}>아직 응답이 없어요</div>
              <div style={{ fontSize: 13, color: C.body, marginBottom: interview?.share_code ? 20 : 0 }}>인터뷰 링크를 공유하면 패널이 참여해요</div>
              {interview?.share_code && (
                <button onClick={() => { navigator.clipboard.writeText(`${location.origin}/i/${interview.share_code}`); }}
                  style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 13, color: C.purple, fontFamily: F, cursor: "pointer", fontWeight: 500 }}>
                  🔗 링크 복사
                </button>
              )}
            </div>
          ) : filteredSessions.map((s, i) => {
            const isCompleted = s.status === "completed";
            const originalIdx = sessions.indexOf(s);
            const dt = s.completed_at
              ? new Date(s.completed_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
              : "진행 중";
            const respCount = allResponses.filter(r => r.session_id === s.id).length;
            return (
              <div key={s.id} onClick={() => setSelectedSession(s)}
                style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: S.ambient }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: isCompleted ? "rgba(21,190,83,0.12)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: isCompleted ? C.successText : "#92650a", flexShrink: 0 }}>
                  {originalIdx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.navy, marginBottom: 2 }}>응답자 {originalIdx + 1}</div>
                  <div style={{ fontSize: 12, color: C.body }}>{dt} · {respCount}개 응답</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: isCompleted ? C.successText : "#b45309", whiteSpace: "nowrap" }}>
                  {isCompleted ? "완료" : "진행 중"}
                </div>
                <span style={{ color: C.body, fontSize: 16 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Desktop: 2-panel layout ── */
  return (
    <div style={{ fontFamily: F, minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} variant="app" user={user} logout={logout} />

      {/* Sub-header */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 48, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
        <div style={{ width: 1, height: 16, background: C.border }} />
        <div style={{ fontSize: 14, fontWeight: 500, color: C.navy, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {interview?.title ?? "인터뷰"}
        </div>
        <div style={{ fontSize: 12, color: C.body, whiteSpace: "nowrap" }}>
          완료 {completedCount}명
        </div>
        <button onClick={handleExportCsv} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, fontSize: 12, color: C.purple, fontFamily: F, cursor: "pointer", fontWeight: 500 }}>
          {Ic.BarChart({ s: 13, c: C.purple })} CSV 내보내기
        </button>
        <Btn size="sm" onClick={() => go("report", interviewId)}>리포트 보기</Btn>
      </div>

      <FunnelCard funnel={funnel} compact />

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: session list */}
        <div style={{ width: 260, borderRight: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Stats + toolbar */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
            <StatsBar sessions={sessions} allResponses={allResponses} />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <FilterTabs value={filterStatus} onChange={setFilterStatus} small />
              <button
                onClick={() => setViewMode(v => v === "expanded" ? "compact" : "expanded")}
                title={viewMode === "expanded" ? "컴팩트 보기" : "확장 보기"}
                style={{ marginLeft: "auto", padding: "4px 8px", borderRadius: 5, border: `1px solid ${C.border}`, background: viewMode === "compact" ? C.purpleBg : C.white, cursor: "pointer", display: "flex", alignItems: "center", color: viewMode === "compact" ? C.purple : C.body }}>
                {viewMode === "compact"
                  ? Ic.BarChart({ s: 13, c: C.purple })
                  : Ic.BarChart({ s: 13, c: C.body })}
              </button>
            </div>
          </div>

          <div style={{ padding: "6px 12px 4px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.5 }}>
            응답자 목록 ({filteredSessions.length})
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎙️</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 6 }}>아직 응답이 없어요</div>
                <div style={{ fontSize: 12, color: C.body, marginBottom: interview?.share_code ? 16 : 0 }}>인터뷰 링크를 공유하면 패널이 참여해요</div>
                {interview?.share_code && (
                  <button onClick={() => navigator.clipboard.writeText(`${location.origin}/i/${interview.share_code}`)}
                    style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 12, color: C.purple, fontFamily: F, cursor: "pointer" }}>
                    🔗 링크 복사
                  </button>
                )}
              </div>
            ) : filteredSessions.map((s) => {
              const originalIdx = sessions.indexOf(s);
              const isSelected = selectedSession?.id === s.id;
              const isCompleted = s.status === "completed";
              const dt = s.completed_at
                ? new Date(s.completed_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                : "진행 중";
              const respCount = allResponses.filter(r => r.session_id === s.id).length;
              const durMin = s.completed_at && s.started_at
                ? Math.round((new Date(s.completed_at) - new Date(s.started_at)) / 60000)
                : null;

              if (viewMode === "compact") {
                return (
                  <div key={s.id} onClick={() => setSelectedSession(s)}
                    style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: isSelected ? C.purpleBg : "transparent", borderLeft: `3px solid ${isSelected ? C.purple : "transparent"}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: isCompleted ? "rgba(21,190,83,0.12)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: isCompleted ? C.successText : "#92650a", flexShrink: 0 }}>
                      {originalIdx + 1}
                    </div>
                    <span style={{ flex: 1, fontSize: 12, color: isSelected ? C.purple : C.navy }}>응답자 {originalIdx + 1}</span>
                    <span style={{ fontSize: 10, color: isCompleted ? C.successText : "#b45309" }}>{isCompleted ? "완료" : "진행"}</span>
                  </div>
                );
              }

              return (
                <div key={s.id} onClick={() => setSelectedSession(s)}
                  style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: isSelected ? C.purpleBg : "transparent", borderLeft: `3px solid ${isSelected ? C.purple : "transparent"}`, transition: "background 0.1s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: isCompleted ? "rgba(21,190,83,0.12)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: isCompleted ? C.successText : "#92650a", flexShrink: 0 }}>
                      {originalIdx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: isSelected ? C.purple : C.navy, fontWeight: isSelected ? 500 : 400 }}>응답자 {originalIdx + 1}</div>
                      <div style={{ fontSize: 11, color: isCompleted ? C.successText : "#b45309" }}>{isCompleted ? "완료" : "진행 중"}</div>
                    </div>
                    <div style={{ fontSize: 10, color: C.body, textAlign: "right", flexShrink: 0 }}>
                      {respCount}개
                      {durMin !== null && <div style={{ fontSize: 10, color: C.body }}>{durMin}분</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.body, paddingLeft: 34 }}>{dt}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: answers */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {!selectedSession ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.body, fontSize: 14 }}>
              왼쪽에서 응답자를 선택해요
            </div>
          ) : (
            <div style={{ maxWidth: 720 }}>
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
                  응답자 {sessions.indexOf(selectedSession) + 1}
                </div>
                <div style={{ fontSize: 12, color: C.body }}>
                  {selectedSession.completed_at
                    ? `완료 · ${new Date(selectedSession.completed_at).toLocaleString("ko-KR")}`
                    : "인터뷰 진행 중"
                  }
                  {" · "}{responses.length}개 응답
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {questions.map((q, qi) => {
                  const r = responses.find(r => r.question_id === q.id);
                  return <QuestionAnswer key={q.id} question={q} response={r} index={qi} />;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
function FilterTabs({ value, onChange, small }) {
  const options = [
    { v: "all", label: "전체" },
    { v: "completed", label: "완료" },
    { v: "in_progress", label: "진행 중" },
  ];
  return (
    <div style={{ display: "flex", gap: 2, background: C.bg, padding: 2, borderRadius: 7, border: `1px solid ${C.border}` }}>
      {options.map(opt => (
        <button key={opt.v} onClick={() => onChange(opt.v)} style={{ padding: small ? "3px 8px" : "4px 10px", borderRadius: 5, border: "none", background: value === opt.v ? C.white : "transparent", color: value === opt.v ? C.navy : C.body, fontSize: small ? 10 : 11, fontWeight: value === opt.v ? 600 : 400, cursor: "pointer", fontFamily: F, boxShadow: value === opt.v ? S.card : "none", transition: "all 0.15s" }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Q&A card ──────────────────────────────────────────────────────────────────
function QuestionAnswer({ question, response, index }) {
  const typeLabel = { voice: "음성", multiple_choice: "객관식", likert: "평점" };
  const typeIcon = {
    voice: Ic.Mic,
    multiple_choice: Ic.Check,
    likert: Ic.Star,
  };
  const typeColor = {
    voice: { bg: C.purpleBg, color: C.purple },
    multiple_choice: { bg: "rgba(21,190,83,0.1)", color: C.successText },
    likert: { bg: "rgba(245,158,11,0.1)", color: "#92650a" },
  };
  const tc = typeColor[question.type] ?? { bg: C.bg, color: C.body };
  const TypeIconComp = typeIcon[question.type] ?? Ic.Chat;

  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: S.ambient }}>
      <div style={{ padding: "12px 18px", background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.body, marginTop: 2, flexShrink: 0 }}>Q{index + 1}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "2px 7px", borderRadius: 4, background: tc.bg, color: tc.color, fontWeight: 600 }}>
              {TypeIconComp({ s: 11, c: tc.color })}
              {typeLabel[question.type]}
            </span>
          </div>
          <div style={{ fontSize: 14, color: C.navy, lineHeight: 1.55 }}>{question.content}</div>
        </div>
      </div>
      <div style={{ padding: "14px 18px" }}>
        {!response ? (
          <div style={{ fontSize: 13, color: C.body, fontStyle: "italic" }}>응답 없음</div>
        ) : question.type === "voice" ? (
          <VoiceAnswer response={response} />
        ) : question.type === "multiple_choice" ? (
          <MCAnswer response={response} question={question} />
        ) : (
          <LikertAnswer response={response} question={question} />
        )}
      </div>
    </div>
  );
}

function VoiceAnswer({ response }) {
  return <VoicePlayer audioUrl={response.audio_url} transcript={response.transcript} />;
}

function MCAnswer({ response, question }) {
  const selected = response.value;
  const options = Array.isArray(question.options) ? question.options : [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options.map((opt, i) => {
        const isSelected = opt === selected;
        return (
          <div key={i} style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${isSelected ? C.purple : C.border}`, background: isSelected ? C.purpleBg : "transparent", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${isSelected ? C.purple : C.border}`, background: isSelected ? C.purple : "transparent", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: isSelected ? C.purple : C.navy, fontWeight: isSelected ? 500 : 400 }}>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

function LikertAnswer({ response, question }) {
  const selected = Number(response.value);
  const min = question.options?.min ?? 1;
  const max = question.options?.max ?? 5;
  const labels = question.options?.labels ?? [];
  return (
    <div>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => {
          const isSelected = n === selected;
          return (
            <div key={n} style={{ flex: 1, aspectRatio: "1", borderRadius: 8, border: `2px solid ${isSelected ? C.purple : C.border}`, background: isSelected ? C.purple : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: isSelected ? C.white : C.body }}>
              {n}
            </div>
          );
        })}
      </div>
      {labels.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 10, color: C.body }}>{labels[0]}</span>
          <span style={{ fontSize: 10, color: C.body }}>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}
