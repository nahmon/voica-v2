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
  "Got it, thank you.",
  "Understood.",
  "Thanks for sharing that.",
  "Great, thank you.",
  "Perfect, I've got that.",
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
  return `~${m} min`;
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
  const [nameTouched, setNameTouched] = useState(false);
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
    if (!shareCode) { setLoadError("Invalid interview link."); setLoading(false); return; }
    (async () => {
      const res = await fetch(`/api/interview/${shareCode}`);
      if (!res.ok) {
        let msg = "Interview not found. Please check the link and try again.";
        try {
          const errData = await res.json();
          if (errData.status === "draft") msg = "This interview hasn't been published yet. Activate it before sharing.";
          else if (errData.detail === "Missing Supabase credentials") msg = "Server configuration error. Please contact the administrator.";
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

  // Prefetch all questions' TTS as soon as interview loads (while user is on intro screen)
  useEffect(() => {
    if (!interview || introStep === "started") return;
    interview.questions.forEach(q => prefetchTts(q));
  }, [interview]);

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
          audio.onerror = () => { if (!cancelled) { setTtsReadFallback(true); setPhase(q.type === "voice" ? "ready" : q.type); } };
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
        setRecordingWarning("Recording stopped because the screen was locked. Please record again.");
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
        showToast(d.error || "Unable to start the interview. Please try again.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
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
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("[saveResponse]", res.status, errBody);
        showToast(`Failed to save response (${res.status}): ${errBody.error ?? "Unknown error"}`, "error");
      }
    } catch (e) {
      console.error("[saveResponse exception]", e);
      showToast("Failed to save response. Please check your connection.", "error");
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
      setRecordingWarning("Microphone access is required. Please allow microphone access in your browser settings and try again.");
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
        else { console.error("[stt]", sttRes.status); showToast("Speech recognition failed. Saving without transcript.", "error"); }
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
      setRecordingWarning("Microphone access is required. Please allow microphone access in your browser settings and try again.");
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
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading interview...</div>
    </div>
  );

  if (loadError) return (
    <div style={{ minHeight: "100vh", background: "#202124", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>🔗</div>
      <div style={{ fontSize: isMobile ? 16 : 18, color: C.white, marginBottom: 8 }}>Check your link</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>{loadError}</div>
      <button onClick={() => go("landing")} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: C.purple, color: C.white, fontSize: 14, fontWeight: 500, fontFamily: F, cursor: "pointer" }}>Go home</button>
    </div>
  );

  // ─── Resume prompt ───
  if (introStep === "info" && resumeData) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#202124,#292a2d)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>💬</div>
        <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 600, color: "#fff", marginBottom: 10 }}>You have an interview in progress</div>
        <div style={{ fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.5)", marginBottom: 32, lineHeight: 1.6 }}>
          You completed {resumeData.qIndex + 1} question{resumeData.qIndex + 1 !== 1 ? "s" : ""}.<br />Would you like to continue where you left off?
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => {
            setSessionId(resumeData.sessionId);
            setQIndex(resumeData.qIndex);
            setIntroStep("started");
            setResumeData(null);
          }} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.purple},${C.purpleDeep})`, color: "#fff", fontSize: 14, fontWeight: 500, fontFamily: F, cursor: "pointer" }}>
            Continue →
          </button>
          <button onClick={() => { localStorage.removeItem(`voica_session_${shareCode}`); setResumeData(null); }}
            style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: F, cursor: "pointer" }}>
            Start over
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Warmup ───
  if (introStep === "warmup") return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 28, fontWeight: 500 }}>Step 1 / 2 · Mic Check</div>
        <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: "#fff", marginBottom: 10, lineHeight: 1.2 }}>Can you hear yourself clearly?</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 48, lineHeight: 1.6 }}>
          Speak for three seconds and play it back.
        </div>

        {warmupPhase === "idle" && (
          <>
            <button onClick={startWarmup}
              style={{ width: 128, height: 128, borderRadius: "50%", border: "none", cursor: "pointer", background: C.purple, boxShadow: "0 0 0 12px rgba(83,58,253,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              {Ic.Mic({ s: 40, c: "white" })}
            </button>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 48 }}>Tap mic to start</div>
          </>
        )}

        {warmupPhase === "recording" && (
          <>
            <button onClick={stopWarmup}
              style={{ width: 128, height: 128, borderRadius: "50%", border: "none", cursor: "pointer", background: C.ruby, boxShadow: "0 0 0 12px rgba(217,48,37,0.15),0 0 0 24px rgba(217,48,37,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "rec-pulse 1.2s ease-in-out infinite" }}>
              {Ic.Stop({ s: 36, c: "white" })}
            </button>
            <div style={{ fontSize: 12, color: "rgba(217,48,37,0.8)", marginBottom: 48 }}>Recording... tap to stop</div>
          </>
        )}

        {warmupPhase === "done" && warmupPlayUrl && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 48 }}>
            <audio controls src={warmupPlayUrl} style={{ width: "100%", maxWidth: 320, borderRadius: 10 }} />
            <button onClick={() => { setWarmupPhase("idle"); setWarmupPlayUrl(null); setWarmupBlob(null); }}
              style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: F, textDecoration: "underline" }}>
              Test again
            </button>
          </div>
        )}

        {recordingWarning && (
          <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(255,200,50,0.07)", border: "1px solid rgba(255,200,50,0.2)", fontSize: 13, color: "rgba(255,200,50,0.85)", textAlign: "left" }}>
            {recordingWarning}
          </div>
        )}

        <button
          onClick={() => { setIntroStep("started"); }}
          disabled={warmupPhase === "recording"}
          style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: warmupPhase === "recording" ? "rgba(255,255,255,0.08)" : C.purple, color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: F, cursor: warmupPhase === "recording" ? "not-allowed" : "pointer", opacity: warmupPhase === "recording" ? 0.5 : 1 }}>
          {warmupPhase === "done" ? "Mic confirmed — Start interview →" : "Skip mic check →"}
        </button>
      </div>
    </div>
  );

  // ─── Intro / Info ───
  if (introStep === "info") return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "flex-start", justifyContent: "center", fontFamily: F, padding: "48px 24px 48px", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 576 }}>
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3b5bdb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none"><rect x="0" y="4" width="4" height="10" fill="white" rx="1"/><rect x="6" y="0" width="4" height="14" fill="white" rx="1"/><rect x="12" y="6" width="4" height="8" fill="white" rx="1"/></svg>
          </div>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", fontWeight: 400 }}>voicesurvey · AI interview</span>
        </div>
        {/* Session code */}
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>Session · {(shareCode || "").toUpperCase()}</div>
        {/* Title */}
        <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: "#fff", marginBottom: 10, lineHeight: 1.25 }}>{interview.title}</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>{interview.questions.length} questions · voice responses</span>
          <span>·</span>
          <span>≈ {Math.ceil(estimateDuration(interview.questions) / 60)} min</span>
        </div>
        {interview.description && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 20, lineHeight: 1.65 }}>{interview.description}</div>}
        {interview.incentive && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "rgba(21,190,83,0.08)", border: "1px solid rgba(21,190,83,0.2)", marginBottom: 20 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🎁</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(21,190,83,0.85)" }}>Participation reward</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{interview.incentive}</div>
            </div>
          </div>
        )}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 28 }} />
        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {[
            { key: "name", label: "Nickname", sub: "required", placeholder: "e.g. coffee-saving-desk", required: true },
            { key: "age", label: "Age", sub: "optional", placeholder: "e.g. 29", inputMode: "numeric" },
          ].map(f => (
            <div key={f.key}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{f.label}</label>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>· {f.sub}</span>
              </div>
              <input value={respondent[f.key]} onChange={e => setRespondent(r => ({ ...r, [f.key]: e.target.value }))} onBlur={() => { if (f.key === "name") setNameTouched(true); }} placeholder={f.placeholder} inputMode={f.inputMode}
                style={{ width: "100%", padding: "13px 16px", borderRadius: 10, border: `1px solid ${f.required && nameTouched && !respondent[f.key].trim() ? "rgba(255,80,80,0.4)" : "rgba(255,255,255,0.08)"}`, background: "rgba(255,255,255,0.04)", fontSize: 15, fontFamily: F, color: "#fff", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
              <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Gender</label>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>· optional</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Male", "Female", "Other"].map(g => (
                <button key={g} onClick={() => setRespondent(r => ({ ...r, gender: g }))}
                  style={{ flex: 1, padding: "11px 8px", borderRadius: 10, border: `1px solid ${respondent.gender === g ? C.purple : "rgba(255,255,255,0.08)"}`, background: respondent.gender === g ? "rgba(83,58,253,0.18)" : "rgba(255,255,255,0.04)", color: respondent.gender === g ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer", fontFamily: F, fontWeight: respondent.gender === g ? 500 : 400 }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Audio notice */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🎙️</span>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Turn your audio on.</span> The interviewer reads each question aloud. Headphones recommended.
          </div>
        </div>
        {nameTouched && !respondent.name.trim() && <div style={{ fontSize: 12, color: "rgba(255,100,100,0.7)", marginBottom: 10 }}>Please enter a nickname</div>}
        <button onClick={startSession} disabled={!respondent.name.trim() || starting} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none", background: respondent.name.trim() ? C.purple : "rgba(255,255,255,0.08)", color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: F, cursor: respondent.name.trim() ? "pointer" : "not-allowed", opacity: respondent.name.trim() ? 1 : 0.4 }}>
          Start interview →
        </button>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 16, fontFamily: "monospace", letterSpacing: "0.05em" }}>answers are encrypted end-to-end</div>
      </div>
    </div>
  );

  // ─── Completed ───
  const handleShare = () => {
    track("viral_share_clicked", {});
    const shareText = "I just completed a Voice Survey AI interview! 🎤 voicesurvey.ai";
    if (navigator.share) {
      navigator.share({ title: "Voice Survey interview complete!", text: "I just completed an AI voice interview. Give it a try!", url: "https://voicesurvey.ai" }).catch(() => {});
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
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: F, position: "relative", overflow: "hidden" }}>
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

        <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 700, color: C.white, marginBottom: 10 }}>Interview complete!</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: interview.incentive ? 12 : 20 }}>{isMobile ? "Thank you! Your responses have been saved." : <>Thank you for your valuable input.<br />Your responses have been saved securely.</>}</div>
        {interview.incentive && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "rgba(21,190,83,0.1)", border: "1px solid rgba(21,190,83,0.3)", marginBottom: 20, textAlign: "left" }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🎁</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(21,190,83,0.9)", marginBottom: 2 }}>Participation reward</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{interview.incentive}</div>
            </div>
          </div>
        )}

        {/* Summary card */}
        <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 0.6, marginBottom: 10 }}>Response summary</div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.white, fontFeatureSettings: '"tnum"' }}>{interview.questions.length}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Total questions</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#15be53", fontFeatureSettings: '"tnum"' }}>{interview.questions.length}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Responses submitted</div>
            </div>
          </div>
        </div>

        {/* Share button */}
        <button onClick={handleShare}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", fontSize: 14, fontFamily: F, cursor: "pointer", marginBottom: 16, width: "100%", justifyContent: "center" }}>
          {shareCopied ? "✓ Copied!" : "🔗 Share your completion"}
        </button>

        {/* Primary CTA — go back */}
        <button onClick={() => go("landing")}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", borderRadius: 10, border: "none", background: C.purple, color: C.white, fontSize: 15, fontWeight: 600, fontFamily: F, cursor: "pointer", marginBottom: 24, width: "100%" }}>
          Back to home →
        </button>

        {/* Powered by Voice Survey footer */}
        <div style={{ padding: "16px 20px", borderRadius: 12, border: `1px solid ${C.purpleLight}44`, background: C.purpleBg, textAlign: "left" }}>
          <div style={{ fontSize: 12, color: `${C.purpleLight}`, marginBottom: 8, fontWeight: 500 }}>{isMobile ? "Voice Survey Interview" : "This interview was built with Voice Survey"}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{isMobile ? "Run your own research →" : "Want to run research with voice? →"}</span>
            <button onClick={() => { track("powered_by_voice_survey_clicked", {}); window.location.href = "/"; }}
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 8, border: "none", background: C.purple, color: C.white, fontSize: 12, fontWeight: 600, fontFamily: F, cursor: "pointer", whiteSpace: "nowrap" }}>
              Get started free →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const q = interview.questions[qIndex];

  // ─── Main interview (chat UI) ───
  return (
    <div style={{ height: "100dvh", minHeight: "100vh", background: "#111827", display: "flex", flexDirection: "column", fontFamily: F, position: "relative", overflow: "hidden" }}>
      <style>{INTERVIEW_STYLES}</style>

      {showExitConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#292a2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "28px 24px", width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 8 }}>Exit the interview?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>{isMobile ? "Your responses won't be saved if you leave." : "If you leave now, your saved responses may not be preserved."}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn size="lg" style={{ flex: 1 }} onClick={() => setShowExitConfirm(false)}>Keep going</Btn>
              <Btn variant="ghost" size="lg" style={{ flex: 1, borderColor: "rgba(255,255,255,0.2)", color: C.white }} onClick={() => { track("interview_abandoned", { shareCode, sessionId, qIndex }); setShowExitConfirm(false); go("landing"); }}>Exit</Btn>
            </div>
          </div>
        </div>
      )}

      {showSkipConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#292a2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "28px 24px", width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏭️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 8 }}>Skip this question?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>{isMobile ? "You can skip this question." : "If this question doesn't apply or is too difficult, you can skip it."}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn size="lg" style={{ flex: 1 }} onClick={() => setShowSkipConfirm(false)}>Answer it</Btn>
              <Btn variant="ghost" size="lg" style={{ flex: 1, borderColor: "rgba(255,255,255,0.2)", color: C.white }} onClick={skipQuestion}>Skip</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Ambient glows */}
      <div style={{ position: "absolute", top: -100, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.18),transparent 70%)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.1),transparent)", filter: "blur(70px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Progress bar header */}
      <div style={{ flexShrink: 0, position: "relative", zIndex: 1, padding: isMobile ? "14px 16px 10px" : "18px 32px 12px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => setShowExitConfirm(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", fontFamily: F, padding: 0 }}>Exit</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {(() => {
                const remaining = estimateDuration(interview.questions.slice(qIndex));
                const mins = Math.ceil(remaining / 60);
                return mins > 0 ? (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round"><circle cx="6" cy="6" r="5"/><path d="M6 3.5v2.5l1.5 1.5"/></svg>
                    ~{mins} min left
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
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative", zIndex: 1, padding: isMobile ? "8px 16px 16px" : "8px 32px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 20, flex: 1 }}>
          {completedChats.map((chat, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* AI question bubble */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#3b5bdb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><rect x="0" y="3" width="3" height="7" fill="white" rx="0.8"/><rect x="4.5" y="0" width="3" height="10" fill="white" rx="0.8"/><rect x="9" y="4" width="3" height="6" fill="white" rx="0.8"/></svg>
                </div>
                <div style={{ maxWidth: "78%", background: "rgba(255,255,255,0.12)", borderRadius: "4px 16px 16px 16px", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{chat.qText}</p>
                </div>
              </div>
              {/* User answer bubble */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "78%", background: "rgba(83,58,253,0.55)", borderRadius: "16px 4px 16px 16px", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: chat.skipped ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.8)", lineHeight: 1.6, fontStyle: chat.skipped ? "italic" : "normal" }}>
                    {chat.skipped
                      ? "Skipped"
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
      <div style={{ flexShrink: 0, position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.07)", background: "#141d2e", padding: isMobile ? "16px 16px calc(28px + env(safe-area-inset-bottom,0px))" : "20px 32px calc(28px + env(safe-area-inset-bottom,0px))" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>

          {/* AI avatar row + current question */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3b5bdb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: phase === "ai_speaking" ? "0 0 14px rgba(59,91,219,0.5)" : "none", transition: "box-shadow 0.4s" }}>
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><rect x="0" y="3" width="3.5" height="9" fill="white" rx="1"/><rect x="5.25" y="0" width="3.5" height="12" fill="white" rx="1"/><rect x="10.5" y="5" width="3.5" height="7" fill="white" rx="1"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: C.purpleLight, marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                {phase === "ai_speaking" ? <WaveAnimation active /> : <span style={{ color: "rgba(255,255,255,0.3)" }}>AI Interviewer</span>}
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
                🔊 Enable sound and listen again
              </button>
              <button onClick={() => { setTtsReadFallback(true); setPhase(q.type === "voice" ? "ready" : q.type); }}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, cursor: "pointer", fontFamily: F, padding: "8px 14px" }}>
                📖 Read the question and continue
              </button>
            </div>
          )}

          {/* Voice controls */}
          {q.type === "voice" && (
            <div style={{ minHeight: 160, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {phase === "ai_speaking" && !ttsBlocked && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", paddingBottom: 4 }}>AI is reading the question...</div>
              )}
              {phase === "submitting" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                  <div style={{ display: "flex", gap: 3 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, animation: `wave-${i} 0.6s ease-in-out ${i*0.12}s infinite alternate` }} />)}</div>
                  <span>Saving response...</span>
                </div>
              )}
              {phase === "review_pass" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "rgba(30,142,62,0.8)" }}>
                  <span>✓</span><span>Saved</span>
                </div>
              )}
              {(phase === "ready" || phase === "recording") && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  {/* Big centered mic button */}
                  <button
                    onClick={() => phase === "ready" ? startRecording() : stopRecording()}
                    style={{ width: 72, height: 72, borderRadius: "50%", border: "none", cursor: "pointer", background: phase === "recording" ? C.ruby : C.purple, boxShadow: phase === "recording" ? "0 0 0 8px rgba(217,48,37,0.2),0 0 0 16px rgba(217,48,37,0.07)" : "0 0 0 8px rgba(83,58,253,0.2),0 0 0 16px rgba(83,58,253,0.07)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s", animation: phase === "recording" ? "rec-pulse 1.2s ease-in-out infinite" : "none" }}>
                    {phase === "recording" ? Ic.Stop({ s: 28, c: "white" }) : Ic.Mic({ s: 28, c: "white" })}
                  </button>
                  {/* Status text below */}
                  {phase === "recording" ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.ruby, display: "inline-block", animation: "rec-pulse 1.2s ease-in-out infinite" }} />
                        <span style={{ fontSize: 14, color: "rgba(217,48,37,0.9)", fontFeatureSettings: '"tnum"', fontWeight: 600 }}>{fmt(recordTime)}</span>
                        {recordTime < MIN_RECORD_SECS && (
                          <span style={{ fontSize: 11, color: "rgba(255,200,100,0.7)" }}>{MIN_RECORD_SECS - recordTime}s more</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 2, height: 14 }}>
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} style={{ width: 3, borderRadius: 2, background: C.ruby, opacity: 0.7, animation: `wave-${i % 3} 0.5s ease-in-out ${(i * 0.06).toFixed(2)}s infinite alternate`, height: `${8 + (i % 3) * 4}px` }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Tap to start your response</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>Please respond for at least {MIN_RECORD_SECS} seconds</div>
                    </div>
                  )}
                  {/* Skip */}
                  {phase === "ready" && (
                    <button onClick={() => setShowSkipConfirm(true)} style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", background: "none", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: F, padding: "4px 8px", marginTop: 2 }}>
                      Skip
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Multiple choice */}
          {q.type === "multiple_choice" && Array.isArray(q.options) && phase !== "review_pass" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => setSelectedValue(opt)}
                  style={{ padding: "11px 14px", borderRadius: 10, border: "none", background: selectedValue === opt ? C.purple : "rgba(255,255,255,0.1)", color: selectedValue === opt ? C.white : "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: F, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                  {opt}
                </button>
              ))}
              <button onClick={submitMCLikert} disabled={selectedValue === null}
                style={{ marginTop: 4, padding: "11px", borderRadius: 10, border: "none", background: selectedValue !== null ? C.purple : "rgba(255,255,255,0.1)", color: C.white, fontSize: 14, fontFamily: F, cursor: selectedValue !== null ? "pointer" : "not-allowed", opacity: selectedValue !== null ? 1 : 0.4 }}>
                Next →
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
                      style={{ width: `calc((100% - ${(count - 1) * 8}px) / ${count})`, minWidth: 36, maxWidth: 56, height: 48, borderRadius: 10, border: "none", background: selectedValue === n ? C.purple : "rgba(255,255,255,0.1)", color: selectedValue === n ? C.white : "rgba(255,255,255,0.6)", fontSize: 17, fontFamily: F, cursor: "pointer", transition: "all 0.15s" }}>
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
                Next →
              </button>
            </div>
          )}

          {phase === "review_pass" && q.type !== "voice" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "rgba(30,142,62,0.8)" }}>
              <span>✓</span><span>Saved</span>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.1)" }}>Your responses are encrypted and stored securely</span>
          </div>
        </div>
      </div>
    </div>
  );
}
