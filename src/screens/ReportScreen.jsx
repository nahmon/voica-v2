import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, VoicePlayer, Footer, Skeleton, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function ReportScreen({ go, user, logout, interviewId }) {
  const isMobile = useIsMobile();
  const { showToast } = useToast();
  const [interview, setInterview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [allResponses, setAllResponses] = useState([]);
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genElapsed, setGenElapsed] = useState(0);
  const genTimerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (!interviewId) { setLoading(false); return; }
    (async () => {
      try {
        const [ivRes, sessRes, qsRes, repRes] = await Promise.all([
          supabase.from("interviews").select("id, title, status").eq("id", interviewId).single(),
          supabase.from("sessions")
            .select("id, respondent, status, started_at, completed_at")
            .eq("interview_id", interviewId)
            .order("started_at", { ascending: false }),
          supabase.from("questions").select("*").eq("interview_id", interviewId).order("order_num"),
          supabase.from("reports").select("*").eq("interview_id", interviewId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (ivRes.data) setInterview(ivRes.data);
        if (qsRes.data) setQuestions(qsRes.data);
        if (repRes.data) setReport(repRes.data);

        const ss = sessRes.data ?? [];
        setSessions(ss);

        if (ss.length > 0) {
          const sessionIds = ss.map(s => s.id);
          const { data: resp } = await supabase
            .from("responses").select("*").in("session_id", sessionIds);
          setAllResponses(resp ?? []);
        }
      } catch (e) {
        console.error("[ReportScreen load]", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    setGenElapsed(0);
    genTimerRef.current = setInterval(() => setGenElapsed(s => s + 1), 1000);
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
      showToast(e.message, "error");
    } finally {
      clearInterval(genTimerRef.current);
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  const completedSessions = sessions.filter(s => s.status === "completed");

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <Skeleton width={220} height={28} borderRadius={8} style={{ marginBottom: 8 }} />
        <Skeleton width={160} height={16} borderRadius={6} style={{ marginBottom: 32 }} />
        <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px" }}>
          <Skeleton width="100%" height={20} borderRadius={6} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={16} borderRadius={6} />
        </div>
      </div>
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
      <div style={{ padding: isMobile ? "8px 16px" : "10px 24px", background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← {isMobile ? "" : "대시보드"}</Btn>
        <div style={{ fontSize: 13, fontWeight: 400, color: C.navy, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{interview?.title}</div>
        <Badge variant="neutral">{completedSessions.length}명 완료</Badge>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px" : "28px 24px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24, alignItems: "flex-start" }}>

        {/* Left: Sessions list */}
        <div style={{ width: isMobile ? "100%" : 280, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 12 }}>응답 목록 ({sessions.length}명)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.length === 0 && (
              <div style={{ background: C.white, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "24px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: C.body }}>아직 응답이 없어요</div>
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
                  <div style={{ fontSize: 11, color: C.body }}>{duration} · {allResponses.filter(r => r.session_id === s.id).length}개 답변</div>
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
                {questions.map((q, i) => {
                  const r = allResponses.find(r => r.session_id === selectedSession.id && r.question_id === q.id);
                  return (
                    <div key={q.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
                      <div style={{ fontSize: 12, color: C.body, marginBottom: 6 }}>Q{i + 1} · {q.content}</div>
                      {!r ? (
                        <span style={{ fontSize: 12, color: C.body, fontStyle: "italic" }}>응답 없음</span>
                      ) : q.type === "voice" ? (
                        <VoicePlayer audioUrl={r.audio_url} transcript={r.transcript} />
                      ) : q.type === "multiple_choice" ? (
                        <div style={{ padding: "6px 12px", borderRadius: 6, background: C.purpleBg, border: `1px solid ${C.purple}20`, display: "inline-block" }}>
                          <span style={{ fontSize: 13, color: C.purple, fontWeight: 500 }}>
                            {Array.isArray(r.value) ? r.value.join(", ") : String(r.value ?? "")}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          {Array.from({ length: (q.options?.max ?? 5) - (q.options?.min ?? 1) + 1 }, (_, k) => k + (q.options?.min ?? 1)).map(n => {
                            const sel = n === Number(r.value);
                            return (
                              <div key={n} style={{ width: 32, height: 32, borderRadius: 6, border: `2px solid ${sel ? C.purple : C.border}`, background: sel ? C.purple : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: sel ? C.white : C.body }}>
                                {n}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                테마, 감성, 인사이트를 자동으로 정리해요.
              </div>
              {generating ? (() => {
                const steps = [
                  { label: "응답 데이터 수집 중", from: 0, to: 3 },
                  { label: "AI 분석 중", from: 3, to: 8 },
                  { label: "테마 분류 중", from: 8, to: 15 },
                  { label: "인사이트 리포트 작성 중", from: 15, to: Infinity },
                ];
                const currentStep = steps.findIndex(s => genElapsed >= s.from && genElapsed < s.to);
                const stepIdx = currentStep === -1 ? steps.length - 1 : currentStep;
                const progress = Math.min((genElapsed / 25) * 100, 98);
                return (
                  <div style={{ maxWidth: 300, margin: "0 auto" }}>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse-step{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, justifyContent: "center" }}>
                      <div style={{ width: 16, height: 16, border: `2px solid ${C.purple}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: C.navy, animation: "pulse-step 1.6s ease-in-out infinite" }}>{steps[stepIdx].label}</span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ height: "100%", background: `linear-gradient(90deg,${C.purple},${C.purpleLight})`, borderRadius: 2, width: `${progress}%`, transition: "width 1s ease" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.body }}>
                      <span>{steps.map((s, i) => i <= stepIdx ? "●" : "○").join(" ")}</span>
                      <span>{genElapsed}초 경과</span>
                    </div>
                  </div>
                );
              })() : (
                <Btn onClick={handleGenerateReport} disabled={completedSessions.length === 0}>
                  리포트 생성하기 →
                </Btn>
              )}
              {completedSessions.length === 0 && !generating && (
                <div style={{ fontSize: 12, color: C.body, marginTop: 12 }}>완료된 응답이 있으면 리포트를 생성할 수 있어요</div>
              )}
            </div>
          )}

          {report?.status === "completed" && report.content && (
            <div>
              {/* Stats */}
              {report.content.stats && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 22px", marginBottom: 24, boxShadow: S.ambient }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 14 }}>응답 통계</div>
                  <div style={{ display: "flex", gap: 32 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.body, marginBottom: 4 }}>총 응답수</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: C.navy }}>{report.content.stats.total_responses}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.body, marginBottom: 4 }}>평균 완료 시간</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: C.navy }}>{report.content.stats.avg_completion_time}</div>
                    </div>
                  </div>
                </div>
              )}

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
                <Btn variant="ghost" size="sm" onClick={handlePrint}>
                  PDF 저장
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
      <Footer go={go} />
    </div>
  );
}
