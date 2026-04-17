import { useState, useEffect } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { PANEL_JOBS, MOCK_PANEL_PROFILE, getMatchScore } from "../lib/mockData.js";
import { GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const APPLY_STEPS = ["none", "applied", "ai_screening", "confirmed"];
const SORT_OPTIONS = [
  { key: "추천순", label: "추천순" },
  { key: "최신순", label: "최신순" },
  { key: "리워드순", label: "리워드순" },
];

function parseReward(r) {
  return parseInt((r || "0").replace(/[^0-9]/g, ""), 10) || 0;
}

function matchPct(score) {
  // score max is ~8 (3+2+1+2), map to 0-100
  return Math.min(100, Math.round((score / 8) * 100));
}

function MatchBadge({ score }) {
  const pct = matchPct(score);
  let color, bg;
  if (pct >= 70) { color = "#15803d"; bg = "rgba(21,190,83,0.12)"; }
  else if (pct >= 40) { color = "#92650a"; bg = "rgba(251,191,36,0.13)"; }
  else { color = "#64748d"; bg = "rgba(100,116,141,0.1)"; }
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color, background: bg,
      padding: "2px 8px", borderRadius: 4, flexShrink: 0,
    }}>매칭 {pct}%</span>
  );
}

const RECENTLY_VIEWED_KEY = "voica_recently_viewed";

function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]"); }
  catch { return []; }
}

function addRecentlyViewed(jobId) {
  const prev = getRecentlyViewed().filter(id => id !== jobId);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([jobId, ...prev].slice(0, 6)));
}

export default function PanelBoardScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("전체");
  const [sortKey, setSortKey] = useState("추천순");
  const [applyState, setApplyState] = useState({});
  const [recentIds, setRecentIds] = useState(getRecentlyViewed);
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
      if (sortKey === "최신순") return a.id - b.id; // mock: lower id = older, invert
      if (sortKey === "리워드순") return parseReward(b.reward) - parseReward(a.reward);
      // 추천순 (default)
      return b._matchScore - a._matchScore;
    });

  const recommendedCount = jobsWithScore.filter(j => j._matchScore >= MATCH_THRESHOLD).length;

  const recentJobs = recentIds
    .map(id => jobsWithScore.find(j => j.id === id))
    .filter(Boolean);

  function handleView(jobId) {
    addRecentlyViewed(jobId);
    setRecentIds(getRecentlyViewed());
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflowX: "auto", marginBottom: 12, paddingBottom: 4, scrollbarWidth: "none" }}>
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

        {/* Sort toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: C.body, flexShrink: 0 }}>정렬:</span>
          {SORT_OPTIONS.map(opt => {
            const active = sortKey === opt.key;
            return (
              <button key={opt.key} onClick={() => setSortKey(opt.key)}
                style={{
                  padding: "4px 12px", borderRadius: 6, fontSize: 12, fontFamily: F, cursor: "pointer",
                  border: `1px solid ${active ? C.purple : C.border}`,
                  background: active ? C.purpleBg : "transparent",
                  color: active ? C.purple : C.body,
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.12s",
                }}>
                {opt.label}
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
              onApply={() => {
                setApplyState(prev => ({ ...prev, [job.id]: "applied" }));
                handleView(job.id);
              }}
              onView={() => handleView(job.id)}
              onCycleDemo={() => {
                const idx = APPLY_STEPS.indexOf(applyState[job.id] || "none");
                const next = APPLY_STEPS[Math.min(idx + 1, APPLY_STEPS.length - 1)];
                setApplyState(prev => ({ ...prev, [job.id]: next }));
              }}
              go={go}
            />
          ))}
        </div>

        {/* 최근 본 공고 */}
        {recentJobs.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 12 }}>최근 본 공고</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentJobs.map(job => (
                <div key={job.id} style={{
                  background: C.white, borderRadius: 10, padding: "12px 16px",
                  border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.navy, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</div>
                    <div style={{ fontSize: 11, color: C.body }}>{job.company} · {job.duration}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{job.reward}</span>
                    <MatchBadge score={job._matchScore} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer go={go} />
    </div>
  );
}

function JobCard({ job, status, isRecommended, isMobile, onApply, onView, onCycleDemo, go }) {
  const [expanded, setExpanded] = useState(true);
  const remaining = job.total - job.filled;
  const fillPct = Math.round((job.filled / job.total) * 100);
  const isConfirmed = status === "confirmed";
  const isApplied = status !== "none";
  const isUrgent = job.urgent || remaining <= 10;

  function handleToggle() {
    if (!isApplied) {
      setExpanded(v => !v);
      onView();
    }
  }

  return (
    <div
      onClick={handleToggle}
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
            <MatchBadge score={job._matchScore} />
          </div>
          {/* Reward + duration — hero numbers */}
          <div style={{ flexShrink: 0, marginLeft: 12, textAlign: "right" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{job.reward}</div>
            <div style={{ fontSize: 11, color: C.body, marginTop: 3, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={C.body} strokeWidth="1.4" strokeLinecap="round"><circle cx="5" cy="5" r="4"/><path d="M5 3v2l1.5 1.5"/></svg>
              {job.duration}
            </div>
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
              인터뷰 시작할게요
            </button>
          </div>
        ) : isApplied ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "rgba(108,63,219,0.07)", borderRadius: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.purple, fontWeight: 500 }}>
              {status === "applied" ? "AI 적합성 검토 중이에요" : "리서처 최종 검토를 기다리고 있어요"}
            </span>
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
            지원할게요
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
