import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav } from "../components/shared.jsx";

export default function ReportScreen({ go, user, logout, interviewId }) {
  const [interview, setInterview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (!interviewId) { setLoading(false); return; }
    (async () => {
      const [ivRes, sessRes, repRes] = await Promise.all([
        supabase.from("interviews").select("id, title, status").eq("id", interviewId).single(),
        supabase.from("sessions")
          .select("id, respondent, status, started_at, completed_at, responses(id, type, transcript, value, audio_url, question_id, questions(content, order_num, type))")
          .eq("interview_id", interviewId)
          .order("started_at", { ascending: false }),
        supabase.from("reports").select("*").eq("interview_id", interviewId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (ivRes.data) setInterview(ivRes.data);
      if (sessRes.data) setSessions(sessRes.data);
      if (repRes.data) setReport(repRes.data);
      setLoading(false);
    })();
  }, [interviewId]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/report/${interviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "리포트 생성 실패");
      setReport({ status: "completed", content: data.content });
    } catch (e) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const completedSessions = sessions.filter(s => s.status === "completed");

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <div style={{ color: C.body }}>불러오는 중...</div>
    </div>
  );

  if (!interviewId) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: F, gap: 16 }}>
      <div style={{ fontSize: 16, color: C.navy }}>인터뷰를 선택해 주세요</div>
      <Btn onClick={() => go("dashboard")}>대시보드로</Btn>
    </div>
  );

  const sentimentColor = { positive: C.success, negative: C.ruby, neutral: C.body };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} variant="app" user={user} logout={logout} />

      {/* Sub nav */}
      <div style={{ padding: "10px 24px", background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
        <div style={{ fontSize: 14, fontWeight: 400, color: C.navy }}>{interview?.title}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Badge variant="neutral">{completedSessions.length}명 완료</Badge>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Left: Sessions list */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 12 }}>응답 목록 ({sessions.length}명)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.length === 0 && (
              <div style={{ background: C.white, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "24px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: C.body }}>아직 응답이 없습니다</div>
              </div>
            )}
            {sessions.map((s, i) => {
              const duration = s.completed_at && s.started_at
                ? Math.round((new Date(s.completed_at) - new Date(s.started_at)) / 60000) + "분"
                : "진행 중";
              const name = s.respondent?.name || `패널 ${i + 1}`;
              return (
                <div key={s.id} onClick={() => setSelectedSession(selectedSession?.id === s.id ? null : s)}
                  style={{ background: C.white, border: `1px solid ${selectedSession?.id === s.id ? C.purple : C.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", boxShadow: S.ambient }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 400, color: C.navy }}>{name}</span>
                    <Badge variant={s.status === "completed" ? "success" : "warning"}>{s.status === "completed" ? "완료" : "진행 중"}</Badge>
                  </div>
                  <div style={{ fontSize: 11, color: C.body }}>{duration} · {(s.responses?.length ?? 0)}개 답변</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Report or session drill-down */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Session detail */}
          {selectedSession && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 24, boxShadow: S.standard }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 400, color: C.navy }}>
                  {selectedSession.respondent?.name || "익명"} 응답 상세
                </div>
                <button onClick={() => setSelectedSession(null)} style={{ background: "none", border: "none", color: C.body, cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(selectedSession.responses ?? [])
                  .sort((a, b) => (a.questions?.order_num ?? 0) - (b.questions?.order_num ?? 0))
                  .map((r, i) => (
                    <div key={r.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
                      <div style={{ fontSize: 12, color: C.body, marginBottom: 4 }}>Q{i + 1} · {r.questions?.content}</div>
                      {r.type === "voice" && (
                        <div>
                          {r.audio_url && (
                            <audio controls src={r.audio_url} style={{ width: "100%", height: 32, marginBottom: 8, borderRadius: 6 }} />
                          )}
                          <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.6 }}>
                            {r.transcript ? <span>"{r.transcript}"</span> : <span style={{ color: C.body, fontStyle: "italic" }}>트랜스크립트 없음</span>}
                          </div>
                        </div>
                      )}
                      {r.type === "multiple_choice" && (
                        <Badge variant="purple">{Array.isArray(r.value) ? r.value.join(", ") : String(r.value ?? "")}</Badge>
                      )}
                      {r.type === "likert" && (
                        <Badge variant="neutral">{r.value}점</Badge>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Report section */}
          {!report && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "32px", textAlign: "center", boxShadow: S.standard }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
              <div style={{ fontSize: 18, fontWeight: 400, color: C.navy, marginBottom: 8 }}>AI 리포트 생성</div>
              <div style={{ fontSize: 13, color: C.body, marginBottom: 24, lineHeight: 1.6 }}>
                완료된 응답 {completedSessions.length}건을 GPT-4o가 분석하여<br />
                테마, 감성, 인사이트를 자동으로 정리합니다.
              </div>
              <Btn onClick={handleGenerateReport} disabled={generating || completedSessions.length === 0}>
                {generating ? "분석 중... (30초~1분 소요)" : "리포트 생성하기 →"}
              </Btn>
              {completedSessions.length === 0 && (
                <div style={{ fontSize: 12, color: C.body, marginTop: 12 }}>완료된 응답이 있어야 리포트를 생성할 수 있습니다</div>
              )}
            </div>
          )}

          {report?.status === "completed" && report.content && (
            <div>
              {/* Summary */}
              <div style={{ background: `linear-gradient(135deg,rgba(83,58,253,0.05),rgba(232,113,10,0.04))`, border: `1px solid rgba(83,58,253,0.1)`, borderRadius: 8, padding: "20px 22px", marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 400, color: C.purple, marginBottom: 10 }}>✦ AI 종합 요약</div>
                <p style={{ margin: 0, fontSize: 15, color: C.navy, lineHeight: 1.7 }}>{report.content.summary}</p>
              </div>

              {/* Themes */}
              {report.content.themes?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 14 }}>발견된 테마</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                    {report.content.themes.map((t, i) => (
                      <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, boxShadow: S.ambient }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <Badge variant={t.sentiment === "positive" ? "success" : t.sentiment === "negative" ? "negative" : "neutral"}>
                            {t.sentiment === "positive" ? "긍정" : t.sentiment === "negative" ? "부정" : "중립"}
                          </Badge>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 400, color: C.navy, marginBottom: 6 }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: C.body, marginBottom: 10 }}>언급 {t.count}회</div>
                        {t.quotes?.[0] && (
                          <div style={{ fontSize: 12, color: C.body, fontStyle: "italic", lineHeight: 1.5, borderLeft: `2px solid ${C.border}`, paddingLeft: 8 }}>"{t.quotes[0]}"</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {report.content.recommendations?.length > 0 && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 22px", boxShadow: S.ambient }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 14 }}>개선 제안</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {report.content.recommendations.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {Ic.CheckCircle({ s: 12, c: C.purple })}
                        </div>
                        <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.6 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Btn variant="ghost" size="sm" onClick={handleGenerateReport} disabled={generating}>
                  {generating ? "재생성 중..." : "리포트 재생성"}
                </Btn>
              </div>
            </div>
          )}

          {report?.status === "failed" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: C.ruby, marginBottom: 12 }}>리포트 생성 실패</div>
              <Btn size="sm" onClick={handleGenerateReport} disabled={generating}>다시 시도</Btn>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
