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

export default function InterviewScreen({ go, shareCode }) {
  const isMobile = useIsMobile();

  // Interview data
  const [interview, setInterview] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session
  const [sessionId, setSessionId] = useState(null);
  const [respondent, setRespondent] = useState({ name: "", age: "", gender: "" });
  const [introStep, setIntroStep] = useState("info"); // "info" | "started"

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

  // MC/Likert
  const [selectedValue, setSelectedValue] = useState(null);

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
      if (!res.ok) { setLoadError("인터뷰를 찾지 못했어요. 링크를 다시 확인해요."); setLoading(false); return; }
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
      timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
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
        setIntroStep("started");
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

  const advanceOrComplete = () => {
    const qType = interview.questions[qIndex]?.type;
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
    } catch {
      setRecordingWarning("마이크 권한이 필요해요. 브라우저 설정에서 마이크를 허용한 후 다시 시도해 주세요.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    setPhase("submitting");
    mr.onstop = async () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const mimeType = mr.mimeType;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = mimeType.includes("webm") ? "webm" : "mp4";
      const q = interview.questions[qIndex];
      let audioUrl = null;
      let transcript = null;
      // Upload audio — independent of STT
      try {
        const path = `${sessionId}/${q.id}.${ext}`;
        const { data: uploaded, error: uploadError } = await supabase.storage.from("audio-responses").upload(path, blob, { contentType: mimeType, upsert: true });
        if (uploadError) { console.error("[audio upload]", uploadError); showToast("녹음 저장에 실패했어요. 응답은 계속 진행됩니다.", "error"); }
        else if (uploaded) {
          const { data: signedData } = await supabase.storage.from("audio-responses").createSignedUrl(path, 31536000);
          if (signedData) audioUrl = signedData.signedUrl;
        }
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
      setPhase("review_pass");
      setTimeout(advanceOrComplete, 1200);
    };
    mr.stop();
  };

  const submitMCLikert = async () => {
    if (selectedValue === null) return;
    const q = interview.questions[qIndex];
    const isLikert = q.type === "likert";
    await saveResponse({ value: isLikert ? selectedValue : [selectedValue] });
    setPhase("review_pass");
    setTimeout(advanceOrComplete, 800);
  };

  const skipQuestion = async () => {
    setShowSkipConfirm(false);
    await saveResponse({ skipped: true });
    track("interview_q_skipped", { shareCode, sessionId, qIndex });
    advanceOrComplete();
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
      <div style={{ fontSize: 18, color: C.white, marginBottom: 8 }}>링크를 확인해 주세요</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{loadError}</div>
    </div>
  );

  // ─── Resume prompt ───
  if (introStep === "info" && resumeData) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#202124,#292a2d)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>💬</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 10 }}>이전 인터뷰가 있어요</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 32, lineHeight: 1.6 }}>
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

  // ─── Intro / Info ───
  if (introStep === "info") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#202124 0%,#292a2d 50%,#202124 100%)", display: "flex", alignItems: "flex-start", justifyContent: "center", fontFamily: F, padding: "40px 24px 40px", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1a73e8,#e8710a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 400 }}>Voica AI 인터뷰</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, color: C.white, marginBottom: 8, lineHeight: 1.3 }}>{interview.title}</div>
        {interview.description && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 28, lineHeight: 1.6 }}>{interview.description}</div>}
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>질문 {interview.questions.length}개 · 음성 응답 포함</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {[
            { key: "name", label: "닉네임 (선택)", placeholder: "예: 커피좋아하는직장인" },
            { key: "age", label: "나이 (선택)", placeholder: "예: 29", inputMode: "numeric" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>{f.label}</label>
              <input value={respondent[f.key]} onChange={e => setRespondent(r => ({ ...r, [f.key]: e.target.value }))} placeholder={f.placeholder} inputMode={f.inputMode}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", fontSize: 16, fontFamily: F, color: C.white, outline: "none", boxSizing: "border-box" }} />
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
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>AI 인터뷰어가 질문을 음성으로 읽어드립니다. 이어폰 착용을 권장합니다.</div>
          </div>
        </div>
        <button onClick={startSession} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.purple},${C.purpleDeep})`, color: C.white, fontSize: 15, fontWeight: 500, fontFamily: F, cursor: "pointer" }}>
          인터뷰 시작하기 →
        </button>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 14 }}>답변은 암호화 저장됩니다</div>
      </div>
    </div>
  );

  // ─── Completed ───
  const [shareCopied, setShareCopied] = useState(false);
  const handleShare = () => {
    track("viral_share_clicked", {});
    const shareText = "나는 방금 Voica AI 인터뷰에 참여했어요! 🎤 voica.kr";
    if (navigator.share) {
      navigator.share({ title: "Voica 인터뷰 완료!", text: "방금 AI 음성 인터뷰에 참여했어요. 당신도 해보세요!", url: "https://voica.kr" }).catch(() => {});
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

        <div style={{ fontSize: 32, fontWeight: 700, color: C.white, marginBottom: 10 }}>인터뷰 완료!</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 20 }}>소중한 의견 감사해요.<br />답변을 안전하게 저장했어요.</div>

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

        {/* Powered by Voica footer */}
        <div style={{ padding: "16px 20px", borderRadius: 12, border: `1px solid rgba(124,58,237,0.3)`, background: "rgba(124,58,237,0.08)", textAlign: "left" }}>
          <div style={{ fontSize: 12, color: `${C.purpleLight}`, marginBottom: 8, fontWeight: 500 }}>🎤 Voica로 만들어진 인터뷰예요</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>당신의 목소리로 리서치하고 싶다면 →</span>
            <button onClick={() => { track("powered_by_voica_clicked", {}); window.location.href = "/"; }}
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 8, border: "none", background: C.purple, color: C.white, fontSize: 12, fontWeight: 600, fontFamily: F, cursor: "pointer", whiteSpace: "nowrap" }}>
              무료로 시작하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const q = interview.questions[qIndex];

  // ─── Main interview ───
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#202124 0%,#292a2d 45%,#303134 80%,#202124 100%)", display: "flex", flexDirection: "column", fontFamily: F, position: "relative", overflow: "hidden" }}>
      <style>{INTERVIEW_STYLES}</style>

      {showExitConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#292a2d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "28px 24px", width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 8 }}>인터뷰를 중단하시겠습니까?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>지금 나가면 저장된 답변이 유지되지 않을 수 있습니다.</div>
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
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 24 }}>답변하기 어렵거나 관련 없는 질문이라면 건너뛸 수 있어요.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn size="lg" style={{ flex: 1 }} onClick={() => setShowSkipConfirm(false)}>계속 답변</Btn>
              <Btn variant="ghost" size="lg" style={{ flex: 1, borderColor: "rgba(255,255,255,0.2)", color: C.white }} onClick={skipQuestion}>건너뛰기</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Ambient glows */}
      <div style={{ position: "absolute", top: -100, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(26,115,232,0.2),transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,113,10,0.15),transparent)", filter: "blur(70px)", pointerEvents: "none" }} />

      {/* Progress bar */}
      <div style={{ position: "relative", padding: isMobile ? "14px 16px 0" : "18px 32px 0" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => setShowExitConfirm(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", fontFamily: F, padding: 0 }}>나가기</button>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFeatureSettings: '"tnum"', fontWeight: 500 }}>
              질문 {qIndex + 1} / {interview.questions.length}
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${((qIndex + 1) / interview.questions.length) * 100}%`, background: `linear-gradient(90deg,${C.purple},${C.magenta})`, borderRadius: 2, transition: "width 0.5s ease" }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "24px 16px" : "32px" }}>
        <div key={qAnimKey} style={{ width: "100%", maxWidth: 700, animation: "q-fade-in 0.35s ease forwards" }}>

          {/* AI avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#1a73e8,#e8710a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, boxShadow: phase === "ai_speaking" ? "0 0 20px rgba(26,115,232,0.5)" : "none", transition: "box-shadow 0.5s" }}>✦</div>
            <div>
              <div style={{ fontSize: 11, color: C.purpleLight, marginBottom: 2 }}>AI 인터뷰어 · Voica</div>
              {phase === "ai_speaking" ? <WaveAnimation active /> : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>질문이 끝났어요</span>}
            </div>
          </div>

          {/* Question bubble */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: isMobile ? "18px 16px" : "28px 28px", marginBottom: 32, backdropFilter: "blur(8px)" }}>
            <p style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 400, color: C.white, lineHeight: 1.7, letterSpacing: -0.3 }}>{q.content}</p>
          </div>

          {/* Response area */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

            {/* Voice question */}
            {q.type === "voice" && (
              <>
                {recordingWarning && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8, background: "rgba(255,200,50,0.1)", border: "1px solid rgba(255,200,50,0.25)", marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ fontSize: 12, color: "rgba(255,200,50,0.9)" }}>{recordingWarning}</span>
                    <button onClick={() => setRecordingWarning(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", padding: 0 }}>✕</button>
                  </div>
                )}
                {phase === "ai_speaking" && !ttsBlocked && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>AI가 질문을 읽고 있어요...</div>}
                {phase === "ai_speaking" && ttsBlocked && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 8, background: "rgba(255,200,50,0.08)", border: "1px solid rgba(255,200,50,0.25)", width: "100%", boxSizing: "border-box" }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>🔇</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,200,50,0.9)", marginBottom: 2 }}>음성 재생이 차단됐어요</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>기기 소리를 켜거나, 질문 텍스트를 직접 확인하세요.</div>
                      </div>
                    </div>
                    <button onClick={async () => {
                      setTtsBlocked(false);
                      if (audioRef.current) {
                        try { await audioRef.current.play(); }
                        catch { setPhase(q.type === "voice" ? "ready" : q.type); }
                      } else {
                        setPhase(q.type === "voice" ? "ready" : q.type);
                      }
                    }} style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: C.purple, color: C.white, fontSize: 14, fontWeight: 500, fontFamily: F, cursor: "pointer", width: "100%" }}>
                      🔊 소리 켜고 다시 듣기
                    </button>
                    <button onClick={() => { setTtsReadFallback(true); setPhase(q.type === "voice" ? "ready" : q.type); }}
                      style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, cursor: "pointer", fontFamily: F, padding: "10px 16px", width: "100%" }}>
                      📖 질문 텍스트로 확인하고 진행
                    </button>
                  </div>
                )}

                {phase === "submitting" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0,1,2,3,4].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.purple, opacity: 0.4, animation: `wave-${i%3} 0.6s ease-in-out ${i*0.12}s infinite alternate` }} />)}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>답변을 저장하고 있어요...</div>
                  </div>
                )}

                {phase === "review_pass" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(30,142,62,0.8)" }}>
                    <span>✓</span><span>답변을 저장했어요. 다음 질문으로 넘어가요...</span>
                  </div>
                )}

                {phase === "recording" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 36 }}>
                      {Array.from({ length: 22 }).map((_, i) => (
                        <div key={i} style={{ width: 3, borderRadius: 2, background: C.ruby, animation: `wave-${i % 3} 0.5s ease-in-out ${(i * 0.05).toFixed(2)}s infinite alternate` }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "rgba(217,48,37,0.9)", fontFeatureSettings: '"tnum"', display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.ruby, display: "inline-block", animation: "rec-pulse 1.2s ease-in-out infinite" }} />
                        {fmt(recordTime)}
                      </span>
                      {recordTime < MIN_RECORD_SECS && (
                        <span style={{ fontSize: 11, color: "rgba(255,200,100,0.7)" }}>최소 {MIN_RECORD_SECS - recordTime}초 더 답변해 주세요</span>
                      )}
                    </div>
                  </div>
                )}

                {(phase === "ready" || phase === "recording") && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => phase === "ready" ? startRecording() : stopRecording()}
                      style={{ width: 68, height: 68, borderRadius: "50%", border: "none", cursor: "pointer", background: phase === "recording" ? C.ruby : C.purple, boxShadow: phase === "recording" ? "0 0 0 8px rgba(217,48,37,0.2),0 0 0 16px rgba(217,48,37,0.08)" : "0 0 0 8px rgba(26,115,232,0.2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s" }}>
                      {phase === "recording" ? Ic.Stop({ s: 24, c: "white" }) : Ic.Mic({ s: 24, c: "white" })}
                    </button>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                      {phase === "recording" ? "탭하여 완료" : "탭하여 녹음 시작"}
                    </span>
                  </div>
                )}

                {phase === "ready" && (
                  <div style={{ textAlign: "center", width: "100%" }}>
                    {ttsReadFallback && (
                      <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(83,58,253,0.12)", border: `1px solid rgba(83,58,253,0.3)`, marginBottom: 14, textAlign: "left" }}>
                        <div style={{ fontSize: 11, color: C.purpleLight, marginBottom: 6, fontWeight: 600 }}>질문 텍스트</div>
                        <div style={{ fontSize: 16, color: C.white, lineHeight: 1.65, fontWeight: 400 }}>{q.content}</div>
                      </div>
                    )}
                    {recordingWarning ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8, background: "rgba(217,48,37,0.1)", border: "1px solid rgba(217,48,37,0.25)", marginBottom: 10 }}
                        onClick={() => setRecordingWarning(null)}>
                        <span style={{ fontSize: 16 }}>⚠️</span>
                        <div style={{ fontSize: 12, color: "rgba(255,180,180,0.9)", lineHeight: 1.5, textAlign: "left" }}>{recordingWarning}</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>버튼을 눌러 답변을 시작해요</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>최소 {MIN_RECORD_SECS}초 이상 답변 후 다시 눌러 완료</div>
                      </>
                    )}
                    <button onClick={() => setShowSkipConfirm(true)} style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.28)", background: "none", border: "none", cursor: "pointer", fontFamily: F, textDecoration: "underline" }}>
                      이 질문 건너뛰기
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Multiple choice */}
            {q.type === "multiple_choice" && Array.isArray(q.options) && phase !== "review_pass" && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => setSelectedValue(opt)}
                    style={{ padding: "14px 18px", borderRadius: 10, border: `1px solid ${selectedValue === opt ? C.purple : "rgba(255,255,255,0.15)"}`, background: selectedValue === opt ? "rgba(83,58,253,0.2)" : "rgba(255,255,255,0.04)", color: selectedValue === opt ? C.purpleLight : "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: F, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    {opt}
                  </button>
                ))}
                <button onClick={submitMCLikert} disabled={selectedValue === null}
                  style={{ marginTop: 8, padding: "12px", borderRadius: 10, border: "none", background: selectedValue !== null ? C.purple : "rgba(255,255,255,0.1)", color: C.white, fontSize: 14, fontFamily: F, cursor: selectedValue !== null ? "pointer" : "not-allowed", opacity: selectedValue !== null ? 1 : 0.4 }}>
                  다음 질문 →
                </button>
              </div>
            )}

            {/* Likert scale */}
            {q.type === "likert" && q.options && phase !== "review_pass" && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", width: "100%", flexWrap: "wrap" }}>
                  {Array.from({ length: (q.options.max ?? 5) - (q.options.min ?? 1) + 1 }, (_, i) => i + (q.options.min ?? 1)).map(n => {
                    const count = (q.options.max ?? 5) - (q.options.min ?? 1) + 1;
                    return (
                      <button key={n} onClick={() => setSelectedValue(n)}
                        style={{ width: `calc((100% - ${(count - 1) * 8}px) / ${count})`, minWidth: 40, maxWidth: 60, height: 52, borderRadius: 10, border: `1px solid ${selectedValue === n ? C.purple : "rgba(255,255,255,0.2)"}`, background: selectedValue === n ? "rgba(83,58,253,0.3)" : "rgba(255,255,255,0.04)", color: selectedValue === n ? C.purpleLight : "rgba(255,255,255,0.6)", fontSize: 18, fontFamily: F, cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}>
                        {n}
                      </button>
                    );
                  })}
                </div>
                {Array.isArray(q.options.labels) && q.options.labels.length >= 2 && (
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 320 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{q.options.labels[0]}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{q.options.labels[q.options.labels.length - 1]}</span>
                  </div>
                )}
                <button onClick={submitMCLikert} disabled={selectedValue === null}
                  style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: selectedValue !== null ? C.purple : "rgba(255,255,255,0.1)", color: C.white, fontSize: 14, fontFamily: F, cursor: selectedValue !== null ? "pointer" : "not-allowed", opacity: selectedValue !== null ? 1 : 0.4 }}>
                  다음 질문 →
                </button>
              </div>
            )}

            {phase === "review_pass" && q.type !== "voice" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(30,142,62,0.8)" }}>
                <span>✓</span><span>답변을 저장했어요. 다음 질문으로 넘어가요...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "12px 24px 20px" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>답변은 암호화 저장됩니다</span>
      </div>
    </div>
  );
}
