import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, VoicePlayer, Footer, Skeleton, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "themes", label: "Themes" },
  { id: "recommendations", label: "Recommendations" },
];

export default function ReportScreen({ go, user, logout, interviewId, lang = "ko", onLangChange }) {
  const isMobile = useIsMobile();
  const isKo = lang === "ko";
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
            .select("id, respondent, status, started_at, completed_at, responses(*)")
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
        setAllResponses(ss.flatMap(s => s.responses ?? []));
      } catch (e) {
        console.error("[ReportScreen load]", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId]);

  const GEN_STEPS = [
    { label: "Collecting data", from: 0, to: 4 },
    { label: "AI analysis", from: 4, to: 10 },
    { label: "Writing report", from: 10, to: 20 },
    { label: "Done", from: 20, to: Infinity },
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
      if (!res.ok) throw new Error(data.error || "Report generation failed");
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
      showToast("Report link copied", "success");
    }).catch(() => {
      showToast("Failed to copy link", "error");
    });
  };

  const completedSessions = sessions.filter(s => s.status === "completed");

  const dk = {
    bg: "#111827", card: "#1a2236", card2: "#1e2947",
    border: "rgba(255,255,255,0.07)", text: "#e2e8f0",
    muted: "rgba(255,255,255,0.5)", dim: "rgba(255,255,255,0.3)", label: "rgba(160,165,200,0.8)",
  };

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

  const ratingDists = (() => {
    const scaleQs = questions.filter(q => q.type === "scale");
    if (scaleQs.length === 0 || allResponses.length === 0) return [];
    return scaleQs.map(q => {
      const min = q.options?.min ?? 1;
      const max = q.options?.max ?? 5;
      const resps = allResponses.filter(r => r.question_id === q.id && r.value != null);
      const dist = {};
      for (let n = min; n <= max; n++) dist[n] = 0;
      resps.forEach(r => { const v = Number(r.value); if (v >= min && v <= max) dist[v]++; });
      const maxCount = Math.max(...Object.values(dist), 1);
      const avg = resps.length > 0
        ? (resps.reduce((s, r) => s + Number(r.value), 0) / resps.length).toFixed(1)
        : null;
      return { question: q, dist, min, max, maxCount, avg, total: resps.length };
    }).filter(d => d.total > 0);
  })();

  if (loading) return (
    <div style={{ minHeight: "100vh", background: dk.bg, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#7c6af7", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 14, color: dk.muted }}>{isKo ? "리포트 불러오는 중..." : "Loading report..."}</div>
    </div>
  );

  if (!interviewId) return (
    <div style={{ minHeight: "100vh", background: dk.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: F, gap: 16 }}>
      <div style={{ fontSize: 16, color: dk.text }}>{isKo ? "인터뷰를 선택해주세요" : "Please select an interview"}</div>
      <Btn onClick={() => go("dashboard")}>{isKo ? "대시보드로" : "Go to dashboard"}</Btn>
    </div>
  );

  const hasReport = report?.status === "completed" && report.content;

  const dateRange = (() => {
    const starts = sessions.map(s => new Date(s.started_at)).filter(d => !isNaN(d));
    const ends = sessions.map(s => s.completed_at && new Date(s.completed_at)).filter(Boolean).filter(d => !isNaN(d));
    if (starts.length === 0) return null;
    const minDate = new Date(Math.min(...starts));
    const maxDate = ends.length > 0 ? new Date(Math.max(...ends)) : new Date();
    const fmt = d => d.toLocaleDateString(isKo ? "ko-KR" : "en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${fmt(minDate)} – ${fmt(maxDate)}`;
  })();

  return (
    <div style={{ background: dk.bg, minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column" }}>
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

      {/* Top bar */}
      <div className="no-print" style={{ background: dk.card, borderBottom: `1px solid ${dk.border}`, padding: isMobile ? "0 16px" : "0 32px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: "white" }} />
          </div>
          <span style={{ fontSize: 13, color: dk.muted }}>voicesurvey</span>
          <span style={{ color: dk.border }}>/</span>
          <span style={{ fontSize: 13, color: dk.muted }}>{isKo ? "리포트" : "Reports"}</span>
          {interview?.title && !isMobile && (
            <>
              <span style={{ color: dk.border }}>·</span>
              <span style={{ fontSize: 13, color: dk.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>{interview.title}</span>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => go("dashboard")} style={{ background: "none", border: "none", padding: "6px 10px", color: dk.muted, fontSize: 13, cursor: "pointer", fontFamily: F }}>
            ← {isMobile ? "" : (isKo ? "대시보드" : "Dashboard")}
          </button>
          {hasReport && (
            <>
              <button onClick={handleShare} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${dk.border}`, background: "none", color: dk.text, fontSize: 13, cursor: "pointer", fontFamily: F }}>
                {isKo ? "공유" : "Share"}
              </button>
              <button onClick={handlePrint} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: C.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: F }}>
                {isKo ? "내보내기 →" : "Export →"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header card */}
      {hasReport && (
        <div style={{ background: dk.card, borderBottom: `1px solid ${dk.border}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "24px 16px 20px" : "32px 32px 28px" }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(110,75,255,0.15)", border: "1px solid rgba(110,75,255,0.25)", fontSize: 12, color: "#a78bff" }}>
                <span>✦</span>
                {isKo ? "AI 분석 완료" : "AI analysis complete"}
                <span style={{ color: dk.border }}>·</span>
                <span style={{ color: dk.muted }}>{completedSessions.length} {isKo ? "명 응답" : "respondents"}</span>
              </span>
            </div>
            <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, color: dk.text, marginBottom: 8, lineHeight: 1.2 }}>{interview?.title}</div>
            {dateRange && <div style={{ fontSize: 13, color: dk.muted, marginBottom: 24 }}>{dateRange}</div>}
            <div style={{ height: 1, background: dk.border, marginBottom: 24 }} />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 20 : 0 }}>
              {[
                { label: isKo ? "응답자" : "RESPONDENTS", value: String(totalSessions), color: dk.text },
                { label: isKo ? "평균 소요 시간" : "AVG DURATION", value: avgDurationMin !== null ? (isKo ? `${avgDurationMin}분` : `${avgDurationMin}m`) : "—", color: dk.text },
                { label: isKo ? "완료율" : "COMPLETION", value: `${completionRate}%`, color: completionRate >= 80 ? C.success : dk.text },
                { label: isKo ? "주제" : "THEMES", value: String(report.content.themes?.length ?? 0), color: C.purple },
              ].map((m, i) => (
                <div key={i} style={{ paddingRight: isMobile ? 0 : 32, borderRight: (!isMobile && i < 3) ? `1px solid ${dk.border}` : "none", paddingLeft: (!isMobile && i > 0) ? 32 : 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: dk.muted, letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>{m.label}</div>
                  <div style={{ fontSize: 34, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px" : "28px 32px", flex: 1, width: "100%" }} className="print-content">

        {/* No report CTA */}
        {!report && (
          <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "40px 32px", textAlign: "center", marginTop: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 16, color: C.purple }}>✦</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: dk.text, marginBottom: 8 }}>{isKo ? "AI 리포트 생성" : "Generate AI Report"}</div>
            <div style={{ fontSize: 13, color: dk.muted, marginBottom: 24, lineHeight: 1.7 }}>
              {isKo
                ? <>완료된 응답 {completedSessions.length}개를 AI가 분석해<br />주제, 감정, 인사이트를 자동으로 추출해드려요.</>
                : <>AI will analyze {completedSessions.length} completed responses<br />and automatically extract themes, sentiment, and insights.</>}
            </div>
            {generating ? (
              <GeneratingProgress steps={GEN_STEPS} currentStep={genStep} elapsed={genElapsed} />
            ) : (
              <Btn onClick={handleGenerateReport} disabled={completedSessions.length === 0} style={completedSessions.length === 0 ? { background: "rgba(110,75,255,0.3)", color: "rgba(255,255,255,0.4)", cursor: "not-allowed" } : {}}>
                {isKo ? "리포트 생성 →" : "Generate Report →"}
              </Btn>
            )}
            {completedSessions.length === 0 && !generating && (
              <div style={{ fontSize: 12, color: dk.muted, marginTop: 12 }}>{isKo ? "완료된 응답이 1개 이상 있어야 리포트를 생성할 수 있어요" : "You need at least 1 completed response to generate a report"}</div>
            )}
          </div>
        )}

        {hasReport && (
          <>
            {/* Key insights — top 3 themes as numbered insights */}
            {report.content.themes?.length > 0 && (
              <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: isMobile ? "20px 16px" : "28px 32px", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: dk.text, marginBottom: 24 }}>{isKo ? "핵심 인사이트" : "Key insights"}</div>
                {report.content.themes.slice(0, 3).map((theme, i) => (
                  <div key={i} style={{ display: "flex", gap: 24, paddingBottom: i < 2 ? 24 : 0, marginBottom: i < 2 ? 24 : 0, borderBottom: i < 2 ? `1px solid ${dk.border}` : "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, flexShrink: 0, width: 24, paddingTop: 1 }}>0{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: dk.text, marginBottom: theme.quotes?.[0] ? 6 : 0 }}>{theme.label}</div>
                      {theme.quotes?.[0] && (
                        <div style={{ fontSize: 13, color: dk.muted, lineHeight: 1.6 }}>{theme.quotes[0]}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI summary (fallback if no themes) */}
            {!report.content.themes?.length && report.content.summary && (
              <div style={{ background: "linear-gradient(135deg,rgba(83,58,253,0.12),rgba(83,58,253,0.05))", border: "1px solid rgba(83,58,253,0.2)", borderRadius: 12, padding: "24px 28px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.purple, marginBottom: 10 }}>✦ {isKo ? "AI 요약" : "AI Summary"}</div>
                <p style={{ margin: 0, fontSize: 15, color: dk.text, lineHeight: 1.7 }}>{report.content.summary}</p>
              </div>
            )}

            {/* Sentiment + Theme clusters */}
            {(sentimentDist || report.content.themes?.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {sentimentDist && (
                  <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "24px 28px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: dk.text, marginBottom: 20 }}>{isKo ? "감정 분포" : "Sentiment distribution"}</div>
                    <div style={{ display: "flex", height: 28, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                      {sentimentDist.positive > 0 && (
                        <div style={{ width: `${sentimentDist.positive}%`, background: C.success, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", padding: "0 4px" }}>
                            {isKo ? "긍정" : "Positive"} {sentimentDist.positive}%
                          </span>
                        </div>
                      )}
                      {sentimentDist.neutral > 0 && (
                        <div style={{ width: `${sentimentDist.neutral}%`, background: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 11, color: "#fff", whiteSpace: "nowrap", padding: "0 4px" }}>
                            {isKo ? "중립" : "Neutral"} {sentimentDist.neutral}%
                          </span>
                        </div>
                      )}
                      {sentimentDist.negative > 0 && (
                        <div style={{ width: `${sentimentDist.negative}%`, background: C.ruby, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 11, color: "#fff", whiteSpace: "nowrap", padding: "0 4px" }}>
                            {isKo ? "부정" : "Negative"} {sentimentDist.negative}%
                          </span>
                        </div>
                      )}
                    </div>
                    {report.content.summary && (
                      <div style={{ fontSize: 12, color: dk.muted, lineHeight: 1.6 }}>
                        {report.content.summary.slice(0, 160)}{report.content.summary.length > 160 ? "..." : ""}
                      </div>
                    )}
                  </div>
                )}
                {report.content.themes?.length > 0 && (
                  <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "24px 28px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: dk.text, marginBottom: 20 }}>{isKo ? "주제 클러스터" : "Theme clusters"}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {report.content.themes.map((theme, i) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: dk.card2, border: `1px solid ${dk.border}`, fontSize: 12, color: dk.text }}>
                          {theme.label}
                          <span style={{ fontSize: 11, fontWeight: 600, color: dk.muted }}>{theme.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Voice quotes — per question */}
            {(() => {
              const questionsWithQuotes = questions
                .filter(q => q.type !== "scale")
                .map(q => {
                  const resps = allResponses
                    .filter(r => r.question_id === q.id && r.transcript && r.transcript.trim().length > 20)
                    .sort((a, b) => b.transcript.length - a.transcript.length)
                    .slice(0, 3);
                  return { q, resps };
                })
                .filter(({ resps }) => resps.length > 0);
              if (questionsWithQuotes.length === 0) return null;
              return (
                <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: isMobile ? "20px 16px" : "28px 32px", marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: dk.text, marginBottom: 24 }}>
                    {isKo ? "문항별 실제 발언" : "Quotes by Question"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    {questionsWithQuotes.map(({ q, resps }, qi) => (
                      <div key={q.id}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: C.purple, background: "rgba(110,75,255,0.12)", borderRadius: 5, padding: "2px 7px", marginTop: 1 }}>Q{qi + 1}</span>
                          <span style={{ fontSize: 13, color: dk.label, lineHeight: 1.55, fontWeight: 500 }}>{q.content}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : resps.length === 1 ? "1fr" : "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
                          {resps.map((r, i) => {
                            const session = sessions.find(s => s.id === r.session_id);
                            const sIdx = sessions.indexOf(session);
                            const name = session?.respondent?.name || (isKo ? `응답자 ${sIdx + 1}` : `Respondent ${sIdx + 1}`);
                            const isBest = i === 0;
                            return (
                              <div key={r.id || i} style={{ background: dk.card2, border: `1px solid ${isBest ? "rgba(110,75,255,0.25)" : dk.border}`, borderRadius: 10, padding: "14px 16px", position: "relative" }}>
                                {isBest && (
                                  <span style={{ position: "absolute", top: 10, right: 12, fontSize: 9, fontWeight: 700, color: C.purple, background: "rgba(110,75,255,0.12)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>
                                    {isKo ? "대표" : "TOP"}
                                  </span>
                                )}
                                <div style={{ fontSize: 22, color: C.purple, lineHeight: 1, marginBottom: 6, opacity: 0.35, fontFamily: "Georgia, serif" }}>"</div>
                                <div style={{ fontSize: 13, color: dk.text, lineHeight: 1.7, marginBottom: 10 }}>
                                  {r.transcript.length > 220 ? r.transcript.slice(0, 220) + "..." : r.transcript}
                                </div>
                                <div style={{ fontSize: 11, color: dk.muted }}>— {name}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Rating distributions */}
            {ratingDists.length > 0 && (
              <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: dk.text, marginBottom: 16 }}>{isKo ? "평점 분포" : "Rating Distribution"}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {ratingDists.map(({ question: q, dist, min, max, maxCount, avg, total }) => (
                    <div key={q.id}>
                      <div style={{ fontSize: 12, color: dk.muted, marginBottom: 12, lineHeight: 1.5 }}>{q.content}</div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                        {Array.from({ length: max - min + 1 }, (_, k) => k + min).map(n => {
                          const count = dist[n] ?? 0;
                          const barH = Math.round(count / maxCount * 44);
                          return (
                            <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                              <div style={{ fontSize: 10, color: count > 0 ? dk.text : "transparent" }}>{count}</div>
                              <div style={{ width: "100%", height: barH || 2, background: count > 0 ? C.purple : dk.border, borderRadius: "2px 2px 0 0", opacity: count > 0 ? 0.35 + (count / maxCount) * 0.65 : 1 }} />
                              <div style={{ fontSize: 11, color: dk.muted }}>{n}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 11, color: dk.muted, marginTop: 8 }}>{isKo ? `평균 ${avg} · ${total}개 응답` : `Avg ${avg} · ${total} responses`}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.content.recommendations?.length > 0 && (
              <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: dk.text, marginBottom: 16 }}>{isKo ? "인사이트 & 제안" : "Insights & Recommendations"}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {report.content.recommendations.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(110,75,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        {Ic.CheckCircle({ s: 12, c: C.purple })}
                      </div>
                      <span style={{ fontSize: 13, color: dk.text, lineHeight: 1.6 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8 }} className="no-print">
              <Btn variant="ghost" size="sm" onClick={handleGenerateReport} disabled={generating} style={{ color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.2)" }}>
                {generating ? (isKo ? "재생성 중..." : "Regenerating...") : (isKo ? "리포트 재생성" : "Regenerate")}
              </Btn>
              <Btn variant="ghost" size="sm" onClick={handlePrint} style={{ color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.2)" }}>
                {isKo ? "PDF 저장" : "Save PDF"}
              </Btn>
              <Btn variant="ghost" size="sm" onClick={handleShare} style={{ color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.2)" }}>
                {isKo ? "리포트 공유" : "Share Report"}
              </Btn>
            </div>
          </>
        )}

        {report?.status === "failed" && (
          <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: C.ruby, marginBottom: 12 }}>{isKo ? "리포트 생성에 실패했어요" : "Report generation failed"}</div>
            <Btn size="sm" onClick={handleGenerateReport} disabled={generating}>{isKo ? "다시 시도" : "Try Again"}</Btn>
          </div>
        )}
      </main>
      <div className="no-print">
        <Footer go={go} lang={lang} onLangChange={onLangChange} />
      </div>
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
        <span style={{ animation: "pulse-step 1.6s ease-in-out infinite" }}>{steps[currentStep]?.label ?? "Done"}</span>
        <span>{elapsed}s elapsed</span>
      </div>

      {/* Spinner */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 16, height: 16, border: `2px solid ${C.purple}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    </div>
  );
}
