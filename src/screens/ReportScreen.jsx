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

export default function ReportScreen({ go, user, logout, interviewId }) {
  const isMobile = useIsMobile();
  const [lang, setLang] = useState("ko");
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
    bg: "#0b0f1c", card: "#141927", card2: "#1a2035",
    border: "rgba(255,255,255,0.07)", text: "#e8eaf4",
    muted: "rgba(180,185,215,0.65)", label: "rgba(160,165,200,0.8)",
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
    <div style={{ minHeight: "100vh", background: dk.bg, fontFamily: F }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <Skeleton width={220} height={28} borderRadius={8} style={{ marginBottom: 8 }} />
        <Skeleton width={160} height={16} borderRadius={6} style={{ marginBottom: 32 }} />
        <div style={{ background: dk.card, borderRadius: 16, padding: "28px 24px" }}>
          <Skeleton width="100%" height={20} borderRadius={6} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={16} borderRadius={6} />
        </div>
      </div>
    </div>
  );

  if (!interviewId) return (
    <div style={{ minHeight: "100vh", background: dk.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: F, gap: 16 }}>
      <div style={{ fontSize: 16, color: dk.text }}>Please select an interview</div>
      <Btn onClick={() => go("dashboard")}>Go to dashboard</Btn>
    </div>
  );

  const hasReport = report?.status === "completed" && report.content;

  return (
    <div style={{ background: dk.bg, minHeight: "100vh", fontFamily: F }}>
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
        <GlobalNav go={go} variant="app" user={user} logout={logout} lang={lang} />
      </div>

      {/* Sub nav */}
      <div className="no-print" style={{ padding: isMobile ? "8px 16px" : "10px 24px", background: dk.card, borderBottom: `1px solid ${dk.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← {isMobile ? "" : "Dashboard"}</Btn>
        <div style={{ fontSize: 13, fontWeight: 400, color: dk.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{interview?.title}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {hasReport && (
            <Btn variant="ghost" size="sm" onClick={handleShare}>
              {Ic.Clip({ s: 13, c: C.purple })} Share
            </Btn>
          )}
          <Badge variant="neutral">{completedSessions.length} completed</Badge>
        </div>
      </div>

      {/* Summary header card — shown when report exists */}
      {hasReport && (
        <div className="no-print" style={{ background: dk.card, borderBottom: `1px solid ${dk.border}`, padding: isMobile ? "14px 16px" : "16px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: isMobile ? 12 : 24, flexWrap: "wrap" }}>
              <MetricCard label="Total responses" value={`${totalSessions}`} icon={Ic.Users({ s: 16, c: C.purple })} />
              <MetricCard label="Completion rate" value={`${completionRate}%`} icon={Ic.CheckCircle({ s: 16, c: C.success })} />
              {avgDurationMin !== null && (
                <MetricCard label="Avg. time to complete" value={`${avgDurationMin} min`} icon={Ic.Target({ s: 16, c: "#1a73e8" })} />
              )}
              {sentimentDist && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 14px", background: dk.card2, borderRadius: 10, border: `1px solid ${dk.border}`, minWidth: 220 }}>
                  <span style={{ fontSize: 11, color: dk.muted }}>Sentiment distribution</span>
                  <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${sentimentDist.positive}%`, background: C.success }} />
                    <div style={{ width: `${sentimentDist.neutral}%`, background: "#d0d0d8" }} />
                    <div style={{ width: `${sentimentDist.negative}%`, background: C.ruby }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                    <span style={{ color: C.success }}>Positive {sentimentDist.positive}%</span>
                    <span style={{ color: dk.muted }}>Neutral {sentimentDist.neutral}%</span>
                    <span style={{ color: C.ruby }}>Negative {sentimentDist.negative}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section tabs (mobile) / sticky sidebar (desktop) */}
      {hasReport && isMobile && (
        <div className="no-print" style={{ background: dk.card, borderBottom: `1px solid ${dk.border}`, padding: "0 16px", display: "flex", gap: 0, overflowX: "auto" }}>
          {SECTIONS.map(sec => (
            <button key={sec.id} onClick={() => {
              setActiveSection(sec.id);
              document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }} style={{ background: "none", border: "none", borderBottom: `2px solid ${activeSection === sec.id ? C.purple : "transparent"}`, padding: "10px 16px", fontSize: 13, fontWeight: activeSection === sec.id ? 600 : 400, color: activeSection === sec.id ? C.purple : dk.muted, cursor: "pointer", whiteSpace: "nowrap", fontFamily: F }}>
              {sec.label}
            </button>
          ))}
        </div>
      )}

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px" : "28px 24px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24, alignItems: "flex-start" }}>

        {/* Sticky sidebar (desktop) */}
        {hasReport && !isMobile && (
          <div className="no-print" style={{ width: 160, flexShrink: 0, position: "sticky", top: 24 }}>
            <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 600, color: dk.muted, borderBottom: `1px solid ${dk.border}`, letterSpacing: 0.5 }}>Jump to section</div>
              {SECTIONS.map(sec => (
                <button key={sec.id} onClick={() => {
                  setActiveSection(sec.id);
                  document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }} style={{ display: "block", width: "100%", background: activeSection === sec.id ? C.purpleBg : "none", border: "none", borderLeft: `3px solid ${activeSection === sec.id ? C.purple : "transparent"}`, padding: "9px 12px", fontSize: 13, fontWeight: activeSection === sec.id ? 500 : 400, color: activeSection === sec.id ? C.purple : dk.text, cursor: "pointer", textAlign: "left", fontFamily: F }}>
                  {sec.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Left: Sessions list (no sidebar) or main area */}
        {!hasReport && (
          <div style={{ width: isMobile ? "100%" : 280, flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 400, color: dk.label, marginBottom: 12 }}>Responses ({sessions.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessions.length === 0 && (
                <div style={{ background: dk.card, border: `1px dashed ${dk.border}`, borderRadius: 8, padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: dk.muted }}>No responses yet</div>
                </div>
              )}
              {sessions.map((s, i) => {
                const duration = s.completed_at && s.started_at
                  ? Math.round((new Date(s.completed_at) - new Date(s.started_at)) / 60000) + " min"
                  : "In progress";
                const name = s.respondent?.name || `Respondent ${i + 1}`;
                return (
                  <div key={s.id} onClick={() => setSelectedSession(selectedSession?.id === s.id ? null : s)}
                    style={{ background: dk.card, border: `1px solid ${selectedSession?.id === s.id ? C.purple : dk.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 400, color: dk.text }}>{name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {allResponses.some(r => r.session_id === s.id && r.audio_url) && (
                          <svg width={10} height={10} viewBox="0 0 16 16" fill={C.purple} title="Has voice recording"><path d="M8 1a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/><path d="M4.5 8a.5.5 0 0 0-1 0 4.5 4.5 0 0 0 9 0 .5.5 0 0 0-1 0A3.5 3.5 0 0 1 8 11.5 3.5 3.5 0 0 1 4.5 8z"/></svg>
                        )}
                        <Badge variant={s.status === "completed" ? "success" : "warning"}>{s.status === "completed" ? "Completed" : "In progress"}</Badge>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: dk.muted }}>{duration} · {allResponses.filter(r => r.session_id === s.id).length} responses</div>
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
            <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: dk.text }}>
                    {selectedSession.respondent?.name || "Anonymous"} — Response detail
                  </div>
                  <div style={{ fontSize: 11, color: dk.muted, marginTop: 3 }}>
                    {allResponses.filter(r => r.session_id === selectedSession.id && r.audio_url).length} voice · {allResponses.filter(r => r.session_id === selectedSession.id).length} responses
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => setVoiceOnly(v => !v)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${voiceOnly ? C.purple : dk.border}`, background: voiceOnly ? C.purpleBg : "transparent", color: voiceOnly ? C.purple : dk.muted, cursor: "pointer", fontFamily: F }}>
                    {voiceOnly ? "Show all" : "Voice only"}
                  </button>
                  <button onClick={() => setSelectedSession(null)} style={{ background: "none", border: "none", color: dk.muted, cursor: "pointer", fontSize: 18 }}>✕</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {questions.filter(q => !voiceOnly || q.type === "voice").map((q, i) => {
                  const r = allResponses.find(r => r.session_id === selectedSession.id && r.question_id === q.id);
                  const isVoiceWithAudio = q.type === "voice" && r?.audio_url;
                  return (
                    <div key={q.id} style={{ borderBottom: `1px solid ${dk.border}`, paddingBottom: 12, background: isVoiceWithAudio ? "rgba(83,58,253,0.08)" : "transparent", borderRadius: isVoiceWithAudio ? 8 : 0, padding: "10px 0" }}>
                      <div style={{ fontSize: 12, color: dk.muted, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                        {isVoiceWithAudio && <svg width={10} height={10} viewBox="0 0 16 16" fill={C.purple}><path d="M8 1a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/></svg>}
                        Q{questions.indexOf(q) + 1} · {q.content}
                      </div>
                      {!r ? (
                        <span style={{ fontSize: 12, color: dk.muted, fontStyle: "italic" }}>No response</span>
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
                              <div key={n} style={{ width: 32, height: 32, borderRadius: 6, border: `2px solid ${sel ? C.purple : dk.border}`, background: sel ? C.purple : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: sel ? "#fff" : dk.muted }}>
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
            <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
              <div style={{ fontSize: 18, fontWeight: 400, color: dk.text, marginBottom: 8 }}>Generate AI Report</div>
              <div style={{ fontSize: 13, color: dk.muted, marginBottom: 24, lineHeight: 1.6 }}>
                GPT-4o will analyze {completedSessions.length} completed response{completedSessions.length !== 1 ? "s" : ""} and<br />
                automatically identify themes, sentiment, and insights.
              </div>
              {generating ? (
                <GeneratingProgress steps={GEN_STEPS} currentStep={genStep} elapsed={genElapsed} />
              ) : (
                <Btn onClick={handleGenerateReport} disabled={completedSessions.length === 0}>
                  Generate report →
                </Btn>
              )}
              {completedSessions.length === 0 && !generating && (
                <div style={{ fontSize: 12, color: dk.muted, marginTop: 12 }}>You need at least one completed response to generate a report</div>
              )}
            </div>
          )}

          {hasReport && (
            <div>
              {/* Stats */}
              {report.content.stats && (
                <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 8, padding: "20px 22px", marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: dk.label, marginBottom: 14 }}>Response stats</div>
                  <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 11, color: dk.muted, marginBottom: 4 }}>Total responses</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: dk.text }}>{report.content.stats.total_responses}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: dk.muted, marginBottom: 4 }}>Avg. completion time</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: dk.text }}>{report.content.stats.avg_completion_time}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating distributions */}
              {ratingDists.length > 0 && (
                <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 8, padding: "20px 22px", marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: dk.label, marginBottom: 16 }}>Rating distribution</div>
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
                        <div style={{ fontSize: 11, color: dk.muted, marginTop: 8 }}>Avg. {avg} · {total} responses</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div id="section-summary" style={{ background: `linear-gradient(135deg,rgba(83,58,253,0.12),rgba(83,58,253,0.05))`, border: `1px solid rgba(83,58,253,0.2)`, borderRadius: 8, padding: "20px 22px", marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 400, color: C.purple, marginBottom: 10 }}>✦ AI Summary</div>
                <p style={{ margin: 0, fontSize: 15, color: dk.text, lineHeight: 1.7 }}>{report.content.summary}</p>
              </div>

              {/* Themes */}
              {report.content.themes?.length > 0 && (
                <div id="section-themes" style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: dk.label, marginBottom: 14 }}>Discovered themes</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                    {(() => {
                      const maxCount = Math.max(...report.content.themes.map(t => t.count ?? 0), 1);
                      return report.content.themes.map((t, i) => (
                        <div key={i} style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 8, padding: 18 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <Badge variant={t.sentiment === "positive" ? "success" : t.sentiment === "negative" ? "negative" : "dark"}>
                              {t.sentiment === "positive" ? "Positive" : t.sentiment === "negative" ? "Negative" : "Neutral"}
                            </Badge>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 400, color: dk.text, marginBottom: 8 }}>{t.label}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <div style={{ flex: 1, height: 4, borderRadius: 2, background: dk.border, overflow: "hidden" }}>
                              <div style={{ width: `${Math.round((t.count ?? 0) / maxCount * 100)}%`, height: "100%", background: t.sentiment === "positive" ? C.success : t.sentiment === "negative" ? C.ruby : C.purple, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, color: dk.muted, whiteSpace: "nowrap" }}>{t.count}x</span>
                          </div>
                          {t.quotes?.[0] && (
                            <div style={{ fontSize: 12, color: dk.muted, fontStyle: "italic", lineHeight: 1.5, borderLeft: `2px solid ${dk.border}`, paddingLeft: 8 }}>"{t.quotes[0]}"</div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {report.content.recommendations?.length > 0 && (
                <div id="section-recommendations" style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 8, padding: "20px 22px", marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: dk.label, marginBottom: 14 }}>Recommendations</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {report.content.recommendations.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {Ic.CheckCircle({ s: 12, c: C.purple })}
                        </div>
                        <span style={{ fontSize: 13, color: dk.text, lineHeight: 1.6 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }} className="no-print">
                <Btn variant="ghost" size="sm" onClick={handleGenerateReport} disabled={generating}>
                  {generating ? "Regenerating..." : "Regenerate report"}
                </Btn>
                <Btn variant="ghost" size="sm" onClick={handlePrint}>
                  Save as PDF
                </Btn>
                <Btn variant="ghost" size="sm" onClick={handleShare}>
                  Share report
                </Btn>
              </div>
            </div>
          )}

          {report?.status === "failed" && (
            <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: C.ruby, marginBottom: 12 }}>Report generation failed</div>
              <Btn size="sm" onClick={handleGenerateReport} disabled={generating}>Try again</Btn>
            </div>
          )}
        </div>
      </main>
      <div className="no-print">
        <Footer go={go} lang={lang} onLangChange={setLang} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#1a2035", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", minWidth: 120 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#141927", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, color: "rgba(180,185,215,0.65)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e8eaf4" }}>{value}</div>
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
