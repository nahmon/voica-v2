import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { PANEL_JOBS, MOCK_PANEL_PROFILE, getMatchScore } from "../lib/mockData.js";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
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
      <div style={{ background: C.navy, padding: isMobile ? "36px 20px 32px" : "48px 24px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>지금 모집 중</span>
        </div>
        <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.white, marginBottom: 8, lineHeight: 1.25 }}>
          인터뷰 참여하고 리워드 받기
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>
          AI 음성 인터뷰 · 평균 10분 · 완료 즉시 지급
        </div>
        <div style={{ maxWidth: 440, margin: "0 auto", position: "relative" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="인터뷰 주제 또는 기업명 검색"
            style={{ width: "100%", padding: "12px 42px 12px 16px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.1)", color: C.white, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box" }}
          />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.4, display: "flex" }}>
            {Ic.Search({ s: 16, c: "#fff" })}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "20px 16px 60px" : "28px 24px 80px" }}>

        {/* Category filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {categories.map(c => {
            const active = catFilter === c;
            return (
              <button key={c} onClick={() => setCatFilter(c)}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontFamily: F, cursor: "pointer",
                  border: `1px solid ${active ? C.purple : C.border}`,
                  background: active ? C.purple : C.white,
                  color: active ? "#fff" : C.body,
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.12s",
                }}>
                {c === "추천" ? `✦ 추천 ${recommendedCount}` : c}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.body }}>{filtered.length}개</span>
        </div>

        {/* Job list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
  const [expanded, setExpanded] = useState(false);
  const remaining = job.total - job.filled;
  const isConfirmed = status === "confirmed";
  const isApplied = status !== "none";
  const isUrgent = job.urgent || remaining <= 5;

  return (
    <div style={{
      background: C.white,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      borderLeft: isRecommended ? `3px solid ${C.purple}` : `1px solid ${C.border}`,
      overflow: "hidden",
    }}>
      <div style={{ padding: isMobile ? "16px" : "18px 20px" }}>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.body }}>{job.company}</span>
          <span style={{ fontSize: 12, color: C.border }}>·</span>
          <span style={{ fontSize: 12, color: C.body }}>{job.category}</span>
          {isUrgent && (
            <>
              <span style={{ fontSize: 12, color: C.border }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626" }}>마감임박</span>
            </>
          )}
          {isRecommended && (
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: C.purple }}>✦ 추천</span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 600, color: C.navy, lineHeight: 1.4, marginBottom: 10 }}>
          {job.title}
        </div>

        {/* Stats: duration · deadline · reward */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: C.body }}>{job.duration}</span>
          <span style={{ color: C.border, fontSize: 12 }}>·</span>
          <span style={{ fontSize: 13, color: C.body }}>~{job.deadline}</span>
          <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 700, color: C.navy }}>{job.reward}</span>
        </div>

        {/* CTA */}
        {isConfirmed ? (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, padding: "9px 14px", background: C.successBg, borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.successText }}>참여 확정</span>
            </div>
            <button onClick={() => go("consent")}
              style={{ padding: "9px 18px", background: C.purple, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              인터뷰 시작 →
            </button>
          </div>
        ) : isApplied ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: C.purpleBg, borderRadius: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.purple, fontWeight: 500 }}>
              {status === "applied" ? "AI 적합성 검토 중" : "리서처 최종 검토 대기"}
            </span>
            <button onClick={onCycleDemo} style={{ marginLeft: "auto", fontSize: 10, color: "rgba(0,0,0,0.1)", background: "none", border: "none", cursor: "pointer", fontFamily: F }}>[dev]</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setExpanded(v => !v)}
              style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.body, fontSize: 13, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>
              {expanded ? "접기" : "상세보기"}
            </button>
            <button onClick={onApply}
              style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: "none", background: C.purple, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              지원하기
            </button>
          </div>
        )}

        {/* Expanded detail */}
        {expanded && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 14 }}>
            {job.description && (
              <div style={{ fontSize: 13, color: C.body, lineHeight: 1.75 }}>{job.description}</div>
            )}
            {job.targetProfile && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 8, letterSpacing: 0.5 }}>찾는 패널</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  {[job.targetProfile.age, job.targetProfile.gender, job.targetProfile.region].map((v, i) => (
                    <span key={i} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: C.bg, color: C.navy }}>{v}</span>
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
              <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 8, letterSpacing: 0.5 }}>참여 조건</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {job.conditions.map(c => (
                  <span key={c} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: C.bg, color: C.navy }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
