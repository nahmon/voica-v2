import { useState } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { PANEL_JOBS, MOCK_PANEL_PROFILE, getMatchScore } from "../lib/mockData.js";
import { Btn, GlobalNav } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const APPLY_STEPS = ["none", "applied", "ai_screening", "confirmed"];

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
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} activeTab="panel_board" variant="panel" user={user} logout={logout} />

      {/* Hero */}
      <div style={{ background: C.navy, padding: isMobile ? "32px 20px 28px" : "40px 24px 32px", textAlign: "center" }}>
        <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: C.white, marginBottom: 6, lineHeight: 1.2 }}>
          인터뷰 참여하고 리워드 받기
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>
          보이스 인터뷰 · 평균 10분 · 완료 즉시 지급
        </div>
        <div style={{ maxWidth: 440, margin: "0 auto", position: "relative" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="인터뷰 주제 또는 기업명 검색"
            style={{ width: "100%", padding: "11px 40px 11px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.1)", color: C.white, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box" }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5, display: "flex" }}>
            {Ic.Search({ s: 16, c: C.white })}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "20px 16px 60px" : "24px 24px 80px" }}>

        {/* Category filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, fontFamily: F, cursor: "pointer", border: `1px solid ${catFilter === c ? C.purple : C.border}`, background: catFilter === c ? C.purple : C.white, color: catFilter === c ? C.white : (c === "추천" ? C.purple : C.body), fontWeight: catFilter === c ? 600 : (c === "추천" ? 600 : 400), transition: "all 0.12s" }}>
              {c === "추천" ? `✦ 추천 ${recommendedCount}` : c}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.body }}>{filtered.length}개</span>
        </div>

        {/* Job list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(job => (
            <JobRow
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

function JobRow({ job, status, isRecommended, isMobile, onApply, onCycleDemo, go }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((job.filled / job.total) * 100);
  const remaining = job.total - job.filled;
  const isConfirmed = status === "confirmed";
  const isApplied   = status !== "none";

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 12,
        border: `1px solid ${isRecommended ? "rgba(83,58,253,0.2)" : C.border}`,
        overflow: "hidden",
        transition: "box-shadow 0.15s",
        boxShadow: isRecommended ? "0 0 0 1px rgba(83,58,253,0.08), 0 2px 8px rgba(83,58,253,0.06)" : S.ambient,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = S.standard}
      onMouseLeave={e => e.currentTarget.style.boxShadow = isRecommended ? "0 0 0 1px rgba(83,58,253,0.08), 0 2px 8px rgba(83,58,253,0.06)" : S.ambient}
    >
      {/* Recommended stripe */}
      {isRecommended && (
        <div style={{ height: 2, background: `linear-gradient(90deg,${C.purple},#b9b9f9)` }} />
      )}

      <div style={{ padding: isMobile ? "16px 16px 14px" : "18px 20px 16px" }}>
        {/* Top row: title + reward */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Meta chips */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              {isRecommended && (
                <span style={{ fontSize: 10, fontWeight: 600, color: C.purple, background: C.purpleBg, padding: "2px 7px", borderRadius: 4 }}>✦ 추천</span>
              )}
              {job.expert && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "#92400e", background: "rgba(251,191,36,0.12)", padding: "2px 7px", borderRadius: 4 }}>{job.expertTag}</span>
              )}
              {job.urgent && (
                <span style={{ fontSize: 10, fontWeight: 600, color: C.ruby, background: "rgba(234,34,97,0.08)", padding: "2px 7px", borderRadius: 4 }}>마감임박</span>
              )}
              <span style={{ fontSize: 10, color: C.body, background: C.bg, padding: "2px 7px", borderRadius: 4, border: `1px solid ${C.border}` }}>{job.category}</span>
            </div>

            {/* Title */}
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, lineHeight: 1.3, marginBottom: 3 }}>{job.title}</div>

            {/* Company + duration */}
            <div style={{ fontSize: 12, color: C.body }}>
              {job.company} · {job.duration} · ~{job.deadline}
            </div>
          </div>

          {/* Reward */}
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: job.expert ? 20 : 18, fontWeight: 700, color: job.expert ? "#92400e" : C.navy, lineHeight: 1, marginBottom: 2, fontFeatureSettings: '"tnum"' }}>
              {job.reward}
            </div>
            <div style={{ fontSize: 10, color: C.body }}>리워드</div>
          </div>
        </div>

        {/* Fill progress */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? C.ruby : pct >= 70 ? "#f59e0b" : C.purple, borderRadius: 2, transition: "width 0.4s" }} />
          </div>
          <span style={{ fontSize: 11, color: remaining <= 5 ? C.ruby : C.body, fontWeight: remaining <= 5 ? 600 : 400, whiteSpace: "nowrap", fontFeatureSettings: '"tnum"' }}>
            {remaining <= 5 ? `잔여 ${remaining}자리` : `${job.filled}/${job.total}명`}
          </span>
        </div>

        {/* Toggle button */}
        <button onClick={() => setExpanded(v => !v)} style={{ marginTop: 8, fontSize: 11, color: C.purple, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: F, display: "flex", alignItems: "center", gap: 3 }}>
          {expanded ? "접기 ↑" : "상세 보기 ↓"}
        </button>

        {/* Expanded detail panel */}
        {expanded && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Description */}
            {job.description && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 5, letterSpacing: 0.4 }}>인터뷰 소개</div>
                <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.65 }}>{job.description}</div>
              </div>
            )}
            {/* Target profile */}
            {job.targetProfile && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 8, letterSpacing: 0.4 }}>찾는 패널</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  {[
                    { icon: "🎂", label: "연령", value: job.targetProfile.age },
                    { icon: "👤", label: "성별", value: job.targetProfile.gender },
                    { icon: "📍", label: "지역", value: job.targetProfile.region },
                  ].map(item => (
                    <div key={item.label} style={{ background: C.bg, borderRadius: 8, padding: "8px 10px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 10, color: C.body, marginBottom: 2 }}>{item.icon} {item.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.navy }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, background: "rgba(83,58,253,0.04)", borderRadius: 8, padding: "8px 10px", border: `1px solid rgba(83,58,253,0.12)` }}>
                  <div style={{ fontSize: 10, color: C.purple, marginBottom: 3, fontWeight: 600 }}>✦ 이런 분을 찾아요</div>
                  <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.6 }}>{job.targetProfile.lifestyle}</div>
                </div>
                {job.targetProfile.exclude && (
                  <div style={{ marginTop: 6, fontSize: 11, color: C.body }}>⛔ {job.targetProfile.exclude}</div>
                )}
              </div>
            )}
            {/* Conditions tags */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 6, letterSpacing: 0.4 }}>참여 조건</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {job.conditions.map(c => (
                  <span key={c} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: C.bg, color: C.label, border: `1px solid ${C.border}` }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA row */}
        <div style={{ marginTop: 14 }}>
          {isConfirmed ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: "rgba(21,190,83,0.08)", borderRadius: 6, flex: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.successText }}>참여 확정</span>
              </div>
              <Btn size="sm" onClick={() => go("consent")}
                style={{ background: C.purple, color: C.white, border: "none", fontWeight: 600, gap: 4 }}>
                {Ic.Mic({ s: 13, c: "white" })} 인터뷰 시작
              </Btn>
            </div>
          ) : isApplied ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: 12, color: C.purple, fontWeight: 500 }}>
                  {status === "applied" ? "AI 적합성 검토 중" : "리서처 최종 검토 대기"}
                </span>
              </div>
              {/* Dev-only cycle button */}
              <button onClick={onCycleDemo} style={{ marginLeft: "auto", fontSize: 10, color: "rgba(0,0,0,0.2)", background: "none", border: "none", cursor: "pointer", fontFamily: F }}>
                [dev] →
              </button>
            </div>
          ) : (
            <Btn full size="sm" variant="primary" onClick={onApply}>
              지원하기 · {job.reward}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
