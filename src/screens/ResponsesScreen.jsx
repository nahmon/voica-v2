import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, VoicePlayer, Skeleton } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

function FunnelCard({ funnel, compact }) {
  if (!funnel) return null;
  const opened    = funnel.interview_link_opened    || 0;
  const started   = funnel.interview_info_submitted || 0;
  const completed = funnel.interview_completed      || 0;
  const abandoned = funnel.interview_abandoned      || 0;
  if (opened === 0) return null;

  const pct = (n) => opened > 0 ? Math.round(n / opened * 100) : 0;
  const steps = [
    { label: "링크 접속",  count: opened,    color: C.purple },
    { label: "정보 입력",  count: started,   color: "#1a73e8" },
    { label: "완료",       count: completed, color: "#1e8e3e" },
  ];

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderBottom: `1px solid ${C.border}`, background: C.white, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.5, marginRight: 4 }}>참여 깔때기</span>
        {steps.map((s, i) => (
          <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span style={{ color: C.border, fontSize: 10 }}>›</span>}
            <span style={{ fontSize: 11, color: C.navy }}>{s.label} <strong style={{ color: s.color }}>{s.count}</strong></span>
            {i > 0 && <span style={{ fontSize: 10, color: C.body }}>({pct(s.count)}%)</span>}
          </span>
        ))}
        {abandoned > 0 && <span style={{ fontSize: 10, color: "#b45309", marginLeft: 4 }}>이탈 {abandoned}명</span>}
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(26,115,232,0.03)", border: `1px solid rgba(26,115,232,0.12)`, borderRadius: 8, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 12 }}>참여 깔때기</div>
      {steps.map((step) => {
        const p = pct(step.count);
        return (
          <div key={step.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: C.body }}>{step.label}</span>
              <span style={{ fontWeight: 600, color: C.navy }}>{step.count}명 <span style={{ fontWeight: 400, color: C.body }}>({p}%)</span></span>
            </div>
            <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${p}%`, background: step.color, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
      {abandoned > 0 && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#b45309" }}>이탈 {abandoned}명</div>
      )}
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
  const isMobile = useIsMobile();

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

  const responses = selectedSession
    ? allResponses.filter(r => r.session_id === selectedSession.id)
    : [];

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

  const completedCount = sessions.filter(s => s.status === "completed").length;

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
          <FunnelCard funnel={funnel} />
          <div style={{ fontSize: 12, fontWeight: 600, color: C.body, marginBottom: 10, letterSpacing: 0.5 }}>
            응답자 목록 ({sessions.length})
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
          ) : sessions.map((s, i) => {
            const isCompleted = s.status === "completed";
            const dt = s.completed_at
              ? new Date(s.completed_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
              : "진행 중";
            const respCount = allResponses.filter(r => r.session_id === s.id).length;
            return (
              <div key={s.id} onClick={() => setSelectedSession(s)}
                style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: S.ambient }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: isCompleted ? "rgba(21,190,83,0.12)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: isCompleted ? C.successText : "#92650a", flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.navy, marginBottom: 2 }}>응답자 {i + 1}</div>
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
        <Btn size="sm" onClick={() => go("report", interviewId)}>리포트 보기</Btn>
      </div>

      <FunnelCard funnel={funnel} compact />

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: session list */}
        <div style={{ width: 240, borderRight: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "10px 14px 8px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.5, borderBottom: `1px solid ${C.border}` }}>
            응답자 목록 ({sessions.length})
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
            ) : sessions.map((s, i) => {
              const isSelected = selectedSession?.id === s.id;
              const isCompleted = s.status === "completed";
              const dt = s.completed_at
                ? new Date(s.completed_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                : "진행 중";
              return (
                <div key={s.id} onClick={() => setSelectedSession(s)}
                  style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: isSelected ? C.purpleBg : "transparent", borderLeft: `3px solid ${isSelected ? C.purple : "transparent"}`, transition: "background 0.1s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: isCompleted ? "rgba(21,190,83,0.12)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: isCompleted ? C.successText : "#92650a", flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: isSelected ? C.purple : C.navy, fontWeight: isSelected ? 500 : 400 }}>응답자 {i + 1}</div>
                      <div style={{ fontSize: 11, color: isCompleted ? C.successText : "#b45309" }}>{isCompleted ? "완료" : "진행 중"}</div>
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

function QuestionAnswer({ question, response, index }) {
  const typeLabel = { voice: "음성", multiple_choice: "객관식", likert: "평점" };
  const typeColor = {
    voice: { bg: C.purpleBg, color: C.purple },
    multiple_choice: { bg: "rgba(21,190,83,0.1)", color: C.successText },
    likert: { bg: "rgba(245,158,11,0.1)", color: "#92650a" },
  };
  const tc = typeColor[question.type] ?? { bg: C.bg, color: C.body };

  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: S.ambient }}>
      <div style={{ padding: "12px 18px", background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.body, marginTop: 2, flexShrink: 0 }}>Q{index + 1}</span>
        <div style={{ flex: 1 }}>
          <span style={{ display: "inline-block", fontSize: 10, padding: "2px 7px", borderRadius: 4, background: tc.bg, color: tc.color, fontWeight: 600, marginBottom: 5 }}>
            {typeLabel[question.type]}
          </span>
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
