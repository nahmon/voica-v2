import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, VoicePlayer, Footer, Skeleton, useToast } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

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
  const [publicToken, setPublicToken] = useState(null);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(null);
  const audioRef = useRef(null);

  // Cleanup interval on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (genTimerRef.current) clearInterval(genTimerRef.current);
    };
  }, []);

  const loadComments = async (reportId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/comments/${reportId}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) setComments(await res.json());
  };

  useEffect(() => {
    if (!interviewId) { setLoading(false); return; }
    (async () => {
      try {
        const [ivRes, sessRes, qsRes, repRes] = await Promise.all([
          supabase.from("interviews").select("id, title, status, public_report_token").eq("id", interviewId).single(),
          supabase.from("sessions")
            .select("id, respondent, status, started_at, completed_at, responses(*)")
            .eq("interview_id", interviewId)
            .order("started_at", { ascending: false }),
          supabase.from("questions").select("*").eq("interview_id", interviewId).order("order_num"),
          supabase.from("reports").select("*").eq("interview_id", interviewId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (ivRes.data) {
          setInterview(ivRes.data);
          setPublicToken(ivRes.data.public_report_token ?? null);
        }
        if (qsRes.data) setQuestions(qsRes.data);
        if (repRes.data) {
          setReport(repRes.data);
          loadComments(repRes.data.id);
        }
        const ss = sessRes.data ?? [];
        setSessions(ss);
        setAllResponses(ss.flatMap(s => s.responses ?? []));
      } catch (e) {
        showToast(isKo ? "리포트 데이터를 불러오지 못했어요." : "Failed to load report data.", "error");
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
      if (!res.ok) throw new Error(data.error || "Report generation failed");
      setReport({ status: "completed", content: data.content });
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      clearInterval(genTimerRef.current);
      setGenerating(false);
    }
  };

  const playAudio = async (responseId) => {
    if (playingId === responseId) {
      audioRef.current?.pause();
      setPlayingId(null);
      setAudioProgress(null);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/storage?response_id=${responseId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) { showToast(isKo ? "음성을 불러올 수 없어요" : "Failed to load audio", "error"); return; }
      const { audio_url } = await res.json();
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(audio_url);
      audioRef.current.onended = () => { setPlayingId(null); setAudioProgress(null); };
      audioRef.current.onerror = () => { showToast(isKo ? "음성 재생 실패" : "Playback failed", "error"); setPlayingId(null); setAudioProgress(null); };
      audioRef.current.onloadedmetadata = () => setAudioProgress({ id: responseId, current: 0, duration: audioRef.current.duration });
      audioRef.current.ontimeupdate = () => setAudioProgress({ id: responseId, current: audioRef.current.currentTime, duration: audioRef.current.duration });
      audioRef.current.play();
      setPlayingId(responseId);
    } catch { showToast(isKo ? "음성 재생 실패" : "Playback failed", "error"); }
  };

  const handleCreatePublicLink = async () => {
    setSharingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/report/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create link");
      setPublicToken(data.public_report_token);
      const url = `${location.origin}/report/public/${data.public_report_token}`;
      await navigator.clipboard.writeText(url);
      showToast(isKo ? "공개 링크가 생성되어 클립보드에 복사됐어요" : "Public link created and copied", "success");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSharingLoading(false);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!publicToken) return;
    const url = `${location.origin}/report/public/${publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(isKo ? "공개 링크가 복사됐어요" : "Link copied", "success");
    } catch {
      showToast(isKo ? "복사에 실패했어요" : "Copy failed", "error");
    }
  };

  const handleRevokePublicLink = async () => {
    setSharingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/report/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ action: "revoke" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke");
      setPublicToken(null);
      showToast(isKo ? "공개 링크가 초기화됐어요" : "Public link revoked", "success");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSharingLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/comments/${report?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const newComment = await res.json();
      setComments(prev => [...prev, newComment]);
      setCommentText("");
    } catch {
      showToast(isKo ? "코멘트 저장에 실패했어요" : "Failed to save comment", "error");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/comments/${report?.id}?commentId=${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handlePrint = () => window.print();
  const handleShare = () => {
    const url = `${location.origin}/report/${interviewId}`;
    navigator.clipboard.writeText(url)
      .then(() => showToast("리포트 링크가 복사됐어요", "success"))
      .catch(() => showToast("링크 복사에 실패했어요", "error"));
  };

  const completedSessions = useMemo(() => sessions.filter(s => s.status === "completed"), [sessions]);
  const sessionMap = useMemo(() => new Map(sessions.map((s, i) => [s.id, { session: s, idx: i }])), [sessions]);

  const dk = {
    bg: "#0d1117", card: "#161b22", card2: "#1c2230",
    border: "rgba(255,255,255,0.08)", text: "#e2e8f0",
    muted: "rgba(255,255,255,0.45)", dim: "rgba(255,255,255,0.25)", label: "rgba(160,165,200,0.8)",
  };

  const totalSessions = sessions.length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0;
  const avgDurationMin = (() => {
    const timed = completedSessions.filter(s => s.completed_at && s.started_at);
    if (timed.length === 0) return null;
    const avg = timed.reduce((sum, s) => sum + (new Date(s.completed_at) - new Date(s.started_at)), 0) / timed.length;
    return Math.round(avg / 60000);
  })();

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
    const scaleQs = questions.filter(q => q.type === "likert");
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

  const mcDists = (() => {
    const mcQs = questions.filter(q => q.type === "multiple_choice");
    if (mcQs.length === 0 || allResponses.length === 0) return [];
    return mcQs.map(q => {
      const choices = Array.isArray(q.options) ? q.options : (q.options?.choices ?? []);
      const resps = allResponses.filter(r => r.question_id === q.id && r.value != null);
      const counts = {};
      choices.forEach(c => { counts[typeof c === "string" ? c : (c.label ?? String(c))] = 0; });
      resps.forEach(r => {
        const vals = Array.isArray(r.value) ? r.value : [r.value];
        vals.forEach(v => {
          const key = typeof v === "string" ? v : String(v);
          if (!(key in counts)) counts[key] = 0;
          counts[key]++;
        });
      });
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const maxCount = Math.max(...entries.map(e => e[1]), 1);
      return { question: q, entries, maxCount, total: resps.length };
    }).filter(d => d.total > 0);
  })();

  const questionInsights = report?.content?.questionInsights ?? [];
  const demographicInsights = report?.content?.demographicInsights ?? null;

  const genderDist = (() => {
    const counts = {};
    sessions.forEach(s => {
      const g = s.respondent?.gender?.trim();
      if (!g) return;
      counts[g] = (counts[g] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  })();

  const ageBuckets = (() => {
    const buckets = isKo
      ? { "10대": 0, "20대": 0, "30대": 0, "40대": 0, "50대+": 0 }
      : { "10s": 0, "20s": 0, "30s": 0, "40s": 0, "50s+": 0 };
    sessions.forEach(s => {
      const age = parseInt(s.respondent?.age, 10);
      if (isNaN(age)) return;
      const keys = Object.keys(buckets);
      if (age < 20) buckets[keys[0]]++;
      else if (age < 30) buckets[keys[1]]++;
      else if (age < 40) buckets[keys[2]]++;
      else if (age < 50) buckets[keys[3]]++;
      else buckets[keys[4]]++;
    });
    return Object.entries(buckets).filter(([, v]) => v > 0);
  })();

  const dateRange = (() => {
    const starts = sessions.map(s => new Date(s.started_at)).filter(d => !isNaN(d));
    const ends = sessions.map(s => s.completed_at && new Date(s.completed_at)).filter(Boolean).filter(d => !isNaN(d));
    if (starts.length === 0) return null;
    const minDate = new Date(Math.min(...starts));
    const maxDate = ends.length > 0 ? new Date(Math.max(...ends)) : new Date();
    const fmt = d => d.toLocaleDateString(isKo ? "ko-KR" : "en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${fmt(minDate)} – ${fmt(maxDate)}`;
  })();

  const durationBuckets = (() => {
    const buckets = isKo
      ? { "~3분": 0, "3~5분": 0, "5~10분": 0, "10분+": 0 }
      : { "~3m": 0, "3~5m": 0, "5~10m": 0, "10m+": 0 };
    completedSessions.forEach(s => {
      if (!s.started_at || !s.completed_at) return;
      const min = (new Date(s.completed_at) - new Date(s.started_at)) / 60000;
      const keys = Object.keys(buckets);
      if (min < 3) buckets[keys[0]]++;
      else if (min < 5) buckets[keys[1]]++;
      else if (min < 10) buckets[keys[2]]++;
      else buckets[keys[3]]++;
    });
    return Object.entries(buckets).filter(([, v]) => v > 0);
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

  const voiceClips = (() => {
    if (!hasReport) return [];
    return questions
      .filter(q => ["voice", "creative", "prototype"].includes(q.type))
      .map(q => ({
        q,
        resps: allResponses
          .filter(r => r.question_id === q.id && r.audio_url)
          .sort((a, b) => (b.transcript?.length ?? 0) - (a.transcript?.length ?? 0))
          .slice(0, 5),
      }))
      .filter(({ resps }) => resps.length > 0);
  })();

  const sn = (() => {
    let n = 0;
    const num = () => String(++n).padStart(2, "0");
    const maybe = (cond) => cond ? num() : null;
    const hasQuotes = questions
      .filter(q => q.type !== "scale" && q.type !== "multiple_choice")
      .some(q => allResponses.some(r => r.question_id === q.id && r.transcript?.trim().length > 20));
    return {
      overview: num(),
      findings: maybe(hasReport && report?.content?.themes?.length > 0),
      quant: maybe(hasReport && (mcDists.length > 0 || ratingDists.length > 0)),
      qInsights: maybe(hasReport && questionInsights.length > 0),
      quotes: maybe(hasReport && hasQuotes),
      clips: maybe(hasReport && voiceClips.length > 0),
      themes: maybe(hasReport && (report?.content?.themes?.length > 0 || !!sentimentDist)),
      profile: num(),
      demoInsights: maybe(hasReport && !!demographicInsights && (genderDist.length > 0 || ageBuckets.length > 0)),
      actions: maybe(hasReport && report?.content?.recommendations?.length > 0),
    };
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
          <div onClick={() => go("landing")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: "white" }} />
            </div>
            <span style={{ fontSize: 13, color: dk.muted }}>voicesurvey</span>
          </div>
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
              {publicToken ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={handleCopyPublicLink}
                    title={`${location.origin}/report/public/${publicToken}`}
                    style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid rgba(110,75,255,0.4)`, background: "rgba(110,75,255,0.1)", color: "#a78bff", fontSize: 12, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 5 }}>
                    🔗 {isMobile ? "" : (isKo ? "링크 복사" : "Copy link")}
                  </button>
                  <button
                    onClick={handleRevokePublicLink}
                    disabled={sharingLoading}
                    style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${dk.border}`, background: "none", color: dk.muted, fontSize: 12, cursor: "pointer", fontFamily: F }}>
                    {isKo ? "초기화" : "Revoke"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCreatePublicLink}
                  disabled={sharingLoading}
                  style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${dk.border}`, background: "none", color: dk.text, fontSize: 13, cursor: sharingLoading ? "default" : "pointer", fontFamily: F, opacity: sharingLoading ? 0.6 : 1 }}>
                  {sharingLoading ? (isKo ? "생성 중..." : "Creating...") : (isKo ? "공개 링크 생성" : "Create public link")}
                </button>
              )}
              <button onClick={handlePrint} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: C.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: F }}>
                {isKo ? "내보내기 →" : "Export →"}
              </button>
            </>
          )}
        </div>
      </div>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "16px" : "32px", flex: 1, width: "100%" }} className="print-content">

        {/* No report CTA */}
        {!report && (
          <div style={{ background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 12, padding: "40px 32px", textAlign: "center", marginTop: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 16, color: C.purple }}>✦</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: dk.text, marginBottom: 8 }}>{isKo ? "AI 리포트 생성" : "Generate AI Report"}</div>
            <div style={{ fontSize: 13, color: dk.muted, marginBottom: 24, lineHeight: 1.7 }}>
              {isKo
                ? <>완료된 응답 {completedSessions.length}개를 AI가 분석해<br />주제, 감정, 인사이트를 자동으로 추출해드려요.</>
                : <>AI will analyze {completedSessions.length} completed responses<br />and extract themes, sentiment, and insights automatically.</>}
            </div>
            {generating ? (
              <GeneratingProgress steps={GEN_STEPS} currentStep={genStep} elapsed={genElapsed} />
            ) : (
              <Btn onClick={handleGenerateReport} disabled={completedSessions.length < 10}
                style={completedSessions.length < 10 ? { background: "rgba(110,75,255,0.3)", color: "rgba(255,255,255,0.4)", cursor: "not-allowed" } : {}}>
                {isKo ? "리포트 생성 →" : "Generate Report →"}
              </Btn>
            )}
            {completedSessions.length < 10 && !generating && (
              <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 10, background: "rgba(110,75,255,0.06)", border: "1px dashed rgba(110,75,255,0.2)", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{completedSessions.length === 0 ? "📤" : "📊"}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: dk.text, marginBottom: 6 }}>
                  {completedSessions.length === 0
                    ? (isKo ? "아직 완료된 응답이 없어요" : "No completed responses yet")
                    : (isKo ? `응답 ${completedSessions.length}개 수집됨` : `${completedSessions.length} responses collected`)}
                </div>
                <div style={{ fontSize: 12, color: dk.muted, marginBottom: 12 }}>
                  {isKo
                    ? `응답이 최소 10개 이상 쌓여야 리포트를 생성할 수 있어요. (${completedSessions.length}/10)`
                    : `At least 10 responses required to generate a report. (${completedSessions.length}/10)`}
                </div>
                <button onClick={() => {
                  const url = `${location.origin}/i/${interview?.share_code}`;
                  navigator.clipboard.writeText(url).then(() => showToast(isKo ? "링크 복사됨" : "Link copied", "success"));
                }} style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid rgba(110,75,255,0.4)`, background: "transparent", color: "#a78bff", fontSize: 12, cursor: "pointer", fontFamily: F }}>
                  {isKo ? "🔗 인터뷰 링크 복사" : "🔗 Copy interview link"}
                </button>
              </div>
            )}
          </div>
        )}

        {hasReport && (
          <>
            {/* Report header */}
            <div style={{ paddingBottom: 28, marginBottom: 4 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: "rgba(110,75,255,0.12)", border: "1px solid rgba(110,75,255,0.2)", fontSize: 11, color: "#a78bff", marginBottom: 14 }}>
                ✦ {isKo ? "AI 분석 완료" : "AI analysis complete"}
              </div>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: dk.text, margin: "0 0 6px", lineHeight: 1.25 }}>{interview?.title}</h1>
              {dateRange && <div style={{ fontSize: 13, color: dk.muted }}>{dateRange}</div>}
            </div>

            {/* Executive Summary */}
            {report.content.summary && (
              <div style={{ marginBottom: 28, padding: "20px 24px", borderRadius: 10, background: "rgba(110,75,255,0.06)", border: "1px solid rgba(110,75,255,0.15)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                  {isKo ? "핵심 요약" : "Executive Summary"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {report.content.summary.split(/•/).filter(s => s.trim()).map((line, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.purple, flexShrink: 0, marginTop: 7 }} />
                      <div style={{ fontSize: 14, color: dk.text, lineHeight: 1.65 }}>{line.trim()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 01 리서치 개요 */}
            <Section number={sn.overview} title={isKo ? "리서치 개요" : "Research Overview"} dk={dk}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5,1fr)", gap: 1, background: dk.border, borderRadius: 8, overflow: "hidden" }}>
                {[
                  { label: isKo ? "조사 방법" : "Method", value: isKo ? "AI 음성 인터뷰" : "AI Voice Interview", small: true },
                  { label: isKo ? "총 응답자" : "Total", value: String(totalSessions) },
                  { label: isKo ? "완료 응답" : "Completed", value: String(completedSessions.length) },
                  { label: isKo ? "평균 소요" : "Avg Duration", value: avgDurationMin !== null ? `${avgDurationMin}${isKo ? "분" : "m"}` : "—" },
                  { label: isKo ? "문항 수" : "Questions", value: String(questions.length) },
                ].map((m, i) => (
                  <div key={i} style={{ background: dk.card, padding: "18px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: dk.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>{m.label}</div>
                    <div style={{ fontSize: m.small ? 12 : 22, fontWeight: 700, color: m.small ? C.purple : dk.text, lineHeight: 1.2 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 02 핵심 결론 */}
            {report.content.themes?.length > 0 && (
              <Section number={sn.findings} title={isKo ? "핵심 결론" : "Key Findings"} dk={dk}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {report.content.themes.slice(0, 3).map((theme, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 20, alignItems: "flex-start",
                      padding: "18px 0",
                      borderBottom: i < 2 ? `1px solid ${dk.border}` : "none",
                    }}>
                      <div style={{ width: 36, flexShrink: 0, paddingTop: 2 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: "0.04em" }}>F{String(i + 1).padStart(2, "0")}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: theme.quotes?.[0] ? 8 : 0, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: dk.text }}>{theme.label}</span>
                          <span style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 20,
                            background: theme.sentiment === "positive" ? "rgba(34,197,94,0.1)" : theme.sentiment === "negative" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
                            color: theme.sentiment === "positive" ? "#4ade80" : theme.sentiment === "negative" ? "#f87171" : dk.muted,
                            border: `1px solid ${theme.sentiment === "positive" ? "rgba(34,197,94,0.2)" : theme.sentiment === "negative" ? "rgba(239,68,68,0.2)" : dk.border}`,
                          }}>
                            {theme.sentiment === "positive" ? (isKo ? "긍정" : "Positive") : theme.sentiment === "negative" ? (isKo ? "부정" : "Negative") : (isKo ? "중립" : "Neutral")}
                          </span>
                          {theme.count && <span style={{ fontSize: 12, color: dk.dim }}>{isKo ? `${theme.count}회 언급` : `${theme.count} mentions`}</span>}
                        </div>
                        {theme.quotes?.[0] && (
                          <div style={{ fontSize: 13, color: dk.muted, lineHeight: 1.65, fontStyle: "italic" }}>"{theme.quotes[0]}"</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* 03 정량 결과 */}
            {(mcDists.length > 0 || ratingDists.length > 0) && (
              <Section number={sn.quant} title={isKo ? "정량 결과" : "Quantitative Results"} dk={dk}>
                {mcDists.length > 0 && (
                  <div style={{ marginBottom: ratingDists.length > 0 ? 28 : 0, display: "flex", flexDirection: "column", gap: 22 }}>
                    {mcDists.map(({ question: q, entries, maxCount, total }) => (
                      <div key={q.id}>
                        <div style={{ fontSize: 13, color: dk.label, fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>{q.content}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {entries.map(([label, count], i) => {
                            const pct = total > 0 ? Math.round(count / total * 100) : 0;
                            const isTop = i === 0 && count > 0;
                            return (
                              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: isMobile ? 72 : 140, fontSize: 12, color: isTop ? dk.text : dk.muted, flexShrink: 0, textAlign: "right", wordBreak: "keep-all", lineHeight: 1.3 }}>{label}</div>
                                <div style={{ flex: 1, height: 22, background: dk.card2, borderRadius: 4, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`, background: isTop ? `linear-gradient(90deg,${C.purple},#7c6af7)` : "rgba(110,75,255,0.28)", borderRadius: 4 }} />
                                </div>
                                <div style={{ width: 56, fontSize: 12, color: isTop ? C.purple : dk.muted, fontWeight: isTop ? 600 : 400, flexShrink: 0 }}>
                                  {pct}% <span style={{ fontSize: 10, color: dk.dim }}>({count})</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ fontSize: 11, color: dk.dim, marginTop: 8 }}>{isKo ? `총 ${total}개 응답` : `${total} responses`}</div>
                      </div>
                    ))}
                  </div>
                )}
                {ratingDists.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                        <div style={{ fontSize: 11, color: dk.muted, marginTop: 6 }}>{isKo ? `평균 ${avg} · ${total}개 응답` : `Avg ${avg} · ${total} responses`}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* 04 문항별 AI 인사이트 */}
            {questionInsights.length > 0 && (
              <Section number={sn.qInsights} title={isKo ? "문항별 AI 인사이트" : "Per-Question AI Insights"} dk={dk}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {questionInsights.map((qi, i) => {
                    const isLast = i === questionInsights.length - 1;
                    return (
                      <div key={qi.questionId || i} style={{ paddingBottom: isLast ? 0 : 20, marginBottom: isLast ? 0 : 20, borderBottom: isLast ? "none" : `1px solid ${dk.border}` }}>
                        <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: C.purple, background: "rgba(110,75,255,0.12)", borderRadius: 5, padding: "2px 7px", marginTop: 1 }}>Q{i + 1}</span>
                          <span style={{ fontSize: 13, color: dk.label, lineHeight: 1.55, fontWeight: 500 }}>{qi.question}</span>
                        </div>
                        <div style={{ paddingLeft: 38 }}>
                          <div style={{ background: dk.card2, borderLeft: "2px solid rgba(110,75,255,0.4)", borderRadius: "0 6px 6px 0", padding: "12px 14px" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, marginBottom: 6, letterSpacing: "0.06em" }}>AI INSIGHT</div>
                            <div style={{ fontSize: 13, color: dk.text, lineHeight: 1.75 }}>{qi.insight}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* 05 대표 발언 */}
            {(() => {
              const questionsWithQuotes = questions
                .filter(q => q.type !== "scale" && q.type !== "multiple_choice")
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
                <Section number={sn.quotes} title={isKo ? "대표 발언" : "Representative Quotes"} dk={dk}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {questionsWithQuotes.map(({ q, resps }, qi) => (
                      <div key={q.id}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: C.purple, background: "rgba(110,75,255,0.12)", borderRadius: 5, padding: "2px 7px", marginTop: 1 }}>Q{qi + 1}</span>
                          <span style={{ fontSize: 13, color: dk.label, lineHeight: 1.55, fontWeight: 500 }}>{q.content}</span>
                        </div>
                        {(() => {
                          const insight = report.content.questionInsights?.find(qi => qi.questionId === q.id)?.insight;
                          if (!insight) return null;
                          return (
                            <div style={{ background: "rgba(110,75,255,0.06)", border: "1px solid rgba(110,75,255,0.18)", borderRadius: 8, padding: "10px 14px", marginBottom: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: C.purple, background: "rgba(110,75,255,0.12)", borderRadius: 4, padding: "2px 6px", marginTop: 1 }}>AI</span>
                              <span style={{ fontSize: 13, color: dk.text, lineHeight: 1.65 }}>{insight}</span>
                            </div>
                          );
                        })()}
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : resps.length === 1 ? "1fr" : "repeat(auto-fill,minmax(240px,1fr))", gap: 8 }}>
                          {resps.map((r, i) => {
                            const { session, idx: sIdx } = sessionMap.get(r.session_id) ?? { session: null, idx: -1 };
                            const name = session?.respondent?.name || (isKo ? `응답자 ${sIdx + 1}` : `R${sIdx + 1}`);
                            const ts = (() => {
                              if (!session?.started_at || !r.created_at) return null;
                              const diff = new Date(r.created_at) - new Date(session.started_at);
                              if (diff < 0 || isNaN(diff)) return null;
                              const m = Math.floor(diff / 60000);
                              const s = Math.floor((diff % 60000) / 1000);
                              return m > 0 ? `${m}분 ${s}초` : `${s}초`;
                            })();
                            return (
                              <div key={r.id || i} style={{ background: dk.card2, border: `1px solid ${i === 0 ? "rgba(110,75,255,0.22)" : dk.border}`, borderRadius: 8, padding: "12px 14px", position: "relative" }}>
                                {i === 0 && (
                                  <span style={{ position: "absolute", top: 8, right: 10, fontSize: 9, fontWeight: 700, color: C.purple, background: "rgba(110,75,255,0.12)", borderRadius: 4, padding: "2px 6px" }}>
                                    {isKo ? "대표" : "TOP"}
                                  </span>
                                )}
                                <div style={{ fontSize: 18, color: C.purple, lineHeight: 1, marginBottom: 4, opacity: 0.3, fontFamily: "Georgia,serif" }}>"</div>
                                <div style={{ fontSize: 13, color: dk.text, lineHeight: 1.65, marginBottom: 8 }}>
                                  {r.transcript.length > 180 ? r.transcript.slice(0, 180) + "..." : r.transcript}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                  <div style={{ fontSize: 11, color: dk.dim }}>
                                    — {name}{ts && <span style={{ marginLeft: 6, color: dk.dim, opacity: 0.7 }}>· {isKo ? `${ts}경` : `@${ts}`}</span>}
                                  </div>
                                  {r.audio_url && (
                                    <button onClick={() => playAudio(r.id)} aria-label={playingId === r.id ? "stop" : "play"} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: "50%", border: `1px solid ${playingId === r.id ? C.purple : "rgba(110,75,255,0.3)"}`, background: playingId === r.id ? C.purple : "transparent", color: playingId === r.id ? "#fff" : C.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, transition: "all 0.15s" }}>
                                      {playingId === r.id ? "■" : "▶"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              );
            })()}

            {/* 음성 클립 모음 */}
            {voiceClips.length > 0 && (
              <Section number={sn.clips} title={isKo ? "음성 클립 모음" : "Audio Clips"} dk={dk}>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {voiceClips.map(({ q, resps }, qi) => (
                    <div key={q.id}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: C.purple, background: "rgba(110,75,255,0.12)", borderRadius: 5, padding: "2px 7px", marginTop: 1 }}>Q{qi + 1}</span>
                        <span style={{ fontSize: 13, color: dk.label, lineHeight: 1.55, fontWeight: 500 }}>{q.content}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {resps.map((r, ri) => {
                          const { session: sess, idx: sIdx } = sessionMap.get(r.session_id) ?? { session: null, idx: -1 };
                          const name = sess?.respondent?.name || (isKo ? `응답자 ${sIdx + 1}` : `R${sIdx + 1}`);
                          const isPlaying = playingId === r.id;
                          const prog = audioProgress?.id === r.id ? audioProgress : null;
                          const pct = prog && prog.duration > 0 ? (prog.current / prog.duration) * 100 : 0;
                          const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
                          return (
                            <div key={r.id || ri} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: dk.card2, borderRadius: 8, border: `1px solid ${isPlaying ? "rgba(110,75,255,0.3)" : dk.border}`, transition: "border-color 0.15s" }}>
                              <button onClick={() => playAudio(r.id)} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", border: `1px solid ${isPlaying ? C.purple : "rgba(110,75,255,0.35)"}`, background: isPlaying ? C.purple : "transparent", color: isPlaying ? "#fff" : C.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, transition: "all 0.15s" }}>
                                {isPlaying ? "■" : "▶"}
                              </button>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                                  <span style={{ fontSize: 11, color: dk.muted }}>— {name}</span>
                                  <span style={{ fontSize: 11, color: isPlaying ? C.purple : dk.dim, fontVariantNumeric: "tabular-nums" }}>
                                    {prog ? `${fmt(prog.current)} / ${fmt(prog.duration)}` : "🎙"}
                                  </span>
                                </div>
                                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: C.purple, borderRadius: 2, transition: "width 0.15s linear" }} />
                                </div>
                                {r.transcript && (
                                  <div style={{ fontSize: 11, color: dk.muted, marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    "{r.transcript.slice(0, 65)}{r.transcript.length > 65 ? "…" : ""}"
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* 06 테마 & 감정 분석 */}
            {(report.content.themes?.length > 0 || sentimentDist) && (
              <Section number={sn.themes} title={isKo ? "테마 & 감정 분석" : "Themes & Sentiment"} dk={dk}>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {sentimentDist && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: dk.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>{isKo ? "감정 분포" : "Sentiment Distribution"}</div>
                      <div style={{ display: "flex", height: 24, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                        {sentimentDist.positive > 0 && <div style={{ width: `${sentimentDist.positive}%`, background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, fontWeight: 600, color: "#fff", padding: "0 4px", whiteSpace: "nowrap" }}>{isKo ? "긍정" : "Pos"} {sentimentDist.positive}%</span></div>}
                        {sentimentDist.neutral > 0 && <div style={{ width: `${sentimentDist.neutral}%`, background: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, color: "#fff", padding: "0 4px", whiteSpace: "nowrap" }}>{isKo ? "중립" : "Neu"} {sentimentDist.neutral}%</span></div>}
                        {sentimentDist.negative > 0 && <div style={{ width: `${sentimentDist.negative}%`, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, color: "#fff", padding: "0 4px", whiteSpace: "nowrap" }}>{isKo ? "부정" : "Neg"} {sentimentDist.negative}%</span></div>}
                      </div>
                    </div>
                  )}
                  {report.content.themes?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: dk.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>{isKo ? "테마별 감정 분석" : "Theme × Sentiment"}</div>
                      {/* header */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 52px 52px 40px", gap: 4, padding: "0 4px 6px", borderBottom: `1px solid ${dk.border}` }}>
                        {[isKo ? "테마" : "Theme", isKo ? "긍정" : "Pos", isKo ? "중립" : "Neu", isKo ? "부정" : "Neg", isKo ? "언급" : "N"].map((h, hi) => (
                          <div key={hi} style={{ fontSize: 10, fontWeight: 600, color: dk.dim, letterSpacing: "0.06em", textAlign: hi > 0 ? "center" : "left" }}>{h}</div>
                        ))}
                      </div>
                      {report.content.themes.map((theme, i) => {
                        const bd = theme.sentiment_breakdown;
                        const bdTotal = bd ? (bd.positive + bd.negative + bd.neutral) : 0;
                        const posP = bdTotal > 0 ? Math.round(bd.positive / bdTotal * 100) : null;
                        const neuP = bdTotal > 0 ? Math.round(bd.neutral / bdTotal * 100) : null;
                        const negP = bdTotal > 0 ? Math.round(bd.negative / bdTotal * 100) : null;
                        const isLast = i === report.content.themes.length - 1;
                        const sentCfg = [
                          { val: posP, color: "#4ade80", bg: "rgba(34,197,94,0.12)", dom: theme.sentiment === "positive" },
                          { val: neuP, color: "#94a3b8", bg: "rgba(148,163,184,0.1)", dom: theme.sentiment === "neutral" },
                          { val: negP, color: "#f87171", bg: "rgba(239,68,68,0.12)", dom: theme.sentiment === "negative" },
                        ];
                        return (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 52px 52px 52px 40px", gap: 4, padding: "10px 4px", borderBottom: isLast ? "none" : `1px solid ${dk.border}`, alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: dk.text }}>{theme.label}</div>
                              {(theme.key_quote || theme.quotes?.[0]) && (
                                <div style={{ fontSize: 11, color: dk.muted, marginTop: 2, fontStyle: "italic", lineHeight: 1.4 }}>
                                  "{(theme.key_quote || theme.quotes[0]).slice(0, 72)}{(theme.key_quote || theme.quotes[0]).length > 72 ? "…" : ""}"
                                </div>
                              )}
                            </div>
                            {sentCfg.map(({ val, color, bg, dom }, ci) => (
                              <div key={ci} style={{ textAlign: "center", padding: "3px 4px", borderRadius: 5, background: dom ? bg : "transparent" }}>
                                {val !== null
                                  ? <span style={{ fontSize: 12, fontWeight: dom ? 700 : 400, color: dom ? color : dk.muted }}>{val}%</span>
                                  : <span style={{ fontSize: 12, color: dom ? color : dk.dim }}>{dom ? "●" : "—"}</span>
                                }
                              </div>
                            ))}
                            <div style={{ textAlign: "center", fontSize: 12, fontWeight: 500, color: theme.count ? dk.text : dk.dim }}>{theme.count ?? "—"}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* 07 응답자 프로파일 */}
            <Section number={sn.profile} title={isKo ? "응답자 프로파일" : "Respondent Profile"} dk={dk}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 28 }}>
                {/* Completion donut */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: dk.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>{isKo ? "완료율" : "Completion Rate"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <svg width="72" height="72" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="28" fill="none" stroke={dk.card2} strokeWidth="8" />
                      <circle cx="36" cy="36" r="28" fill="none" stroke={C.purple} strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionRate / 100)}`}
                        strokeLinecap="round" transform="rotate(-90 36 36)" />
                      <text x="36" y="40" textAnchor="middle" fill={dk.text} fontSize="13" fontWeight="700" fontFamily={F}>{completionRate}%</text>
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 13, color: dk.muted }}>{isKo ? `완료: ${completedSessions.length}명` : `Completed: ${completedSessions.length}`}</div>
                      <div style={{ fontSize: 13, color: dk.muted }}>{isKo ? `미완료: ${totalSessions - completedSessions.length}명` : `Dropped: ${totalSessions - completedSessions.length}`}</div>
                      {avgDurationMin !== null && <div style={{ fontSize: 13, color: dk.muted }}>{isKo ? `평균 ${avgDurationMin}분 소요` : `Avg ${avgDurationMin}m`}</div>}
                    </div>
                  </div>
                </div>
                {/* Duration */}
                {durationBuckets.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: dk.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>{isKo ? "소요 시간 분포" : "Duration Distribution"}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {durationBuckets.map(([label, count]) => {
                        const maxVal = Math.max(...durationBuckets.map(([, v]) => v), 1);
                        return (
                          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 44, fontSize: 11, color: dk.muted, flexShrink: 0, textAlign: "right" }}>{label}</div>
                            <div style={{ flex: 1, height: 16, background: dk.card2, borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(count / maxVal) * 100}%`, background: "rgba(110,75,255,0.4)", borderRadius: 3 }} />
                            </div>
                            <div style={{ width: 20, fontSize: 11, color: dk.muted, flexShrink: 0 }}>{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Gender */}
                {genderDist.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: dk.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>{isKo ? "성별 분포" : "Gender Distribution"}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {genderDist.map(([label, count]) => {
                        const maxVal = Math.max(...genderDist.map(([, v]) => v), 1);
                        const pct = Math.round(count / totalSessions * 100);
                        return (
                          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 36, fontSize: 12, color: dk.muted, flexShrink: 0, textAlign: "right" }}>{label}</div>
                            <div style={{ flex: 1, height: 20, background: dk.card2, borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(count / maxVal) * 100}%`, background: "rgba(110,75,255,0.45)", borderRadius: 4 }} />
                            </div>
                            <div style={{ width: 52, fontSize: 11, color: dk.muted, flexShrink: 0 }}>{pct}% ({count})</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Age */}
                {ageBuckets.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: dk.dim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>{isKo ? "연령대 분포" : "Age Distribution"}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {ageBuckets.map(([label, count]) => {
                        const maxVal = Math.max(...ageBuckets.map(([, v]) => v), 1);
                        const pct = Math.round(count / totalSessions * 100);
                        return (
                          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 36, fontSize: 12, color: dk.muted, flexShrink: 0, textAlign: "right" }}>{label}</div>
                            <div style={{ flex: 1, height: 20, background: dk.card2, borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(count / maxVal) * 100}%`, background: "rgba(52,211,153,0.4)", borderRadius: 4 }} />
                            </div>
                            <div style={{ width: 52, fontSize: 11, color: dk.muted, flexShrink: 0 }}>{pct}% ({count})</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* 08 인구통계 기반 AI 분석 */}
            {demographicInsights && (genderDist.length > 0 || ageBuckets.length > 0) && (
              <Section number={sn.demoInsights} title={isKo ? "인구통계 기반 분석" : "Demographic Analysis"} dk={dk}>
                {demographicInsights.summary && (
                  <div style={{ background: dk.card2, borderLeft: "2px solid rgba(52,211,153,0.4)", borderRadius: "0 6px 6px 0", padding: "12px 14px", marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#34d399", marginBottom: 6, letterSpacing: "0.06em" }}>OVERVIEW</div>
                    <div style={{ fontSize: 13, color: dk.text, lineHeight: 1.75 }}>{demographicInsights.summary}</div>
                  </div>
                )}
                {demographicInsights.groups?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {demographicInsights.groups.map((g, i) => {
                      const isLast = i === demographicInsights.groups.length - 1;
                      return (
                        <div key={i} style={{ paddingBottom: isLast ? 0 : 16, marginBottom: isLast ? 0 : 16, borderBottom: isLast ? "none" : `1px solid ${dk.border}` }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 5, padding: "2px 8px", marginTop: 1 }}>{g.group}</span>
                            <span style={{ fontSize: 13, color: dk.muted, lineHeight: 1.7 }}>{g.trait}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            )}

            {/* 09 인사이트 & 액션 아이템 */}
            {report.content.recommendations?.length > 0 && (
              <Section number={sn.actions} title={isKo ? "인사이트 & 액션 아이템" : "Insights & Action Items"} dk={dk}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {report.content.recommendations.map((r, i) => {
                    const isObj = r && typeof r === "object";
                    const title = isObj ? r.title : r;
                    const detail = isObj ? r.detail : null;
                    const rawPriority = isObj ? r.priority : null;
                    const priority = rawPriority ?? (i === 0 ? "high" : i === report.content.recommendations.length - 1 ? "low" : "mid");
                    const pCfg = {
                      high: { label: "High", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", color: "#f87171" },
                      mid:  { label: "Mid",  bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)", color: "#fbbf24" },
                      low:  { label: "Low",  bg: "rgba(110,75,255,0.1)", border: "rgba(110,75,255,0.25)", color: "#a78bff" },
                    }[priority] ?? { label: "—", bg: dk.card2, border: dk.border, color: dk.muted };
                    const isLast = i === report.content.recommendations.length - 1;
                    return (
                      <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: isLast ? 0 : 20, marginBottom: isLast ? 0 : 20, borderBottom: isLast ? "none" : `1px solid ${dk.border}` }}>
                        <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 6, background: pCfg.bg, border: `1px solid ${pCfg.border}`, fontSize: 11, fontWeight: 700, color: pCfg.color, flexShrink: 0, marginTop: 2, minWidth: 44, justifyContent: "center" }}>
                          {pCfg.label}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: dk.text, marginBottom: detail ? 6 : 0, lineHeight: 1.4 }}>{title}</div>
                          {detail && <div style={{ fontSize: 13, color: dk.muted, lineHeight: 1.75 }}>{detail}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Public link panel */}
            {publicToken && (
              <div className="no-print" style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(110,75,255,0.07)", border: "1px solid rgba(110,75,255,0.2)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#a78bff", flexShrink: 0 }}>🔗 {isKo ? "공개 링크" : "Public link"}</span>
                <code style={{ flex: 1, fontSize: 11, color: dk.muted, background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "4px 10px", wordBreak: "break-all", minWidth: 0 }}>
                  {`${location.origin}/report/public/${publicToken}`}
                </code>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={handleCopyPublicLink} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(110,75,255,0.35)", background: "transparent", color: "#a78bff", fontSize: 12, cursor: "pointer", fontFamily: F }}>
                    {isKo ? "복사" : "Copy"}
                  </button>
                  <button onClick={handleRevokePublicLink} disabled={sharingLoading} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${dk.border}`, background: "transparent", color: dk.muted, fontSize: 12, cursor: "pointer", fontFamily: F }}>
                    {isKo ? "링크 초기화" : "Revoke"}
                  </button>
                </div>
              </div>
            )}

            {/* Team notes / comments */}
            <div style={{ marginTop: 32 }} className="no-print">
              <div style={{ fontSize: 13, fontWeight: 600, color: dk.muted, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {isKo ? "팀 메모" : "Team Notes"} {comments.length > 0 && `(${comments.length})`}
              </div>
              {comments.map(c => (
                <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(110,75,255,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: C.purple }}>
                    {user?.email?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 14px", border: `1px solid ${dk.border}` }}>
                    <div style={{ fontSize: 13, color: dk.text, lineHeight: 1.6 }}>{c.content}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: dk.muted }}>{new Date(c.created_at).toLocaleDateString("ko-KR")}</span>
                      {c.user_id === user?.id && (
                        <button onClick={() => handleDeleteComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: dk.muted, fontFamily: F, padding: 0, textDecoration: "underline" }}>
                          {isKo ? "삭제" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input
                  aria-label={isKo ? "팀 메모 입력" : "Add team note"}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                  placeholder={isKo ? "팀 메모 추가..." : "Add a note..."}
                  style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${dk.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: dk.text, fontFamily: F, outline: "none" }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || commentLoading}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: C.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: F, opacity: commentLoading ? 0.6 : 1 }}>
                  {isKo ? "추가" : "Add"}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 16, borderTop: `1px solid ${dk.border}`, marginTop: 8 }} className="no-print">
              <Btn variant="ghost" size="sm" onClick={handleGenerateReport} disabled={generating} style={{ color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.2)" }}>
                {generating ? (isKo ? "재생성 중..." : "Regenerating...") : (isKo ? "리포트 재생성" : "Regenerate")}
              </Btn>
              <Btn variant="ghost" size="sm" onClick={handlePrint} style={{ color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.2)" }}>
                {isKo ? "PDF 저장" : "Save PDF"}
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

function Section({ number, title, children, dk }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingTop: 22 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(110,75,255,0.5)", letterSpacing: "0.05em", flexShrink: 0 }}>{number}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", flexShrink: 0 }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>
      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px 22px" }}>
        {children}
      </div>
    </div>
  );
}

function GeneratingProgress({ steps, currentStep, elapsed }) {
  const progress = Math.min((elapsed / 25) * 100, 98);
  return (
    <div style={{ maxWidth: 340, margin: "0 auto" }}>
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
      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ height: "100%", background: `linear-gradient(90deg,${C.purple},${C.purpleLight})`, borderRadius: 2, width: `${progress}%`, transition: "width 1s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.body }}>
        <span style={{ animation: "pulse-step 1.6s ease-in-out infinite" }}>{steps[currentStep]?.label ?? "Done"}</span>
        <span>{elapsed}s elapsed</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 16, height: 16, border: `2px solid ${C.purple}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    </div>
  );
}
