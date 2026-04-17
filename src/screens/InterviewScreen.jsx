import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Btn, WaveAnimation, useToast } from "../components/shared.jsx";
import { track } from "../lib/analytics.js";

// Keyframes injected once
const INTERVIEW_STYLES = `
@keyframes rec-pulse{0%{box-shadow:0 0 0 0 rgba(217,48,37,0.5)}70%{box-shadow:0 0 0 10px rgba(217,48,37,0)}100%{box-shadow:0 0 0 0 rgba(217,48,37,0)}}
@keyframes q-fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes confetti-fall{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(120px) rotate(360deg)}}
`;

const MIN_RECORD_SECS = 5;

const BRIDGE_PHRASES = [
  "네, 감사해요.",
  "알겠습니다.",
  "잘 들었어요.",
  "좋아요, 감사해요.",
  "네, 잘 알겠어요.",
];

// Estimate total interview duration in seconds
function estimateDuration(questions) {
  return questions.reduce((sum, q) => {
    if (q.type === "voice") return sum + 45;
    if (q.type === "multiple_choice") return sum + 10;
    if (q.type === "likert") return sum + 8;
    return sum + 20;
  }, 0);
}

function fmtMinutes(secs) {
  const m = Math.ceil(secs / 60);
  return `약 ${m}분`;
}

