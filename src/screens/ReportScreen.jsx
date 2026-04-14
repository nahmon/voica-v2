import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, VoicePlayer, Footer, Skeleton, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const SECTIONS = [
  { id: "summary", label: "요약" },
  { id: "themes", label: "테마" },
  { id: "recommendations", label: "제안" },
];

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
  const [genStep, setGenStep] = useState(0);
  const genTimerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeSection, setActiveSection] = useState("summary");
  const [voiceOnly, setVoiceOnly] = useState(false);

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

  const GEN_STEPS = [
    { label: "데이터 수집 중", from: 0, to: 4 },
    { label: "AI 분석 중", from: 4, to: 10 },
    { label: "리포트 작성 중", from: 10, to: 20 },
    { label: "완료", from: 20, to: Infinity },
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    setGenElapsed(0);
    setGenStep(0);
    genTimerRef.current = setInterval(() => {
      setGenElapsed(s => {
        const next = s + 1;
        const idx = GEN_STEPS.findIndex(st => next >= st.from && next < st.to);
        setGenStep(idx === -1 ? GEN_STEPS.length - 1 : idx);
        return next;
      });
    }, 1000);
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

  const handleShare = () => {
    const url = `${location.origin}/report/${interviewId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("리포트 링크가 복사되었어요", "success");
    }).catch(() => {
      showToast("링크 복사에 실패했어요", "error");
    });
  };

  const completedSessions = sessions.filter(s => s.status === "completed");

  // Compute key metrics
  const totalSessions = sessions.length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0;
  const avgDurationMin = (() => {
    const timed = completedSessions.filter(s => s.completed_at && s.started_at);
    if (timed.length === 0) return null;
    const avg = timed.reduce((sum, s) => sum + (new Date(s.completed_at) - new Date(s.started_at)), 0) / timed.length;
    return Math.round(avg / 60000);
  })();

  // Sentiment from report themes
  const sentimentDist = (() => {
    const themes = report?.content?.themes ?? [];
    if (themes.length === 0) return null;
    const pos = themes.filter(t => t.sentiment === "positive").length;
    const neg = themes.filter(t => t.sentiment === "negative").length;
    const neu = themes.filter(t => t.sentiment === "neutral").length;
    const total = pos + neg + neu;
    return total > 0 ? {
      positive: Math.round(pos / total * 100),
      neutral: Math.round(neu / total * 100),
      negative: Math.round(neg / total * 100),
    } : null;
  })();

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

  const hasReport = report?.status === "completed" && report.content;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-step { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes step-appear { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-content { max-width: 100% !important; padding: 0 !important; }
          @page { size: A4; margin: 20mm; }
        }
      `}</style>

      <div className="no-print">
        <GlobalNav go={go} variant="app" user={user} logout={logout} />
      </div>

      {/* Sub nav */}
      <div className="no-print" style={{ padding: isMobile ? "8px 16px" : "10px 24px", background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← {isMobile ? "" : "대시보드"}</Btn>
        <div style={{ fontSize: 13, fontWeight: 400, color: C.navy, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{interview?.title}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {hasReport && (
            <Btn variant="ghost" size="sm" onClick={handleShare}>
              {Ic.Clip({ s: 13, c: C.purple })} 공유
            </Btn>
          )}
          <Badge variant="neutral">{completedSessions.length}명 완료</Badge>
        </div>
      </div>

      {/* Summary header card — shown when report exists */}
      {hasReport && (
        <div className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: isMobile ? "14px 16px" : "16px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: isMobile ? 12 : 24, flexWrap: "wrap" }}>
              <MetricCard label="총 응답수" value={`${totalSessions}명`} icon={Ic.Users({ s: 16, c: C.purple })} />
              <MetricCard label="완료율" value={`${completionRate}%`} icon={Ic.CheckCircle({ s: 16, c: C.success })} />
              {avgDurationMin !== null && (
                <MetricCard label="평균 소요 시간" value={`${avgDurationMin}분`} icon={Ic.Target({ s: 16, c: "#1a73e8" })} />
              )}
              {sentimentDist && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: C.body, marginRight: 4 }}>감성 분포</span>
                  <SentimentBadge label="긍정" pct={sentimentDist.positive} color={C.success} />
                  <SentimentBadge label="중립" pct={sentimentDist.neutral} color={C.body} />
                  <SentimentBadge label="부정" pct={sentimentDist.negative} color={C.ruby} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section tabs (mobile) / sticky sidebar (desktop) */}
      {hasReport && isMobile && (
        <div className="no-print" style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 16px", display: "flex", gap: 0, overflowX: "auto" }}>
          {SECTIONS.map(sec => (
            <button key={sec.id} onClick={() => {
              setActiveSection(sec.id);
              document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }} style={{ background: "none", border: "none", borderBottom: `2px solid ${activeSection === sec.id ? C.purple : "transparent"}`, padding: "10px 16px", fontSize: 13, fontWeight: activeSection === sec.id ? 600 : 400, color: activeSection === sec.id ? C.purple : C.body, cursor: "pointer", whiteSpace: "nowrap", fontFamily: F }}>
              {sec.label}
            </button>
          ))}
        </div>
      )}

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px" : "28px 24px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24, alignItems: "flex-start" }}>

        {/* Sticky sidebar (desktop) */}
        {hasReport && !isMobile && (
          <div className="no-print" style={{ width: 160, flexShrink: 0, position: "sticky", top: 24 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 600, color: C.body, borderBottom: `1px solid ${C.border}`, letterSpacing: 0.5 }}>섹션 이동</div>
              {SECTIONS.map(sec => (
                <button key={sec.id} onClick={() => {
                  setActiveSection(sec.id);
                  document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }} style={{ display: "block", width: "100%", background: activeSection === sec.id ? C.purpleBg : "none", border: "none", borderLeft: `3px solid ${activeSection === sec.id ? C.purple : "transparent"}`, padding: "9px 12px", fontSize: 13, fontWeight: activeSection === sec.id ? 500 : 400, color: activeSection === sec.id ? C.purple : C.navy, cursor: "pointer", textAlign: "left", fontFamily: F }}>
                  {sec.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Left: Sessions list (no sidebar) or main area */}
        {!hasReport && (
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
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {allResponses.some(r => r.session_id === s.id && r.audio_url) && (
                          <svg width={10} height={10} viewBox="0 0 16 16" fill={C.purple} title="음성 녹음 있음"><path d="M8 1a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/><path d="M4.5 8a.5.5 0 0 0-1 0 4.5 4.5 0 0 0 9 0 .5.5 0 0 0-1 0A3.5 3.5 0 0 1 8 11.5 3.5 3.5 0 0 1 4.5 8z"/></svg>
                        )}
                        <Badge variant={s.status === "completed" ? "success" : "warning"}>{s.status === "completed" ? "완료" : "진행 중"}</Badge>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.body }}>{duration} · {allResponses.filter(r => r.session_id === s.id).length}개 답변</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right: Report or session drill-down */}
        <div style={{ flex: 1, minWidth: 0 }} className="print-content">

          {/* Session detail */}
          {selectedSession && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 24, boxShadow: S.standard }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: C.navy }}>
                    {selectedSession.respondent?.name || "익명"} 응답 상세
                  </div>
                  <div style={{ fontSize: 11, color: C.body, marginTop: 3 }}>
                    🎙 음성 {allResponses.filter(r => r.session_id === selectedSession.id && r.audio_url).length}개 · 답변 {allResponses.filter(r => r.session_id === selectedSession.id).length}개
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => setVoiceOnly(v => !v)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${voiceOnly ? C.purple : C.border}`, background: voiceOnly ? C.purpleBg : "transparent", color: voiceOnly ? C.purple : C.body, cursor: "pointer", fontFamily: F }}>
                    {voiceOnly ? "전체 보기" : "🎙 음성만"}
                  </button>
                  <button onClick={() => setSelectedSession(null)} style={{ background: "none", border: "none", color: C.body, cursor: "pointer", fontSize: 18 }}>✕</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {questions.filter(q => !voiceOnly || q.type === "voice").map((q, i) => {
                  const r = allResponses.find(r => r.session_id === selectedSession.id && r.question_id === q.id);
                  const isVoiceWithAudio = q.type === "voice" && r?.audio_url;
                  return (
                    <div key={q.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12, background: isVoiceWithAudio ? "rgba(83,58,253,0.03)" : "transparent", borderRadius: isVoiceWithAudio ? 8 : 0, padding: "10px 0" }}>
                      <div style={{ fontSize: 12, color: C.body, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                        {isVoiceWithAudio && <svg width={10} height={10} viewBox="0 0 16 16" fill={C.purple}><path d="M8 1a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/></svg>}
                        Q{questions.indexOf(q) + 1} · {q.content}
                      </div>
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
              {generating ? (
                <GeneratingProgress steps={GEN_STEPS} currentStep={genStep} elapsed={genElapsed} />
              ) : (
                <Btn onClick={handleGenerateReport} disabled={completedSessions.length === 0}>
                  리포트 생성하기 →
                </Btn>
              )}
              {completedSessions.length === 0 && !generating && (
                <div style={{ fontSize: 12, color: C.body, marginTop: 12 }}>완료된 응답이 있으면 리포트를 생성할 수 있어요</div>
              )}
            </div>
          )}

          {hasReport && (
            <div>
              {/* Stats */}
              {report.content.stats && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 22px", marginBottom: 24, boxShadow: S.ambient }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: C.label, marginBottom: 14 }}>응답 통계</div>
                  <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
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
              <div id="section-summary" style={{ background: `linear-gradient(135deg,rgba(83,58,253,0.05),rgba(232,113,10,0.04))`, border: `1px solid rgba(83,58,253,0.1)`, borderRadius: 8, padding: "20px 22px", marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 400, color: C.purple, marginBottom: 10 }}>✦ AI 종합 요약</div>
                <p style={{ margin: 0, fontSize: 15, color: C.navy, lineHeight: 1.7 }}>{report.content.summary}</p>
              </div>

              {/* Themes */}
              {report.content.themes?.length > 0 && (
                <div id="section-themes" style={{ marginBottom: 24 }}>
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
                <div id="section-recommendations" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 22px", boxShadow: S.ambient, marginBottom: 24 }}>
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

              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }} className="no-print">
                <Btn variant="ghost" size="sm" onClick={handleGenerateReport} disabled={generating}>
                  {generating ? "재생성 중..." : "리포트 재생성"}
                </Btn>
                <Btn variant="ghost" size="sm" onClick={handlePrint}>
                  PDF 저장
                </Btn>
                <Btn variant="ghost" size="sm" onClick={handleShare}>
                  리포트 공유
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
      <div className="no-print">
        <Footer go={go} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, minWidth: 120 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, color: C.body, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{value}</div>
      </div>
    </div>
  );
}

function SentimentBadge({ label, pct, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: C.navy }}>{label} <strong style={{ color }}>{pct}%</strong></span>
    </div>
  );
}

function GeneratingProgress({ steps, currentStep, elapsed }) {
  const progress = Math.min((elapsed / 25) * 100, 98);
  return (
    <div style={{ maxWidth: 340, margin: "0 auto" }}>
      {/* Step indicators */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 20 }}>
        {steps.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: isDone ? C.success : isActive ? C.purple : C.border,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.4s",
                  animation: isActive ? "pulse-step 1.6s ease-in-out infinite" : "none",
                }}>
                  {isDone
                    ? Ic.Check({ s: 14, c: "#fff" })
                    : isActive
                      ? <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />
                      : <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.body, opacity: 0.4 }} />
                  }
                </div>
                <span style={{ fontSize: 9, color: isActive ? C.purple : isDone ? C.successText : C.body, fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap", animation: isActive ? "step-appear 0.3s ease" : "none" }}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 32, height: 2, background: isDone ? C.success : C.border, marginBottom: 16, transition: "background 0.4s" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ height: "100%", background: `linear-gradient(90deg,${C.purple},${C.purpleLight})`, borderRadius: 2, width: `${progress}%`, transition: "width 1s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.body }}>
        <span style={{ animation: "pulse-step 1.6s ease-in-out infinite" }}>{steps[currentStep]?.label ?? "완료"}</span>
        <span>{elapsed}초 경과</span>
      </div>

      {/* Spinner */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 16, height: 16, border: `2px solid ${C.purple}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    </div>
  );
}
