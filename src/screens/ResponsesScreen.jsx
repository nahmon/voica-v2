import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav } from "../components/shared.jsx";

export default function ResponsesScreen({ go, user, logout, interviewId }) {
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    if (!interviewId) return;
    (async () => {
      const [{ data: iv }, { data: qs }, { data: ss }] = await Promise.all([
        supabase.from("interviews").select("id, title, status").eq("id", interviewId).single(),
        supabase.from("questions").select("*").eq("interview_id", interviewId).order("order_num"),
        supabase.from("sessions").select("id, respondent, status, completed_at, created_at")
          .eq("interview_id", interviewId)
          .order("created_at", { ascending: false }),
      ]);
      setInterview(iv);
      setQuestions(qs ?? []);
      setSessions(ss ?? []);
      if (ss?.length > 0) setSelectedSession(ss[0]);
      setLoading(false);
    })();
  }, [interviewId]);

  useEffect(() => {
    if (!selectedSession) return;
    setLoadingResponses(true);
    (async () => {
      const { data } = await supabase
        .from("responses")
        .select("*")
        .eq("session_id", selectedSession.id);
      setResponses(data ?? []);
      setLoadingResponses(false);
    })();
  }, [selectedSession?.id]);

  if (loading) return (
    <div style={{ fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: C.body, fontSize: 14 }}>
      불러오는 중…
    </div>
  );

  const completedCount = sessions.filter(s => s.status === "completed").length;

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

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: session list */}
        <div style={{ width: 240, borderRight: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "10px 14px 8px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.5, borderBottom: `1px solid ${C.border}` }}>
            응답자 목록 ({sessions.length})
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {sessions.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: C.body, fontSize: 13 }}>
                아직 응답이 없습니다
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
              왼쪽에서 응답자를 선택하세요
            </div>
          ) : loadingResponses ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.body, fontSize: 14 }}>
              불러오는 중…
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
  const typeLabel = { voice: "음성", multiple_choice: "객관식", likert: "리커트" };
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
  return (
    <div>
      {response.audio_url && (
        <div style={{ marginBottom: 12 }}>
          <audio controls src={response.audio_url} style={{ width: "100%", height: 36, outline: "none", borderRadius: 8 }} />
        </div>
      )}
      {response.transcript ? (
        <div style={{ padding: "10px 14px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.body, fontWeight: 600, marginBottom: 6, letterSpacing: 0.4 }}>전사 텍스트</div>
          <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.75 }}>{response.transcript}</div>
        </div>
      ) : !response.audio_url ? (
        <div style={{ fontSize: 13, color: C.body, fontStyle: "italic" }}>녹음 없음</div>
      ) : null}
    </div>
  );
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
