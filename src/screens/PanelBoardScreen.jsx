import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { PANEL_JOBS, PANEL_JOBS_KO, MOCK_PANEL_PROFILE, getMatchScore } from "../lib/mockData.js";
import { GlobalNav, Footer, EmptyState } from "../components/shared.jsx";
import PanelJobCard, { MatchBadge } from "../components/PanelJobCard.jsx";
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
  const [desktopSortOpen, setDesktopSortOpen] = useState(false);
  const desktopSortRef = useRef(null);
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
  const CATEGORY_EMOJIS = { All: "🌐", Recommended: "✦", Expert: "💼", Tech: "💻", Beauty: "💄", Media: "📺", Food: "🍽", Finance: "💰", Education: "📚" };
  const catLabel = (key) => isKo ? (CATEGORY_LABELS_KO[key] ?? key) : key;

  // Close desktop sort dropdown on outside click
  useEffect(() => {
    if (!desktopSortOpen) return;
    function handleClickOutside(e) {
      if (desktopSortRef.current && !desktopSortRef.current.contains(e.target)) {
        setDesktopSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [desktopSortOpen]);

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
  const profile = useMemo(() => userProfile
    ? {
        interests: (userProfile.interests ?? []).map(i => INTEREST_MAP[i] ?? i),
        job: JOB_MAP[userProfile.job] ?? userProfile.job ?? "",
        gender: GENDER_MAP[userProfile.gender] ?? userProfile.gender ?? "",
        age: AGE_MAP[userProfile.age_group] ?? "",
      }
    : MOCK_PANEL_PROFILE,
  [userProfile]);

  const MATCH_THRESHOLD = 4;

  // Memoize scoring — expensive O(jobs×criteria), only recompute when lang or profile changes
  const jobsWithScore = useMemo(
    () => (isKo ? PANEL_JOBS_KO : PANEL_JOBS).map(j => ({ ...j, _matchScore: getMatchScore(j, profile) })),
    [isKo, profile]
  );

  // Memoize filtered list — recompute only when filter/sort/search state changes
  const filtered = useMemo(() => jobsWithScore
    .filter(j =>
      (catFilter === "All" || catFilter === "Recommended" || j.category === catFilter) &&
      (debouncedSearch === "" || j.title.includes(debouncedSearch) || j.company.includes(debouncedSearch))
    )
    .filter(j => catFilter === "Recommended" ? j._matchScore >= MATCH_THRESHOLD : true)
    .sort((a, b) => {
      if (sortKey === "newest") return b.id - a.id;
      if (sortKey === "reward") return parseReward(b.reward) - parseReward(a.reward);
      return b._matchScore - a._matchScore;
    }),
  [jobsWithScore, catFilter, debouncedSearch, sortKey]);

  const recommendedCount = useMemo(
    () => jobsWithScore.filter(j => j._matchScore >= MATCH_THRESHOLD).length,
    [jobsWithScore]
  );
  const recentJobs = useMemo(
    () => recentIds.map(id => jobsWithScore.find(j => j.id === id)).filter(Boolean),
    [recentIds, jobsWithScore]
  );

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
    <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
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

          <h1 style={{ fontSize: isMobile ? 20 : 30, fontWeight: 700, color: "#fff", margin: "0 0 8px", lineHeight: 1.25, wordBreak: "keep-all" }}>
            {isKo ? "인터뷰에 참여하고, 리워드를 받아보세요" : "Share your voice. Earn rewards."}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: "0 0 24px", wordBreak: "keep-all" }}>
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

      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "20px 16px 80px" : "28px 24px 80px", flex: 1, minWidth: 0, width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>

        {/* Filters + Sort row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          {/* Category pills */}
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
              {CATEGORY_KEYS.map(c => {
                const active = catFilter === c;
                const isRecommendedCat = c === "Recommended";
                return (
                  <button key={c} onClick={() => setCatFilter(c)} style={{
                    padding: "5px 10px", borderRadius: 20, fontSize: 12, fontFamily: F, cursor: "pointer",
                    border: `1px solid ${active ? C.purple : C.border}`,
                    background: active ? C.purple : "#fff",
                    color: active ? "#fff" : C.body,
                    fontWeight: active ? 600 : 400, flexShrink: 0,
                    transition: "all 0.12s",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {isRecommendedCat
                      ? <>{isKo ? "추천" : "Matched"}<span style={{ fontSize: 11, fontWeight: 700, background: active ? "rgba(255,255,255,0.25)" : C.purpleBg, color: active ? "#fff" : C.purple, borderRadius: 10, padding: "1px 6px", marginLeft: 2 }}>{recommendedCount}</span></>
                      : catLabel(c)}
                  </button>
                );
              })}
            </div>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 32, background: "linear-gradient(to right, transparent, #fff)", pointerEvents: "none" }} />
          </div>

          {/* Sort: desktop custom dropdown / mobile icon button */}
          {isMobile ? (
            <button
              onClick={() => setMobileSortOpen(v => !v)}
              aria-label={isKo ? "정렬 기준 선택" : "Sort options"}
              aria-expanded={mobileSortOpen}
              style={{
                padding: "6px 10px", borderRadius: 8, border: `1px solid ${mobileSortOpen ? C.purple : C.border}`,
                background: mobileSortOpen ? C.purpleBg : "#fff", color: mobileSortOpen ? C.purple : C.body,
                fontSize: 13, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: F,
              }}>
              ⇅
            </button>
          ) : (
            <div ref={desktopSortRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setDesktopSortOpen(v => !v)}
                aria-label={isKo ? "정렬 기준" : "Sort by"}
                aria-expanded={desktopSortOpen}
                style={{
                  padding: "7px 10px 7px 12px", borderRadius: 8,
                  border: `1px solid ${desktopSortOpen ? C.purple : C.border}`,
                  background: desktopSortOpen ? C.purpleBg : "#fff",
                  fontSize: 12, fontFamily: F, color: desktopSortOpen ? C.purple : C.navy,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6, outline: "none",
                  transition: "all 0.12s",
                }}>
                {SORT_OPTIONS.find(o => o.key === sortKey)?.label}
                <span style={{ fontSize: 10, opacity: 0.7, transform: desktopSortOpen ? "rotate(180deg)" : "none", transition: "transform 0.12s", display: "inline-block" }}>▾</span>
              </button>
              {desktopSortOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
                  background: "#fff", borderRadius: 10, border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 140, overflow: "hidden",
                }}>
                  {SORT_OPTIONS.map(o => {
                    const active = sortKey === o.key;
                    return (
                      <button key={o.key} onClick={() => { setSortKey(o.key); setDesktopSortOpen(false); }} style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "9px 14px", fontSize: 12, fontFamily: F, cursor: "pointer",
                        border: "none", background: active ? C.purpleBg : "transparent",
                        color: active ? C.purple : C.navy, fontWeight: active ? 600 : 400,
                        transition: "background 0.08s",
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{isKo ? "최근 본 인터뷰" : "Recently viewed"}</span>
              <button
                onClick={() => { localStorage.removeItem(RECENTLY_VIEWED_KEY); setRecentIds([]); }}
                style={{
                  fontSize: 11, color: C.body, background: "none", border: "none", cursor: "pointer",
                  fontFamily: F, padding: "2px 4px", opacity: 0.65,
                }}>
                {isKo ? "전체 지우기" : "Clear all"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
              {recentJobs.map(job => (
                <div key={job.id} style={{
                  background: "#fff", borderRadius: 10, padding: "10px 12px",
                  border: `1px solid rgba(0,0,0,0.07)`, flexShrink: 0,
                  minWidth: 180, maxWidth: 220,
                }}>
                  <div style={{ fontSize: 11, color: C.body, marginBottom: 3 }}>{job.company}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.purple }}>{job.reward}</span>
                    <MatchBadge score={job._matchScore} isKo={isKo} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result count row */}
        {(() => {
          const hasSearch = debouncedSearch !== "";
          const hasCatFilter = catFilter !== "All";
          const isFiltered = hasSearch || hasCatFilter;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.body }}>
                {isKo
                  ? `${hasCatFilter ? `${catLabel(catFilter)} ` : ""}인터뷰 ${filtered.length}건`
                  : `${filtered.length} interview${filtered.length !== 1 ? "s" : ""} ${hasCatFilter ? `in ${catLabel(catFilter)}` : "available"}`}
              </span>
              {isFiltered && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: C.purple,
                  background: C.purpleBg, borderRadius: 10, padding: "2px 8px",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {isKo ? "필터 적용됨" : "Filtered"}
                  <button
                    onClick={() => { setSearch(""); setCatFilter("All"); }}
                    style={{
                      fontSize: 11, color: C.purple, background: "none", border: "none",
                      cursor: "pointer", fontFamily: F, padding: 0, fontWeight: 600, lineHeight: 1,
                    }}>
                    ✕
                  </button>
                </span>
              )}
            </div>
          );
        })()}

        {/* Job cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.length === 0 ? (() => {
            const hasSearch = debouncedSearch !== "";
            const hasCatFilter = catFilter !== "All";
            return (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                  {isKo ? "인터뷰를 찾을 수 없어요" : "No interviews found"}
                </div>
                <div style={{ fontSize: 13, color: C.body, marginBottom: 20 }}>
                  {hasSearch && hasCatFilter
                    ? (isKo ? "검색어와 카테고리 필터를 모두 초기화해 보세요" : "Try clearing the search and category filter")
                    : hasSearch
                      ? (isKo ? "다른 검색어를 입력해 보세요" : "Try a different search term")
                      : (isKo ? "다른 카테고리를 선택해 보세요" : "Try a different category")}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {hasSearch && (
                    <button
                      onClick={() => setSearch("")}
                      style={{
                        padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
                        background: "#fff", fontSize: 13, fontFamily: F, color: C.navy,
                        cursor: "pointer", fontWeight: 500,
                      }}>
                      {isKo ? "검색 초기화" : "Clear search"}
                    </button>
                  )}
                  {hasCatFilter && (
                    <button
                      onClick={() => setCatFilter("All")}
                      style={{
                        padding: "7px 16px", borderRadius: 8, border: "none",
                        background: C.purple, fontSize: 13, fontFamily: F, color: "#fff",
                        cursor: "pointer", fontWeight: 600,
                      }}>
                      {isKo ? "전체 보기" : "View all"}
                    </button>
                  )}
                </div>
              </div>
            );
          })() : filtered.map(job => (
            <PanelJobCard
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

