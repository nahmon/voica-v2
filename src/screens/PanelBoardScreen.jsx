import { useState } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { PANEL_JOBS, MOCK_PANEL_PROFILE, getMatchScore } from "../lib/mockData.js";
import { Btn, GlobalNav } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const APPLY_STEPS = ["none", "applied", "ai_screening", "confirmed"];

function rewardTier(rewardStr) {
  const n = parseInt(rewardStr.replace(/[^0-9]/g, ""), 10) || 0;
  if (n >= 80000) return { color: "#92400e", bg: "#fef3c7", accent: "#f59e0b", label: "전문가" };
  if (n >= 20000) return { color: "#92400e", bg: "#fef9e7", accent: "#f59e0b", label: "프리미엄" };
  if (n >= 5000)  return { color: C.successText, bg: "#d1fae5", accent: C.success, label: null };
  return { color: C.purple, bg: C.purpleBg, accent: C.purple, label: null };
}

export default function PanelBoardScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("전체");
  const [applyState, setApplyState] = useState({});
  const categories = ["전체", "추천", "전문가", "테크", "뷰티", "미디어", "식품", "금융", "교육"];
  const profile = MOCK_PANEL_PROFILE;

  const jobsWithScore = PANEL_JOBS.map(j => ({ ...j, _matchScore: getMatchScore(j, profile) }));
  const MATCH_THRESHOLD = 4;

  const filtered = jobsWithScore
    .filter(j =>
      (catFilter === "전체" || catFilter === "추천" || j.category === catFilter) &&
      (search === "" || j.title.includes(search) || j.company.includes(search))
    )
    .filter(j => catFilter === "추천" ? j._matchScore >= MATCH_THRESHOLD : true)
    .sort((a, b) => {
      if (catFilter === "전체" || catFilter === "추천") return b._matchScore - a._matchScore;
      return 0;
    });

  const recommendedCount = jobsWithScore.filter(j => j._matchScore >= MATCH_THRESHOLD).length;

  return (
    <div style={{ background: "#f7f7fb", minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} activeTab="panel_board" variant={user?.user_metadata?.role === "researcher" ? "app" : "panel"} user={user} logout={logout} />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, #0f0c2e 0%, #1e1a4f 60%, #2d1b69 100%)`, padding: isMobile ? "36px 20px 32px" : "48px 24px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>지금 모집 중</span>
        </div>
        <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>
          인터뷰 참여하고 리워드 받기
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
          보이스 인터뷰 · 평균 10분 · 완료 즉시 지급
        </div>
        <div style={{ maxWidth: 460, margin: "0 auto", position: "relative" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="인터뷰 주제 또는 기업명 검색"
            style={{ width: "100%", padding: "13px 44px 13px 18px", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", backdropFilter: "blur(8px)" }}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.5, display: "flex" }}>
            {Ic.Search({ s: 16, c: "#fff" })}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "20px 16px 60px" : "28px 24px 80px" }}>

        {/* Category filter — filled pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {categories.map(c => {
            const active = catFilter === c;
            const isSpecial = c === "추천";
            return (
              <button key={c} onClick={() => setCatFilter(c)}
                style={{
                  padding: "7px 16px", borderRadius: 24, fontSize: 13, fontFamily: F, cursor: "pointer",
                  border: "none",
                  background: active ? C.purple : isSpecial ? "#ede9ff" : "#ebebf2",
                  color: active ? "#fff" : isSpecial ? C.purple : "#555",
                  fontWeight: active ? 600 : isSpecial ? 600 : 400,
                  transition: "all 0.12s",
                }}>
                {c === "추천" ? `✦ 추천 ${recommendedCount}` : c}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#999" }}>{filtered.length}개</span>
        </div>

        {/* Job list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              status={applyState[job.id] || "none"}
              isRecommended={job._matchScore >= MATCH_THRESHOLD}
              isMobile={isMobile}
              onApply={() => setApplyState(prev => ({ ...prev, [job.id]: "applied" }))}
              onCycleDemo={() => {
                const idx = APPLY_STEPS.indexOf(applyState[job.id] || "none");
                const next = APPLY_STEPS[Math.min(idx + 1, APPLY_STEPS.length - 1)];
                setApplyState(prev => ({ ...prev, [job.id]: next }));
              }}
              go={go}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, status, isRecommended, isMobile, onApply, onCycleDemo, go }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((job.filled / job.total) * 100);
  const remaining = job.total - job.filled;
  const isConfirmed = status === "confirmed";
  const isApplied   = status !== "none";
  const tier = rewardTier(job.reward);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: isRecommended
        ? "0 4px 20px rgba(83,58,253,0.12), 0 1px 4px rgba(0,0,0,0.06)"
        : "0 1px 6px rgba(0,0,0,0.07)",
      transition: "box-shadow 0.15s, transform 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isRecommended ? "0 4px 20px rgba(83,58,253,0.12)" : "0 1px 6px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Colored top accent for recommended */}
      {isRecommended && (
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.purple}, #818cf8)` }} />
      )}

      <div style={{ padding: isMobile ? "18px 16px 16px" : "20px 22px 18px" }}>
        {/* Top row */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Chips — all filled, no borders */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
              {isRecommended && (
                <Chip bg={C.purple} color="#fff">✦ 추천</Chip>
              )}
              {job.expert && (
                <Chip bg="#f59e0b" color="#fff">{job.expertTag}</Chip>
              )}
              {job.urgent && (
                <Chip bg="#ef4444" color="#fff">마감임박</Chip>
              )}
              <Chip bg="#e8e8f0" color="#555">{job.category}</Chip>
            </div>

            <div style={{ fontSize: 16, fontWeight: 700, color: "#0d0f1a", lineHeight: 1.3, marginBottom: 4 }}>{job.title}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{job.company} · {job.duration} · ~{job.deadline}</div>
          </div>

          {/* Reward pill — filled */}
          <div style={{ flexShrink: 0, background: tier.bg, borderRadius: 12, padding: "10px 14px", textAlign: "center", minWidth: 72 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: tier.color, lineHeight: 1, marginBottom: 2, fontFeatureSettings: '"tnum"', whiteSpace: "nowrap" }}>
              {job.reward}
            </div>
            <div style={{ fontSize: 10, color: tier.color, opacity: 0.75, fontWeight: 600 }}>
              {tier.label ?? "리워드"}
            </div>
          </div>
        </div>

        {/* Fill progress */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 5, background: "#ebebf2", borderRadius: 3 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : C.purple, borderRadius: 3, transition: "width 0.4s" }} />
          </div>
          <span style={{ fontSize: 11, color: remaining <= 5 ? "#ef4444" : "#888", fontWeight: remaining <= 5 ? 700 : 400, whiteSpace: "nowrap", fontFeatureSettings: '"tnum"' }}>
            {remaining <= 5 ? `잔여 ${remaining}자리` : `${job.filled}/${job.total}명`}
          </span>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {job.description && (
              <div style={{ background: "#f4f4f9", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>인터뷰 소개</div>
                <div style={{ fontSize: 13, color: "#1a1a2e", lineHeight: 1.7 }}>{job.description}</div>
              </div>
            )}

            {job.targetProfile && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>찾는 패널</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[
                    { icon: "🎂", label: "연령", value: job.targetProfile.age },
                    { icon: "👤", label: "성별", value: job.targetProfile.gender },
                    { icon: "📍", label: "지역", value: job.targetProfile.region },
                  ].map(item => (
                    <div key={item.label} style={{ background: "#eef0fb", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#777", marginBottom: 3 }}>{item.icon} {item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0d0f1a" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, background: "#ede9ff", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.purple, marginBottom: 4, fontWeight: 700 }}>✦ 이런 분을 찾아요</div>
                  <div style={{ fontSize: 12, color: "#1a1a2e", lineHeight: 1.65 }}>{job.targetProfile.lifestyle}</div>
                </div>
                {job.targetProfile.exclude && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>⛔ {job.targetProfile.exclude}</div>
                )}
              </div>
            )}

            {/* Conditions — filled chips, no borders */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>참여 조건</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {job.conditions.map(c => (
                  <Chip key={c} bg="#e8e8f0" color="#444">{c}</Chip>
                ))}
              </div>
            </div>

            {/* Apply CTA inside detail */}
            {!isApplied && !isConfirmed && (
              <button onClick={onApply}
                style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: C.purple, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F, letterSpacing: "0.2px" }}>
                지원하기 · {job.reward}
              </button>
            )}
          </div>
        )}

        {/* Bottom CTA row */}
        <div style={{ marginTop: 14 }}>
          {isConfirmed ? (
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#d1fae5", borderRadius: 10, flex: 1 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, display: "inline-block" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.successText }}>참여 확정</span>
              </div>
              <button onClick={() => go("consent")}
                style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: C.purple, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 5 }}>
                {Ic.Mic({ s: 13, c: "white" })} 인터뷰 시작
              </button>
            </div>
          ) : isApplied ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "#ede9ff", borderRadius: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.purple, display: "inline-block" }} />
              <span style={{ fontSize: 12, color: C.purple, fontWeight: 600 }}>
                {status === "applied" ? "AI 적합성 검토 중" : "리서처 최종 검토 대기"}
              </span>
              <button onClick={onCycleDemo} style={{ marginLeft: "auto", fontSize: 10, color: "rgba(0,0,0,0.15)", background: "none", border: "none", cursor: "pointer", fontFamily: F }}>[dev]</button>
            </div>
          ) : (
            <button onClick={() => setExpanded(v => !v)}
              style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1px solid #d4d4e0", background: "transparent", color: "#666", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "border-color 0.12s, color 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.color = C.purple; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#d4d4e0"; e.currentTarget.style.color = "#666"; }}>
              {expanded ? "접기 ∧" : "상세 보기 ∨"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ bg, color, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: bg, color }}>
      {children}
    </span>
  );
}
