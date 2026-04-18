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
  const [lang, setLang] = useState("ko");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(new Set());
  const isMobile = useIsMobile();
  const filters = ["All", "Applied", "Qualified", "Unqualified", "Completed"];
  const statusMap = { "All": "All", "Applied": "Applied", "Qualified": "Qualified", "Unqualified": "Not Qualified", "Completed": "Completed" };
  const statusStyle = {
    "Applied":       { color: "#92650a", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.3)" },
    "Qualified":     { color: C.successText, bg: C.successBg, border: C.successBorder },
    "Not Qualified": { color: C.ruby, bg: "rgba(217,48,37,0.08)", border: "rgba(217,48,37,0.2)" },
    "Completed":     { color: C.body, bg: C.bg, border: C.border },
  };
  const filtered = filter === "All" ? PANEL_APPLICANTS : PANEL_APPLICANTS.filter(p => p.status === statusMap[filter]);
  const counts = filters.slice(1).reduce((acc, f) => ({ ...acc, [f]: PANEL_APPLICANTS.filter(p => p.status === statusMap[f]).length }), {});

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} variant="app" user={user} logout={logout} lang={lang} />
      <div style={{ padding: "10px 24px", background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Btn variant="ghost" size="sm" onClick={() => go("dashboard")}>← Dashboard</Btn>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={() => go("editor")}>Edit interview</Btn>
          <Btn size="sm" onClick={() => go("report")}>View report</Btn>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total applicants", value: PANEL_APPLICANTS.length, color: C.navy },
            { label: "Qualified", value: counts["Qualified"] || 0, color: C.success },
            { label: "Needs review", value: counts["Applied"] || 0, color: "#f59e0b" },
            { label: "Interviews done", value: counts["Completed"] || 0, color: C.purple },
            { label: "Unqualified", value: counts["Unqualified"] || 0, color: C.ruby },
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
                {f} {f !== "All" && counts[f] !== undefined && <span style={{ fontSize: 11 }}>({counts[f]})</span>}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.body }}>{selected.size} selected</span>
              <Btn size="sm" style={{ background: C.success }} onClick={() => { setSelected(new Set()); alert(`Approved ${selected.size} applicant(s).`); }}>Approve all</Btn>
              <Btn size="sm" style={{ background: C.ruby }} onClick={() => { setSelected(new Set()); alert(`Rejected ${selected.size} applicant(s).`); }}>Reject all</Btn>
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
                      <div style={{ fontSize: 12, color: C.body, marginTop: 2 }}>{p.age} · {p.gender} · {p.intv} interviews</div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{statusLabel[p.status]}</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.body }}>AI Fit Score</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>{p.score}</span>
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${p.score}%`, background: scoreColor, borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.body, marginBottom: 12 }}>{p.applied}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {p.status === "Applied" && (
                      <>
                        <button style={{ flex: 1, padding: "8px", fontSize: 13, borderRadius: 8, border: `1px solid ${C.successBorder}`, background: C.successBg, color: C.successText, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>Approve</button>
                        <button style={{ flex: 1, padding: "8px", fontSize: 13, borderRadius: 8, border: "1px solid rgba(217,48,37,0.25)", background: "rgba(217,48,37,0.06)", color: C.ruby, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>Reject</button>
                      </>
                    )}
                    {p.status === "Qualified" && <Btn size="sm" onClick={() => go("interview")}>Start interview</Btn>}
                    {p.status === "Completed" && <Btn variant="ghost" size="sm" onClick={() => go("report")}>Report</Btn>}
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
            {["", "Applicant", "Age", "Gender", "Applied on"].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: C.body, letterSpacing: "0.3px", textTransform: "uppercase" }}>{h}</div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 600, color: C.body, letterSpacing: "0.3px", textTransform: "uppercase", display: "flex", alignItems: "center" }}>
              AI Fit Score
              <InfoTooltip text={"Profile match + interview history + response quality\ncombined into a 0–100 AI fit score.\n85+ Qualified · 70–84 Review · Below 70 Unqualified"} />
            </div>
            {["Status", "Actions"].map((h, i) => (
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
                  <div style={{ fontSize: 11, color: C.body, marginTop: 2 }}>{p.intv} interview{p.intv !== 1 ? "s" : ""} completed</div>
                </div>
                <div style={{ fontSize: 13, color: C.navy }}>{p.age}</div>
                <div style={{ fontSize: 13, color: C.navy }}>{p.gender}</div>
                <div style={{ fontSize: 12, color: C.body, fontFeatureSettings: '"tnum"', lineHeight: 1.4 }}>{p.applied}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: scoreColor, marginBottom: 5, fontFeatureSettings: '"tnum"' }}>{p.score}</div>
                  <div style={{ height: 3, background: C.border, borderRadius: 2, width: "80%" }}>
                    <div style={{ height: "100%", width: `${p.score}%`, background: scoreColor, borderRadius: 2 }} />
                  </div>
                </div>
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, whiteSpace: "nowrap" }}>{p.status}</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 16 }}>
                  {p.status === "Applied" && (
                    <>
                      <button style={{ padding: "4px 12px", fontSize: 12, borderRadius: 6, border: `1px solid ${C.successBorder}`, background: C.successBg, color: C.successText, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>Approve</button>
                      <button style={{ padding: "4px 12px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(217,48,37,0.25)", background: "rgba(217,48,37,0.06)", color: C.ruby, cursor: "pointer", fontFamily: F, fontWeight: 500 }}>Reject</button>
                    </>
                  )}
                  {p.status === "Qualified" && <Btn size="sm" onClick={() => go("interview")}>Start interview</Btn>}
                  {p.status === "Completed" && <Btn variant="ghost" size="sm" onClick={() => go("report")}>Report</Btn>}
                  {p.status === "Not Qualified" && <span style={{ fontSize: 13, color: C.body }}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </main>
      <Footer go={go} lang={lang} onLangChange={setLang} />
    </div>
  );
}
