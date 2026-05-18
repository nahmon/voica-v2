import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic, APP_URL } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, Btn, useToast } from "../components/shared.jsx";
import { track } from "../lib/analytics.js";
import { TEMPLATES, templateToQuestions } from "../lib/templates.js";

function newQ(type = "voice") {
  const id = Math.random().toString(36).slice(2, 10);
  if (type === "multiple_choice") return { id, type, content: "", options: ["", "", ""] };
  if (type === "likert") return { id, type, content: "", options: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] } };
  if (type === "creative") return { id, type, content: "아래 광고 소재를 보신 후, 첫 인상을 자유롭게 말씀해 주세요.", stimulus: null };
  if (type === "prototype") return { id, type, content: "아래 화면을 살펴보신 후, 사용하면서 느낀 점을 말씀해 주세요.", stimulus: null };
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
  { type: "voice",           icon: Ic.Mic({s:15}),      label: "음성 답변",      desc: "참여자가 자유롭게 음성으로 답변해요" },
  { type: "creative",        icon: Ic.Image({s:15}),    label: "광고 소재 반응",  desc: "이미지·영상 시안을 보여주고 음성 반응을 수집해요" },
  { type: "prototype",       icon: Ic.Phone({s:15}),    label: "UI/UX 조사",    desc: "Figma 또는 프로토타입 링크를 보여주고 음성 피드백을 받아요" },
  { type: "multiple_choice", icon: Ic.Check({s:15}),    label: "객관식",        desc: "미리 정해진 보기 중 하나를 선택해요" },
  { type: "likert",          icon: Ic.BarChart({s:15}), label: "평가 척도",     desc: "1~5점 척도로 평가해요" },
];

