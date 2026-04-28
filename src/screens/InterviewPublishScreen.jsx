import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { C, F, Ic } from "../lib/constants.jsx";
import { PanelJobCard } from "../components/PanelJobCard.jsx";
import { supabase } from "../supabase.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

const CATEGORIES = ["Tech", "Beauty", "Finance", "Media", "Food", "Education", "Expert", "Health"];
const CATEGORIES_KO = { Tech: "테크", Beauty: "뷰티", Finance: "금융", Media: "미디어", Food: "식음료", Education: "교육", Expert: "전문직", Health: "헬스케어" };

const METHODS = [
  { key: "voice", icon: "🎙", label: "음성", labelEn: "Voice", desc: "마이크로 음성 응답" },
  { key: "video", icon: "🎥", label: "영상", labelEn: "Video", desc: "카메라 + 마이크" },
  { key: "text",  icon: "💬", label: "텍스트", labelEn: "Text", desc: "키보드로 입력 응답" },
];

const DURATIONS = ["5분", "10분", "15분", "20분", "30분 이상"];
const GENDERS   = [
  { key: "Any", label: "무관", labelEn: "Any" },
  { key: "Female", label: "여성", labelEn: "Female" },
  { key: "Male",   label: "남성", labelEn: "Male"   },
];

const STEPS = [
  { num: 1, label: "인터뷰 소개",  labelEn: "About" },
  { num: 2, label: "모집 조건",    labelEn: "Recruitment" },
  { num: 3, label: "게시 미리보기", labelEn: "Preview" },
];

