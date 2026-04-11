import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, Btn } from "../components/shared.jsx";

function newQ(type = "voice") {
  const id = Math.random().toString(36).slice(2, 10);
  if (type === "multiple_choice") return { id, type, content: "", options: ["", "", ""] };
  if (type === "likert") return { id, type, content: "", options: { min: 1, max: 5, labels: ["매우 아니다", "아니다", "보통", "그렇다", "매우 그렇다"] } };
  return { id, type, content: "" };
}

export default function EditorScreen({ go, user }) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([newQ("voice")]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [shareCode, setShareCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const handleSave = async () => {
    if (!title.trim()) { alert("인터뷰 제목을 입력해 주세요"); return; }
    if (questions.some(q => !q.content.trim())) { alert("모든 질문 텍스트를 입력해 주세요"); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          questions: questions.map((q, i) => ({
            order_num: i + 1,
            type: q.type,
            content: q.content,
            options: q.options ?? null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");
      setShareCode(data.share_code);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/i/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabel = { voice: "음성", multiple_choice: "객관식", likert: "리커트" };
  const typeVariant = { voice: "purple", multiple_choice: "success", likert: "warning" };

  // ─── Share link modal ───
  if (shareCode) {
    const url = `${window.location.origin}/i/${shareCode}`;
    return (
      <div style={{ fontFamily: F, minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: C.white, borderRadius: 20, padding: "40px 36px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "rgba(50,50,93,0.15) 0px 30px 60px -12px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(21,190,83,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            {Ic.CheckCircle({ s: 28, c: C.success })}
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, color: C.navy, marginBottom: 8 }}>인터뷰 링크가 생성됐습니다</div>
          <div style={{ fontSize: 13, color: C.body, marginBottom: 28, lineHeight: 1.6 }}>
            아래 링크를 참여자에게 공유하세요.<br />로그인 없이 바로 참여할 수 있습니다.
          </div>
          <div style={{ background: C.bg, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20, border: `1px solid ${C.border}` }}>
            <span style={{ flex: 1, fontSize: 13, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
            <Btn size="sm" onClick={handleCopy}>{copied ? "복사됨 ✓" : "복사"}</Btn>
          </div>
          <Btn full onClick={() => go("dashboard")}>대시보드로 이동</Btn>
        </div>
      </div>
    );
  }

  // ─── Top nav bar (back + save only) ───
  const NavBar = (
    <div style={{ padding: "0 16px", height: 48, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
      <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: title ? C.body : C.border }}>
          {title || "제목 없음"}
        </span>
        <Btn size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중…" : "링크 생성 →"}
        </Btn>
      </div>
    </div>
  );

  // ─── Mobile layout ───
  if (isMobile) return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: "100vh" }}>
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
        <button onClick={() => addQuestion("voice")}
          style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: F, cursor: "pointer", border: `1px dashed ${C.border}`, background: "transparent", color: C.body, whiteSpace: "nowrap" }}>
          +
        </button>
      </div>
      <div style={{ padding: 16 }}>
        <PreviewCard q={q} idx={selectedIdx} total={questions.length} />
      </div>
      <div style={{ padding: "0 16px 24px" }}>
        <QuestionSettings q={q} idx={selectedIdx} updateQ={updateQ} typeLabel={typeLabel} />
      </div>
    </div>
  );

  // ─── Desktop layout ───
  return (
    <div style={{ fontFamily: F, height: "100vh", display: "flex", flexDirection: "column" }}>
      {NavBar}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: question list */}
        <div style={{ width: 260, borderRight: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, position: "relative" }}>
            <div style={{ fontSize: 11, color: C.body, marginBottom: 8 }}>질문 목록 ({questions.length}개)</div>
            <Btn size="sm" full onClick={() => setAddTypeOpen(v => !v)}>+ 질문 추가</Btn>
            {addTypeOpen && (
              <div style={{ position: "absolute", top: "100%", left: 14, right: 14, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "rgba(0,0,0,0.12) 0 4px 16px", zIndex: 10 }}>
                {[["voice", "🎙 음성 질문"], ["multiple_choice", "☑ 객관식"], ["likert", "📊 리커트 척도"]].map(([type, label]) => (
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
              <div key={qq.id} onClick={() => setSelectedIdx(i)}
                style={{ padding: "10px 12px", borderRadius: 6, marginBottom: 4, cursor: "pointer", border: `1px solid ${selectedIdx === i ? C.purpleLight : "transparent"}`, background: selectedIdx === i ? C.purpleBg : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: selectedIdx === i ? C.purple : C.body }}>Q{i + 1}</span>
                  <Badge variant={selectedIdx === i ? typeVariant[qq.type] : "neutral"} style={{ fontSize: 10 }}>{typeLabel[qq.type]}</Badge>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                    <button onClick={e => { e.stopPropagation(); moveQ(i, -1); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.body, fontSize: 10, padding: "0 2px" }}>↑</button>
                    <button onClick={e => { e.stopPropagation(); moveQ(i, 1); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.body, fontSize: 10, padding: "0 2px" }}>↓</button>
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
            <div style={{ fontSize: 11, color: C.body, letterSpacing: 0.3 }}>참여자에게 보이는 화면</div>
            <PreviewCard q={q} idx={selectedIdx} total={questions.length} />
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

function PreviewCard({ q, idx, total }) {
  return (
    <div style={{ width: "100%", maxWidth: 420, background: C.interviewBg, borderRadius: 8, padding: "28px 24px", boxShadow: "rgba(50,50,93,0.25) 0px 30px 45px -30px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(26,115,232,0.15),transparent)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a73e8,#e8710a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>AI 인터뷰어 · Voica</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Q{idx + 1}/{total}</span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 400, color: "white", lineHeight: 1.65, letterSpacing: -0.3, margin: "0 0 20px" }}>
          {q?.content || <span style={{ opacity: 0.3 }}>질문 텍스트를 입력하세요</span>}
        </p>
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
            {q.options.map((opt, i) => (
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
      <div style={{ fontSize: 12, fontWeight: 600, color: C.label, marginBottom: 14 }}>질문 설정 — {typeLabel[q.type]}</div>
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
