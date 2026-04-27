import { useState, useEffect, useCallback, useRef } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { PANEL_JOBS, PANEL_JOBS_KO, MOCK_PANEL_PROFILE, getMatchScore } from "../lib/mockData.js";
import { GlobalNav, Footer, EmptyState } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";

const APPLY_STATE_KEY = "voica_apply_state";
function loadApplyState() {
  try { return JSON.parse(localStorage.getItem(APPLY_STATE_KEY) || "{}"); }
  catch { return {}; }
}
function saveApplyState(state) {
  try { localStorage.setItem(APPLY_STATE_KEY, JSON.stringify(state)); } catch {}
}

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

const RECENTLY_VIEWED_KEY = "voica_recently_viewed";
function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]"); }
  catch { return []; }
}
function addRecentlyViewed(jobId) {
  const prev = getRecentlyViewed().filter(id => id !== jobId);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([jobId, ...prev].slice(0, 6)));
}

export default function PanelBoardScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const isKo = lang === "ko";
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortKey, setSortKey] = useState("recommended");
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [applyState, setApplyState] = useState(loadApplyState);
  const [recentIds, setRecentIds] = useState(getRecentlyViewed);
  const [userProfile, setUserProfile] = useState(null);
  const debounceRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 280);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch real user profile for match scoring
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("region, gender, age_group, job, income, interests")
      .eq("id", user.id)
      .single()
      .then(({ data }) => { if (data) setUserProfile(data); });
  }, [user?.id]);

  const SORT_OPTIONS = isKo ? SORT_OPTIONS_KO : SORT_OPTIONS_EN;
  const CATEGORY_KEYS = ["All", "Recommended", "Expert", "Tech", "Beauty", "Media", "Food", "Finance", "Education"];
  const CATEGORY_LABELS_KO = { All: "전체", Recommended: "추천", Expert: "전문직", Tech: "테크", Beauty: "뷰티", Media: "미디어", Food: "식음료", Finance: "금융", Education: "교육" };
  const catLabel = (key) => isKo ? (CATEGORY_LABELS_KO[key] ?? key) : key;

  // Map Korean profile values to English for getMatchScore compatibility
  const INTEREST_MAP = {
    "테크/IT": "Tech/IT", "뷰티/패션": "Beauty/Fashion", "식음료": "Food/Dining",
    "금융/투자": "Finance/Investment", "헬스케어/의료": "Medical/Healthcare",
    "교육": "Education", "여행/레저": "Travel/Leisure",
    "미디어/엔터테인먼트": "Media/Entertainment", "부동산": "Real Estate",
    "자동차/모빌리티": "Auto/Mobility", "쇼핑/리테일": "Shopping/Retail",
    "스포츠/피트니스": "Sports/Fitness", "환경/지속가능성": "Environment/Sustainability",
    "법률/세금": "Legal/Tax",
  };
  const JOB_MAP = {
    "대기업/중견기업": "Corporate employee (large/mid-size)",
    "중소기업": "Corporate employee (small/medium)",
    "프리랜서/자영업": "Freelancer/Self-employed",
    "전문직 (의사, 변호사, 회계사 등)": "Professional (doctor/lawyer/accountant)",
    "공공기관/공무원": "Government/Public sector",
    "학생": "Student", "주부": "Homemaker", "구직 중": "Job seeking", "기타": "Other",
  };
  const GENDER_MAP = { "남성": "Male", "여성": "Female" };
  const AGE_MAP = { "10대": "10", "20대": "20", "30대": "30", "40대": "40", "50대": "50", "60대 이상": "60" };

  // Use real profile for scoring if available, fall back to mock
  const profile = userProfile
    ? {
        interests: (userProfile.interests ?? []).map(i => INTEREST_MAP[i] ?? i),
        job: JOB_MAP[userProfile.job] ?? userProfile.job ?? "",
        gender: GENDER_MAP[userProfile.gender] ?? userProfile.gender ?? "",
        age: AGE_MAP[userProfile.age_group] ?? "",
      }
    : MOCK_PANEL_PROFILE;

  const jobsWithScore = (isKo ? PANEL_JOBS_KO : PANEL_JOBS).map(j => ({ ...j, _matchScore: getMatchScore(j, profile) }));
  const MATCH_THRESHOLD = 4;

  const filtered = jobsWithScore
    .filter(j =>
      (catFilter === "All" || catFilter === "Recommended" || j.category === catFilter) &&
      (debouncedSearch === "" || j.title.includes(debouncedSearch) || j.company.includes(debouncedSearch))
    )
    .filter(j => catFilter === "Recommended" ? j._matchScore >= MATCH_THRESHOLD : true)
    .sort((a, b) => {
      if (sortKey === "newest") return b.id - a.id;
      if (sortKey === "reward") return parseReward(b.reward) - parseReward(a.reward);
      return b._matchScore - a._matchScore;
    });

  const recommendedCount = jobsWithScore.filter(j => j._matchScore >= MATCH_THRESHOLD).length;
  const recentJobs = recentIds.map(id => jobsWithScore.find(j => j.id === id)).filter(Boolean);

  const updateApplyState = useCallback((jobId, nextStatus) => {
    setApplyState(prev => {
      const next = { ...prev, [jobId]: nextStatus };
      saveApplyState(next);
      return next;
    });
  }, []);

  function handleView(jobId) {
    addRecentlyViewed(jobId);
    setRecentIds(getRecentlyViewed());
  }

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} activeTab="panel_board" variant={user?.user_metadata?.role === "researcher" ? "app" : "panel"} user={user} logout={logout} lang={lang} />

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #2d1b6b 100%)`,
        padding: isMobile ? "32px 20px 40px" : "48px 24px 56px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, opacity: 0.035, pointerEvents: "none" }} />
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {/* Live indicator */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "5px 12px", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{isKo ? `인터뷰 ${filtered.length}건 모집 중` : `${filtered.length} interviews open now`}</span>
          </div>

          <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, color: "#fff", margin: "0 0 8px", lineHeight: 1.25 }}>
            {isKo ? "인터뷰에 참여하고, 리워드를 받아보세요" : "Share your voice. Earn rewards."}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: "0 0 24px" }}>
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
              aria-label={isKo ? "인터뷰 검색" : "Search interviews"}
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
              recommendedCount > 0 && { label: isKo ? "나에게 맞는 인터뷰" : "Matched for you", value: isKo ? `${recommendedCount}건` : `${recommendedCount} interviews` },
            ].filter(Boolean).map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "20px 16px 80px" : "28px 24px 80px", flex: 1, minWidth: 0, width: "100%" }}>

        {/* Filters + Sort row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          {/* Category pills */}
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>

            {CATEGORY_KEYS.map(c => {
              const active = catFilter === c;
              return (
                <button key={c} onClick={() => setCatFilter(c)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontFamily: F, cursor: "pointer",
                  border: `1px solid ${active ? C.purple : C.border}`,
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
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 32, background: "linear-gradient(to right, transparent, #fff)", pointerEvents: "none" }} />
          </div>

          {/* Sort: desktop dropdown / mobile icon button */}
          {isMobile ? (
            <button
              onClick={() => setMobileSortOpen(v => !v)}
              style={{
                padding: "6px 10px", borderRadius: 8, border: `1px solid ${mobileSortOpen ? C.purple : C.border}`,
                background: mobileSortOpen ? C.purpleBg : "#fff", color: mobileSortOpen ? C.purple : C.body,
                fontSize: 13, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: F,
              }}>
              ⇅
            </button>
          ) : (
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              style={{
                padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                background: "#fff", fontSize: 12, fontFamily: F, color: C.navy,
                cursor: "pointer", flexShrink: 0, outline: "none",
              }}>
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          )}
        </div>
        {/* Mobile sort options row */}
        {isMobile && mobileSortOpen && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {SORT_OPTIONS.map(o => {
              const active = sortKey === o.key;
              return (
                <button key={o.key} onClick={() => { setSortKey(o.key); setMobileSortOpen(false); }} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontFamily: F, cursor: "pointer",
                  border: `1px solid ${active ? C.purple : C.border}`,
                  background: active ? C.purple : "#fff",
                  color: active ? "#fff" : C.body,
                  fontWeight: active ? 600 : 400,
                }}>
                  {o.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Recently viewed — top */}
        {recentJobs.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              {isKo ? "최근 본 인터뷰" : "Recently viewed"}
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
              {recentJobs.map(job => (
                <div key={job.id} style={{
                  background: "#fff", borderRadius: 12, padding: "12px 14px",
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

        {/* Result count */}
        <div style={{ fontSize: 12, color: C.body, marginBottom: 12 }}>
          {isKo
            ? `${catFilter !== "All" ? `${catLabel(catFilter)} ` : ""}인터뷰 ${filtered.length}건`
            : `${filtered.length} interview${filtered.length !== 1 ? "s" : ""} ${catFilter !== "All" ? `in ${catFilter}` : "available"}`}
        </div>

        {/* Job cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.length === 0 ? (
            <EmptyState
              icon="🔍"
              title={isKo ? "인터뷰를 찾을 수 없어요" : "No interviews found"}
              description={isKo ? "다른 검색어나 필터를 써보세요" : "Try a different search or filter"}
              action={debouncedSearch ? (isKo ? "검색 초기화" : "Clear search") : undefined}
              onAction={debouncedSearch ? () => setSearch("") : undefined}
            />
          ) : filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              status={applyState[job.id] || "none"}
              isRecommended={job._matchScore >= MATCH_THRESHOLD}
              isMobile={isMobile}
              isKo={isKo}
              onApply={() => { updateApplyState(job.id, "applied"); handleView(job.id); }}
              onView={() => handleView(job.id)}
              go={go}
            />
          ))}
        </div>
      </div>
      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}

function MatchBadge({ score, isKo }) {
  const pct = Math.min(100, Math.round((score / 8) * 100));
  let color, bg;
  if (pct >= 70) { color = C.successText; bg = C.successBg; }
  else if (pct >= 40) { color = "#92650a"; bg = "rgba(251,191,36,0.12)"; }
  else { color = C.body; bg = "rgba(0,0,0,0.05)"; }
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>
      {isKo ? `${pct}% 일치` : `${pct}% match`}
    </span>
  );
}

function JobCard({ job, status, isRecommended, isMobile, isKo, onApply, onView, go }) {
  const remaining = job.total - job.filled;
  const fillPct = Math.round((job.filled / job.total) * 100);
  const isConfirmed = status === "confirmed";
  const isApplied = status !== "none";
  const isUrgent = job.urgent || remaining <= 10;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: isRecommended ? `1.5px solid ${C.purpleLight}` : `1px solid ${C.border}`,
        overflow: "hidden",
        transition: "transform 0.12s ease-out, filter 0.12s ease-out",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.filter = "brightness(1.02)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "brightness(1)"; }}
    >
      <div style={{ padding: isMobile ? "14px 16px" : "18px 22px" }}>

        {/* Header row: company + badges / reward */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", flex: 1, minWidth: 0, paddingRight: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.body, whiteSpace: "nowrap" }}>{job.company}</span>
            {isUrgent && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", background: "rgba(220,38,38,0.07)", padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap" }}>
                {isKo ? "⚡ 마감 임박" : "⚡ Closing"}
              </span>
            )}
            {isRecommended && (
              <span style={{ fontSize: 11, fontWeight: 600, color: C.purple, background: C.purpleBg, padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap" }}>
                {isKo ? "★ 추천" : "★ Matched"}
              </span>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: C.purple, lineHeight: 1 }}>{job.reward}</div>
            <div style={{ fontSize: 11, color: C.body, marginTop: 3, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={C.body} strokeWidth="1.4" strokeLinecap="round"><circle cx="5" cy="5" r="4"/><path d="M5 3v2l1.5 1.5"/></svg>
              {job.duration}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 8, wordBreak: "keep-all", overflowWrap: "break-word" }}>
          {job.title}
        </div>

        {/* Description — always visible, 2-line clamp */}
        {job.description && (
          <p style={{
            fontSize: 13, color: C.body, lineHeight: 1.65, margin: "0 0 10px",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {job.description}
          </p>
        )}

        {/* Conditions + deadline chips */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {job.conditions.map(c => (
            <span key={c} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(0,0,0,0.04)", color: C.navy, fontWeight: 500, border: "1px solid rgba(0,0,0,0.06)" }}>{c}</span>
          ))}
          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(0,0,0,0.04)", color: C.body, border: "1px solid rgba(0,0,0,0.06)" }}>~{job.deadline}</span>
        </div>

        {/* Match + fill row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, minWidth: 0 }}>
          <MatchBadge score={job._matchScore} isKo={isKo} />
          <div style={{ flex: 1, minWidth: 0, height: 5, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, width: `${fillPct}%`, background: fillPct >= 80 ? C.ruby : C.purple, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 11, color: isUrgent ? "#dc2626" : C.body, fontWeight: isUrgent ? 600 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>
            {isKo ? `${remaining}자리 남음` : `${remaining} left`}
          </span>
        </div>

        {/* CTA */}
        {isConfirmed ? (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, padding: "10px 14px", background: "rgba(22,163,74,0.07)", borderRadius: 8, border: "1px solid rgba(22,163,74,0.2)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>{isKo ? "참여 확정됐어요!" : "Confirmed — you're in!"}</span>
            </div>
            <button onClick={() => go("consent")} style={{ padding: "10px 20px", background: C.purple, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>
              {isKo ? "시작하기 " : "Start "}<span className="ba">→</span>
            </button>
          </div>
        ) : isApplied ? (
          <div style={{ padding: "10px 14px", background: C.purpleBg, borderRadius: 8, border: `1px solid ${C.purple}20` }}>
            {(() => {
              const steps = isKo
                ? ["지원 완료", "AI 심사중", "확정 대기"]
                : ["Applied", "AI Review", "Confirming"];
              const stepIdx = status === "applied" ? 1 : 2;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  {steps.map((label, i) => {
                    const done = i < stepIdx;
                    const active = i === stepIdx;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                            background: done ? C.purple : active ? C.purple : "rgba(0,0,0,0.08)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, color: "#fff", fontWeight: 700,
                          }}>
                            {done ? "✓" : i + 1}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.purple : done ? C.purple : C.body, whiteSpace: "nowrap" }}>{label}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: done ? C.purple : "rgba(0,0,0,0.08)", margin: "0 4px", marginBottom: 14, borderRadius: 1 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onApply(); }}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "none", background: C.purple, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "background 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.purpleHover}
            onMouseLeave={e => e.currentTarget.style.background = C.purple}
          >
            {isKo ? "지원하기 " : "Apply Now "}<span className="ba">→</span>
          </button>
        )}

      </div>
    </div>
  );
}
