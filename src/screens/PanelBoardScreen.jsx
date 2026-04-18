import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { PANEL_JOBS, PANEL_JOBS_KO, MOCK_PANEL_PROFILE, getMatchScore } from "../lib/mockData.js";
import { GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const APPLY_STEPS = ["none", "applied", "ai_screening", "confirmed"];
const SORT_OPTIONS_EN = [
  { key: "recommended", label: "Best Match" },
  { key: "newest", label: "Newest" },
  { key: "reward", label: "Top Reward" },
];
const SORT_OPTIONS_KO = [
  { key: "recommended", label: "추천순" },
  { key: "newest", label: "최신순" },
  { key: "reward", label: "리워드 높은 순" },
];

function parseReward(r) {
  return parseInt((r || "0").replace(/[^0-9]/g, ""), 10) || 0;
}

function matchPct(score) {
  return Math.min(100, Math.round((score / 8) * 100));
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
  const [lang, setLang] = useState("ko");
  const isKo = lang === "ko";
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortKey, setSortKey] = useState("recommended");
  const [applyState, setApplyState] = useState({});
  const [recentIds, setRecentIds] = useState(getRecentlyViewed);

  const SORT_OPTIONS = isKo ? SORT_OPTIONS_KO : SORT_OPTIONS_EN;
  const CATEGORY_KEYS = ["All", "Recommended", "Expert", "Tech", "Beauty", "Media", "Food", "Finance", "Education"];
  const CATEGORY_LABELS_KO = { All: "전체", Recommended: "추천", Expert: "전문직", Tech: "테크", Beauty: "뷰티", Media: "미디어", Food: "식음료", Finance: "금융", Education: "교육" };
  const catLabel = (key) => isKo ? (CATEGORY_LABELS_KO[key] ?? key) : key;
  const profile = MOCK_PANEL_PROFILE;

  const jobsWithScore = (isKo ? PANEL_JOBS_KO : PANEL_JOBS).map(j => ({ ...j, _matchScore: getMatchScore(j, profile) }));
  const MATCH_THRESHOLD = 4;

  const filtered = jobsWithScore
    .filter(j =>
      (catFilter === "All" || catFilter === "Recommended" || j.category === catFilter) &&
      (search === "" || j.title.includes(search) || j.company.includes(search))
    )
    .filter(j => catFilter === "Recommended" ? j._matchScore >= MATCH_THRESHOLD : true)
    .sort((a, b) => {
      if (sortKey === "newest") return a.id - b.id;
      if (sortKey === "reward") return parseReward(b.reward) - parseReward(a.reward);
      return b._matchScore - a._matchScore;
    });

  const recommendedCount = jobsWithScore.filter(j => j._matchScore >= MATCH_THRESHOLD).length;
  const recentJobs = recentIds.map(id => jobsWithScore.find(j => j.id === id)).filter(Boolean);

  function handleView(jobId) {
    addRecentlyViewed(jobId);
    setRecentIds(getRecentlyViewed());
  }

  return (
    <div style={{ background: "#f5f6fa", minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} activeTab="panel_board" variant={user?.user_metadata?.role === "researcher" ? "app" : "panel"} user={user} logout={logout} lang={lang} />

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #2d1b6b 100%)`,
        padding: isMobile ? "32px 20px 40px" : "48px 24px 56px",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {/* Live indicator */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "5px 12px", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{isKo ? `인터뷰 ${filtered.length}건 모집 중` : `${filtered.length} interviews open now`}</span>
          </div>

          <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, color: "#fff", margin: "0 0 8px", lineHeight: 1.25 }}>
            {isKo ? "인터뷰에 참여하고, 리워드를 받아보세요" : "Share your voice. Earn rewards."}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: "0 0 24px" }}>
            {isKo ? "내 프로필에 딱 맞는 AI 인터뷰에 참여해 보세요." : "Join AI-powered interviews matched to your profile."}
          </p>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.45, display: "flex", pointerEvents: "none" }}>
              {Ic.Search({ s: 16, c: "#fff" })}
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isKo ? "주제나 기업명으로 검색해 보세요…" : "Search by topic or company…"}
              style={{
                width: "100%", padding: "13px 16px 13px 42px",
                borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 14, fontFamily: F, outline: "none",
                boxSizing: "border-box", backdropFilter: "blur(8px)",
              }}
            />
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: isMobile ? 16 : 28, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: isKo ? "평균 리워드" : "Avg. reward", value: "₩25,000" },
              { label: isKo ? "평균 소요 시간" : "Avg. duration", value: isKo ? "8분" : "8 min" },
              { label: isKo ? "나에게 맞는 인터뷰" : "Matched for you", value: isKo ? `${recommendedCount}건` : `${recommendedCount} interviews` },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "20px 16px 80px" : "28px 24px 80px" }}>

        {/* Filters + Sort row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          {/* Category pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", scrollbarWidth: "none", flex: 1 }}>
            {CATEGORY_KEYS.map(c => {
              const active = catFilter === c;
              return (
                <button key={c} onClick={() => setCatFilter(c)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontFamily: F, cursor: "pointer",
                  border: `1px solid ${active ? C.purple : "rgba(0,0,0,0.1)"}`,
                  background: active ? C.purple : "#fff",
                  color: active ? "#fff" : C.body,
                  fontWeight: active ? 600 : 400, flexShrink: 0,
                  transition: "all 0.12s",
                }}>
                  {c === "Recommended" ? `✦ ${isKo ? `추천 (${recommendedCount})` : `Matched (${recommendedCount})`}` : catLabel(c)}
                </button>
              );
            })}
          </div>

          {/* Sort dropdown */}
          {!isMobile && (
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              style={{
                padding: "7px 12px", borderRadius: 8, border: `1px solid rgba(0,0,0,0.1)`,
                background: "#fff", fontSize: 12, fontFamily: F, color: C.navy,
                cursor: "pointer", flexShrink: 0, outline: "none",
              }}>
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          )}
        </div>

        {/* Result count */}
        <div style={{ fontSize: 12, color: C.body, marginBottom: 12 }}>
          {isKo
            ? `${catFilter !== "All" ? `${catLabel(catFilter)} ` : ""}인터뷰 ${filtered.length}건`
            : `${filtered.length} interview${filtered.length !== 1 ? "s" : ""} ${catFilter !== "All" ? `in ${catFilter}` : "available"}`}
        </div>

        {/* Job cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.body }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: C.navy, marginBottom: 6 }}>{isKo ? "인터뷰를 찾을 수 없어요" : "No interviews found"}</div>
              <div style={{ fontSize: 13 }}>{isKo ? "다른 검색어나 필터를 써보세요" : "Try a different search or filter"}</div>
            </div>
          ) : filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              status={applyState[job.id] || "none"}
              isRecommended={job._matchScore >= MATCH_THRESHOLD}
              isMobile={isMobile}
              isKo={isKo}
              onApply={() => { setApplyState(prev => ({ ...prev, [job.id]: "applied" })); handleView(job.id); }}
              onView={() => handleView(job.id)}
              onCycleDemo={() => {
                const idx = APPLY_STEPS.indexOf(applyState[job.id] || "none");
                setApplyState(prev => ({ ...prev, [job.id]: APPLY_STEPS[Math.min(idx + 1, APPLY_STEPS.length - 1)] }));
              }}
              go={go}
            />
          ))}
        </div>

        {/* Recently viewed */}
        {recentJobs.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              {isKo ? "최근 본 인터뷰" : "Recently viewed"}
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
              {recentJobs.map(job => (
                <div key={job.id} style={{
                  background: "#fff", borderRadius: 10, padding: "12px 14px",
                  border: `1px solid rgba(0,0,0,0.08)`, flexShrink: 0,
                  minWidth: 200, maxWidth: 240,
                }}>
                  <div style={{ fontSize: 12, color: C.body, marginBottom: 4 }}>{job.company}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>{job.reward}</span>
                    <MatchBadge score={job._matchScore} isKo={isKo} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer go={go} lang={lang} onLangChange={setLang} />
    </div>
  );
}

function MatchBadge({ score, isKo }) {
  const pct = Math.min(100, Math.round((score / 8) * 100));
  let color, bg;
  if (pct >= 70) { color = "#15803d"; bg = "rgba(21,190,83,0.1)"; }
  else if (pct >= 40) { color = "#92650a"; bg = "rgba(251,191,36,0.12)"; }
  else { color = "#64748d"; bg = "rgba(100,116,141,0.08)"; }
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: "2px 8px", borderRadius: 4, flexShrink: 0 }}>
      {isKo ? `${pct}% 일치` : `${pct}% match`}
    </span>
  );
}

