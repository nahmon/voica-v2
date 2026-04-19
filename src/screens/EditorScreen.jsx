import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, Btn, useToast } from "../components/shared.jsx";
import { track } from "../lib/analytics.js";
import { TEMPLATES, templateToQuestions } from "../lib/templates.js";

function newQ(type = "voice") {
  const id = Math.random().toString(36).slice(2, 10);
  if (type === "multiple_choice") return { id, type, content: "", options: ["", "", ""] };
  if (type === "likert") return { id, type, content: "", options: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] } };
  return { id, type, content: "" };
}

function mkId() { return Math.random().toString(36).slice(2, 10); }

const VOICA_SURVEY_TEMPLATE = {
  title: "Voice Survey User Satisfaction Study — Researchers & Marketers",
  questions: [
    { id: mkId(), type: "multiple_choice", content: "Which best describes your primary role?", options: ["UX Researcher / Design Researcher", "Marketer / Brand Manager", "Product Manager", "Business Development / Strategy", "Other"] },
    { id: mkId(), type: "multiple_choice", content: "How often do you personally conduct user or customer research?", options: ["Almost every week", "1–2 times a month", "Once a quarter", "Only when needed (2 or fewer times a year)"] },
    { id: mkId(), type: "voice", content: "Walk me through how you currently conduct user interviews or surveys — what tools and methods do you use, from recruiting participants all the way through to analysis?" },
    { id: mkId(), type: "voice", content: "Which stage takes the most time or causes the most stress? If you've had a particularly frustrating experience recently, please share the details." },
    { id: mkId(), type: "multiple_choice", content: "What is the average total cost for a single user interview project? (Including participant recruiting, facilitation, and analysis)", options: ["Under $500", "$500–$2,000", "$2,000–$5,000", "$5,000+", "Outsourced to an external agency"] },
    { id: mkId(), type: "multiple_choice", content: "What is your approximate annual budget for user research? (Excluding internal labor costs)", options: ["Under $5,000", "$5,000–$20,000", "$20,000–$50,000", "$50,000+"] },
    { id: mkId(), type: "multiple_choice", content: "On average, how long does it take to complete a single interview project?", options: ["1–2 days", "3–7 days", "2+ weeks", "1+ month"] },
    { id: mkId(), type: "multiple_choice", content: "Which of these stages is the most burdensome?", options: ["Recruiting participants and scheduling", "Conducting the interview itself", "Transcription and note-taking", "Insight analysis and report writing"] },
    { id: mkId(), type: "voice", content: "If AI could conduct voice interviews with hundreds of participants simultaneously and deliver an analysis report in under 10 minutes — how does that compare to how you research today? Be honest." },
    { id: mkId(), type: "voice", content: "What concerns or doubts do you have about this kind of AI-driven interview approach?" },
    { id: mkId(), type: "voice", content: "What conditions would need to be in place for your team or organization to adopt a tool like Voice Survey? Think about budget, security, data quality — what are the hurdles?" },
    { id: mkId(), type: "multiple_choice", content: "For a 50-participant interview project (AI-conducted + analysis report included), what would be a reasonable price?", options: ["Under $50", "$50–$150", "$150–$300", "$300–$500", "$500+ is worth it"] },
    { id: mkId(), type: "multiple_choice", content: "What pricing model do you prefer?", options: ["Free plan to try first", "Monthly subscription (predictable cost)", "Annual contract (discount-focused)", "Team / enterprise contract"] },
    { id: mkId(), type: "voice", content: "Finally, if Voice Survey could solve just one problem in your research workflow, what would you want that to be?" },
  ],
};

const DRAFT_KEY = "voica_editor_draft";
const MAX_Q_CHARS = 200;

// Question type definitions with icons and descriptions
const Q_TYPES = [
  { type: "voice",           icon: "🎙", label: "음성 답변",   desc: "참여자가 자유롭게 음성으로 답변해요" },
  { type: "multiple_choice", icon: "☑",  label: "객관식",     desc: "미리 정해진 보기 중 하나를 선택해요" },
  { type: "likert",          icon: "📊", label: "평가 척도",  desc: "1~5점 척도로 평가해요" },
];

