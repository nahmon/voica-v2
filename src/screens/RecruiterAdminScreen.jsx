import { useState, useRef } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { PANEL_APPLICANTS } from "../lib/mockData.js";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
    setShow(true);
  };

  return (
    <span ref={triggerRef} style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 4 }}
      onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(83,58,253,0.12)", color: C.purple, fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "default", lineHeight: 1 }}>i</span>
      {show && (
        <div style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateX(-50%) translateY(-100%)", background: C.navy, color: C.white, fontSize: 11, lineHeight: 1.65, padding: "10px 14px", borderRadius: 8, whiteSpace: "normal", width: 240, zIndex: 9999, boxShadow: "0 6px 20px rgba(0,0,0,0.25)", pointerEvents: "none" }}>
          {text.split("\n").map((line, i) => <div key={i}>{line}</div>)}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${C.navy}` }} />
        </div>
      )}
    </span>
  );
}

export default function RecruiterAdminScreen({ go, user, logout }) {
  const [filter, setFilter] = useState("전체");
  const [selected, setSelected] = useState(new Set());
  const isMobile = useIsMobile();
  const filters = ["전체", "신청", "적합", "부적합", "완료"];
  const statusStyle = {
    신청:  { color: "#92650a", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
    적합:  { color: C.successText, bg: C.successBg, border: C.successBorder },
    부적합: { color: C.ruby, bg: "rgba(217,48,37,0.08)", border: "rgba(217,48,37,0.2)" },
    완료:  { color: C.body, bg: C.bg, border: C.border },
  };
  const filtered = filter === "전체" ? PANEL_APPLICANTS : PANEL_APPLICANTS.filter(p => p.status === filter);
  const counts = filters.slice(1).reduce((acc, f) => ({ ...acc, [f]: PANEL_APPLICANTS.filter(p => p.status === f).length }), {});

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} variant="app" user={user} logout={logout} />
      <div style={{ padding: "10px 24px", background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← 대시보드</Btn>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={() => go("editor")}>인터뷰 편집</Btn>
          <Btn size="sm" onClick={() => go("report")}>리포트 보기</Btn>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { label: "총 지원자", value: PANEL_APPLICANTS.length, color: C.navy },
            { label: "적합 패널", value: counts["적합"] || 0, color: C.success },
            { label: "검토 필요", value: counts["신청"] || 0, color: "#f59e0b" },
            { label: "인터뷰 완료", value: counts["완료"] || 0, color: C.purple },
            { label: "부적합", value: counts["부적합"] || 0, color: C.ruby },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, borderRadius: 16, padding: "16px 18px", border: `1px solid ${C.border}`, boxShadow: S.ambient }}>
              <div style={{ fontSize: 11, color: C.body, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: s.color, fontFeatureSettings: '"tnum"' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 13, fontFamily: F, border: "none", cursor: "pointer", background: filter === f ? C.purpleBg : "transparent", color: filter === f ? C.purple : C.body, fontWeight: filter === f ? 400 : 300 }}>
                {f} {f !== "전체" && counts[f] !== undefined && <span style={{ fontSize: 11 }}>({counts[f]})</span>}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.body }}>{selected.size}명 선택됨</span>
              <Btn size="sm" style={{ background: C.success }} onClick={() => { setSelected(new Set()); alert(`${selected.size}명을 승인했습니다.`); }}>일괄 승인</Btn>
              <Btn size="sm" style={{ background: C.ruby }} onClick={() => { setSelected(new Set()); alert(`${selected.size}명을 거절했습니다.`); }}>일괄 거절</Btn>
            </div>
          )}
        </div>

        {/* Mobile: card list */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((p) => {
              const ss = statusStyle[p.status];
              const scoreColor = p.score >= 85 ? C.success : p.score >= 70 ? "#f59e0b" : C.ruby;
              return (
                <div key={p.id} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 16px", boxShadow: S.ambient }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: C.navy }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.body, marginTop: 2 }}>{p.age} · {p.gender} · 인터뷰 {p.intv}회</div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{p.status}</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.body }}>AI 적합도</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>{p.score}점</span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${p.score}%`, background: scoreColor, borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.body, marginBottom: 12 }}>{p.applied}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {p.status === "신청" && (
                      <>
                        <button style={{ flex: 1, padding: "8px", fontSize: 13, borderRadius: 8, border: `1px solid ${C.successBorder}`, background: C.successBg, color: C.successText, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>승인</button>
                        <button style={{ flex: 1, padding: "8px", fontSize: 13, borderRadius: 8, border: "1px solid rgba(217,48,37,0.25)", background: "rgba(217,48,37,0.06)", color: C.ruby, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>거절</button>
                      </>
                    )}
                    {p.status === "적합" && <Btn size="sm" onClick={() => go("interview")}>인터뷰 시작</Btn>}
                    {p.status === "완료" && <Btn variant="ghost" size="sm" onClick={() => go("report")}>리포트</Btn>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        /* Desktop: table */
        <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, overflowX: "auto", overflowY: "visible", boxShadow: S.ambient }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 72px 72px 168px 130px 116px 180px", columnGap: 16, alignItems: "center", padding: "0 24px", height: 40, borderBottom: `1px solid ${C.border}`, background: C.bg, minWidth: 980 }}>
            {["", "패널", "연령", "성별", "지원일시"].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: C.body, letterSpacing: "0.3px", textTransform: "uppercase" }}>{h}</div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 600, color: C.body, letterSpacing: "0.3px", textTransform: "uppercase", display: "flex", alignItems: "center" }}>
              AI 적합도
              <InfoTooltip text={"프로필 매칭도 + 인터뷰 이력 + 응답 품질을\n종합한 0~100점 AI 적합도 점수입니다.\n85점↑ 적합 · 70~84점 검토 · 70점↓ 부적합"} />
            </div>
            {["상태", "액션"].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: C.body, letterSpacing: "0.3px", textTransform: "uppercase", paddingLeft: i === 1 ? 16 : 0 }}>{h}</div>
            ))}
          </div>

          {/* Table rows */}
          {filtered.map((p, i) => {
            const ss = statusStyle[p.status];
            const isSelected = selected.has(p.id);
            const scoreColor = p.score >= 85 ? C.success : p.score >= 70 ? "#f59e0b" : C.ruby;
            return (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr 72px 72px 168px 130px 116px 180px", columnGap: 16, alignItems: "center", padding: "0 24px", minHeight: 60, minWidth: 980, borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", background: isSelected ? C.purpleBg : "transparent", transition: "background 0.15s" }}>
                <div onClick={() => setSelected(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}
                  style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${isSelected ? C.purple : C.border}`, background: isSelected ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  {isSelected && <span style={{ color: C.white, fontSize: 10 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: C.navy, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.body, marginTop: 2 }}>인터뷰 {p.intv}회 참여</div>
                </div>
                <div style={{ fontSize: 13, color: C.navy }}>{p.age}</div>
                <div style={{ fontSize: 13, color: C.navy }}>{p.gender}</div>
                <div style={{ fontSize: 12, color: C.body, fontFeatureSettings: '"tnum"', lineHeight: 1.4 }}>{p.applied}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: scoreColor, marginBottom: 5, fontFeatureSettings: '"tnum"' }}>{p.score}점</div>
                  <div style={{ height: 3, background: C.border, borderRadius: 2, width: "80%" }}>
                    <div style={{ height: "100%", width: `${p.score}%`, background: scoreColor, borderRadius: 2 }} />
                  </div>
                </div>
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, whiteSpace: "nowrap" }}>{p.status}</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 16 }}>
                  {p.status === "신청" && (
                    <>
                      <button style={{ padding: "4px 12px", fontSize: 12, borderRadius: 6, border: `1px solid ${C.successBorder}`, background: C.successBg, color: C.successText, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>승인</button>
                      <button style={{ padding: "4px 12px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(217,48,37,0.25)", background: "rgba(217,48,37,0.06)", color: C.ruby, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>거절</button>
                    </>
                  )}
                  {p.status === "적합" && <Btn size="sm" onClick={() => go("interview")}>인터뷰 시작</Btn>}
                  {p.status === "완료" && <Btn variant="ghost" size="sm" onClick={() => go("report")}>리포트</Btn>}
                  {p.status === "부적합" && <span style={{ fontSize: 13, color: C.body }}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>
      <Footer go={go} />
    </div>
  );
}
