import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, Btn, useToast } from "../components/shared.jsx";

function newQ(type = "voice") {
  const id = Math.random().toString(36).slice(2, 10);
  if (type === "multiple_choice") return { id, type, content: "", options: ["", "", ""] };
  if (type === "likert") return { id, type, content: "", options: { min: 1, max: 5, labels: ["매우 아니다", "아니다", "보통", "그렇다", "매우 그렇다"] } };
  return { id, type, content: "" };
}

function mkId() { return Math.random().toString(36).slice(2, 10); }

const VOICA_SURVEY_TEMPLATE = {
  title: "Voica 사용자 만족도 조사 — 리서처/마케터 대상",
  questions: [
    { id: mkId(), type: "multiple_choice", content: "현재 주요 업무를 가장 잘 나타내는 것은 무엇인가요?", options: ["UX 리서처 / 디자인 리서처", "마케터 / 브랜드 매니저", "프로덕트 매니저", "사업개발 / 전략기획", "기타"] },
    { id: mkId(), type: "multiple_choice", content: "사용자/고객 조사를 얼마나 자주 직접 수행하시나요?", options: ["거의 매주", "월 1~2회", "분기 1회", "필요할 때만 (연 2회 이하)"] },
    { id: mkId(), type: "voice", content: "현재 사용자 인터뷰나 설문조사를 진행할 때 어떤 방식과 툴을 주로 쓰시나요? 섭외부터 분석까지 어떻게 하시는지 전체 흐름을 설명해 주세요." },
    { id: mkId(), type: "voice", content: "그 과정에서 가장 시간이 많이 걸리거나 스트레스를 받는 단계는 어디인가요? 최근에 실제로 힘들었던 상황이 있다면 구체적으로 말씀해 주세요." },
    { id: mkId(), type: "multiple_choice", content: "사용자 인터뷰 1회 프로젝트 기준 평균 총 비용은 얼마인가요? (참여자 섭외 + 진행 + 분석 인건비 포함)", options: ["50만원 미만", "50~200만원", "200~500만원", "500만원 이상", "외부 에이전시에 아웃소싱"] },
    { id: mkId(), type: "multiple_choice", content: "연간 사용자 리서치에 쓰는 총 예산 규모는 어느 정도인가요? (인건비 제외 순수 리서치 비용)", options: ["500만원 미만", "500만~2,000만원", "2,000만~5,000만원", "5,000만원 이상"] },
    { id: mkId(), type: "multiple_choice", content: "인터뷰 1건 완료까지 평균 소요 시간은?", options: ["1~2일 이내", "3~7일", "2주 이상", "한 달 이상"] },
    { id: mkId(), type: "multiple_choice", content: "다음 중 가장 번거로운 단계는 무엇인가요?", options: ["참여자 섭외 및 일정 조율", "인터뷰 진행 자체", "녹취 정리 및 전사", "인사이트 분석 및 보고서 작성"] },
    { id: mkId(), type: "voice", content: "AI가 수백 명과 동시에 음성 인터뷰를 진행하고, 10분 안에 분석 리포트가 나온다면 — 지금 하시는 리서치 방식과 비교해서 어떤 생각이 드시나요? 솔직하게 말씀해 주세요." },
    { id: mkId(), type: "voice", content: "이런 AI 인터뷰 방식에서 가장 걱정되는 점이나 믿기 어려운 부분이 있다면 무엇인가요?" },
    { id: mkId(), type: "voice", content: "팀이나 조직에서 Voica 같은 툴을 도입하려면 어떤 조건이 갖춰져야 할 것 같으세요? 예산, 보안, 데이터 품질 등 어떤 허들이 있을지 말씀해 주세요." },
    { id: mkId(), type: "multiple_choice", content: "참여자 50명 기준 인터뷰 1회 프로젝트 (AI 진행 + 분석 리포트 포함) 적정 비용은?", options: ["5만원 미만", "5~15만원", "15~30만원", "30~50만원", "50만원 이상도 가치 있다"] },
    { id: mkId(), type: "multiple_choice", content: "선호하는 요금 방식은 무엇인가요?", options: ["건별 충전 (쓴 만큼만)", "월 구독 (예측 가능한 비용)", "연간 계약 (할인 중심)", "팀/기업 단위 계약"] },
    { id: mkId(), type: "voice", content: "마지막으로, 리서치 업무에서 Voica가 딱 한 가지만 해결해 준다면 어떤 문제를 해결해 주길 바라시나요?" },
  ],
};