export default function EditorScreen({ go, user, logout, interviewId }) {
  const { showToast } = useToast();
  // Restore draft from localStorage only when creating new (no interviewId)
  const savedDraft = !interviewId ? (() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch { return null; } })() : null;
  const [title, setTitle] = useState(savedDraft?.title ?? "");
  const [expertOnly, setExpertOnly] = useState(false);
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
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const [dragOver, setDragOver] = useState(null);
  const [stimuliDragId, setStimuliDragId] = useState(null);
  const [stimuliUploading, setStimuliUploading] = useState({});
  const [savedTitle, setSavedTitle] = useState(savedDraft?.title ?? "");
  const [savedIncentive, setSavedIncentive] = useState(savedDraft?.incentive ?? "");
  const [savedQuestions, setSavedQuestions] = useState(savedDraft?.questions ?? [newQ("voice")]);
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const dragIdx = useRef(null);
  const saveDraftRef = useRef(null);
  const handleSaveRef = useRef(null);
  const isMobile = useIsMobile();

  // Track whether there are unsaved changes
  const hasUnsaved = title !== savedTitle || incentive !== savedIncentive || JSON.stringify(questions) !== JSON.stringify(savedQuestions);

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const { data: { session: aiSession } } = await supabase.auth.getSession();
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiSession?.access_token}` },
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
          supabase.from("interviews").select("id, title, incentive, share_code, expert_only, slack_webhook_url, ends_at").eq("id", interviewId).single(),
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
          setExpertOnly(iv.expert_only ?? false);
          setSlackWebhookUrl(iv.slack_webhook_url ?? "");
          if (iv.ends_at) setEndsAt(iv.ends_at.slice(0, 10));
        }
        if (qs && qs.length > 0) {
          const loaded = qs.map(q => ({ id: q.id, type: q.type, content: q.content, options: q.options, stimulus: q.stimulus, followup_enabled: q.followup_enabled !== false }));
          setQuestions(loaded);
          setSavedQuestions(loaded);
          setSelectedIdx(0);
        }
      } catch (e) {
        showToast("인터뷰를 불러오지 못했어요. 다시 시도해 주세요.", "error");
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
  saveDraftRef.current = saveDraft;

  // Debounce auto-save on change (new interviews only)
  useEffect(() => {
    if (editingId) return;
    const timer = setTimeout(saveDraft, 800);
    return () => clearTimeout(timer);
  }, [title, questions, editingId]);

  // 3-minute interval auto-save (all interviews) — stable ref so timer never resets on keystrokes
  useEffect(() => {
    const interval = setInterval(() => saveDraftRef.current?.(), 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Cmd+S / Ctrl+S to save — stable ref so listener registers only once
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
    <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: isMobile ? "16px 16px 12px" : "20px 24px 16px" }}>
      {/* AI section */}
      <div style={{ background: "linear-gradient(135deg,rgba(83,58,253,0.06),rgba(249,107,238,0.06))", border: `1.5px solid rgba(83,58,253,0.18)`, borderRadius: 14, padding: isMobile ? "14px 14px" : "16px 18px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#533afd,#f96bee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>✦</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>AI로 초안 만들기</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <input
            aria-label="AI 초안 프롬프트"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setShowAiModal(true); } }}
            placeholder="인터뷰 목적을 설명하세요 — 예: 20대 앱 사용자의 불편함을 파악하고 싶어요"
            style={{ flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, outline: "none" }}
            onFocus={e => e.target.style.borderColor = C.purple}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          <button
            onClick={() => setShowAiModal(true)}
            style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#533afd,#f96bee)", color: C.white, fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer", whiteSpace: "nowrap", minHeight: 44, width: isMobile ? "100%" : "auto" }}
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

  const uploadStimulusImage = async (file) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("stimuli").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) return null;
      const { data: { publicUrl } } = supabase.storage.from("stimuli").getPublicUrl(path);
      return publicUrl;
    } catch {
      return null;
    }
  };

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
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const payload = {
        title: title.trim(),
        expert_only: expertOnly,
        incentive: rewardAmount > 0 ? `₩${rewardAmount.toLocaleString("ko-KR")}` : null,
        reward_amount: rewardAmount,
        ends_at: endsAt || null,
        questions: questions.map((q, i) => ({
          id: q.id,
          order_num: i + 1,
          type: q.type,
          content: q.content,
          options: q.options ?? null,
          stimulus: q.stimulus ?? null,
          followup_enabled: q.followup_enabled !== false,
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
    doSave();
  };
  handleSaveRef.current = handleSave;

  const handleCopy = async () => {
    const url = `${APP_URL}/i/${shareCode}`;
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

  const typeLabel = { voice: "음성", creative: "광고", prototype: "UX", multiple_choice: "객관식", likert: "평가" };
  const typeVariant = { voice: "purple", creative: "purple", prototype: "purple", multiple_choice: "success", likert: "warning" };

  // ─── Overlays (share success + incomplete warning) ───
  const shareUrl = shareCode ? `${window.location.origin}/i/${shareCode}` : null;

  const ShareOverlay = showShareOverlay && shareCode && (
    <div role="presentation" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 16 : 24, overflowY: "auto" }}>
      <div role="dialog" aria-modal="true" aria-label="링크 공유" style={{ background: C.white, borderRadius: isMobile ? 16 : 20, padding: isMobile ? "28px 20px" : "40px 36px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "rgba(50,50,93,0.2) 0px 40px 80px -16px", animation: "fadeInUp 0.2s ease" }}>
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
                if (editingId) supabase.from("interviews").update({ incentive: amt > 0 ? `₩${amt.toLocaleString("ko-KR")}` : null, reward_amount: amt }).eq("id", editingId);
              }}
                style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${rewardAmount === amt ? C.purple : C.border}`, background: rewardAmount === amt ? C.purpleBg : C.white, color: rewardAmount === amt ? C.purple : C.body, fontSize: 13, fontFamily: F, cursor: "pointer", fontWeight: rewardAmount === amt ? 600 : 400, transition: "all 0.15s" }}>
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
                  if (editingId) supabase.from("interviews").update({ incentive: `₩${next.toLocaleString("ko-KR")}`, reward_amount: next }).eq("id", editingId);
                }}
                  style={{ padding: "3px 9px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", fontSize: 11, color: C.body, cursor: "pointer", fontFamily: F }}>
                  +{inc >= 10000 ? "₩10만" : inc >= 5000 ? "₩5천" : "₩1천"}
                </button>
              ))}
              <button onClick={() => {
                  const next = Math.max(0, rewardAmount - 1000);
                  setRewardAmount(next);
                  if (editingId) supabase.from("interviews").update({ incentive: next > 0 ? `₩${next.toLocaleString("ko-KR")}` : null, reward_amount: next }).eq("id", editingId);
                }}
                style={{ padding: "3px 9px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", fontSize: 11, color: C.body, cursor: "pointer", fontFamily: F }}>
                -₩1천
              </button>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: C.purple }}>₩{rewardAmount.toLocaleString("ko-KR")}</span>
            </div>
          )}
        </div>

        {/* Slack webhook */}
        <div style={{ background: C.bg, borderRadius: 12, padding: "16px", marginBottom: 20, textAlign: "left", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 8, letterSpacing: 0.5 }}>Slack 알림 (선택)</div>
          <div style={{ fontSize: 12, color: C.body, marginBottom: 8, lineHeight: 1.5 }}>응답 완료 시 Slack으로 알림을 받을 수 있어요.</div>
          <input
            type="url"
            value={slackWebhookUrl}
            onChange={e => setSlackWebhookUrl(e.target.value)}
            onBlur={() => {
              if (editingId) supabase.from("interviews").update({ slack_webhook_url: slackWebhookUrl || null }).eq("id", editingId);
            }}
            placeholder="https://hooks.slack.com/services/..."
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F, color: C.navy, background: C.white, outline: "none" }}
          />
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
            style={{ width: isMobile ? 140 : 180, height: isMobile ? 140 : 180, borderRadius: 12, border: `1px solid ${C.border}` }}
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


  const AiModal = showAiModal && (
    <div role="presentation" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 16 : 24 }}
      onClick={e => { if (e.target === e.currentTarget) setShowAiModal(false); }}>
      <div role="dialog" aria-modal="true" aria-label="AI 초안 생성" style={{ background: C.white, borderRadius: isMobile ? 16 : 20, padding: isMobile ? "24px 20px 20px" : "36px 32px 28px", maxWidth: 480, width: "100%", boxShadow: "rgba(50,50,93,0.2) 0px 40px 80px -16px" }}>
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
        <button aria-label="대시보드로 돌아가기" onClick={() => go("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", fontSize: 22, color: C.navy, lineHeight: 1, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: questions.length >= 10 ? "rgba(30,142,62,0.1)" : "rgba(180,120,0,0.08)", color: questions.length >= 10 ? C.successText : "rgba(140,90,0,0.9)" }}>
          {questions.length}/10
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Btn size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중…" : "저장하기"}
          </Btn>
          <button aria-label="추가 메뉴" aria-expanded={showMobileMenu} onClick={() => setShowMobileMenu(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", fontSize: 20, color: C.navy, lineHeight: 1, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>⋯</button>
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
            {saving ? "저장 중…" : "저장하기"}
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
    <div style={{ background: "rgba(83,58,253,0.06)", borderBottom: `1px solid rgba(83,58,253,0.15)`, padding: isMobile ? "8px 12px" : "8px 16px", display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: C.purple, fontWeight: 500, flexShrink: 0 }}>공유 링크</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFeatureSettings: '"tnum"' }}>{shareUrl}</span>
      <Btn size="sm" variant="ghost" onClick={handleCopy} style={{ fontSize: 11, padding: "3px 10px", flexShrink: 0 }}>{copied ? "복사됨 ✓" : "링크 복사"}</Btn>
      <span style={{ fontSize: 11, color: "rgba(140,90,0,0.9)", background: "rgba(180,120,0,0.08)", padding: "2px 8px", borderRadius: 10, flexShrink: 0, whiteSpace: "nowrap" }}>
        💡 AI 리포트는 응답 10개 이상 시 생성 가능
      </span>
    </div>
  );

  // ─── Loading guard for edit mode ───
  if (loadingExisting) return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.purple, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 13, color: C.body }}>불러오는 중…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  // ─── Mobile layout ───
  if (isMobile) return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: "100vh", overflowX: "hidden" }}>
      {ShareOverlay}
      {AiModal}
      {NavBar}
      {ShareLinkBar}
      {/* Title area */}
      <div style={{ background: C.white, padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}` }}>
        <input
          aria-label="인터뷰 제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="인터뷰 제목을 입력하세요"
          style={{ width: "100%", border: "none", outline: "none", fontSize: 18, fontFamily: F, fontWeight: 600, color: C.navy, background: "transparent", boxSizing: "border-box", minHeight: 44, wordBreak: "break-word" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${expertOnly ? "rgba(110,75,255,0.3)" : C.border}`, background: expertOnly ? C.purpleBg : "transparent" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.navy }}>전문가 패널 전용</div>
            <div style={{ fontSize: 10, color: C.body, marginTop: 1 }}>전문가 인증 완료 회원만 참여</div>
          </div>
          <button
            role="switch" aria-checked={expertOnly} aria-label="전문가 패널 전용 토글"
            onClick={() => setExpertOnly(v => !v)}
            style={{ width: 38, height: 20, borderRadius: 10, border: "none", cursor: "pointer", background: expertOnly ? C.purple : C.border, position: "relative", flexShrink: 0, transition: "background 0.2s", WebkitAppearance: "none", appearance: "none" }}
          >
            <span style={{ position: "absolute", top: 2, left: expertOnly ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s", display: "block" }} />
          </button>
        </div>
        <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: C.label, marginBottom: 6 }}>마감일 (선택)</div>
          <input type="date" value={endsAt} min={new Date().toISOString().slice(0, 10)}
            onChange={e => { setEndsAt(e.target.value); if (editingId) supabase.from("interviews").update({ ends_at: e.target.value || null }).eq("id", editingId); }}
            style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F, color: C.navy, background: C.white, outline: "none" }} />
          {endsAt && <div style={{ fontSize: 10, color: C.body, marginTop: 4 }}>{new Date(endsAt).toLocaleDateString("ko-KR")} 자정에 자동 마감</div>}
        </div>
      </div>
      {/* Question tabs */}
      <div style={{ display: "flex", gap: 6, padding: "10px 16px", overflowX: "auto", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        {questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setSelectedIdx(i)}
            style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: F, cursor: "pointer", border: "none", background: selectedIdx === i ? C.purple : C.bg, color: selectedIdx === i ? C.white : C.body, whiteSpace: "nowrap", fontWeight: selectedIdx === i ? 500 : 400, minHeight: 44, display: "inline-flex", alignItems: "center" }}>
            Q{i + 1}
          </button>
        ))}
        <div style={{ position: "relative" }}>
          <button aria-label="질문 추가" aria-expanded={addTypeOpen} onClick={() => setAddTypeOpen(v => !v)}
            style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: F, cursor: "pointer", border: `1px dashed ${C.border}`, background: "transparent", color: C.body, whiteSpace: "nowrap", minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            +
          </button>
          {addTypeOpen && (
            <>
              <div onClick={() => setAddTypeOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "rgba(0,0,0,0.12) 0 4px 16px", zIndex: 100, minWidth: 160 }}>
                {Q_TYPES.map(({ type, icon, label }) => (
                  <div key={type} onClick={() => addQuestion(type)}
                    style={{ padding: "12px 16px", fontSize: 14, color: C.navy, cursor: "pointer", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7 }}>
                    {icon}{label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <PreviewCard q={q} idx={selectedIdx} total={questions.length} updateQ={updateQ} />
      </div>
      <div style={{ padding: "0 16px 12px" }}>
        <button onClick={() => setShowAiModal(true)} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.purple}`, background: C.purpleBg, color: C.purple, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          ✨ AI로 인터뷰 쉽게 만들기 <span className="ba">→</span>
        </button>
      </div>
      <div style={{ padding: "0 16px 24px" }}>
        <QuestionSettings q={q} idx={selectedIdx} updateQ={updateQ} typeLabel={typeLabel} stimuliDragId={stimuliDragId} setStimuliDragId={setStimuliDragId} stimuliUploading={stimuliUploading} setStimuliUploading={setStimuliUploading} uploadStimulusImage={uploadStimulusImage} />
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
                    <div style={{ fontSize: 13, color: C.navy, fontWeight: 500, marginBottom: 2, display: "flex", alignItems: "center", gap: 7 }}>{icon}{label}</div>
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
                    <button onClick={e => duplicateQ(i, e)} title="Duplicate" aria-label="질문 복제" style={{ background: "none", border: "none", cursor: "pointer", color: C.body, fontSize: 10, padding: "0 2px", opacity: 0.6 }}>⧉</button>
                    <button onClick={e => { e.stopPropagation(); removeQ(i); }} aria-label="질문 삭제" style={{ background: "none", border: "none", cursor: "pointer", color: C.body, fontSize: 10, padding: "0 2px" }}>✕</button>
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
              aria-label="인터뷰 제목"
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
            {/* Expert-only toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "12px 14px", borderRadius: 8, border: `1px solid ${expertOnly ? "rgba(110,75,255,0.3)" : C.border}`, background: expertOnly ? C.purpleBg : "transparent", transition: "all 0.15s" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.navy }}>전문가 패널 전용</div>
                <div style={{ fontSize: 11, color: C.body, marginTop: 2 }}>전문가 인증을 완료한 패널 회원만 참여할 수 있어요</div>
              </div>
              <button
                role="switch" aria-checked={expertOnly} aria-label="전문가 패널 전용 토글"
                onClick={() => setExpertOnly(v => !v)}
                style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: expertOnly ? C.purple : C.border, position: "relative", flexShrink: 0, transition: "background 0.2s", WebkitAppearance: "none", appearance: "none" }}
              >
                <span style={{ position: "absolute", top: 2, left: expertOnly ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s", display: "block" }} />
              </button>
            </div>
            {/* Ends-at date picker */}
            <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: C.label, marginBottom: 8 }}>마감일 (선택)</div>
              <input type="date" value={endsAt} min={new Date().toISOString().slice(0, 10)}
                onChange={e => { setEndsAt(e.target.value); if (editingId) supabase.from("interviews").update({ ends_at: e.target.value || null }).eq("id", editingId); }}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, background: C.white, outline: "none" }} />
              {endsAt && <div style={{ fontSize: 11, color: C.body, marginTop: 6 }}>{new Date(endsAt).toLocaleDateString("ko-KR")} 자정에 자동 마감</div>}
            </div>
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
              AI로 인터뷰 쉽게 만들기 <span className="ba">→</span>
            </button>
          </div>
        </div>

        {/* Right: settings */}
        <div style={{ width: 260, borderLeft: `1px solid ${C.border}`, background: C.white, padding: 18, overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <QuestionSettings q={q} idx={selectedIdx} updateQ={updateQ} typeLabel={typeLabel} stimuliDragId={stimuliDragId} setStimuliDragId={setStimuliDragId} stimuliUploading={stimuliUploading} setStimuliUploading={setStimuliUploading} uploadStimulusImage={uploadStimulusImage} />
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
  const isMobile = useIsMobile();
  return (
    <div style={{ width: "100%", maxWidth: 600, background: C.interviewBg, borderRadius: 12, padding: isMobile ? "24px 18px" : "36px 32px", boxShadow: "rgba(50,50,93,0.25) 0px 30px 60px -20px", position: "relative", overflow: "hidden", boxSizing: "border-box", minWidth: 0 }}>
      <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(110,75,255,0.18),transparent)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${C.purple},#f96bee)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="white"><path d="M8 0 C8 0 8.8 3.5 10.5 5.5 C12.2 7.5 16 8 16 8 C16 8 12.2 8.5 10.5 10.5 C8.8 12.5 8 16 8 16 C8 16 7.2 12.5 5.5 10.5 C3.8 8.5 0 8 0 8 C0 8 3.8 7.5 5.5 5.5 C7.2 3.5 8 0 8 0Z"/></svg>
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>AI Interviewer · voicesurvey</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Q{idx + 1}/{total}</span>
        </div>

        {/* Stimulus (image / video / url) */}
        {q?.stimulus?.url && (() => {
          const { type, url, label } = q.stimulus;
          if (type === "image") {
            return <img src={url} alt={label || "자료"} style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />;
          }
          if (type === "video") {
            const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
            const videoId = ytMatch?.[1];
            if (!videoId) return null;
            return (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                style={{ width: "100%", height: 160, borderRadius: 8, border: "none", marginBottom: 12 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            );
          }
          // type === "url"
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🔗</span>
              <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label || url}</span>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#b9b9f9", textDecoration: "none", flexShrink: 0 }}>↗ 열기</a>
            </div>
          );
        })()}

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
                aria-label={`보기 ${i + 1}`}
                value={opt}
                onChange={e => { const next = [...q.options]; next[i] = e.target.value; updateQ(idx, { options: next }); }}
                placeholder={`보기 ${i + 1}`}
                style={{ padding: isMobile ? "12px 12px" : "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", fontSize: isMobile ? 14 : 13, color: "rgba(255,255,255,0.85)", fontFamily: F, outline: "none", width: "100%", boxSizing: "border-box", caretColor: "rgba(185,185,249,0.9)", minHeight: 44 }}
                onFocus={e => e.target.style.borderColor = "rgba(185,185,249,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
              />
            ) : (
              <div key={i} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", fontSize: 13, color: "rgba(255,255,255,0.7)", wordBreak: "break-word" }}>{opt || `보기 ${i + 1}`}</div>
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
          <div style={{ display: "flex", justifyContent: "space-between", gap: isMobile ? 4 : 6, flexWrap: "nowrap", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
            {Array.from({ length: (q.options?.max ?? 5) - (q.options?.min ?? 1) + 1 }, (_, i) => i + (q.options?.min ?? 1)).map(n => (
              <div key={n} style={{ flex: 1, minWidth: isMobile ? 30 : 36, minHeight: isMobile ? 30 : 36, aspectRatio: "1", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>{n}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionSettings({ q, idx, updateQ, typeLabel, stimuliDragId, setStimuliDragId, stimuliUploading, setStimuliUploading, uploadStimulusImage }) {
  if (!q) return null;
  const isMobile = useIsMobile();

  const currentTypeDef = Q_TYPES.find(t => t.type === q.type);

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
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
          style={{ width: "100%", padding: isMobile ? "10px 12px" : "8px 10px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: isMobile ? 14 : 13, fontFamily: F, color: C.navy, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
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
                aria-label={`보기 ${i + 1}`}
                value={opt}
                onChange={e => { const next = [...q.options]; next[i] = e.target.value; updateQ(idx, { options: next }); }}
                placeholder={`Option ${i + 1}`}
                style={{ flex: 1, minWidth: 0, padding: isMobile ? "10px 10px" : "6px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: isMobile ? 14 : 12, fontFamily: F, outline: "none", boxSizing: "border-box", minHeight: 44 }}
              />
              {q.options.length > 2 && (
                <button aria-label={`보기 ${i + 1} 삭제`} onClick={() => updateQ(idx, { options: q.options.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: C.body, cursor: "pointer", fontSize: 14, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
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
            <input type="number" aria-label="최솟값" value={q.options?.min ?? 1} min={1} max={4}
              onChange={e => updateQ(idx, { options: { ...q.options, min: Number(e.target.value) } })}
              style={{ width: 56, padding: "10px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: isMobile ? 14 : 12, fontFamily: F, outline: "none", textAlign: "center", minHeight: 44, boxSizing: "border-box" }} />
            <span style={{ fontSize: 12, color: C.body }}>~</span>
            <input type="number" aria-label="최댓값" value={q.options?.max ?? 5} min={2} max={10}
              onChange={e => updateQ(idx, { options: { ...q.options, max: Number(e.target.value) } })}
              style={{ width: 56, padding: "10px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: isMobile ? 14 : 12, fontFamily: F, outline: "none", textAlign: "center", minHeight: 44, boxSizing: "border-box" }} />
          </div>
        </div>
      )}

      {/* Creative: image/video stimulus (required) */}
      {q.type === "creative" && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: C.navy, display: "block", marginBottom: 6 }}>광고 소재 <span style={{ color: C.ruby }}>*</span></label>
          {q.stimulus?.url ? (
            <div>
              {q.stimulus.type === "image" && <img src={q.stimulus.url} alt="" style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 6, background: "#f5f5f5", marginBottom: 6, display: "block" }} />}
              {q.stimulus.type === "video" && (() => {
                const ytId = q.stimulus.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)?.[1];
                return ytId ? (
                  <div style={{ position: "relative", paddingBottom: "30%", height: 0, marginBottom: 6, borderRadius: 6, overflow: "hidden" }}>
                    <iframe src={`https://www.youtube.com/embed/${ytId}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
                  </div>
                ) : <video src={q.stimulus.url} controls style={{ width: "100%", maxHeight: 120, borderRadius: 6, marginBottom: 6, display: "block" }} />;
              })()}
              <div style={{ display: "flex", gap: 6 }}>
                <input value={q.stimulus.label ?? ""} onChange={e => updateQ(idx, { stimulus: { ...q.stimulus, label: e.target.value } })} placeholder="소재 설명 (선택)" style={{ flex: 1, padding: "6px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F, outline: "none" }} />
                <button aria-label="소재 제거" onClick={() => updateQ(idx, { stimulus: null })} style={{ background: "none", border: "none", color: C.body, cursor: "pointer", fontSize: 14, padding: "0 4px", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setStimuliDragId(q.id + "_c"); }}
              onDragLeave={() => setStimuliDragId(null)}
              onDrop={async e => {
                e.preventDefault();
                setStimuliDragId(null);
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) { showToast("이미지 파일만 첨부 가능해요", "error"); return; }
                setStimuliUploading(prev => ({ ...prev, [q.id + "_c"]: true }));
                const url = await uploadStimulusImage(file);
                setStimuliUploading(prev => ({ ...prev, [q.id + "_c"]: false }));
                if (url) updateQ(idx, { stimulus: { type: "image", url, label: "" } });
                else showToast("업로드에 실패했어요", "error");
              }}
              style={{ width: "100%", borderRadius: 8, border: `2px dashed ${stimuliDragId === q.id + "_c" ? C.purple : C.border}`, background: stimuliDragId === q.id + "_c" ? C.purpleBg : C.bg, boxSizing: "border-box", padding: "14px 12px", transition: "all 0.15s" }}>
              {stimuliUploading[q.id + "_c"] ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.purple, height: 48 }}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ width: 14, height: 14, border: `2px solid ${C.purple}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 12, fontFamily: F }}>업로드 중...</span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10, color: stimuliDragId === q.id + "_c" ? C.purple : C.body }}>
                    <span style={{ fontSize: 20 }}>🖼</span>
                    <span style={{ fontSize: 12, fontFamily: F }}>이미지를 여기에 드래그하거나</span>
                    <label style={{ fontSize: 12, color: C.purple, fontFamily: F, cursor: "pointer", textDecoration: "underline", fontWeight: 500 }}>
                      파일 선택
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        e.target.value = "";
                        setStimuliUploading(prev => ({ ...prev, [q.id + "_c"]: true }));
                        const url = await uploadStimulusImage(file);
                        setStimuliUploading(prev => ({ ...prev, [q.id + "_c"]: false }));
                        if (url) updateQ(idx, { stimulus: { type: "image", url, label: "" } });
                        else showToast("업로드에 실패했어요", "error");
                      }} />
                    </label>
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                    <input
                      aria-label="이미지 URL 또는 유튜브 링크"
                      value=""
                      onChange={e => {
                        const url = e.target.value.trim();
                        if (!url) return;
                        const type = /youtube\.com|youtu\.be/.test(url) ? "video" : /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) ? "image" : "video";
                        updateQ(idx, { stimulus: { type, url, label: "" } });
                      }}
                      placeholder="또는 이미지 URL / 유튜브 링크 붙여넣기"
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F, outline: "none", boxSizing: "border-box", background: "#fff" }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prototype: Figma / URL embed (required) */}
      {q.type === "prototype" && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: C.navy, display: "block", marginBottom: 4 }}>프로토타입 링크 <span style={{ color: C.ruby }}>*</span></label>
          <div style={{ fontSize: 10, color: C.body, marginBottom: 6 }}>Figma 공유 링크, 프로토타입 URL, 이미지 등 모두 가능해요</div>
          {q.stimulus?.url ? (
            <div>
              {q.stimulus.type === "figma" && (
                <div style={{ borderRadius: 6, overflow: "hidden", marginBottom: 6, border: `1px solid ${C.border}` }}>
                  <iframe src={`https://www.figma.com/embed?embed_host=voicesurvey&url=${encodeURIComponent(q.stimulus.url)}`} style={{ width: "100%", height: 160, border: "none", display: "block" }} allowFullScreen />
                </div>
              )}
              {q.stimulus.type === "image" && <img src={q.stimulus.url} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 6, background: "#f5f5f5", marginBottom: 6, display: "block" }} />}
              {(q.stimulus.type === "url") && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>🔗</span>
                  <span style={{ flex: 1, fontSize: 11, color: C.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.stimulus.url}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <input value={q.stimulus.label ?? ""} onChange={e => updateQ(idx, { stimulus: { ...q.stimulus, label: e.target.value } })} placeholder="화면 설명 (예: 온보딩 1단계)" style={{ flex: 1, padding: "6px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F, outline: "none" }} />
                <button aria-label="소재 제거" onClick={() => updateQ(idx, { stimulus: null })} style={{ background: "none", border: "none", color: C.body, cursor: "pointer", fontSize: 14, padding: "0 4px", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
              </div>
            </div>
          ) : (
            <input value="" onChange={e => {
              const url = e.target.value.trim();
              if (!url) return;
              const type = /figma\.com/.test(url) ? "figma" : /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) ? "image" : "url";
              updateQ(idx, { stimulus: { type, url, label: "" } });
            }} placeholder="Figma 공유 링크 또는 프로토타입 URL" style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `2px dashed ${C.border}`, fontSize: 12, fontFamily: F, outline: "none", boxSizing: "border-box", background: C.bg }} />
          )}
        </div>
      )}

      {/* Follow-up toggle (voice only) */}
      {q.type === "voice" && (
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: C.navy, marginBottom: 2 }}>AI 후속 질문</div>
            <div style={{ fontSize: 10, color: C.body }}>답변 내용을 바탕으로 AI가 자동으로 추가 질문해요</div>
          </div>
          <button
            onClick={() => updateQ(idx, { followup_enabled: q.followup_enabled === false ? true : false })}
            style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: q.followup_enabled === false ? C.border : C.purple, position: "relative", flexShrink: 0, transition: "background 0.2s", WebkitAppearance: "none", appearance: "none" }}>
            <span style={{ position: "absolute", top: 2, left: q.followup_enabled === false ? 2 : 20, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s", display: "block" }} />
          </button>
        </div>
      )}

      {/* Stimulus attachment */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: C.body, display: "block", marginBottom: 6 }}>자료 첨부 (선택)</label>
        {q.stimulus?.url ? (
          <div>
            {/* Preview */}
            {q.stimulus.type === "image" && (
              <img src={q.stimulus.url} alt={q.stimulus.label || "미리보기"} style={{ width: "100%", maxHeight: 100, objectFit: "cover", borderRadius: 6, marginBottom: 6 }} />
            )}
            {q.stimulus.type === "video" && (() => {
              const ytMatch = q.stimulus.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
              const videoId = ytMatch?.[1];
              return videoId ? (
                <div style={{ position: "relative", paddingBottom: "30%", height: 0, marginBottom: 6, borderRadius: 6, overflow: "hidden" }}>
                  <iframe src={`https://www.youtube.com/embed/${videoId}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
                </div>
              ) : null;
            })()}
            {q.stimulus.type === "url" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>🔗</span>
                <span style={{ flex: 1, fontSize: 11, color: C.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.stimulus.label || q.stimulus.url}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                value={q.stimulus.label ?? ""}
                onChange={e => updateQ(idx, { stimulus: { ...q.stimulus, label: e.target.value } })}
                placeholder="자료 설명 (선택)"
                style={{ flex: 1, padding: "6px 8px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F, outline: "none", boxSizing: "border-box" }}
              />
              <button aria-label="소재 제거" onClick={() => updateQ(idx, { stimulus: null })} style={{ background: "none", border: "none", color: C.body, cursor: "pointer", fontSize: 14, padding: "0 4px", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setStimuliDragId(q.id + "_s"); }}
            onDragLeave={() => setStimuliDragId(null)}
            onDrop={async e => {
              e.preventDefault();
              setStimuliDragId(null);
              const file = e.dataTransfer.files?.[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) { showToast("이미지 파일만 첨부 가능해요", "error"); return; }
              setStimuliUploading(prev => ({ ...prev, [q.id + "_s"]: true }));
              const url = await uploadStimulusImage(file);
              setStimuliUploading(prev => ({ ...prev, [q.id + "_s"]: false }));
              if (url) updateQ(idx, { stimulus: { type: "image", url, label: "" } });
              else showToast("업로드에 실패했어요", "error");
            }}
            style={{ width: "100%", borderRadius: 6, border: `1px dashed ${stimuliDragId === q.id + "_s" ? C.purple : C.border}`, background: stimuliDragId === q.id + "_s" ? C.purpleBg : "#fff", boxSizing: "border-box", transition: "all 0.15s", overflow: "hidden" }}>
            {stimuliUploading[q.id + "_s"] ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.purple, padding: "8px 10px" }}>
                <div style={{ width: 12, height: 12, border: `2px solid ${C.purple}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 12, fontFamily: F }}>업로드 중...</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <input
                  aria-label="이미지 URL, 유튜브, Figma 링크"
                  value=""
                  onChange={e => {
                    const url = e.target.value.trim();
                    if (!url) return;
                    let type = "url";
                    if (/youtube\.com|youtu\.be/.test(url)) type = "video";
                    else if (/figma\.com/.test(url)) type = "url";
                    else if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)) type = "image";
                    updateQ(idx, { stimulus: { type, url, label: "" } });
                  }}
                  placeholder="이미지 URL, 유튜브, Figma 링크 등"
                  style={{ flex: 1, padding: "6px 8px", border: "none", fontSize: 12, fontFamily: F, outline: "none", boxSizing: "border-box", background: "transparent" }}
                />
                <label style={{ padding: "4px 8px", fontSize: 11, color: C.purple, fontFamily: F, cursor: "pointer", borderLeft: `1px solid ${C.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                  📎 이미지
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    e.target.value = "";
                    setStimuliUploading(prev => ({ ...prev, [q.id + "_s"]: true }));
                    const url = await uploadStimulusImage(file);
                    setStimuliUploading(prev => ({ ...prev, [q.id + "_s"]: false }));
                    if (url) updateQ(idx, { stimulus: { type: "image", url, label: "" } });
                    else showToast("업로드에 실패했어요", "error");
                  }} />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
