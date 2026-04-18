import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, Btn, GlobalNav, Footer } from "../components/shared.jsx";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STAT_ICONS = {
  "Total Projects": (c) => Ic.Target({ s: 16, c }),
  "Total Responses":     (c) => Ic.Users({ s: 16, c }),
  "In Progress":       (c) => Ic.RecDot({ s: 10, c }),
  "Completed":          (c) => Ic.Check({ s: 16, c }),
};

const STATUS_FILTERS = ["All", "In Progress", "Draft", "Completed"];

export default function DashboardScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select(`
          id, title, status, share_code, created_at,
          questions(count),
          sessions(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) setInterviews(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const handleCopyLink = async (e, shareCode) => {
    e.stopPropagation();
    const url = `${window.location.origin}/i/${shareCode}`;
    try { await navigator.clipboard.writeText(url); } catch {
      const el = document.createElement("textarea");
      el.value = url; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopiedId(shareCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markAsSeen = (interviewId, count) => {
    localStorage.setItem(`voica_seen_${interviewId}`, String(count));
  };

  const statusLabel = { draft: "Draft", active: "In Progress", closed: "Completed" };
  const statusStyle = {
    "In Progress": { variant: "success", dot: C.success },
    "Draft":    { variant: "warning", dot: "#f59e0b" },
    "Completed":    { variant: "neutral", dot: C.body },
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "there";
  const totalSessions = interviews.reduce((s, i) => s + (i.sessions?.[0]?.count ?? 0), 0);

  const filteredInterviews = interviews.filter(p => {
    const label = statusLabel[p.status] ?? p.status;
    const matchStatus = statusFilter === "All" || label === statusFilter;
    const matchSearch = !searchQuery.trim() || p.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchStatus && matchSearch;
  });

  // Quick start steps — shown only when 0 interviews
  const QuickStart = !loading && interviews.length === 0 && (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 14, fontWeight: 400, color: C.label, marginBottom: 12 }}>How to get started</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
        {[
          { step: "1", icon: (c) => Ic.Pencil({ s: 20, c }), title: "Design Questions", desc: "Create voice and multiple-choice questions to build your interview", action: () => go("editor"), actionLabel: "Get Started", color: C.purple },
          { step: "2", icon: (c) => Ic.Users({ s: 20, c }), title: "Recruit Panelists", desc: "Share a link or recruit panelists from the public board", action: () => go("panel_board"), actionLabel: "View Board", color: C.success },
          { step: "3", icon: (c) => Ic.Sparkle({ s: 20, c }), title: "AI Report", desc: "Once responses come in, AI automatically generates an insights report", action: null, actionLabel: null, color: C.navy },
        ].map(item => (
          <div key={item.step} style={{ background: C.white, borderRadius: 16, padding: "20px 20px 18px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${item.color === C.purple ? "83,58,253" : item.color === C.success ? "21,190,83" : "6,27,49"},0.08)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.icon(item.color)}
              </div>
              <div style={{ fontSize: 11, color: C.body, fontWeight: 500 }}>STEP {item.step}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.navy }}>{item.title}</div>
            <div style={{ fontSize: 12, color: C.body, lineHeight: 1.6, flex: 1 }}>{item.desc}</div>
            {item.action && (
              <button onClick={item.action} style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: 8, border: "none", background: item.color, color: C.white, fontSize: 12, fontWeight: 500, fontFamily: F, cursor: "pointer" }}>
                {item.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <style>{`
        @keyframes cardLift {
          to { transform: translateY(-3px); }
        }
        .dash-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .dash-card:hover {
          transform: translateY(-3px);
          box-shadow: ${S.card};
        }
      `}</style>
      <GlobalNav go={go} activeTab="dashboard" variant="app" logout={logout} isMobile={isMobile} user={user} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 500, color: C.navy, letterSpacing: "0.16px", lineHeight: 1.12, marginBottom: 4, fontFeatureSettings: '"ss01"' }}>Hello, {userName} 👋</div>
            <div style={{ fontSize: 14, color: C.body }}><strong style={{ fontWeight: 400, color: C.navy }}>{interviews.filter(i => i.status === "active").length}</strong> active interviews, <strong style={{ fontWeight: 400, color: C.navy }}>{totalSessions}</strong> total responses</div>
          </div>
          <Btn onClick={() => go("editor")}>+ New Project</Btn>
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14, marginBottom: 32 }}>
          {[
            { label: "Total Projects", value: loading ? "—" : String(interviews.length), sub: "Interviews created", color: C.purple },
            { label: "Total Responses", value: loading ? "—" : String(totalSessions), sub: "Panelist responses", color: C.success },
            { label: "In Progress", value: loading ? "—" : String(interviews.filter(i => i.status === "active").length), sub: "Active interviews", color: C.navy },
            { label: "Completed", value: loading ? "—" : String(interviews.filter(i => i.status === "closed").length), sub: "Closed interviews", color: C.ruby },
          ].map(stat => (
            <div key={stat.label} style={{ background: C.white, borderRadius: 16, padding: "20px 20px", boxShadow: S.standard, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: C.body, letterSpacing: "0.16px" }}>{stat.label}</div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `rgba(${stat.color === C.purple ? "83,58,253" : stat.color === C.success ? "21,190,83" : stat.color === C.navy ? "6,27,49" : "234,34,97"},0.08)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {STAT_ICONS[stat.label]?.(stat.color)}
                </div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 600, color: stat.color, lineHeight: 1.0, marginBottom: 6, fontFamily: F, letterSpacing: "-1px" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: C.body, letterSpacing: "0.16px" }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { icon: "users", title: "Panelist Recruiting", desc: "Review and approve applicants", screen: "recruiter_admin" },
            { icon: "search", title: "Recruitment Board", desc: "Manage public recruitment listings", screen: "panel_board" },
          ].map(item => (
            <div key={item.title} onClick={() => go(item.screen)} style={{ background: C.white, borderRadius: 16, padding: "16px 18px", boxShadow: S.ambient, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = S.card; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = S.ambient; }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{({users:Ic.Users,search:Ic.Search})[item.icon]?.({s:20,c:C.purple})}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 400, color: C.navy, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: C.body }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick start for empty state */}
        {QuickStart}

        {/* Search + filter bar */}
        {!loading && interviews.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
              <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                {Ic.Search({ s: 14, c: C.body })}
              </div>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, background: C.white, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {STATUS_FILTERS.map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${statusFilter === f ? C.purple : C.border}`, background: statusFilter === f ? C.purple : C.white, color: statusFilter === f ? C.white : C.body, fontSize: 12, fontFamily: F, cursor: "pointer", fontWeight: statusFilter === f ? 500 : 400, transition: "all 0.15s" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 400, color: C.label }}>
            Projects
            {statusFilter !== "All" && <span style={{ fontSize: 12, color: C.body, marginLeft: 6 }}>— {statusFilter} ({filteredInterviews.length})</span>}
          </div>
          <div style={{ fontSize: 12, color: C.body }}>🔔 Response notifications active</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!loading && interviews.length === 0 && (
            <div style={{ background: C.white, border: `2px dashed ${C.border}`, borderRadius: 8, padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: C.navy, marginBottom: 8 }}>No projects yet</div>
              <div style={{ fontSize: 13, color: C.body, marginBottom: 24, lineHeight: 1.6 }}>
                Create your first interview.<br />
                Design your questions and let AI conduct interviews with panelists automatically.
              </div>
              <Btn onClick={() => go("editor")}>+ Create First Project</Btn>
            </div>
          )}
          {!loading && interviews.length > 0 && filteredInterviews.length === 0 && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: C.body }}>No matching projects found</div>
            </div>
          )}
          {filteredInterviews.map(p => {
            const sessionCount = p.sessions?.[0]?.count ?? 0;
            const questionCount = p.questions?.[0]?.count ?? 0;
            const label = statusLabel[p.status] ?? p.status;
            const st = statusStyle[label] ?? { variant: "neutral", dot: C.body };
            const seenCount = parseInt(localStorage.getItem(`voica_seen_${p.id}`) ?? "0", 10);
            const newResponses = sessionCount - seenCount;
            return (
              <div key={p.id}
                className="dash-card"
                onClick={() => { markAsSeen(p.id, sessionCount); go(p.status === "closed" ? "report" : "editor", p.id); }}
                style={{ background: C.white, borderRadius: 16, padding: isMobile ? "16px" : "20px 24px", border: `1px solid ${C.border}`, cursor: "pointer" }}>
                {/* Title + status */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 400, color: C.navy, fontFeatureSettings: '"ss01"', flex: 1, minWidth: 0 }}>{p.title}</span>
                  {newResponses > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.white, background: C.ruby, borderRadius: 20, padding: "2px 8px", letterSpacing: "0.1px" }}>{newResponses} new response{newResponses !== 1 ? "s" : ""}</span>
                  )}
                  <Badge variant={st.variant}>{label}</Badge>
                </div>
                <div style={{ fontSize: 12, color: C.body, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{questionCount} question{questionCount !== 1 ? "s" : ""}</span>
                  <span style={{ color: C.border }}>·</span>
                  <span>{timeAgo(p.created_at)}</span>
                </div>
                {/* Response count */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: C.body }}>Responses</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: C.navy, fontFeatureSettings: '"tnum"' }}>{sessionCount}</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${Math.min((sessionCount / Math.max(sessionCount, 20)) * 100, 100)}%`, background: C.purple, borderRadius: 2, transition: "width 0.5s" }} />
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  {p.share_code && (
                    <Btn variant="ghost" size="sm" onClick={e => handleCopyLink(e, p.share_code)}>
                      {copiedId === p.share_code ? "Copied ✓" : "Copy Link"}
                    </Btn>
                  )}
                  {p.status !== "closed" && <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); go("editor", p.id); }}>Edit</Btn>}
                  {sessionCount > 0 && <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); go("responses", p.id); }}>View Responses</Btn>}
                  {p.status === "closed" && <Btn size="sm" onClick={e => { e.stopPropagation(); go("report", p.id); }}>Report</Btn>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer go={go} />
    </div>
  );
}
