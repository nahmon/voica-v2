import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { PANEL_JOBS, MOCK_PANEL_PROFILE, getMatchScore } from "../lib/mockData.js";
import { GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const APPLY_STEPS = ["none", "applied", "ai_screening", "confirmed"];

export default function PanelBoardScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
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
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} activeTab="panel_board" variant={user?.user_metadata?.role === "researcher" ? "app" : "panel"} user={user} logout={logout} />

      {/* Hero */}
      <div style={{ background: C.navy, padding: isMobile ? "32px 20px 28px" : "44px 24px 36px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>지금 {filtered.length}개 모집 중</span>
          </div>
          <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: C.white, marginBottom: 16, lineHeight: 1.3 }}>
            인터뷰 참여하고 리워드 받기
          </div>
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="주제 또는 기업명 검색"
              style={{
                width: "100%", padding: "11px 40px 11px 14px",
                borderRadius: 8, border: "none",
                background: "rgba(255,255,255,0.1)",
                color: C.white, fontSize: 14, fontFamily: F, outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4, display: "flex" }}>
              {Ic.Search({ s: 16, c: "#fff" })}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "16px 16px 60px" : "24px 24px 80px" }}>

        {/* Category filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflowX: "auto", marginBottom: 20, paddingBottom: 4, scrollbarWidth: "none" }}>
          {categories.map(c => {
            const active = catFilter === c;
            return (
              <button key={c} onClick={() => setCatFilter(c)}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontFamily: F, cursor: "pointer",
                  border: "none", flexShrink: 0,
                  background: active ? C.navy : "rgba(0,0,0,0.06)",
                  color: active ? "#fff" : C.body,
                  fontWeight: active ? 600 : 400,
                }}>
                {c === "추천" ? `✦ 추천 ${recommendedCount}` : c}
              </button>
            );
          })}
        </div>

        {/* Job list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
      <Footer go={go} />
    </div>
  );
}

function JobCard({ job, status, isRecommended, isMobile, onApply, onCycleDemo, go }) {
  const [expanded, setExpanded] = useState(true);
  const remaining = job.total - job.filled;
  const fillPct = Math.round((job.filled / job.total) * 100);
  const isConfirmed = status === "confirmed";
  const isApplied = status !== "none";
  const isUrgent = job.urgent || remaining <= 10;

  return (
    <div
      onClick={() => !isApplied && setExpanded(v => !v)}
      style={{
        background: C.white,
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        overflow: "hidden",
        cursor: isApplied ? "default" : "pointer",
        transition: "box-shadow 0.12s",
      }}
      onMouseEnter={e => { if (!isApplied) e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
    >
      <div style={{ padding: isMobile ? "14px 16px" : "16px 20px" }}>

        {/* Top row: badges + reward */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.body }}>{job.company}</span>
            <span style={{ fontSize: 12, color: C.border }}>·</span>
            <span style={{ fontSize: 12, color: C.body }}>{job.category}</span>
            {isUrgent && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: "#dc2626",
                background: "rgba(220,38,38,0.07)", padding: "2px 7px", borderRadius: 4,
              }}>마감임박</span>
            )}
            {isRecommended && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: C.purple,
                background: "rgba(108,63,219,0.08)", padding: "2px 7px", borderRadius: 4,
              }}>✦ 추천</span>
            )}
          </div>
          {/* Reward — hero number */}
          <div style={{ flexShrink: 0, marginLeft: 12, textAlign: "right" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{job.reward}</div>
            <div style={{ fontSize: 11, color: C.body, marginTop: 2 }}>{job.duration}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 600, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>
          {job.title}
        </div>

        {/* Urgency bar + remaining */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: isUrgent ? "#dc2626" : C.body }}>
              {isUrgent ? `⚡ 남은 자리 ${remaining}명` : `남은 자리 ${remaining}명`}
            </span>
            <span style={{ fontSize: 11, color: C.body }}>~{job.deadline}</span>
          </div>
          <div style={{ height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${fillPct}%`,
              background: fillPct >= 80 ? "#dc2626" : C.purple,
              transition: "width 0.3s",
            }} />
          </div>
        </div>

        {/* CTA */}
        {isConfirmed ? (
          <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
            <div style={{ flex: 1, padding: "9px 14px", background: "rgba(22,163,74,0.08)", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>참여 확정</span>
            </div>
            <button onClick={() => go("consent")}
              style={{ padding: "9px 18px", background: C.purple, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              인터뷰 시작 →
            </button>
          </div>
        ) : isApplied ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "rgba(108,63,219,0.07)", borderRadius: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.purple, fontWeight: 500 }}>
              {status === "applied" ? "AI 적합성 검토 중" : "리서처 최종 검토 대기"}
            </span>
            <button onClick={onCycleDemo} style={{ marginLeft: "auto", fontSize: 10, color: "rgba(0,0,0,0.1)", background: "none", border: "none", cursor: "pointer", fontFamily: F }}>[dev]</button>
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onApply(); }}
            style={{
              width: "100%", padding: "10px 14px",
              borderRadius: 8, border: "none",
              background: C.purple, color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F,
            }}>
            지원하기
          </button>
        )}

        {/* Expanded detail */}
        {expanded && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            {job.description && (
              <div style={{ fontSize: 13, color: C.body, lineHeight: 1.75, marginBottom: 12 }}>{job.description}</div>
            )}
            {job.targetProfile && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 6, letterSpacing: 0.5 }}>찾는 패널</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                  {[job.targetProfile.age, job.targetProfile.gender, job.targetProfile.region].map((v, i) => (
                    <span key={i} style={{ fontSize: 12, padding: "3px 9px", borderRadius: 5, background: C.bg, color: C.navy }}>{v}</span>
                  ))}
                </div>
                {job.targetProfile.lifestyle && (
                  <div style={{ fontSize: 12, color: C.body, lineHeight: 1.7 }}>{job.targetProfile.lifestyle}</div>
                )}
                {job.targetProfile.exclude && (
                  <div style={{ marginTop: 4, fontSize: 11, color: C.body }}>제외: {job.targetProfile.exclude}</div>
                )}
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 6, letterSpacing: 0.5 }}>참여 조건</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {job.conditions.map(c => (
                  <span key={c} style={{ fontSize: 12, padding: "3px 9px", borderRadius: 5, background: C.bg, color: C.navy }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