export default function InterviewScreen({ go, shareCode }) {
  const isMobile = useIsMobile();

  // Interview data
  const [interview, setInterview] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session
  const [sessionId, setSessionId] = useState(null);
  const [respondent, setRespondent] = useState({ name: "", age: "", gender: "" });
  const [introStep, setIntroStep] = useState("info"); // "info" | "warmup" | "started"

  // Question progress
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState("ai_speaking"); // ai_speaking|ready|recording|submitting|review_pass|mc|likert
  const [completed, setCompleted] = useState(false);

  // Recording
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const recordTimeRef = useRef(0);
  const audioCtxRef = useRef(null);
  const silenceAnalyserRef = useRef(null);
  const silenceRafRef = useRef(null);
  const lastTranscriptRef = useRef(null);
  const lastSelectedRef = useRef(null);
  const chatEndRef = useRef(null);
  const [completedChats, setCompletedChats] = useState([]);

  // MC/Likert
  const [selectedValue, setSelectedValue] = useState(null);

  // Warmup state
  const [warmupPhase, setWarmupPhase] = useState("idle"); // idle|recording|done
  const [warmupBlob, setWarmupBlob] = useState(null);
  const [warmupPlayUrl, setWarmupPlayUrl] = useState(null);
  const warmupChunksRef = useRef([]);
  const warmupRecorderRef = useRef(null);
  const warmupStreamRef = useRef(null);

  // Exit confirm
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [ttsBlocked, setTtsBlocked] = useState(false);
  const [recordingWarning, setRecordingWarning] = useState(null);
  const [resumeData, setResumeData] = useState(null); // { sessionId, qIndex }
  const { showToast } = useToast();

  // Question transition animation key
  const [qAnimKey, setQAnimKey] = useState(0);
  // Skip question confirm
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  // TTS text fallback — show question text prominently when TTS fails
  const [ttsReadFallback, setTtsReadFallback] = useState(false);
  // Completed share state — must be at top level (Rules of Hooks)
  const [shareCopied, setShareCopied] = useState(false);
  const audioRef = useRef(null);
  const ttsCacheRef = useRef({}); // { [question_id]: url }

  const prefetchTts = async (q) => {
    if (!q || ttsCacheRef.current[q.id]) return;
    try {
      let url = q.tts_url;
      if (!url) {
        const r = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: q.content, question_id: q.id }),
        });
        if (r.ok) { const d = await r.json(); url = d.url; }
      }
      if (url) ttsCacheRef.current[q.id] = url;
    } catch {}
  };

  // Load interview
  useEffect(() => {
    if (!shareCode) { setLoadError("인터뷰 링크가 맞지 않아요"); setLoading(false); return; }
    (async () => {
      const res = await fetch(`/api/interview/${shareCode}`);
      if (!res.ok) {
        let msg = "인터뷰를 찾지 못했어요. 링크를 다시 확인해요.";
        try {
          const errData = await res.json();
          if (errData.status === "draft") msg = "이 인터뷰는 아직 게시되지 않았어요. 인터뷰를 활성화한 후 공유해 주세요.";
          else if (errData.detail === "Missing Supabase credentials") msg = "서버 설정 오류가 발생했어요. 관리자에게 문의해 주세요.";
        } catch {}
        setLoadError(msg);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setInterview(data);
      setLoading(false);
      track("interview_link_opened", { shareCode });
    })();
  }, [shareCode]);

  // TTS playback when question changes — uses cache first
  useEffect(() => {
    if (!interview || introStep !== "started" || phase !== "ai_speaking") return;
    const q = interview.questions[qIndex];
    if (!q) return;
    let cancelled = false;
    (async () => {
      try {
        // Use cached URL if available, otherwise fetch
        let url = ttsCacheRef.current[q.id] || q.tts_url;
        if (!url) {
          const r = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: q.content, question_id: q.id }),
          });
          if (r.ok) { const d = await r.json(); url = d.url; }
        }
        if (url) ttsCacheRef.current[q.id] = url;
        if (url && !cancelled) {
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => { if (!cancelled) { setTtsBlocked(false); setPhase(q.type === "voice" ? "ready" : q.type); } };
          try {
            await audio.play();
            setTtsBlocked(false);
          } catch {
            if (!cancelled) setTtsBlocked(true);
          }
          return;
        }
      } catch {}
      if (!cancelled) setTtsBlocked(true);
    })();
    return () => {
      cancelled = true;
      // Stop audio immediately when question changes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [qIndex, phase, introStep, interview]);

  // Prefetch next question's TTS while user is answering current one
  useEffect(() => {
    if (!interview || introStep !== "started") return;
    if (phase !== "ready" && phase !== "recording") return;
    const nextQ = interview.questions[qIndex + 1];
    if (nextQ) prefetchTts(nextQ);
  }, [qIndex, phase, introStep, interview]);

  // Recording timer
  useEffect(() => {
    if (phase === "recording") {
      recordTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        setRecordTime(t => { const n = t + 1; recordTimeRef.current = n; return n; });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordTime(0);
      recordTimeRef.current = 0;
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Page Visibility — stop recording if screen locks / tab switches
  useEffect(() => {
    if (phase !== "recording") return;
    const handleVisibility = () => {
      if (document.hidden) {
        const mr = mediaRecorderRef.current;
        if (mr && mr.state === "recording") {
          mr.stop();
          streamRef.current?.getTracks().forEach(t => t.stop());
        }
        setPhase("ready");
        setRecordTime(0);
        chunksRef.current = [];
        setRecordingWarning("화면이 잠겨서 녹음이 중단됐어요. 다시 녹음해 주세요.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [phase]);

  // Session resume — check localStorage for existing session
  useEffect(() => {
    if (!shareCode || !interview) return;
    const key = `voica_session_${shareCode}`;
    const stored = localStorage.getItem(key);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const twoHours = 2 * 60 * 60 * 1000;
      if (parsed.sessionId && Date.now() - parsed.startedAt < twoHours) {
        setResumeData(parsed);
      } else {
        localStorage.removeItem(key);
      }
    } catch { localStorage.removeItem(key); }
  }, [shareCode, interview]);

  // Persist qIndex to localStorage as interview progresses
  useEffect(() => {
    if (!shareCode || !sessionId) return;
    const key = `voica_session_${shareCode}`;
    localStorage.setItem(key, JSON.stringify({ sessionId, qIndex, startedAt: Date.now() }));
  }, [qIndex, sessionId, shareCode]);

  // Track each question start
  useEffect(() => {
    if (introStep !== "started" || !sessionId || !interview) return;
    track("interview_q_started", { shareCode, sessionId, qIndex, total: interview.questions.length });
  }, [qIndex, introStep, sessionId]);

  // Auto-scroll chat history to bottom when new Q&A is archived
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [completedChats]);

  const [starting, setStarting] = useState(false);

  const startSession = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const qs = interview?.questions ?? [];
      prefetchTts(qs[0]);
      prefetchTts(qs[1]);
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interview_id: interview.id, respondent }),
      });
      if (res.ok) {
        const d = await res.json();
        setSessionId(d.session_id);
        // Go to warmup if there's at least one voice question
        const hasVoice = interview?.questions?.some(q => q.type === "voice");
        setIntroStep(hasVoice ? "warmup" : "started");
        track("interview_info_submitted", { shareCode, sessionId: d.session_id });
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || "인터뷰를 시작할 수 없어요. 다시 시도해 주세요.", "error");
      }
    } catch {
      showToast("네트워크 오류가 발생했어요. 다시 시도해 주세요.", "error");
    } finally {
      setStarting(false);
    }
  };

  const saveResponse = async (patch) => {
    if (!sessionId) return;
    const q = interview.questions[qIndex];
    try {
      const res = await fetch("/api/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question_id: q.id, type: q.type, ...patch }),
      });
      if (!res.ok) showToast("답변 저장에 실패했어요. 연결을 확인해 주세요.", "error");
    } catch {
      showToast("답변 저장에 실패했어요. 연결을 확인해 주세요.", "error");
    }
  };

  const advanceOrComplete = (skipped = false) => {
    const q = interview.questions[qIndex];
    const qType = q?.type;
    // Archive current Q&A to chat history
    setCompletedChats(prev => [...prev, {
      qText: q?.content,
      qType,
      aText: lastTranscriptRef.current,
      selectedVal: lastSelectedRef.current,
      skipped,
      qIdx: qIndex,
    }]);
    lastTranscriptRef.current = null;
    lastSelectedRef.current = null;
    track("interview_q_answered", { shareCode, sessionId, qIndex, qType });
    if (qIndex < interview.questions.length - 1) {
      setQIndex(i => i + 1);
      setQAnimKey(k => k + 1);
      setPhase("ai_speaking");
      setRecordTime(0);
      setSelectedValue(null);
      setTtsReadFallback(false);
    } else {
      // Complete session
      if (sessionId) fetch("/api/session", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, status: "completed" }) });
      if (shareCode) localStorage.removeItem(`voica_session_${shareCode}`);
      track("interview_completed", { shareCode, sessionId, total: interview.questions.length });
      setCompleted(true);
    }
  };

  // ─── Bridge TTS (Phase 2) ───
  const playBridgeTts = async () => {
    const phrase = BRIDGE_PHRASES[Math.floor(Math.random() * BRIDGE_PHRASES.length)];
    try {
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: phrase }),
      });
      if (!r.ok) return;
      const d = await r.json();
      if (!d.url) return;
      const audio = new Audio(d.url);
      audioRef.current = audio;
      await new Promise(resolve => {
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
    } catch {}
  };

  // ─── Silence detection (Phase 3) ───
  const stopSilenceDetection = () => {
    if (silenceRafRef.current) { cancelAnimationFrame(silenceRafRef.current); silenceRafRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    silenceAnalyserRef.current = null;
  };

  const startSilenceDetection = (stream) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      silenceAnalyserRef.current = analyser;
      const data = new Float32Array(analyser.fftSize);
      let silenceStart = null;
      const THRESHOLD = 0.015;
      const SILENCE_MS = 2500;
      const check = () => {
        if (!silenceAnalyserRef.current) return;
        silenceAnalyserRef.current.getFloatTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
        if (rms < THRESHOLD) {
          if (!silenceStart) silenceStart = Date.now();
          else if (Date.now() - silenceStart >= SILENCE_MS && recordTimeRef.current >= MIN_RECORD_SECS) {
            stopSilenceDetection();
            stopRecording();
            return;
          }
        } else { silenceStart = null; }
        silenceRafRef.current = requestAnimationFrame(check);
      };
      silenceRafRef.current = requestAnimationFrame(check);
    } catch {}
  };

  // ─── Voice recording ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();
      mediaRecorderRef.current = mr;
      setPhase("recording");
      startSilenceDetection(stream);
    } catch {
      setRecordingWarning("마이크 권한이 필요해요. 브라우저 설정에서 마이크를 허용한 후 다시 시도해 주세요.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== "recording") return;
    stopSilenceDetection();
    setPhase("submitting");
    mr.onstop = async () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const mimeType = mr.mimeType;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = mimeType.includes("webm") ? "webm" : "mp4";
      const q = interview.questions[qIndex];
      let audioUrl = null;
      let transcript = null;
      // Upload audio via server-side signed URL (bypasses anon RLS)
      try {
        const urlRes = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, questionId: q.id, ext }),
        });
        if (urlRes.ok) {
          const { signedUrl, downloadUrl } = await urlRes.json();
          const uploadRes = await fetch(signedUrl, { method: "PUT", body: blob, headers: { "Content-Type": mimeType } });
          if (uploadRes.ok) {
            if (downloadUrl) audioUrl = downloadUrl;
          } else { console.error("[audio upload PUT]", uploadRes.status); }
        } else { console.error("[upload-url API]", urlRes.status); }
      } catch (e) { console.error("[audio upload exception]", e); }
      // STT — independent of audio upload
      try {
        const fd = new FormData();
        fd.append("audio", blob, `audio.${ext}`);
        fd.append("session_id", sessionId);
        const sttRes = await fetch("/api/stt", { method: "POST", body: fd });
        if (sttRes.ok) { const d = await sttRes.json(); transcript = d.transcript; }
        else { console.error("[stt]", sttRes.status); showToast("음성 인식에 실패했어요. 텍스트 없이 저장됩니다.", "error"); }
      } catch (e) { console.error("[stt exception]", e); }
      await saveResponse({ audio_url: audioUrl, transcript });
      lastTranscriptRef.current = transcript;
      setPhase("review_pass");
      await playBridgeTts();
      advanceOrComplete();
    };
    mr.stop();
  };

  const submitMCLikert = async () => {
    if (selectedValue === null) return;
    const q = interview.questions[qIndex];
    const isLikert = q.type === "likert";
    await saveResponse({ value: isLikert ? selectedValue : [selectedValue] });
    lastSelectedRef.current = selectedValue;
    setPhase("review_pass");
    setTimeout(advanceOrComplete, 800);
  };

  const skipQuestion = async () => {
    setShowSkipConfirm(false);
    await saveResponse({ skipped: true });
    track("interview_q_skipped", { shareCode, sessionId, qIndex });
    advanceOrComplete(true);
  };

  const startWarmup = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      warmupStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      warmupChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) warmupChunksRef.current.push(e.data); };
      mr.start();
      warmupRecorderRef.current = mr;
      setWarmupPhase("recording");
    } catch {
      setRecordingWarning("마이크 권한이 필요해요. 브라우저 설정에서 마이크를 허용한 후 다시 시도해 주세요.");
    }
  };

  const stopWarmup = () => {
    const mr = warmupRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      warmupStreamRef.current?.getTracks().forEach(t => t.stop());
      const mimeType = mr.mimeType;
      const blob = new Blob(warmupChunksRef.current, { type: mimeType });
      setWarmupBlob(blob);
      const url = URL.createObjectURL(blob);
      setWarmupPlayUrl(url);
      setWarmupPhase("done");
    };
    mr.stop();
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─── Loading ───
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#202124", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>인터뷰 불러오는 중...</div>
    </div>
  );

  if (loadError) return (
    <div style={{ minHeight: "100vh", background: "#202124", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>🔗</div>
      <div style={{ fontSize: isMobile ? 16 : 18, color: C.white, marginBottom: 8 }}>링크를 확인해 주세요</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>{loadError}</div>
      <button onClick={() => go("landing")} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: C.purple, color: C.white, fontSize: 14, fontWeight: 500, fontFamily: F, cursor: "pointer" }}>홈으로</button>
    </div>
  );

  // ─── Resume prompt ───
  if (introStep === "info" && resumeData) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#202124,#292a2d)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>💬</div>
        <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: "#fff", marginBottom: 10 }}>이전 인터뷰가 있어요</div>
        <div style={{ fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.5)", marginBottom: 32, lineHeight: 1.6 }}>
          {resumeData.qIndex + 1}번 질문까지 진행했어요.<br />이어서 계속할까요?
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => {
            setSessionId(resumeData.sessionId);
            setQIndex(resumeData.qIndex);
            setIntroStep("started");
            setResumeData(null);
          }} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.purple},${C.purpleDeep})`, color: "#fff", fontSize: 14, fontWeight: 500, fontFamily: F, cursor: "pointer" }}>
            이어서 하기 →
          </button>
          <button onClick={() => { localStorage.removeItem(`voica_session_${shareCode}`); setResumeData(null); }}
            style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: F, cursor: "pointer" }}>
            처음부터
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Warmup ───
  if (introStep === "warmup") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#202124,#292a2d)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20, letterSpacing: 0.3 }}>마이크 테스트</div>
        <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: C.white, marginBottom: 8 }}>마이크가 잘 들리나요?</div>
        <div style={{ fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.5)", marginBottom: 32, lineHeight: 1.7 }}>
          3초 정도 짧게 말해보고<br />재생해서 확인해 보세요.
        </div>

        {warmupPhase === "idle" && (
          <button onClick={startWarmup}
            style={{ width: 72, height: 72, borderRadius: "50%", border: "none", cursor: "pointer", background: C.purple, boxShadow: "0 0 0 8px rgba(83,58,253,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            {Ic.Mic({ s: 28, c: "white" })}
          </button>
        )}

        {warmupPhase === "recording" && (
          <>
            <button onClick={stopWarmup}
              style={{ width: 72, height: 72, borderRadius: "50%", border: "none", cursor: "pointer", background: C.ruby, boxShadow: "0 0 0 8px rgba(217,48,37,0.2),0 0 0 16px rgba(217,48,37,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              {Ic.Stop({ s: 24, c: "white" })}
            </button>
            <div style={{ fontSize: 12, color: "rgba(217,48,37,0.9)" }}>녹음 중... 탭하여 중지</div>
          </>
        )}

        {warmupPhase === "done" && warmupPlayUrl && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <audio controls src={warmupPlayUrl} style={{ width: "100%", maxWidth: 300, borderRadius: 8 }} />
            <button onClick={() => { setWarmupPhase("idle"); setWarmupPlayUrl(null); setWarmupBlob(null); }}
              style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", fontFamily: F, textDecoration: "underline" }}>
              다시 테스트
            </button>
          </div>
        )}

        {recordingWarning && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(255,200,50,0.08)", border: "1px solid rgba(255,200,50,0.2)", fontSize: 12, color: "rgba(255,200,50,0.9)", textAlign: "left" }}>
            {recordingWarning}
          </div>
        )}

        <button
          onClick={() => { setIntroStep("started"); }}
          disabled={warmupPhase === "recording"}
          style={{ marginTop: 24, width: "100%", padding: "14px", borderRadius: 10, border: "none", background: warmupPhase === "recording" ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg,${C.purple},${C.purpleDeep})`, color: C.white, fontSize: 15, fontWeight: 500, fontFamily: F, cursor: warmupPhase === "recording" ? "not-allowed" : "pointer", opacity: warmupPhase === "recording" ? 0.5 : 1 }}>
          {warmupPhase === "done" ? (isMobile ? "확인 완료 — 시작 →" : "마이크 확인 완료 — 인터뷰 시작 →") : (isMobile ? "테스트 건너뛰기 →" : "마이크 테스트 건너뛰고 시작 →")}
        </button>
      </div>
    </div>
  );

  // ─── Intro / Info ───
  if (introStep === "info") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#202124 0%,#292a2d 50%,#202124 100%)", display: "flex", alignItems: "flex-start", justifyContent: "center", fontFamily: F, padding: "40px 24px 40px", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1a73e8,#e8710a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 400 }}>{isMobile ? "AI 인터뷰" : "Voice Survey AI 인터뷰"}</span>
        </div>
        <div style={{ fontSize: isMobile ? 19 : 22, fontWeight: 500, color: C.white, marginBottom: 8, lineHeight: 1.3 }}>{interview.title}</div>
        {interview.description && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 16, lineHeight: 1.6 }}>{interview.description}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>질문 {interview.questions.length}개 · 음성 응답 포함</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round"><circle cx="6" cy="6" r="5"/><path d="M6 3.5v2.5l1.5 1.5"/></svg>
            예상 소요시간 {fmtMinutes(estimateDuration(interview.questions))}
          </span>
        </div>
        {interview.incentive && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(21,190,83,0.1)", border: "1px solid rgba(21,190,83,0.25)", marginBottom: 20 }}>
            <span style={{ fontSize: 16 }}>🎁</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(21,190,83,0.9)" }}>참여 보상</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>{interview.incentive}</div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {[
            { key: "name", label: "닉네임", placeholder: "예: 커피좋아하는직장인", required: true },
            { key: "age", label: "나이 (선택)", placeholder: "예: 29", inputMode: "numeric" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>
                {f.label}{f.required && <span style={{ color: C.magenta, marginLeft: 3 }}>*</span>}
              </label>
              <input value={respondent[f.key]} onChange={e => setRespondent(r => ({ ...r, [f.key]: e.target.value }))} placeholder={f.placeholder} inputMode={f.inputMode}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${f.required && !respondent[f.key].trim() ? "rgba(255,80,80,0.3)" : "rgba(255,255,255,0.12)"}`, background: "rgba(255,255,255,0.06)", fontSize: 16, fontFamily: F, color: C.white, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>성별 (선택)</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["남성", "여성", "기타"].map(g => (
                <button key={g} onClick={() => setRespondent(r => ({ ...r, gender: g }))}
                  style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${respondent.gender === g ? C.purple : "rgba(255,255,255,0.12)"}`, background: respondent.gender === g ? "rgba(83,58,253,0.2)" : "transparent", color: respondent.gender === g ? C.purpleLight : "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", fontFamily: F }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Sound notice */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(255,200,50,0.08)", border: "1px solid rgba(255,200,50,0.2)", marginBottom: 20 }}>
          <span style={{ fontSize: 16 }}>🔊</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,200,50,0.9)" }}>소리를 켜주세요</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{isMobile ? "AI가 질문을 읽어드려요. 이어폰을 권장해요." : "AI 인터뷰어가 질문을 음성으로 읽어드립니다. 이어폰 착용을 권장합니다."}</div>
          </div>
        </div>
        {!respondent.name.trim() && <div style={{ fontSize: 12, color: "rgba(255,100,100,0.7)", marginBottom: 10 }}>닉네임을 입력해 주세요</div>}
        <button onClick={startSession} disabled={!respondent.name.trim() || starting} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: respondent.name.trim() ? `linear-gradient(135deg,${C.purple},${C.purpleDeep})` : "rgba(255,255,255,0.1)", color: C.white, fontSize: 15, fontWeight: 500, fontFamily: F, cursor: respondent.name.trim() ? "pointer" : "not-allowed", opacity: respondent.name.trim() ? 1 : 0.45 }}>
          인터뷰 시작하기 →
        </button>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 14 }}>답변은 암호화 저장됩니다</div>
      </div>
    </div>
  );

  // ─── Completed ───
  const handleShare = () => {
    track("viral_share_clicked", {});
    const shareText = "나는 방금 Voice Survey AI 인터뷰에 참여했어요! 🎤 voicesurvey.ai";
    if (navigator.share) {
      navigator.share({ title: "Voice Survey 인터뷰 완료!", text: "방금 AI 음성 인터뷰에 참여했어요. 당신도 해보세요!", url: "https://voicesurvey.ai" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); }).catch(() => {});
    }
  };

  // Confetti dots data — generated once
  const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
    left: `${5 + (i * 17) % 90}%`,
    delay: `${(i * 0.13).toFixed(2)}s`,
    dur: `${0.9 + (i % 4) * 0.2}s`,
    color: [C.purple, C.magenta, "#1a73e8", "#15be53", "#f96bee", "#e8710a"][i % 6],
    size: 6 + (i % 3) * 3,
  }));

  if (completed) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#202124,#292a2d,#202124)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: F, position: "relative", overflow: "hidden" }}>
      <style>{INTERVIEW_STYLES}</style>

      {/* Confetti dots */}
      {CONFETTI.map((c, i) => (
        <div key={i} style={{
          position: "absolute", top: "-10px", left: c.left,
          width: c.size, height: c.size, borderRadius: "50%",
          background: c.color, opacity: 0,
          animation: `confetti-fall ${c.dur} ease-out ${c.delay} 3 forwards`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "15%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(30,142,62,0.2),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />

      <div style={{ textAlign: "center", position: "relative", maxWidth: 400, width: "100%", animation: "q-fade-in 0.4s ease forwards" }}>
        {/* Success icon */}
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,142,62,0.18)", border: "1.5px solid rgba(30,142,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>✓</div>

        <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 700, color: C.white, marginBottom: 10 }}>인터뷰 완료!</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: interview.incentive ? 12 : 20 }}>{isMobile ? "감사해요! 답변이 저장됐어요." : <>소중한 의견 감사해요.<br />답변을 안전하게 저장했어요.</>}</div>
        {interview.incentive && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "rgba(21,190,83,0.1)", border: "1px solid rgba(21,190,83,0.3)", marginBottom: 20, textAlign: "left" }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🎁</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(21,190,83,0.9)", marginBottom: 2 }}>참여 보상</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{interview.incentive}</div>
            </div>
          </div>
        )}

        {/* Summary card */}
        <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 0.6, marginBottom: 10 }}>답변 요약</div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.white, fontFeatureSettings: '"tnum"' }}>{interview.questions.length}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>전체 질문</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#15be53", fontFeatureSettings: '"tnum"' }}>{interview.questions.length}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>완료한 답변</div>
            </div>
          </div>
        </div>

        {/* Share button */}
        <button onClick={handleShare}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", fontSize: 14, fontFamily: F, cursor: "pointer", marginBottom: 16, width: "100%", justifyContent: "center" }}>
          {shareCopied ? "✓ 복사됐어요!" : "🔗 완료 인증 공유하기"}
        </button>

        {/* Primary CTA — go back */}
        <button onClick={() => go("landing")}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", borderRadius: 10, border: "none", background: C.purple, color: C.white, fontSize: 15, fontWeight: 600, fontFamily: F, cursor: "pointer", marginBottom: 24, width: "100%" }}>
          홈으로 돌아가기 →
        </button>

        {/* Powered by Voice Survey footer */}
        <div style={{ padding: "16px 20px", borderRadius: 12, border: `1px solid ${C.purpleLight}44`, background: C.purpleBg, textAlign: "left" }}>
          <div style={{ fontSize: 12, color: `${C.purpleLight}`, marginBottom: 8, fontWeight: 500 }}>{isMobile ? "🎤 Voice Survey 인터뷰" : "🎤 Voice Survey로 만들어진 인터뷰예요"}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{isMobile ? "나도 리서치 시작 →" : "당신의 목소리로 리서치하고 싶다면 →"}</span>
            <button onClick={() => { track("powered_by_voice_survey_clicked", {}); window.location.href = "/"; }}
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 8, border: "none", background: C.purple, color: C.white, fontSize: 12, fontWeight: 600, fontFamily: F, cursor: "pointer", whiteSpace: "nowrap" }}>
              무료로 시작하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const q = interview.questions[qIndex];

  // ─── Main interview (chat UI) ───
  return (
    <div style={{ height: "100dvh", minHeight: "100vh", background: "linear-gradient(145deg,#202124 0%,#292a2d 45%,#303134 80%,#202124 100%)", display: "flex", flexDirection: "column", fontFamily: F, position: "relative", overflow: "hidden" }}>
      <style>{INTERVIEW_STYLES}</style>

      {showExitConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#292a2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "28px 24px", width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 8 }}>인터뷰를 중단하시겠습니까?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>{isMobile ? "나가면 답변이 유지되지 않아요." : "지금 나가면 저장된 답변이 유지되지 않을 수 있습니다."}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn size="lg" style={{ flex: 1 }} onClick={() => setShowExitConfirm(false)}>계속 진행</Btn>
              <Btn variant="ghost" size="lg" style={{ flex: 1, borderColor: "rgba(255,255,255,0.2)", color: C.white }} onClick={() => { track("interview_abandoned", { shareCode, sessionId, qIndex }); setShowExitConfirm(false); go("landing"); }}>나가기</Btn>
            </div>
          </div>
        </div>
      )}

      {showSkipConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#292a2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "28px 24px", width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏭️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 8 }}>이 질문을 건너뛸까요?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>{isMobile ? "이 질문을 건너뛸 수 있어요." : "답변하기 어렵거나 관련 없는 질문이라면 건너뛸 수 있어요."}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn size="lg" style={{ flex: 1 }} onClick={() => setShowSkipConfirm(false)}>계속 답변</Btn>
              <Btn variant="ghost" size="lg" style={{ flex: 1, borderColor: "rgba(255,255,255,0.2)", color: C.white }} onClick={skipQuestion}>건너뛰기</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Ambient glows */}
      <div style={{ position: "absolute", top: -100, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(26,115,232,0.2),transparent 70%)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,113,10,0.15),transparent)", filter: "blur(70px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Progress bar header */}
      <div style={{ flexShrink: 0, position: "relative", zIndex: 1, padding: isMobile ? "14px 16px 10px" : "18px 32px 12px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => setShowExitConfirm(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", fontFamily: F, padding: 0 }}>나가기</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {(() => {
                const remaining = estimateDuration(interview.questions.slice(qIndex));
                const mins = Math.ceil(remaining / 60);
                return mins > 0 ? (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round"><circle cx="6" cy="6" r="5"/><path d="M6 3.5v2.5l1.5 1.5"/></svg>
                    약 {mins}분 남음
                  </span>
                ) : null;
              })()}
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFeatureSettings: '"tnum"', fontWeight: 500 }}>
                {qIndex + 1} / {interview.questions.length}
              </span>
            </div>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${((qIndex + 1) / interview.questions.length) * 100}%`, background: `linear-gradient(90deg,${C.purple},${C.magenta})`, borderRadius: 2, transition: "width 0.5s ease" }} />
          </div>
        </div>
      </div>

      {/* Scrollable chat history */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1, padding: isMobile ? "8px 16px 16px" : "8px 32px 16px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {completedChats.map((chat, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* AI question bubble */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#1a73e8,#e8710a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, marginTop: 2 }}>✦</div>
                <div style={{ maxWidth: "78%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px 16px 16px 16px", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{chat.qText}</p>
                </div>
              </div>
              {/* User answer bubble */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "78%", background: "rgba(83,58,253,0.18)", border: "1px solid rgba(83,58,253,0.28)", borderRadius: "16px 4px 16px 16px", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: chat.skipped ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.8)", lineHeight: 1.6, fontStyle: chat.skipped ? "italic" : "normal" }}>
                    {chat.skipped
                      ? "건너뜀"
                      : chat.aText
                        || (chat.selectedVal !== null && chat.selectedVal !== undefined ? String(chat.selectedVal) : "—")}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Sticky bottom panel — current question + controls */}
      <div style={{ flexShrink: 0, position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(28,29,32,0.96)", backdropFilter: "blur(16px)", padding: isMobile ? "16px 16px 28px" : "20px 32px 28px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>

          {/* AI avatar row + current question */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1a73e8,#e8710a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, boxShadow: phase === "ai_speaking" ? "0 0 14px rgba(26,115,232,0.5)" : "none", transition: "box-shadow 0.4s" }}>✦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: C.purpleLight, marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                {phase === "ai_speaking" ? <WaveAnimation active /> : <span style={{ color: "rgba(255,255,255,0.3)" }}>AI 인터뷰어</span>}
              </div>
              <p key={qAnimKey} style={{ margin: 0, fontSize: isMobile ? 15 : 17, color: C.white, lineHeight: 1.65, animation: "q-fade-in 0.35s ease forwards", wordBreak: "keep-all" }}>{q.content}</p>
            </div>
          </div>

          {/* Recording warning */}
          {recordingWarning && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(255,200,50,0.08)", border: "1px solid rgba(255,200,50,0.2)", marginBottom: 12, fontSize: 12, color: "rgba(255,200,50,0.9)" }}>
              <span>⚠️</span>
              <span style={{ flex: 1 }}>{recordingWarning}</span>
              <button onClick={() => setRecordingWarning(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", padding: 0, flexShrink: 0 }}>✕</button>
            </div>
          )}

          {/* TTS blocked */}
          {phase === "ai_speaking" && ttsBlocked && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              <button onClick={async () => {
                setTtsBlocked(false);
                if (audioRef.current) {
                  try { await audioRef.current.play(); }
                  catch { setPhase(q.type === "voice" ? "ready" : q.type); }
                } else {
                  setPhase(q.type === "voice" ? "ready" : q.type);
                }
              }} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: C.purple, color: C.white, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
                🔊 소리 켜고 다시 듣기
              </button>
              <button onClick={() => { setTtsReadFallback(true); setPhase(q.type === "voice" ? "ready" : q.type); }}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, cursor: "pointer", fontFamily: F, padding: "8px 14px" }}>
                📖 텍스트로 확인하고 진행
              </button>
            </div>
          )}

          {/* Voice controls */}
          {q.type === "voice" && (
            <>
              {phase === "ai_speaking" && !ttsBlocked && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", paddingBottom: 4 }}>AI가 질문을 읽고 있어요...</div>
              )}
              {phase === "submitting" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                  <div style={{ display: "flex", gap: 3 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, animation: `wave-${i} 0.6s ease-in-out ${i*0.12}s infinite alternate` }} />)}</div>
                  <span>답변 저장 중...</span>
                </div>
              )}
              {phase === "review_pass" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "rgba(30,142,62,0.8)" }}>
                  <span>✓</span><span>저장됐어요</span>
                </div>
              )}
              {(phase === "ready" || phase === "recording") && (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Inline mic button */}
                  <button
                    onClick={() => phase === "ready" ? startRecording() : stopRecording()}
                    style={{ width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0, background: phase === "recording" ? C.ruby : C.purple, boxShadow: phase === "recording" ? "0 0 0 6px rgba(217,48,37,0.2),0 0 0 12px rgba(217,48,37,0.07)" : "0 0 0 6px rgba(83,58,253,0.2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s" }}>
                    {phase === "recording" ? Ic.Stop({ s: 20, c: "white" }) : Ic.Mic({ s: 20, c: "white" })}
                  </button>
                  {/* Status text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {phase === "recording" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.ruby, display: "inline-block", flexShrink: 0, animation: "rec-pulse 1.2s ease-in-out infinite" }} />
                          <span style={{ fontSize: 13, color: "rgba(217,48,37,0.9)", fontFeatureSettings: '"tnum"', fontWeight: 500 }}>{fmt(recordTime)}</span>
                          {recordTime < MIN_RECORD_SECS && (
                            <span style={{ fontSize: 11, color: "rgba(255,200,100,0.7)" }}>최소 {MIN_RECORD_SECS - recordTime}초 더</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 2, height: 14 }}>
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} style={{ width: 3, borderRadius: 2, background: C.ruby, opacity: 0.7, animation: `wave-${i % 3} 0.5s ease-in-out ${(i * 0.06).toFixed(2)}s infinite alternate`, height: `${8 + (i % 3) * 4}px` }} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>탭해서 답변 시작</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", marginTop: 2 }}>최소 {MIN_RECORD_SECS}초 이상 답변해 주세요</div>
                      </div>
                    )}
                  </div>
                  {/* Skip */}
                  {phase === "ready" && (
                    <button onClick={() => setShowSkipConfirm(true)} style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, cursor: "pointer", fontFamily: F, padding: "6px 10px", flexShrink: 0 }}>
                      건너뛰기
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Multiple choice */}
          {q.type === "multiple_choice" && Array.isArray(q.options) && phase !== "review_pass" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => setSelectedValue(opt)}
                  style={{ padding: "11px 14px", borderRadius: 10, border: `1px solid ${selectedValue === opt ? C.purple : "rgba(255,255,255,0.13)"}`, background: selectedValue === opt ? "rgba(83,58,253,0.2)" : "rgba(255,255,255,0.04)", color: selectedValue === opt ? C.purpleLight : "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: F, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                  {opt}
                </button>
              ))}
              <button onClick={submitMCLikert} disabled={selectedValue === null}
                style={{ marginTop: 4, padding: "11px", borderRadius: 10, border: "none", background: selectedValue !== null ? C.purple : "rgba(255,255,255,0.1)", color: C.white, fontSize: 14, fontFamily: F, cursor: selectedValue !== null ? "pointer" : "not-allowed", opacity: selectedValue !== null ? 1 : 0.4 }}>
                다음 →
              </button>
            </div>
          )}

          {/* Likert scale */}
          {q.type === "likert" && q.options && phase !== "review_pass" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", width: "100%", flexWrap: "wrap" }}>
                {Array.from({ length: (q.options.max ?? 5) - (q.options.min ?? 1) + 1 }, (_, i) => i + (q.options.min ?? 1)).map(n => {
                  const count = (q.options.max ?? 5) - (q.options.min ?? 1) + 1;
                  return (
                    <button key={n} onClick={() => setSelectedValue(n)}
                      style={{ width: `calc((100% - ${(count - 1) * 8}px) / ${count})`, minWidth: 36, maxWidth: 56, height: 48, borderRadius: 10, border: `1px solid ${selectedValue === n ? C.purple : "rgba(255,255,255,0.18)"}`, background: selectedValue === n ? "rgba(83,58,253,0.28)" : "rgba(255,255,255,0.04)", color: selectedValue === n ? C.purpleLight : "rgba(255,255,255,0.6)", fontSize: 17, fontFamily: F, cursor: "pointer", transition: "all 0.15s" }}>
                      {n}
                    </button>
                  );
                })}
              </div>
              {Array.isArray(q.options.labels) && q.options.labels.length >= 2 && (
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 300 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{q.options.labels[0]}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{q.options.labels[q.options.labels.length - 1]}</span>
                </div>
              )}
              <button onClick={submitMCLikert} disabled={selectedValue === null}
                style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: selectedValue !== null ? C.purple : "rgba(255,255,255,0.1)", color: C.white, fontSize: 14, fontFamily: F, cursor: selectedValue !== null ? "pointer" : "not-allowed", opacity: selectedValue !== null ? 1 : 0.4 }}>
                다음 →
              </button>
            </div>
          )}

          {phase === "review_pass" && q.type !== "voice" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "rgba(30,142,62,0.8)" }}>
              <span>✓</span><span>저장됐어요</span>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>답변은 암호화 저장됩니다</span>
          </div>
        </div>
      </div>
    </div>
  );
}