const DRAFT_KEY = "voica_editor_draft";

export default function EditorScreen({ go, user, logout, interviewId }) {
  const { showToast } = useToast();
  // Restore draft from localStorage only when creating new (no interviewId)
  const savedDraft = !interviewId ? (() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch { return null; } })() : null;
  const [title, setTitle] = useState(savedDraft?.title ?? "");
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
  const dragIdx = useRef(null);
  const isMobile = useIsMobile();

  // Load existing interview from DB when editing
  useEffect(() => {
    if (!interviewId) return;
    (async () => {
      try {
        const [{ data: iv }, { data: qs }] = await Promise.all([
          supabase.from("interviews").select("id, title, share_code").eq("id", interviewId).single(),
          supabase.from("questions").select("*").eq("interview_id", interviewId).order("order_num"),
        ]);
        if (iv) { setTitle(iv.title ?? ""); if (iv.share_code) setShareCode(iv.share_code); }
        if (qs && qs.length > 0) {
          setQuestions(qs.map(q => ({ id: q.id, type: q.type, content: q.content, options: q.options })));
          setSelectedIdx(0);
        }
      } catch (e) {
        console.error("[EditorScreen load]", e);
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [interviewId]);

  // Auto-save draft to localStorage only for new interviews
  useEffect(() => {
    if (editingId) return;
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, questions }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 1500);
    }, 800);
    return () => clearTimeout(timer);
  }, [title, questions, editingId]);

  const loadTemplate = () => {
    const hasContent = title.trim() || questions.some(q => q.content.trim());
    if (hasContent && !window.confirm("현재 작성 중인 내용이 모두 사라집니다. 템플릿으로 교체할까요?")) return;
    setTitle(VOICA_SURVEY_TEMPLATE.title);
    setQuestions(VOICA_SURVEY_TEMPLATE.questions.map(q => ({ ...q, id: mkId() })));
    setSelectedIdx(0);
    setTemplateOpen(false);
  };

  const q = questions[selectedIdx] ?? questions[0];

  const updateQ = (idx, patch) =>
    setQuestions(qs => qs.map((item, i) => i === idx ? { ...item, ...patch } : item));

  const addQuestion = (type) => {
    const next = [...questions, newQ(type)];
    setQuestions(next);
    setSelectedIdx(next.length - 1);
    setAddTypeOpen(false);
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
      if (!res.ok) throw new Error(data.error || "저장 실패");
      setShareCode(data.share_code);
      if (!editingId) {
        setShowShareOverlay(true); // only for new interviews
      } else {
        showToast("저장됐습니다 ✓", "success");
      }
      if (!editingId && data.interview?.id) setEditingId(data.interview.id);
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      showToast(e.message || "저장에 실패했습니다. 다시 시도해 주세요.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) { alert("인터뷰 제목을 입력해 주세요"); return; }
    if (questions.some(q => !q.content.trim())) { alert("모든 질문 텍스트를 입력해 주세요"); return; }
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

  const typeLabel = { voice: "음성", multiple_choice: "객관식", likert: "평점" };
  const typeVariant = { voice: "purple", multiple_choice: "success", likert: "warning" };

  // ─── Overlays (share success + incomplete warning) ───
  const shareUrl = shareCode ? `${window.location.origin}/i/${shareCode}` : null;

  const ShareOverlay = showShareOverlay && shareCode && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 20, padding: "40px 36px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "rgba(50,50,93,0.2) 0px 40px 80px -16px", animation: "fadeInUp 0.2s ease" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(21,190,83,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          {Ic.CheckCircle({ s: 28, c: C.success })}
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 8 }}>링크가 생성됐습니다</div>
        <div style={{ fontSize: 13, color: C.body, marginBottom: 24, lineHeight: 1.6 }}>
          아래 링크를 참여자에게 공유하세요.<br />로그인 없이 바로 참여할 수 있습니다.
        </div>
        <div style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, border: `1px solid ${C.border}` }}>
          <span style={{ flex: 1, fontSize: 13, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFeatureSettings: '"tnum"' }}>{shareUrl}</span>
          <Btn size="sm" onClick={handleCopy}>{copied ? "복사됨 ✓" : "복사"}</Btn>
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
        <div style={{ fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 8 }}>아직 인터뷰가 완성되지 않았습니다</div>
        <div style={{ fontSize: 13, color: C.body, marginBottom: 6, lineHeight: 1.65 }}>
          현재 질문이 <strong style={{ color: C.navy }}>{questions.length}개</strong>입니다.
        </div>
        <div style={{ fontSize: 13, color: C.body, marginBottom: 28, lineHeight: 1.65 }}>
          충분한 인사이트를 얻으려면 10개 이상의 질문을 권장합니다. 계속 작성하시겠어요?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn full variant="ghost" onClick={() => setShowIncompleteWarn(false)}>계속 작성</Btn>
          <Btn full onClick={doSave} style={{ background: "#f59e0b", border: "none" }}>그래도 생성하기</Btn>
        </div>
      </div>
    </div>
  );

  // ─── Top nav bar (back + draft indicator + template + save) ───
  const NavBar = (
    <div style={{ padding: "0 16px", height: 48, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
      <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {logout && <Btn variant="ghost" size="sm" onClick={logout} style={{ fontSize: 12, color: C.body }}>로그아웃</Btn>}
        {!editingId && draftSaved && <span style={{ fontSize: 11, color: C.success }}>임시저장됨 ✓</span>}
        <div style={{ position: "relative" }}>
          <Btn variant="ghost" size="sm" onClick={() => setTemplateOpen(v => !v)}>템플릿</Btn>
          {templateOpen && (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "rgba(0,0,0,0.12) 0 4px 16px", zIndex: 100, minWidth: 220 }}>
              <div style={{ padding: "8px 14px 4px", fontSize: 10, color: C.body, fontWeight: 600, letterSpacing: 0.5 }}>템플릿 불러오기</div>
              <div onClick={loadTemplate}
                style={{ padding: "10px 14px", fontSize: 13, color: C.navy, cursor: "pointer", borderTop: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontWeight: 500 }}>Voica 사용자 만족도 조사</div>
                <div style={{ fontSize: 11, color: C.body, marginTop: 2 }}>음성 7개 + 객관식 7개 · 14문항</div>
              </div>
            </div>
          )}
        </div>
        <Btn size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중…" : editingId ? "저장" : "링크 생성 →"}
        </Btn>
      </div>
    </div>
  );

  // ─── Mobile layout ───
  if (isMobile) return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: "100vh" }}>
      {ShareOverlay}
      {IncompleteWarnOverlay}
      {NavBar}
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
              {[["voice", "🎙 음성"], ["multiple_choice", "☑ 객관식"], ["likert", "📊 평점"]].map(([type, label]) => (
                <div key={type} onClick={() => addQuestion(type)}
                  style={{ padding: "10px 16px", fontSize: 13, color: C.navy, cursor: "pointer", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }}>
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <PreviewCard q={q} idx={selectedIdx} total={questions.length} updateQ={updateQ} />
      </div>
      <div style={{ padding: "0 16px 24px" }}>
        <QuestionSettings q={q} idx={selectedIdx} updateQ={updateQ} typeLabel={typeLabel} />
      </div>
    </div>
  );

  // ─── Desktop layout ───
  return (
    <div style={{ fontFamily: F, height: "100vh", display: "flex", flexDirection: "column" }}>
      {ShareOverlay}
      {IncompleteWarnOverlay}
      {NavBar}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: question list */}
        <div style={{ width: 260, borderRight: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, position: "relative" }}>
            <div style={{ fontSize: 11, color: C.body, marginBottom: 8 }}>질문 목록 ({questions.length}개)</div>
            <Btn size="sm" full onClick={() => setAddTypeOpen(v => !v)}>+ 질문 추가</Btn>
            {addTypeOpen && (
              <div style={{ position: "absolute", top: "100%", left: 14, right: 14, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "rgba(0,0,0,0.12) 0 4px 16px", zIndex: 10 }}>
                {[["voice", "🎙 음성 질문"], ["multiple_choice", "☑ 객관식"], ["likert", "📊 평점 선택"]].map(([type, label]) => (
                  <div key={type} onClick={() => addQuestion(type)}
                    style={{ padding: "10px 14px", fontSize: 13, color: C.navy, cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {label}
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
                    <button onClick={e => { e.stopPropagation(); removeQ(i); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.body, fontSize: 10, padding: "0 2px" }}>✕</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: selectedIdx === i ? C.navy : C.body, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {qq.content || <span style={{ color: C.border }}>질문 텍스트 없음</span>}
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
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 40px", gap: 12 }}>
            <div style={{ fontSize: 11, color: C.body, letterSpacing: 0.3 }}>참여자에게 보이는 화면 — 직접 클릭해서 편집하세요</div>
            <PreviewCard q={q} idx={selectedIdx} total={questions.length} updateQ={updateQ} />
          </div>
        </div>

        {/* Right: settings */}
        <div style={{ width: 260, borderLeft: `1px solid ${C.border}`, background: C.white, padding: 18, overflowY: "auto", flexShrink: 0 }}>
          <QuestionSettings q={q} idx={selectedIdx} updateQ={updateQ} typeLabel={typeLabel} />
        </div>

      </div>
    </div>
  );
}

function PreviewCard({ q, idx, total, updateQ }) {
  const editable = !!updateQ;
  return (
    <div style={{ width: "100%", maxWidth: 420, background: C.interviewBg, borderRadius: 8, padding: "28px 24px", boxShadow: "rgba(50,50,93,0.25) 0px 30px 45px -30px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(26,115,232,0.15),transparent)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a73e8,#e8710a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>AI 인터뷰어 · Voica</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Q{idx + 1}/{total}</span>
        </div>

        {/* Question text — editable textarea or static */}
        {editable ? (
          <textarea
            value={q?.content ?? ""}
            onChange={e => updateQ(idx, { content: e.target.value })}
            placeholder="질문 텍스트를 입력하세요"
            rows={3}
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", outline: "none", resize: "none", fontSize: 15, fontWeight: 400, color: "white", lineHeight: 1.65, letterSpacing: "-0.3px", fontFamily: F, marginBottom: 20, padding: "0 0 6px", boxSizing: "border-box", caretColor: "rgba(185,185,249,0.9)" }}
            onFocus={e => e.target.style.borderBottomColor = "rgba(185,185,249,0.7)"}
            onBlur={e => e.target.style.borderBottomColor = "rgba(255,255,255,0.2)"}
          />
        ) : (
          <p style={{ fontSize: 15, fontWeight: 400, color: "white", lineHeight: 1.65, letterSpacing: -0.3, margin: "0 0 20px" }}>
            {q?.content || <span style={{ opacity: 0.3 }}>질문 텍스트를 입력하세요</span>}
          </p>
        )}

        {q?.type === "voice" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(26,115,232,0.25)", border: "1px solid rgba(26,115,232,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {Ic.Mic({ s: 18, c: "#b9b9f9" })}
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>버튼을 눌러 답변해 주세요</span>
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
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.label, marginBottom: 14 }}>질문 설정 — {typeLabel[q.type] ?? q.type}</div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: C.body, display: "block", marginBottom: 6 }}>질문 텍스트</label>
        <textarea
          value={q.content}
          onChange={e => updateQ(idx, { content: e.target.value })}
          rows={4}
          placeholder="질문을 입력하세요"
          style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
        />
      </div>
      {q.type === "multiple_choice" && Array.isArray(q.options) && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.body, display: "block", marginBottom: 6 }}>보기 목록</label>
          {q.options.map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input
                value={opt}
                onChange={e => { const next = [...q.options]; next[i] = e.target.value; updateQ(idx, { options: next }); }}
                placeholder={`보기 ${i + 1}`}
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