if (typeof document !== "undefined" && !document.getElementById("__ips_styles")) {
  const s = document.createElement("style");
  s.id = "__ips_styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
    @keyframes ips-in { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:none } }
  `;
  document.head.appendChild(s);
}

// ─── Shared primitives ───────────────────────────────────────────

function Label({ children, required }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: C.label, marginBottom: 7, letterSpacing: 0.2, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.ruby, marginLeft: 3 }}>*</span>}
    </div>
  );
}
function Hint({ children }) {
  return <div style={{ fontSize: 11, color: C.body, marginTop: 5, lineHeight: 1.5 }}>{children}</div>;
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", prefix }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.purple, fontWeight: 700, pointerEvents: "none" }}>
          {prefix}
        </span>
      )}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: "100%", padding: `11px 14px 11px ${prefix ? "28px" : "14px"}`,
          borderRadius: 8, border: `1.5px solid ${f ? C.purple : C.border}`,
          fontSize: 13, fontFamily: F, color: C.navy, background: "#fff",
          outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
          minHeight: 44,
        }}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  const [f, setF] = useState(false);
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{
        width: "100%", padding: "11px 14px",
        borderRadius: 8, border: `1.5px solid ${f ? C.purple : C.border}`,
        fontSize: 13, fontFamily: F, color: C.navy, background: "#fff",
        outline: "none", boxSizing: "border-box", resize: "vertical",
        lineHeight: 1.65, transition: "border-color 0.15s",
      }}
    />
  );
}

function PillGroup({ options, value, onChange, multi = false }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(o => {
        const active = multi ? (value || []).includes(o.key) : value === o.key;
        return (
          <button key={o.key} onClick={() => {
            if (multi) {
              const arr = value || [];
              onChange(active ? arr.filter(x => x !== o.key) : [...arr, o.key]);
            } else {
              onChange(o.key);
            }
          }} style={{
            padding: "7px 16px", borderRadius: 8,
            border: `1.5px solid ${active ? C.purple : C.border}`,
            background: active ? C.purple : "#fff",
            color: active ? "#fff" : C.body,
            fontSize: 12, fontWeight: active ? 600 : 400,
            cursor: "pointer", fontFamily: F, transition: "all 0.12s", flexShrink: 0,
            minHeight: 44,
          }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 1: 인터뷰 소개 ────────────────────────────────────────

function Step1({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const isKo = data._isKo;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "ips-in 0.22s ease-out" }}>
      <Field label={isKo ? "모집 공고 제목" : "Listing title"} required hint={isKo ? "패널 보드에서 첫 번째로 보이는 제목이에요" : "Displayed as the headline on the panel board"}>
        <Input value={data.title} onChange={v => set("title", v)} placeholder={isKo ? "예: 모바일 결제 앱 UX 인터뷰" : "e.g. Mobile payment app UX interview"} />
      </Field>

      <Field label={isKo ? "인터뷰 설명" : "Description"} required hint={isKo ? "참여자가 읽고 신청 여부를 결정하는 설명이에요" : "Participants read this to decide whether to join"}>
        <Textarea value={data.description} onChange={v => set("description", v)} rows={4}
          placeholder={isKo ? "이 인터뷰에서 다루는 주제와 목적을 간략하게 소개해 주세요." : "Describe the topic and purpose of this interview."} />
      </Field>

      <Field label={isKo ? "카테고리" : "Category"} required>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map(cat => {
            const active = data.category === cat;
            return (
              <button key={cat} onClick={() => set("category", cat)} style={{
                padding: "8px 16px", borderRadius: 8,
                border: `1.5px solid ${active ? C.purple : C.border}`,
                background: active ? C.purpleBg : "#fff",
                color: active ? C.purple : C.body,
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: "pointer", fontFamily: F, transition: "all 0.12s",
                minHeight: 44,
              }}>
                {isKo ? (CATEGORIES_KO[cat] ?? cat) : cat}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={isKo ? "응답 방식" : "Interview method"} required>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {METHODS.map(m => {
            const active = data.method === m.key;
            return (
              <button key={m.key} onClick={() => set("method", m.key)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                borderRadius: 10, border: `1.5px solid ${active ? C.purple : C.border}`,
                background: active ? C.purpleBg : "#fff",
                cursor: "pointer", textAlign: "left", fontFamily: F, outline: "none",
                boxShadow: active ? `0 0 0 3px ${C.purpleBg}` : "none",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? C.purple : C.navy }}>
                    {isKo ? m.label : m.labelEn}
                  </div>
                  <div style={{ fontSize: 11, color: C.body, marginTop: 1 }}>{m.desc}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `2px solid ${active ? C.purple : C.border}`,
                  background: active ? C.purple : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={isKo ? "예상 소요 시간" : "Duration"}>
        <PillGroup
          options={DURATIONS.map(d => ({ key: d, label: d }))}
          value={data.duration}
          onChange={v => set("duration", v)}
        />
      </Field>
    </div>
  );
}

// ─── Step 2: 모집 조건 ────────────────────────────────────────

function Step2({ data, onChange, isMobile }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const setTP = (k, v) => onChange({ ...data, targetProfile: { ...data.targetProfile, [k]: v } });
  const tp = data.targetProfile || {};
  const isKo = data._isKo;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "ips-in 0.22s ease-out" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <Field label={isKo ? "참여 리워드" : "Reward"} required hint={isKo ? "참여자에게 지급되는 금액" : "Amount paid to each participant"}>
          <Input value={data.reward} onChange={v => set("reward", v)} prefix="₩" placeholder="10,000" />
        </Field>
        <Field label={isKo ? "모집 인원" : "Headcount"} required hint={isKo ? "총 모집 인원 수" : "Total participants"}>
          <Input value={data.headcount} onChange={v => set("headcount", v)} placeholder="100" type="number" />
        </Field>
      </div>

      <Field label={isKo ? "모집 마감일" : "Deadline"} required>
        <Input value={data.deadline} onChange={v => set("deadline", v)} type="date" />
      </Field>

      <Field label={isKo ? "카드에 표시될 조건 태그" : "Condition tags"} hint={isKo ? "쉼표로 구분 · 카드에 태그로 표시됩니다" : "Comma-separated · displayed as tags on the card"}>
        <Input value={data.conditionText} onChange={v => set("conditionText", v)}
          placeholder={isKo ? "예: 20-30대, 스마트폰 사용자, 서울 거주" : "e.g. Ages 20–30, Smartphone users"} />
      </Field>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14 }}>🎯</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{isKo ? "모집 대상 프로필" : "Target participant profile"}</div>
            <div style={{ fontSize: 11, color: C.body }}>{isKo ? "상세하게 적을수록 적합한 패널이 신청합니다" : "More detail = better-matched applicants"}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Field label={isKo ? "연령대" : "Age range"}>
              <Input value={tp.age || ""} onChange={v => setTP("age", v)} placeholder={isKo ? "예: 20-35세" : "e.g. 20–35"} />
            </Field>
            <Field label={isKo ? "성별" : "Gender"}>
              <div style={{ display: "flex", gap: 6 }}>
                {GENDERS.map(g => {
                  const active = (tp.gender || "Any") === g.key;
                  return (
                    <button key={g.key} onClick={() => setTP("gender", g.key)} style={{
                      flex: 1, padding: "9px 0", borderRadius: 8,
                      border: `1.5px solid ${active ? C.purple : C.border}`,
                      background: active ? C.purple : "#fff",
                      color: active ? "#fff" : C.body,
                      fontSize: 12, fontWeight: active ? 600 : 400,
                      cursor: "pointer", fontFamily: F, transition: "all 0.12s",
                      minHeight: 44,
                    }}>{isKo ? g.label : g.labelEn}</button>
                  );
                })}
              </div>
            </Field>
          </div>

          <Field label={isKo ? "지역" : "Region"}>
            <Input value={tp.region || ""} onChange={v => setTP("region", v)}
              placeholder={isKo ? "예: 전국, 수도권 선호" : "e.g. Nationwide, Seoul preferred"} />
          </Field>

          <Field label={isKo ? "이런 분이면 좋아요" : "Who should apply"} hint={isKo ? "찾는 사람의 직군, 경험, 생활 패턴을 구체적으로 적어주세요" : "Describe job, experience level, and lifestyle"}>
            <Textarea value={tp.lifestyle || ""} onChange={v => setTP("lifestyle", v)} rows={3}
              placeholder={isKo ? "예: 스마트폰 결제 앱을 주 1회 이상 사용하는 직장인" : "e.g. Working professional who uses a mobile payment app at least weekly"} />
          </Field>

          <Field label={isKo ? "참여 제한 (제외 대상)" : "Exclusions"} hint={isKo ? "이해충돌이 있는 직군 등 참여를 제한할 분들을 적어주세요" : "Groups with conflicts of interest or other exclusions"}>
            <Input value={tp.exclude || ""} onChange={v => setTP("exclude", v)}
              placeholder={isKo ? "예: 금융업 종사자 제외" : "e.g. Excludes finance industry employees"} />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: 미리보기 ────────────────────────────────────────

function Step3({ data, onPublish, publishing, isMobile }) {
  const isKo = data._isKo;
  const rewardNum = Number((data.reward || "0").replace(/[^0-9]/g, "")) || 0;
  const preview = {
    id: 0,
    title:       data.title || (isKo ? "인터뷰 제목" : "Interview title"),
    company:     isKo ? "내 회사" : "My Company",
    description: data.description || "",
    reward:      rewardNum > 0 ? `₩${rewardNum.toLocaleString("ko-KR")}` : "₩0",
    duration:    data.duration || "10분",
    method:      data.method || "voice",
    location:    "online",
    category:    data.category || "Tech",
    deadline:    data.deadline ? data.deadline.slice(5).replace("-", ".") : "",
    conditions:  data.conditionText ? data.conditionText.split(",").map(s => s.trim()).filter(Boolean) : [],
    filled:      0,
    total:       Number(data.headcount) || 100,
    urgent:      false,
    _matchScore: 7,
    targetProfile: data.targetProfile || {},
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "ips-in 0.22s ease-out" }}>
      <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleLight}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
        {Ic.CheckCircle({ s: 16, c: C.purple })}
        <span style={{ fontSize: 13, color: C.purple, lineHeight: 1.5 }}>
          {isKo ? "패널 보드에 실제로 표시되는 카드 모습이에요. 지원자가 이 카드를 보고 신청합니다." : "This is how your listing will appear on the panel board."}
        </span>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
        <PanelJobCard
          job={preview}
          status="none"
          isRecommended={true}
          isMobile={isMobile}
          isKo={isKo}
          onApply={() => {}}
          onView={() => {}}
          go={() => {}}
        />
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
        <button
          onClick={onPublish}
          disabled={publishing}
          style={{
            width: "100%", padding: "14px 24px", borderRadius: 10, border: "none",
            background: publishing ? C.purpleLight : C.purple,
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: publishing ? "default" : "pointer",
            fontFamily: F, transition: "background 0.15s",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={e => { if (!publishing) e.currentTarget.style.background = C.purpleHover; }}
          onMouseLeave={e => { if (!publishing) e.currentTarget.style.background = C.purple; }}
        >
          {publishing
            ? (isKo ? "게시 중…" : "Publishing…")
            : (isKo ? "패널 보드에 게시하기 →" : "Publish to panel board →")}
        </button>
        <p style={{ fontSize: 12, color: C.body, textAlign: "center", marginTop: 10 }}>
          {isKo ? "게시 후에도 마감일 전까지 수정할 수 있어요." : "You can edit this listing until the deadline."}
        </p>
      </div>
    </div>
  );
}

// ─── Main Screen ────────────────────────────────────────────────

export default function InterviewPublishScreen({ go, user, lang = "ko" }) {
  const { id } = useParams();
  const isKo = lang === "ko";
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [data, setData] = useState({
    _isKo: lang === "ko",
    title: "", description: "", category: "", method: "voice", duration: "10분",
    reward: "", headcount: "", deadline: "", conditionText: "",
    targetProfile: { age: "", gender: "Any", region: "", lifestyle: "", exclude: "" },
  });

  useEffect(() => { setData(d => ({ ...d, _isKo: lang === "ko" })); }, [lang]);

  useEffect(() => {
    if (!id) return;
    supabase.from("interviews").select("title").eq("id", id).maybeSingle()
      .then(({ data: d }) => {
        if (d?.title) setData(prev => ({ ...prev, title: prev.title || d.title }));
      });
  }, [id]);

  async function handlePublish() {
    setPublishing(true);
    try {
      await supabase.from("interviews").update({
        status: "active",
        panel_listing: {
          title: data.title, description: data.description,
          category: data.category, method: data.method, duration: data.duration,
          reward: data.reward, headcount: Number(data.headcount) || 100,
          deadline: data.deadline,
          conditions: data.conditionText ? data.conditionText.split(",").map(s => s.trim()).filter(Boolean) : [],
          targetProfile: data.targetProfile,
        },
      }).eq("id", id);
      go("dashboard");
    } catch {
      setPublishing(false);
    }
  }

  const canNext = [
    data.title && data.description && data.category && data.method,
    data.reward && data.headcount && data.deadline,
  ];

  const stepHeader = [
    { title: isKo ? "인터뷰 소개" : "About the interview", sub: isKo ? "패널 보드에 올릴 인터뷰의 기본 정보를 입력해 주세요." : "Enter basic information about the listing." },
    { title: isKo ? "모집 조건" : "Recruitment", sub: isKo ? "어떤 분을 찾는지 구체적으로 알려주세요." : "Tell us who you're looking for." },
    { title: isKo ? "게시 미리보기" : "Preview", sub: isKo ? "게시 전에 최종 공고를 확인해 주세요." : "Review your listing before publishing." },
  ][step - 1];

  return (
    <div style={{ minHeight: "100vh", background: "#f6f5f3", fontFamily: F, display: "flex", flexDirection: "column", overflowX: "hidden" }}>

      {/* Sticky header */}
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? "0 12px" : "0 24px", height: isMobile ? 48 : 54,
        display: "flex", alignItems: "center", gap: isMobile ? 8 : 12,
        position: "sticky", top: 0, zIndex: 40,
        minWidth: 0, overflowX: "hidden",
      }}>
        <button onClick={() => go("dashboard")} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.body, padding: "0", display: "flex", alignItems: "center", gap: 4,
          fontSize: isMobile ? 12 : 13, fontFamily: F, flexShrink: 0,
          minHeight: 44, minWidth: 44, justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M9 2L4 7l5 5" />
          </svg>
          {!isMobile && (isKo ? "대시보드" : "Dashboard")}
        </button>
        {!isMobile && <div style={{ width: 1, height: 16, background: C.border }} />}
        <span style={{
          fontSize: isMobile ? 13 : 13, fontWeight: 600, color: C.navy,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          flex: isMobile ? 1 : "none",
        }}>
          {isKo ? "패널 모집 공고 작성" : "Create panel listing"}
        </span>
        {/* Progress bar */}
        <div style={{ flex: isMobile ? "none" : 1, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {STEPS.map(s => (
              <div key={s.num} style={{
                width: s.num === step ? 20 : 8, height: 6, borderRadius: 3,
                background: s.num < step ? C.success : s.num === step ? C.purple : C.border,
                transition: "all 0.2s",
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, maxWidth: 900, margin: "0 auto", width: "100%",
        padding: isMobile ? "0 0 60px" : "28px 24px 60px",
        display: "flex", gap: 28, alignItems: "flex-start",
        boxSizing: "border-box", overflowX: "hidden",
      }}>

        {/* Left step timeline */}
        {!isMobile && (
          <div style={{ width: 180, flexShrink: 0, position: "sticky", top: 80 }}>
            <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {STEPS.map((s, i) => {
                const done   = step > s.num;
                const active = step === s.num;
                return (
                  <div key={s.num}>
                    <button
                      onClick={() => done && setStep(s.num)}
                      style={{
                        width: "100%", padding: "13px 18px",
                        display: "flex", alignItems: "center", gap: 10,
                        background: active ? C.purpleBg : "transparent",
                        border: "none", cursor: done ? "pointer" : "default",
                        borderLeft: `3px solid ${active ? C.purple : "transparent"}`,
                        fontFamily: F, textAlign: "left", transition: "all 0.15s",
                      }}
                    >
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                        background: done ? C.success : active ? C.purple : C.bg,
                        border: `2px solid ${done ? C.success : active ? C.purple : C.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: (done || active) ? "#fff" : C.body,
                        fontWeight: 700, transition: "all 0.2s",
                      }}>
                        {done ? "✓" : s.num}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? C.purple : done ? C.navy : C.body }}>
                        {isKo ? s.label : s.labelEn}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div style={{ width: 2, height: 6, background: step > s.num ? C.success : C.border, margin: "0 0 0 30px" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main card */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Mobile step bar */}
          {isMobile && (
            <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "10px 16px", display: "flex", gap: 4, overflowX: "auto" }}>
              {STEPS.map(s => {
                const done = step > s.num, active = step === s.num;
                return (
                  <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: done ? C.success : active ? C.purple : C.bg,
                      border: `2px solid ${done ? C.success : active ? C.purple : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: (done || active) ? "#fff" : C.body, fontWeight: 700,
                      flexShrink: 0,
                    }}>{done ? "✓" : s.num}</div>
                    <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? C.purple : C.body, whiteSpace: "nowrap" }}>
                      {isKo ? s.label : s.labelEn}
                    </span>
                    {s.num < STEPS.length && <span style={{ color: C.border, fontSize: 10, marginLeft: 2, flexShrink: 0 }}>›</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ background: C.white, borderRadius: isMobile ? 0 : 14, border: isMobile ? "none" : `1px solid ${C.border}` }}>
            {/* Step header */}
            <div style={{ padding: isMobile ? "20px 16px 0" : "28px 32px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {isKo ? `${step}단계 / 3` : `Step ${step} of 3`}
              </div>
              <h2 style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: isMobile ? 22 : 27, fontWeight: 400,
                color: C.navy, margin: "0 0 6px", lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}>
                {stepHeader.title}
              </h2>
              <p style={{ fontSize: 13, color: C.body, margin: "0 0 22px" }}>{stepHeader.sub}</p>
              <div style={{ height: 1, background: C.border, marginBottom: 28 }} />
            </div>

            {/* Step content */}
            <div style={{ padding: isMobile ? "0 16px 20px" : "0 32px 28px" }}>
              {step === 1 && <Step1 data={data} onChange={setData} />}
              {step === 2 && <Step2 data={data} onChange={setData} isMobile={isMobile} />}
              {step === 3 && <Step3 data={data} onPublish={handlePublish} publishing={publishing} isMobile={isMobile} />}
            </div>

            {/* Nav buttons (steps 1-2) */}
            {step < 3 && (
              <div style={{
                padding: isMobile ? "12px 16px 20px" : "12px 32px 24px",
                borderTop: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <button
                  onClick={() => setStep(s => Math.max(1, s - 1))}
                  disabled={step === 1}
                  style={{
                    background: "none", border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "10px 20px", fontSize: 13,
                    cursor: step === 1 ? "default" : "pointer",
                    color: step === 1 ? C.border : C.body, fontFamily: F,
                    minHeight: 44,
                  }}
                >
                  ← {isKo ? "이전" : "Back"}
                </button>
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext[step - 1]}
                  style={{
                    padding: "10px 28px", borderRadius: 8, border: "none",
                    background: canNext[step - 1] ? C.purple : C.purpleBg,
                    color: canNext[step - 1] ? "#fff" : C.purpleLight,
                    fontSize: 13, fontWeight: 600,
                    cursor: canNext[step - 1] ? "pointer" : "default",
                    fontFamily: F, transition: "all 0.15s",
                    minHeight: 44,
                  }}
                  onMouseEnter={e => { if (canNext[step-1]) e.currentTarget.style.background = C.purpleHover; }}
                  onMouseLeave={e => { if (canNext[step-1]) e.currentTarget.style.background = C.purple; }}
                >
                  {isKo ? "다음 단계 →" : "Next →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