export default function EditorScreen({ go, user, logout, interviewId }) {
  const { showToast } = useToast();
  // Restore draft from localStorage only when creating new (no interviewId)
  const savedDraft = !interviewId ? (() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch { return null; } })() : null;
  const [title, setTitle] = useState(savedDraft?.title ?? "");
  const [incentive, setIncentive] = useState(savedDraft?.incentive ?? "");
  const [rewardAmount, setRewardAmount] = useState(() => {
    const m = (savedDraft?.incentive ?? "").match(/(\d[\d,]*)/);
    return m ? parseInt(m[1].replace(/,/g, "")) : 0;
  });
  const [questions, setQuestions] = useState(savedDraft?.questions ?? [newQ("voice")]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [shareCode, setShareCode] = useState(null);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [editingId, setEditingId] = useState(interviewId ?? null);
  const [loadingExisting, setLoadingExisting] = useState(!!interviewId);
  const [copied, setCopied] = useState(false);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [showIncompleteWarn, setShowIncompleteWarn] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [savedTitle, setSavedTitle] = useState(savedDraft?.title ?? "");
  const [savedIncentive, setSavedIncentive] = useState(savedDraft?.incentive ?? "");
  const [savedQuestions, setSavedQuestions] = useState(savedDraft?.questions ?? [newQ("voice")]);
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const dragIdx = useRef(null);
  const isMobile = useIsMobile();

  // Track whether there are unsaved changes
  const hasUnsaved = title !== savedTitle || incentive !== savedIncentive || JSON.stringify(questions) !== JSON.stringify(savedQuestions);

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const generated = data.questions.map(q => ({ ...q, id: mkId() }));
      setQuestions(generated);
      setSelectedIdx(0);
      setShowAiModal(false);
      setAiPrompt("");
      showToast("AI 초안 질문이 생성됐어요 ✓", "success");
    } catch (e) {
      showToast(e.message || "AI generation failed", "error");
    } finally {
      setAiGenerating(false);
    }
  };

  // Load existing interview from DB when editing
  useEffect(() => {
    if (!interviewId) return;
    (async () => {
      try {
        const [{ data: iv }, { data: qs }] = await Promise.all([
          supabase.from("interviews").select("id, title, incentive, share_code").eq("id", interviewId).single(),
          supabase.from("questions").select("*").eq("interview_id", interviewId).order("order_num"),
        ]);
        if (iv) {
          setTitle(iv.title ?? "");
          setSavedTitle(iv.title ?? "");
          setIncentive(iv.incentive ?? "");
          setSavedIncentive(iv.incentive ?? "");
          const rwMatch = (iv.incentive ?? "").match(/(\d[\d,]*)/);
          if (rwMatch) setRewardAmount(parseInt(rwMatch[1].replace(/,/g, "")));
          if (iv.share_code) setShareCode(iv.share_code);
        }
        if (qs && qs.length > 0) {
          const loaded = qs.map(q => ({ id: q.id, type: q.type, content: q.content, options: q.options }));
          setQuestions(loaded);
          setSavedQuestions(loaded);
          setSelectedIdx(0);
        }
      } catch (e) {
        console.error("[EditorScreen load]", e);
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [interviewId]);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, incentive, questions }));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 1500);
  };

  // Debounce auto-save on change (new interviews only)
  useEffect(() => {
    if (editingId) return;
    const timer = setTimeout(saveDraft, 800);
    return () => clearTimeout(timer);
  }, [title, questions, editingId]);

  // 3-minute interval auto-save (all interviews)
  useEffect(() => {
    const interval = setInterval(saveDraft, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [title, incentive, questions]);

  // Keyboard shortcut: Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const loadTemplate = () => {
    const hasContent = title.trim() || questions.some(q => q.content.trim());
    if (hasContent && !window.confirm("현재 내용이 템플릿으로 교체돼요. 계속할까요?")) return;
    setTitle(VOICA_SURVEY_TEMPLATE.title);
    setQuestions(VOICA_SURVEY_TEMPLATE.questions.map(q => ({ ...q, id: mkId() })));
    setSelectedIdx(0);
    setTemplateOpen(false);
  };

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setQuestions(templateToQuestions(tpl));
    setSelectedIdx(0);
  };

  const isEmpty = !title.trim() && questions.length === 1 && !questions[0].content.trim();

  const TemplateBanner = isEmpty && !editingId && (
    <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "20px 24px 16px" }}>
      {/* AI section */}
      <div style={{ background: "linear-gradient(135deg,rgba(83,58,253,0.06),rgba(249,107,238,0.06))", border: `1.5px solid rgba(83,58,253,0.18)`, borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#533afd,#f96bee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>✦</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>AI로 초안 만들기</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setShowAiModal(true); } }}
            placeholder="인터뷰 목적을 설명하세요 — 예: 20대 앱 사용자의 불편함을 파악하고 싶어요"
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, outline: "none", minWidth: 0 }}
            onFocus={e => e.target.style.borderColor = C.purple}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          <button
            onClick={() => setShowAiModal(true)}
            style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#533afd,#f96bee)", color: C.white, fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            초안 생성
          </button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>템플릿으로 시작하기</div>
        <button
          onClick={() => applyTemplate({ title: "", questions: [] }) || setTitle("") || setQuestions([newQ("voice")])}
          style={{ background: "none", border: "none", fontSize: 12, color: C.body, cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          빈 템플릿으로 시작
        </button>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {TEMPLATES.map(tpl => (
          <div key={tpl.id} style={{ flexShrink: 0, width: 160, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 22 }}>{tpl.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, lineHeight: 1.3 }}>{tpl.title}</div>
            <div style={{ fontSize: 11, color: C.body, lineHeight: 1.4, flex: 1 }}>{tpl.desc}</div>
            <button
              onClick={() => applyTemplate(tpl)}
              style={{ marginTop: 4, padding: "6px 0", borderRadius: 8, border: "none", background: C.purple, color: C.white, fontSize: 12, fontWeight: 500, fontFamily: F, cursor: "pointer" }}
            >
              템플릿 사용
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const q = questions[selectedIdx] ?? questions[0];

  const updateQ = (idx, patch) =>
    setQuestions(qs => qs.map((item, i) => i === idx ? { ...item, ...patch } : item));

  const addQuestion = (type) => {
    const next = [...questions, newQ(type)];
    setQuestions(next);
    setSelectedIdx(next.length - 1);
    setAddTypeOpen(false);
  };

  const duplicateQ = (idx, e) => {
    e.stopPropagation();
    const orig = questions[idx];
    const copy = { ...orig, id: mkId() };
    const next = [...questions];
    next.splice(idx + 1, 0, copy);
    setQuestions(next);
    setSelectedIdx(idx + 1);
  };

  const removeQ = (idx) => {
    if (questions.length === 1) return;
    const next = questions.filter((_, i) => i !== idx);
    setQuestions(next);
    setSelectedIdx(Math.min(idx, next.length - 1));
  };

  const moveQ = (idx, dir) => {
    const next = [...questions];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setQuestions(next);
    setSelectedIdx(target);
  };

  const doSave = async () => {
    setShowIncompleteWarn(false);
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const payload = {
        title: title.trim(),
        incentive: rewardAmount > 0 ? `₩${rewardAmount.toLocaleString("ko-KR")}` : null,
        questions: questions.map((q, i) => ({
          id: q.id,
          order_num: i + 1,
          type: q.type,
          content: q.content,
          options: q.options ?? null,
        })),
      };
      if (editingId) payload.id = editingId;
      const res = await fetch("/api/interview", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setShareCode(data.share_code);
      // Mark as saved
      setSavedTitle(title);
      setSavedIncentive(incentive);
      setSavedQuestions(questions);
      if (!editingId) {
        track("interview_published", { shareCode: data.share_code, questionCount: questions.length });
        setShowShareOverlay(true); // only for new interviews
      } else {
        showToast("저장됐어요 ✓", "success");
      }
      if (!editingId && data.interview?.id) setEditingId(data.interview.id);
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      showToast(e.message || "Failed to save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) { showToast("인터뷰 제목을 입력해주세요", "error"); return; }
    if (questions.some(q => !q.content.trim())) { showToast("모든 질문 내용을 입력해주세요", "error"); return; }
    if (questions.length < 10) { setShowIncompleteWarn(true); return; }
    doSave();
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}/i/${shareCode}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabel = { voice: "음성", multiple_choice: "객관식", likert: "평가" };
  const typeVariant = { voice: "purple", multiple_choice: "success", likert: "warning" };

  // ─── Overlays (share success + incomplete warning) ───
  const shareUrl = shareCode ? `${window.location.origin}/i/${shareCode}` : null;

  const ShareOverlay = showShareOverlay && shareCode && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 20, padding: "40px 36px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "rgba(50,50,93,0.2) 0px 40px 80px -16px", animation: "fadeInUp 0.2s ease" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(21,190,83,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          {Ic.CheckCircle({ s: 28, c: C.success })}
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 8 }}>링크가 준비됐어요</div>
        <div style={{ fontSize: 13, color: C.body, marginBottom: 20, lineHeight: 1.6 }}>
          아래 링크를 참여자에게 공유하세요.<br />로그인 없이 바로 참여할 수 있어요.
        </div>

        {/* Reward picker */}
        <div style={{ background: C.bg, borderRadius: 12, padding: "16px", marginBottom: 20, textAlign: "left", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 10, letterSpacing: 0.5 }}>참여 보상 설정</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: rewardAmount > 0 ? 10 : 0 }}>
            {[0, 1000, 3000, 5000, 10000].map(amt => (
              <button key={amt} onClick={() => {
                setRewardAmount(amt);
                if (editingId) supabase.from("interviews").update({ incentive: amt > 0 ? `₩${amt.toLocaleString("ko-KR")}` : null }).eq("id", editingId);
              }}
                style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${rewardAmount === amt ? C.purple : C.border}`, background: rewardAmount === amt ? C.purpleBg : C.white, color: rewardAmount === amt ? C.purple : C.body, fontSize: 13, fontFamily: F, cursor: "pointer", fontWeight: rewardAmount === amt ? 600 : 400, transition: "all 0.15s" }}>
                {amt === 0 ? "없음" : amt === 1000 ? "₩1,000" : amt === 3000 ? "₩3,000 ✦" : amt === 5000 ? "₩5,000" : "₩10,000"}
              </button>
            ))}
          </div>
          {rewardAmount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: C.body }}>조정:</span>
              {[1000, 5000, 10000].map(inc => (
                <button key={inc} onClick={() => {
                  const next = rewardAmount + inc;
                  setRewardAmount(next);
                  if (editingId) supabase.from("interviews").update({ incentive: `₩${next.toLocaleString("ko-KR")}` }).eq("id", editingId);
                }}
                  style={{ padding: "3px 9px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", fontSize: 11, color: C.body, cursor: "pointer", fontFamily: F }}>
                  +{inc >= 10000 ? "₩10만" : inc >= 5000 ? "₩5천" : "₩1천"}
                </button>
              ))}
              <button onClick={() => {
                  const next = Math.max(0, rewardAmount - 1000);
                  setRewardAmount(next);
                  if (editingId) supabase.from("interviews").update({ incentive: next > 0 ? `₩${next.toLocaleString("ko-KR")}` : null }).eq("id", editingId);
                }}
                style={{ padding: "3px 9px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", fontSize: 11, color: C.body, cursor: "pointer", fontFamily: F }}>
                -₩1천
              </button>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: C.purple }}>₩{rewardAmount.toLocaleString("ko-KR")}</span>
            </div>
          )}
        </div>

        <div style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, border: `1px solid ${C.border}` }}>
          <span style={{ flex: 1, fontSize: 13, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFeatureSettings: '"tnum"' }}>{shareUrl}</span>
          <Btn size="sm" onClick={handleCopy}>{copied ? "복사됨 ✓" : "복사"}</Btn>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.body, marginBottom: 10 }}>📱 QR 코드로 공유</div>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
            alt="QR Code"
            style={{ width: 180, height: 180, borderRadius: 12, border: `1px solid ${C.border}` }}
          />
          <div style={{ marginTop: 10 }}>
            <Btn size="sm" variant="ghost" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`, "_blank")}>QR 코드 저장</Btn>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn full variant="ghost" onClick={() => setShowShareOverlay(false)}>계속 편집</Btn>
          <Btn full onClick={() => go("dashboard")}>대시보드로 이동</Btn>
        </div>
      </div>
    </div>
  );

  const IncompleteWarnOverlay = showIncompleteWarn && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "32px 32px 28px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "rgba(50,50,93,0.18) 0px 30px 60px -12px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>✏️</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 8 }}>인터뷰가 아직 완성되지 않았어요</div>
        <div style={{ fontSize: 13, color: C.body, marginBottom: 6, lineHeight: 1.65 }}>
          현재 질문이 <strong style={{ color: C.navy }}>{questions.length}개</strong> 있어요.
        </div>
        <div style={{ fontSize: 13, color: C.body, marginBottom: 28, lineHeight: 1.65 }}>
          의미 있는 인사이트를 얻으려면 질문이 10개 이상 있어야 해요. 계속 작성할까요?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn full variant="ghost" onClick={() => setShowIncompleteWarn(false)}>계속 작성</Btn>
          <Btn full onClick={doSave} style={{ background: "#f59e0b", border: "none" }}>그냥 공개하기</Btn>
        </div>
      </div>
    </div>
  );

  const AiModal = showAiModal && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) setShowAiModal(false); }}>
      <div style={{ background: C.white, borderRadius: 20, padding: "36px 32px 28px", maxWidth: 480, width: "100%", boxShadow: "rgba(50,50,93,0.2) 0px 40px 80px -16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#533afd,#f96bee)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M8 0 C8 0 8.8 3.5 10.5 5.5 C12.2 7.5 16 8 16 8 C16 8 12.2 8.5 10.5 10.5 C8.8 12.5 8 16 8 16 C8 16 7.2 12.5 5.5 10.5 C3.8 8.5 0 8 0 8 C0 8 3.8 7.5 5.5 5.5 C7.2 3.5 8 0 8 0Z"/></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>AI로 질문 초안 만들기</div>
        </div>
        <div style={{ fontSize: 13, color: C.body, marginBottom: 20, lineHeight: 1.6 }}>
          인터뷰 목적을 간단히 설명하면 AI가 10~12개 질문을 만들어드려요.
        </div>
        <textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          placeholder="예: Z세대 앱 사용자의 결제 경험과 불편함을 파악하고 싶어요. 핀테크 스타트업 UX 개선을 위한 인터뷰입니다."
          rows={4}
          autoFocus
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generateWithAI(); }}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: F, color: C.navy, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6, transition: "border-color 0.15s" }}
          onFocus={e => e.target.style.borderColor = C.purple}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <div style={{ fontSize: 11, color: C.body, textAlign: "right", marginBottom: 20, marginTop: 4 }}>{aiPrompt.length}/600 chars · ⌘Enter to generate</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn full variant="ghost" onClick={() => setShowAiModal(false)} disabled={aiGenerating}>취소</Btn>
          <Btn full onClick={generateWithAI} disabled={aiGenerating || !aiPrompt.trim()}>
            {aiGenerating ? "생성 중…" : <><svg width="12" height="12" viewBox="0 0 16 16" fill="white" style={{ marginRight: 5, verticalAlign: "middle" }}><path d="M8 0 C8 0 8.8 3.5 10.5 5.5 C12.2 7.5 16 8 16 8 C16 8 12.2 8.5 10.5 10.5 C8.8 12.5 8 16 8 16 C8 16 7.2 12.5 5.5 10.5 C3.8 8.5 0 8 0 8 C0 8 3.8 7.5 5.5 5.5 C7.2 3.5 8 0 8 0Z"/></svg>초안 생성</>}
          </Btn>
        </div>
      </div>
    </div>
  );

  // ─── Top nav bar ───
  const NavBar = isMobile ? (
    <>
      <div style={{ padding: "0 12px", height: 52, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => go("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", fontSize: 22, color: C.navy, lineHeight: 1, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: questions.length >= 10 ? "rgba(30,142,62,0.1)" : "rgba(180,120,0,0.08)", color: questions.length >= 10 ? C.successText : "rgba(140,90,0,0.9)" }}>
          {questions.length}/10
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Btn size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중…" : editingId ? "저장" : "링크 생성"}
          </Btn>
          <button onClick={() => setShowMobileMenu(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", fontSize: 20, color: C.navy, lineHeight: 1, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>⋯</button>
        </div>
      </div>
      {showMobileMenu && (
        <>
          <div onClick={() => setShowMobileMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
          <div style={{ position: "fixed", top: 52, right: 12, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 200, minWidth: 160, overflow: "hidden" }}>
            <div onClick={() => { saveDraft(); setShowMobileMenu(false); }} style={{ padding: "12px 16px", fontSize: 14, color: draftSaved ? C.success : C.navy, cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
              {draftSaved ? "저장됨 ✓" : "임시저장"}
            </div>
            {shareCode && (
              <div onClick={() => { handleCopy(); setShowMobileMenu(false); }} style={{ padding: "12px 16px", fontSize: 14, color: C.navy, cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                {copied ? "복사됨 ✓" : "링크 복사"}
              </div>
            )}
            {editingId && hasUnsaved && (
              <div style={{ padding: "8px 16px", fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                저장되지 않은 변경사항
              </div>
            )}
          </div>
        </>
      )}
    </>
  ) : (
    <div style={{ padding: "0 16px", height: 48, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
      <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {editingId && hasUnsaved && (
          <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            저장 안 됨
          </span>
        )}
        {!editingId && draftSaved && <span style={{ fontSize: 11, color: C.success }}>임시 저장됨 ✓</span>}
        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: questions.length >= 10 ? "rgba(30,142,62,0.1)" : "rgba(180,120,0,0.08)", color: questions.length >= 10 ? C.successText : "rgba(140,90,0,0.9)" }}>
          {questions.length}/10
        </span>
        <div style={{ width: 1, height: 16, background: C.border, margin: "0 2px" }} />
        <Btn variant="ghost" size="sm" onClick={saveDraft} style={{ color: draftSaved ? C.success : undefined }}>
          {draftSaved ? "저장됨 ✓" : <span style={{ display: "flex", alignItems: "center", gap: 5 }}>임시저장 <kbd style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, border: `1px solid ${C.border}`, background: C.bg, color: C.body, fontFamily: "inherit", lineHeight: 1.4 }}>⌘S</kbd></span>}
        </Btn>
        <div style={{ width: 1, height: 16, background: C.border, margin: "0 2px" }} />
        {shareCode && (
          <Btn variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? "복사됨 ✓" : "링크 복사"}
          </Btn>
        )}
        <div style={{ position: "relative" }}
          onMouseEnter={() => setShowSaveTooltip(true)}
          onMouseLeave={() => setShowSaveTooltip(false)}>
          <Btn size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중…" : editingId ? "저장하기" : "링크 생성 →"}
          </Btn>
          {showSaveTooltip && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: C.navy, color: C.white, fontSize: 11, padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 200, pointerEvents: "none" }}>
              ⌘S로 저장
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ShareLinkBar = shareCode && editingId && (
    <div style={{ background: "rgba(83,58,253,0.06)", borderBottom: `1px solid rgba(83,58,253,0.15)`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, color: C.purple, fontWeight: 500 }}>공유 링크</span>
      <span style={{ flex: 1, fontSize: 12, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFeatureSettings: '"tnum"' }}>{shareUrl}</span>
      <Btn size="sm" variant="ghost" onClick={handleCopy} style={{ fontSize: 11, padding: "3px 10px" }}>{copied ? "Copied ✓" : "Copy"}</Btn>
    </div>
  );

  // ─── Mobile layout ───
  if (isMobile) return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: "100vh" }}>
      {ShareOverlay}
      {IncompleteWarnOverlay}
      {AiModal}
      {NavBar}
      {ShareLinkBar}
      {/* Title area */}
      <div style={{ background: C.white, padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}` }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="인터뷰 제목을 입력하세요"
          style={{ width: "100%", border: "none", outline: "none", fontSize: 18, fontFamily: F, fontWeight: 600, color: C.navy, background: "transparent", boxSizing: "border-box" }}
        />
      </div>
      {/* Question tabs */}
      <div style={{ display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        {questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setSelectedIdx(i)}
            style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: F, cursor: "pointer", border: "none", background: selectedIdx === i ? C.purple : C.bg, color: selectedIdx === i ? C.white : C.body, whiteSpace: "nowrap", fontWeight: selectedIdx === i ? 500 : 400 }}>
            Q{i + 1}
          </button>
        ))}
        <div style={{ position: "relative" }}>
          <button onClick={() => setAddTypeOpen(v => !v)}
            style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: F, cursor: "pointer", border: `1px dashed ${C.border}`, background: "transparent", color: C.body, whiteSpace: "nowrap" }}>
            +
          </button>
          {addTypeOpen && (
            <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "rgba(0,0,0,0.12) 0 4px 16px", zIndex: 100 }}>
              {Q_TYPES.map(({ type, icon, label }) => (
                <div key={type} onClick={() => addQuestion(type)}
                  style={{ padding: "10px 16px", fontSize: 13, color: C.navy, cursor: "pointer", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }}>
                  {icon} {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <PreviewCard q={q} idx={selectedIdx} total={questions.length} updateQ={updateQ} />
      </div>
      <div style={{ padding: "0 16px 12px" }}>
        <button onClick={() => setShowAiModal(true)} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.purple}`, background: C.purpleBg, color: C.purple, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          ✨ AI로 인터뷰 쉽게 만들기
        </button>
      </div>
      <div style={{ padding: "0 16px 24px" }}>
        <QuestionSettings q={q} idx={selectedIdx} updateQ={updateQ} typeLabel={typeLabel} />
      </div>
    </div>
  );

  // ─── Desktop layout ───
  return (
    <div style={{ fontFamily: F, height: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes aiGradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {ShareOverlay}
      {IncompleteWarnOverlay}
      {AiModal}
      {NavBar}
      {ShareLinkBar}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: question list */}
        <div style={{ width: 260, borderRight: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, position: "relative" }}>
            <div style={{ fontSize: 11, color: C.body, marginBottom: 8 }}>질문 ({questions.length})</div>
            <Btn size="sm" full onClick={() => setAddTypeOpen(v => !v)}>+ 질문 추가</Btn>
            {addTypeOpen && (
              <div style={{ position: "absolute", top: "100%", left: 14, right: 14, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "rgba(0,0,0,0.12) 0 4px 16px", zIndex: 10 }}>
                {Q_TYPES.map(({ type, icon, label, desc }) => (
                  <div key={type} onClick={() => addQuestion(type)}
                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontSize: 13, color: C.navy, fontWeight: 500, marginBottom: 2 }}>{icon} {label}</div>
                    <div style={{ fontSize: 11, color: C.body }}>{desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
            {questions.map((qq, i) => (
              <div key={qq.id}
                draggable
                onDragStart={() => { dragIdx.current = i; }}
                onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => {
                  const from = dragIdx.current;
                  if (from === null || from === i) { setDragOver(null); return; }
                  const next = [...questions];
                  const [moved] = next.splice(from, 1);
                  next.splice(i, 0, moved);
                  setQuestions(next);
                  setSelectedIdx(i);
                  dragIdx.current = null;
                  setDragOver(null);
                }}
                onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
                onClick={() => setSelectedIdx(i)}
                style={{
                  padding: "10px 12px", borderRadius: 6, marginBottom: 4, cursor: "grab",
                  border: `1px solid ${dragOver === i ? C.purple : selectedIdx === i ? C.purpleLight : "transparent"}`,
                  background: dragOver === i ? "rgba(83,58,253,0.08)" : selectedIdx === i ? C.purpleBg : "transparent",
                  opacity: dragIdx.current === i ? 0.4 : 1,
                  transition: "background 0.1s, border-color 0.1s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.body, cursor: "grab", opacity: 0.4, marginRight: 2 }}>⠿</span>
                  <span style={{ fontSize: 11, color: selectedIdx === i ? C.purple : C.body }}>Q{i + 1}</span>
                  <Badge variant={selectedIdx === i ? typeVariant[qq.type] : "neutral"} style={{ fontSize: 10 }}>{typeLabel[qq.type]}</Badge>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                    {/* Duplicate button */}
                    <button onClick={e => duplicateQ(i, e)} title="Duplicate" style={{ background: "none", border: "none", cursor: "pointer", color: C.body, fontSize: 10, padding: "0 2px", opacity: 0.6 }}>⧉</button>
                    <button onClick={e => { e.stopPropagation(); removeQ(i); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.body, fontSize: 10, padding: "0 2px" }}>✕</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: selectedIdx === i ? C.navy : C.body, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {qq.content || <span style={{ color: C.border }}>질문 없음</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: title + preview canvas */}
        <div style={{ flex: 1, background: C.bg, display: "flex", flexDirection: "column", overflow: "auto" }}>

          {/* Title input — prominent, top of canvas */}
          <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "20px 40px 16px" }}>
            <div style={{ fontSize: 11, color: C.body, marginBottom: 6, letterSpacing: 0.5 }}>인터뷰 제목</div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 신제품 사용성 인터뷰 — 2026 Q2"
              style={{
                width: "100%",
                border: "none",
                borderBottom: `2px solid ${title ? C.purple : C.border}`,
                outline: "none",
                fontSize: 22,
                fontFamily: F,
                fontWeight: 600,
                color: C.navy,
                background: "transparent",
                paddingBottom: 6,
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderBottomColor = C.purple}
              onBlur={e => e.target.style.borderBottomColor = title ? C.purple : C.border}
            />
          </div>

          {/* Preview card */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 40px", gap: 12, position: "relative" }}>
            <div style={{ fontSize: 11, color: C.body, letterSpacing: 0.3 }}>참여자 화면 — 클릭해서 바로 편집하세요</div>
            <PreviewCard q={q} idx={selectedIdx} total={questions.length} updateQ={updateQ} />
            {/* Character count */}
            <div style={{ fontSize: 11, color: (q?.content?.length ?? 0) > MAX_Q_CHARS ? C.ruby : C.body, alignSelf: "flex-end", marginRight: 0 }}>
              {q?.content?.length ?? 0}/{MAX_Q_CHARS} chars
            </div>
            {/* AI 초안 floating button with soft glow pulse */}
            <button
              onClick={() => setShowAiModal(true)}
              style={{ position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #2d25b0, #533afd, #9b7eff, #533afd, #2d25b0)", backgroundSize: "300% 300%", border: "none", borderRadius: 24, padding: "10px 22px", color: C.white, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", boxShadow: "0 4px 18px rgba(83,58,253,0.25)", animation: "aiGradientShift 16s ease infinite" }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="white"><path d="M8 0 C8 0 8.8 3.5 10.5 5.5 C12.2 7.5 16 8 16 8 C16 8 12.2 8.5 10.5 10.5 C8.8 12.5 8 16 8 16 C8 16 7.2 12.5 5.5 10.5 C3.8 8.5 0 8 0 8 C0 8 3.8 7.5 5.5 5.5 C7.2 3.5 8 0 8 0Z"/></svg>
              AI로 인터뷰 쉽게 만들기
            </button>
          </div>
        </div>

        {/* Right: settings */}
        <div style={{ width: 260, borderLeft: `1px solid ${C.border}`, background: C.white, padding: 18, overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <QuestionSettings q={q} idx={selectedIdx} updateQ={updateQ} typeLabel={typeLabel} />
          </div>
          {logout && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 12 }}>
              <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.body, fontFamily: F, padding: 0, opacity: 0.55, width: "100%", textAlign: "left" }}>로그아웃</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function PreviewCard({ q, idx, total, updateQ }) {
  const editable = !!updateQ;
  return (
    <div style={{ width: "100%", maxWidth: 600, background: C.interviewBg, borderRadius: 12, padding: "36px 32px", boxShadow: "rgba(50,50,93,0.25) 0px 30px 60px -20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(110,75,255,0.18),transparent)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${C.purple},#f96bee)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="white"><path d="M8 0 C8 0 8.8 3.5 10.5 5.5 C12.2 7.5 16 8 16 8 C16 8 12.2 8.5 10.5 10.5 C8.8 12.5 8 16 8 16 C8 16 7.2 12.5 5.5 10.5 C3.8 8.5 0 8 0 8 C0 8 3.8 7.5 5.5 5.5 C7.2 3.5 8 0 8 0Z"/></svg>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>AI Interviewer · voicesurvey</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Q{idx + 1}/{total}</span>
        </div>

        {/* Question text — editable textarea or static */}
        {editable ? (
          <textarea
            value={q?.content ?? ""}
            onChange={e => updateQ(idx, { content: e.target.value })}
            placeholder="질문 내용을 입력하세요"
            rows={3}
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", outline: "none", resize: "none", fontSize: 15, fontWeight: 400, color: "white", lineHeight: 1.65, letterSpacing: "-0.3px", fontFamily: F, marginBottom: 20, padding: "0 0 6px", boxSizing: "border-box", caretColor: "rgba(185,185,249,0.9)" }}
            onFocus={e => e.target.style.borderBottomColor = "rgba(185,185,249,0.7)"}
            onBlur={e => e.target.style.borderBottomColor = "rgba(255,255,255,0.2)"}
          />
        ) : (
          <p style={{ fontSize: 15, fontWeight: 400, color: "white", lineHeight: 1.65, letterSpacing: -0.3, margin: "0 0 20px" }}>
            {q?.content || <span style={{ opacity: 0.3 }}>질문 내용을 입력하세요</span>}
          </p>
        )}

        {q?.type === "voice" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(26,115,232,0.25)", border: "1px solid rgba(26,115,232,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {Ic.Mic({ s: 18, c: "#b9b9f9" })}
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>버튼을 눌러 답변하세요</span>
          </div>
        )}

        {q?.type === "multiple_choice" && Array.isArray(q.options) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.options.map((opt, i) => editable ? (
              <input
                key={i}
                value={opt}
                onChange={e => { const next = [...q.options]; next[i] = e.target.value; updateQ(idx, { options: next }); }}
                placeholder={`보기 ${i + 1}`}
                style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: F, outline: "none", width: "100%", boxSizing: "border-box", caretColor: "rgba(185,185,249,0.9)" }}
                onFocus={e => e.target.style.borderColor = "rgba(185,185,249,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
              />
            ) : (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{opt || `보기 ${i + 1}`}</div>
            ))}
            {editable && (
              <button
                onClick={() => updateQ(idx, { options: [...q.options, ""] })}
                style={{ marginTop: 4, padding: "8px 14px", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.2)", background: "transparent", fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: F, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(185,185,249,0.5)"; e.currentTarget.style.color = "rgba(185,185,249,0.8)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >
                + 보기 추가
              </button>
            )}
          </div>
        )}

        {q?.type === "likert" && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
            {Array.from({ length: (q.options?.max ?? 5) - (q.options?.min ?? 1) + 1 }, (_, i) => i + (q.options?.min ?? 1)).map(n => (
              <div key={n} style={{ flex: 1, aspectRatio: "1", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{n}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionSettings({ q, idx, updateQ, typeLabel }) {
  if (!q) return null;

  const currentTypeDef = Q_TYPES.find(t => t.type === q.type);

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.label, marginBottom: 14 }}>질문 설정</div>

      {/* Type selector with icons and descriptions */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: C.body, display: "block", marginBottom: 8 }}>질문 유형</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Q_TYPES.map(({ type, icon, label, desc }) => (
            <div key={type}
              onClick={() => updateQ(idx, { type, options: type === "multiple_choice" ? ["", "", ""] : type === "likert" ? { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] } : undefined })}
              style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${q.type === type ? C.purple : C.border}`, background: q.type === type ? C.purpleBg : "transparent", cursor: "pointer", transition: "all 0.1s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: q.type === type ? 600 : 400, color: q.type === type ? C.purple : C.navy }}>{label}</span>
              </div>
              <div style={{ fontSize: 10, color: C.body, lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: C.body, display: "block", marginBottom: 6 }}>질문 내용</label>
        <textarea
          value={q.content}
          onChange={e => updateQ(idx, { content: e.target.value })}
          rows={4}
          placeholder="질문을 입력하세요"
          style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
        />
        <div style={{ fontSize: 10, color: (q.content?.length ?? 0) > 200 ? C.ruby : C.body, textAlign: "right", marginTop: 3 }}>
          {q.content?.length ?? 0}/200 chars
        </div>
      </div>
      {q.type === "multiple_choice" && Array.isArray(q.options) && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.body, display: "block", marginBottom: 6 }}>보기</label>
          {q.options.map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input
                value={opt}
                onChange={e => { const next = [...q.options]; next[i] = e.target.value; updateQ(idx, { options: next }); }}
                placeholder={`Option ${i + 1}`}
                style={{ flex: 1, padding: "6px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F, outline: "none" }}
              />
              {q.options.length > 2 && (
                <button onClick={() => updateQ(idx, { options: q.options.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: C.body, cursor: "pointer", fontSize: 14 }}>✕</button>
              )}
            </div>
          ))}
          {q.options.length < 6 && (
            <button onClick={() => updateQ(idx, { options: [...q.options, ""] })} style={{ fontSize: 12, color: C.purple, background: "none", border: "none", cursor: "pointer", padding: 0 }}>+ 보기 추가</button>
          )}
        </div>
      )}
      {q.type === "likert" && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.body, display: "block", marginBottom: 6 }}>척도 범위</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="number" value={q.options?.min ?? 1} min={1} max={4}
              onChange={e => updateQ(idx, { options: { ...q.options, min: Number(e.target.value) } })}
              style={{ width: 48, padding: "6px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F, outline: "none", textAlign: "center" }} />
            <span style={{ fontSize: 12, color: C.body }}>~</span>
            <input type="number" value={q.options?.max ?? 5} min={2} max={10}
              onChange={e => updateQ(idx, { options: { ...q.options, max: Number(e.target.value) } })}
              style={{ width: 48, padding: "6px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F, outline: "none", textAlign: "center" }} />
          </div>
        </div>
      )}
    </div>
  );
}