function JobCard({ job, status, isRecommended, isMobile, isKo, onApply, onView, onCycleDemo, go }) {
  const [expanded, setExpanded] = useState(true);
  const remaining = job.total - job.filled;
  const fillPct = Math.round((job.filled / job.total) * 100);
  const isConfirmed = status === "confirmed";
  const isApplied = status !== "none";
  const isUrgent = job.urgent || remaining <= 10;
  const matchPct = Math.min(100, Math.round((job._matchScore / 8) * 100));

  function handleToggle() {
    if (!isApplied) { setExpanded(v => !v); onView(); }
  }

  return (
    <div
      onClick={handleToggle}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: isRecommended ? `1.5px solid ${C.purpleLight}40` : "1px solid rgba(0,0,0,0.08)",
        overflow: "hidden",
        cursor: isApplied ? "default" : "pointer",
        transition: "box-shadow 0.15s, transform 0.15s",
        boxShadow: isRecommended ? "0 2px 12px rgba(110,75,255,0.08)" : "0 1px 4px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={e => { if (!isApplied) { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isRecommended ? "0 2px 12px rgba(110,75,255,0.08)" : "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Recommended accent bar */}
      {isRecommended && <div style={{ height: 3, background: `linear-gradient(90deg, ${C.purple}, ${C.purpleLight})` }} />}

      <div style={{ padding: isMobile ? "16px" : "18px 22px" }}>

        {/* Header row: company + category / reward */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.body }}>{job.company}</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.border, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: C.body, background: "rgba(0,0,0,0.04)", padding: "2px 7px", borderRadius: 4 }}>{job.category}</span>
            {isRecommended && (
              <span style={{ fontSize: 11, fontWeight: 600, color: C.purple, background: `${C.purpleBg}`, padding: "2px 7px", borderRadius: 4 }}>{isKo ? "✦ 추천" : "✦ Matched"}</span>
            )}
            {isUrgent && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", background: "rgba(220,38,38,0.07)", padding: "2px 7px", borderRadius: 4 }}>{isKo ? "⚡ 마감 임박" : "⚡ Closing Soon"}</span>
            )}
          </div>

          {/* Reward — hero number */}
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{job.reward}</div>
            <div style={{ fontSize: 11, color: C.body, marginTop: 3, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={C.body} strokeWidth="1.4" strokeLinecap="round"><circle cx="5" cy="5" r="4"/><path d="M5 3v2l1.5 1.5"/></svg>
              {job.duration}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 12 }}>
          {job.title}
        </div>

        {/* Match + fill row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <MatchBadge score={job._matchScore} isKo={isKo} />
          <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${fillPct}%`,
              background: fillPct >= 80 ? "#ef4444" : C.purple,
              transition: "width 0.3s",
            }} />
          </div>
          <span style={{ fontSize: 11, color: isUrgent ? "#dc2626" : C.body, fontWeight: isUrgent ? 600 : 400, whiteSpace: "nowrap" }}>
            {isUrgent
              ? (isKo ? `⚡ ${remaining}자리 남음` : `⚡ ${remaining} left`)
              : (isKo ? `${remaining}자리 남음` : `${remaining} spots`)}
          </span>
          <span style={{ fontSize: 11, color: C.body, whiteSpace: "nowrap" }}>~{job.deadline}</span>
        </div>

        {/* CTA */}
        {isConfirmed ? (
          <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
            <div style={{ flex: 1, padding: "10px 14px", background: "rgba(22,163,74,0.07)", borderRadius: 8, border: "1px solid rgba(22,163,74,0.2)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>{isKo ? "참여 확정됐어요!" : "Confirmed — you're in!"}</span>
            </div>
            <button onClick={() => go("consent")} style={{
              padding: "10px 20px", background: C.purple, color: "#fff",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: F, whiteSpace: "nowrap",
            }}>
              {isKo ? "시작하기 →" : "Start →"}
            </button>
          </div>
        ) : isApplied ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: C.purpleBg, borderRadius: 8, border: `1px solid ${C.purple}20` }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.purple, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.purple, fontWeight: 500 }}>
              {status === "applied"
                ? (isKo ? "AI가 지원서를 검토하고 있어요…" : "AI screening in progress…")
                : (isKo ? "연구자 확인을 기다리고 있어요" : "Awaiting researcher confirmation")}
            </span>
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onApply(); }}
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 8,
              border: "none", background: C.purple, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F,
              transition: "background 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.purpleHover}
            onMouseLeave={e => e.currentTarget.style.background = C.purple}
          >
            {isKo ? "지원하기 →" : "Apply Now →"}
          </button>
        )}

        {/* Expanded details */}
        {expanded && !isApplied && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid rgba(0,0,0,0.06)` }} onClick={e => e.stopPropagation()}>
            {job.description && (
              <p style={{ fontSize: 13, color: C.body, lineHeight: 1.75, margin: "0 0 14px" }}>{job.description}</p>
            )}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {job.targetProfile && (
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.label, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{isKo ? "모집 대상" : "Looking for"}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {[job.targetProfile.age, job.targetProfile.gender, job.targetProfile.region].map((v, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(0,0,0,0.04)", color: C.navy, fontWeight: 500 }}>{v}</span>
                    ))}
                  </div>
                  {job.targetProfile.lifestyle && (
                    <div style={{ fontSize: 12, color: C.body, lineHeight: 1.6, marginTop: 6 }}>{job.targetProfile.lifestyle}</div>
                  )}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.label, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{isKo ? "참여 조건" : "Requirements"}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {job.conditions.map(c => (
                    <span key={c} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: C.purpleBg, color: C.purple, fontWeight: 500 }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapse hint */}
        {!isApplied && (
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <span style={{ fontSize: 11, color: C.body, opacity: 0.5 }}>{expanded ? (isKo ? "▲ 접기" : "▲ less") : (isKo ? "▼ 자세히" : "▼ details")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
