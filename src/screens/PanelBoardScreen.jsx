import { useState } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { PANEL_JOBS, MOCK_PANEL_PROFILE, getMatchScore } from "../lib/mockData.js";
import { Badge, Btn, GlobalNav } from "../components/shared.jsx";

// 지원 단계: none → applied → ai_screening → confirmed
const APPLY_STEPS = ["none", "applied", "ai_screening", "confirmed"];
const APPLY_CONFIG = {
  none:         { label: (reward) => `지원하기 · ${reward}`, variant: "primary",  statusBadge: null },
  applied:      { label: () => "✓ 지원 완료",               variant: "ghost",    statusBadge: { text: "AI 적합성 검토 중", color: C.purple } },
  ai_screening: { label: () => "AI 검토 완료",               variant: "ghost",    statusBadge: { text: "리서처 최종 검토 대기", color: "#f59e0b" } },
  confirmed:    { label: () => "✓ 참여 확정",               variant: "ghost",    statusBadge: { text: "인터뷰 진행 예정", color: C.success } },
};

export default function PanelBoardScreen({ go, user }) {
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
      <GlobalNav go={go} activeTab="panel_board" variant="panel" />

      <div style={{ background: "linear-gradient(135deg,#061b31 0%,#1c1e54 35%,#2e2b8c 65%,#533afd 100%)", padding: "36px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.15),transparent 70%)", filter: "blur(45px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -20, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.1),transparent 70%)", filter: "blur(55px)", pointerEvents: "none" }} />
        <Badge variant="dark" style={{ background: "rgba(255,255,255,0.18)", color: C.white, marginBottom: 14, display:"inline-flex", alignItems:"center", gap:5 }}>{Ic.Mic({s:14,c:C.white})} Voica 패널 모집 보드</Badge>
        <div style={{ fontSize: 28, fontWeight: 500, color: C.white, letterSpacing: "0.16px", lineHeight: 1.1, marginBottom: 8, fontFeatureSettings: '"ss01"' }}>보이스로 참여하고 리워드 받기</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", marginBottom: 24 }}>지원 → AI 적합성 검토 → 리서처 최종 확정 → 보이스 인터뷰 진행</div>

        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="인터뷰 주제 또는 기업명 검색"
            style={{ width: "100%", padding: "12px 44px 12px 16px", borderRadius: 56, border: "none", background: "rgba(255,255,255,0.22)", color: C.white, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", letterSpacing: "0.16px" }} />
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.7, display:"flex" }}>{Ic.Search({s:16,c:C.white})}</span>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "7px 16px", borderRadius: 20, fontSize: 13, fontFamily: F, cursor: "pointer", border: "none", background: catFilter === c ? C.purple : C.white, color: catFilter === c ? C.white : (c === "추천" ? C.purple : C.body), fontWeight: catFilter === c ? 600 : (c === "추천" ? 600 : 400), transition: "all 0.15s", letterSpacing: "0.16px", boxShadow: catFilter === c ? "none" : S.ambient }}>{c === "추천" ? `✦ 추천 ${recommendedCount}` : c}</button>
            ))}
          </div>
          <div style={{ background: C.white, borderRadius: 20, padding: "6px 14px", boxShadow: S.ambient }}>
            <span style={{ fontSize: 13, color: C.body }}><strong style={{ color: C.navy, fontWeight: 600 }}>{filtered.length}개</strong> 모집 중</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
          {filtered.map(job => {
            const pct = Math.round((job.filled / job.total) * 100);
            const status = applyState[job.id] || "none";
            const cfg = APPLY_CONFIG[status];
            const remaining = job.total - job.filled;
            const isConfirmed = status === "confirmed";
            const isRecommended = job._matchScore >= MATCH_THRESHOLD;

            const handleApply = () => {
              if (status === "none") {
                setApplyState(prev => ({ ...prev, [job.id]: "applied" }));
              }
            };

            const cycleDemoStep = () => {
              const idx = APPLY_STEPS.indexOf(status);
              const next = APPLY_STEPS[Math.min(idx + 1, APPLY_STEPS.length - 1)];
              setApplyState(prev => ({ ...prev, [job.id]: next }));
            };

            return (
              <div key={job.id} style={{ background: C.white, borderRadius: 14, boxShadow: S.standard, display: "flex", flexDirection: "column", transition: "box-shadow 0.2s", overflow: "hidden" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = S.card}
                onMouseLeave={e => e.currentTarget.style.boxShadow = S.standard}>

                {isRecommended && (
                  <div style={{ padding: "6px 20px", background: C.purpleBg, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.purple }}>✦ 내 프로필 맞춤 추천</span>
                    <span style={{ fontSize: 10, color: C.body }}>관심 분야 · 연령 매칭</span>
                  </div>
                )}
                <div style={{ padding: "18px 20px 14px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      {job.expert
                        ? <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "rgba(217,48,37,0.1)", color: C.ruby }}>⭐ {job.expertTag}</span>
                        : <span style={{ fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 4, background: C.bg, color: C.body }}>{job.category}</span>}
                      {job.urgent && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "rgba(217,48,37,0.08)", color: C.ruby }}>⚡ 마감임박</span>}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, letterSpacing: "0.16px", marginBottom: 4, fontFeatureSettings: '"ss01"', lineHeight: 1.3 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: C.body }}>{job.company} · {job.duration} · ~{job.deadline}</div>
                  </div>
                  <div style={{ flexShrink: 0, background: job.expert ? "rgba(217,48,37,0.06)" : "rgba(30,142,62,0.06)", borderRadius: 10, padding: "12px 14px", textAlign: "center", minWidth: 80 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{Ic.Gift({s:16, c: job.expert ? C.ruby : C.successText})}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: job.expert ? C.ruby : C.successText, fontFeatureSettings: '"tnum"', lineHeight: 1.2 }}>{job.reward}</div>
                  </div>
                </div>

                <div style={{ padding: "0 20px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {job.conditions.map(c => (
                      <span key={c} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: C.bg, color: C.navy }}>{c}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.05)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct >= 80 ? C.ruby : C.purple, borderRadius: 2, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, color: remaining <= 3 ? C.ruby : C.body, fontFeatureSettings: '"tnum"', whiteSpace: "nowrap", flexShrink: 0 }}>{job.filled}/{job.total}{remaining <= 3 ? ` (${remaining}자리)` : ""}</span>
                  </div>
                </div>

                <div style={{ marginTop: "auto", padding: "0 20px 16px" }}>
                  {isConfirmed ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(30,142,62,0.08)", borderRadius: 8 }}>
                        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: C.success }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.successText }}>참여 확정 — 인터뷰 준비 완료</span>
                      </div>
                      <Btn full size="sm" onClick={() => go("consent")}
                        style={{ background: `linear-gradient(135deg,${C.purple},${C.purpleDeep})`, border: "none", fontWeight: 600 }}>
                        {Ic.Mic({s:14,c:"white"})} 지금 인터뷰 시작하기
                      </Btn>
                    </div>
                  ) : (
                    <>
                      <Btn full variant={cfg.variant} size="sm"
                        disabled={status !== "none"}
                        onClick={handleApply}>
                        {cfg.label(job.reward)}
                      </Btn>

                      {cfg.statusBadge && (
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: cfg.statusBadge.color }} />
                            <span style={{ fontSize: 11, color: cfg.statusBadge.color, fontWeight: 500 }}>{cfg.statusBadge.text}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {[["지원", "applied"], ["AI검토", "ai_screening"], ["확정", "confirmed"]].map(([lbl, st], i) => {
                              const stepIdx = APPLY_STEPS.indexOf(st);
                              const curIdx  = APPLY_STEPS.indexOf(status);
                              const done    = curIdx >= stepIdx;
                              return (
                                <div key={st} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  {i > 0 && <div style={{ width: 10, height: 2, borderRadius: 1, background: done ? C.purple : "rgba(0,0,0,0.08)" }} />}
                                  <div style={{ width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, background: done ? C.purple : "rgba(0,0,0,0.06)", color: done ? C.white : C.body }}>{done ? "✓" : i + 1}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button onClick={cycleDemoStep} style={{ marginTop: 4, width: "100%", padding: "3px", fontSize: 10, color: C.body, background: "transparent", border: "none", cursor: "pointer", opacity: 0.35, fontFamily: F }}>
                        [데모] 다음 단계 →
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
