import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, Btn, GlobalNav, Footer } from "../components/shared.jsx";

function timeAgo(dateStr, isKo = false) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? (isKo ? "방금 전" : "just now") : (isKo ? `${mins}분 전` : `${mins}m ago`);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return isKo ? "어제" : "yesterday";
  if (days < 7) return isKo ? `${days}일 전` : `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(isKo ? "ko-KR" : "en-US", { month: "short", day: "numeric" });
}

const STAT_ICONS = {
  0: (c) => Ic.Target({ s: 16, c }),
  1: (c) => Ic.Users({ s: 16, c }),
  2: (c) => Ic.RecDot({ s: 10, c }),
  3: (c) => Ic.Check({ s: 16, c }),
};

const STATUS_KEYS = ["all", "active", "draft", "closed"];
const STATUS_LABELS_EN = ["All", "In Progress", "Draft", "Completed"];
const STATUS_LABELS_KO = ["전체", "진행 중", "초안", "완료"];

export default function DashboardScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const isMobile = useIsMobile();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const isKo = lang === "ko";

  const STATUS_LABELS = isKo ? STATUS_LABELS_KO : STATUS_LABELS_EN;

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

  const statusLabel = isKo
    ? { draft: "초안", active: "진행 중", closed: "완료" }
    : { draft: "Draft", active: "In Progress", closed: "Completed" };
  const statusStyle = {
    "In Progress": { variant: "success", dot: C.success },
    "진행 중":     { variant: "success", dot: C.success },
    "Draft":       { variant: "warning", dot: "#f59e0b" },
    "초안":        { variant: "warning", dot: "#f59e0b" },
    "Completed":   { variant: "neutral", dot: C.body },
    "완료":        { variant: "neutral", dot: C.body },
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "there";
  const totalSessions = interviews.reduce((s, i) => s + (i.sessions?.[0]?.count ?? 0), 0);

  const filteredInterviews = interviews.filter(p => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchSearch = !searchQuery.trim() || p.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchStatus && matchSearch;
  });

  // Quick start steps — shown only when 0 interviews
  const QuickStart = !loading && interviews.length === 0 && (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 14, fontWeight: 400, color: C.label, marginBottom: 12 }}>{isKo ? "시작하는 방법" : "How to get started"}</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
        {[
          { step: "1", icon: (c) => Ic.Pencil({ s: 20, c }), title: isKo ? "질문 설계" : "Design Questions", desc: isKo ? "음성 및 객관식 질문을 만들어 인터뷰를 구성해요" : "Create voice and multiple-choice questions to build your interview", action: () => go("editor"), actionLabel: isKo ? "시작하기" : "Get Started", color: C.purple },
          { step: "2", icon: (c) => Ic.Users({ s: 20, c }), title: isKo ? "인터뷰 패널 모집" : "Recruit Panelists", desc: isKo ? "링크를 공유하거나 공개 보드에서 인터뷰 패널을 모집해요" : "Share a link or recruit panelists from the public board", action: () => go("panel_board"), actionLabel: isKo ? "보드 보기" : "View Board", color: C.success },
          { step: "3", icon: (c) => Ic.Sparkle({ s: 20, c }), title: isKo ? "AI 리포트" : "AI Report", desc: isKo ? "응답이 모이면 AI가 자동으로 인사이트 리포트를 만들어줘요" : "Once responses come in, AI automatically generates an insights report", action: null, actionLabel: null, color: C.navy },
        ].map(item => (
          <div key={item.step}
            style={{ background: C.white, borderRadius: 16, padding: "20px 20px 18px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}
            onMouseEnter={e => { const ic = e.currentTarget.querySelector(".qs-icon"); if (ic) ic.style.transform = "scale(1.15)"; }}
            onMouseLeave={e => { const ic = e.currentTarget.querySelector(".qs-icon"); if (ic) ic.style.transform = "scale(1)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="qs-icon" style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${item.color === C.purple ? "83,58,253" : item.color === C.success ? "21,190,83" : "6,27,49"},0.08)`, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.15s ease-out" }}>
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
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes cardLift {
          to { transform: translateY(-3px); }
        }
        .dash-card {
          transition: transform 0.08s ease-out, box-shadow 0.08s ease-out;
        }
        .dash-card:hover {
          transform: translateY(-3px);
          box-shadow: ${S.card};
        }
      `}</style>
      <GlobalNav go={go} activeTab="dashboard" variant="app" logout={logout} isMobile={isMobile} user={user} lang={lang} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", flex: 1, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 500, color: C.navy, letterSpacing: "0.16px", lineHeight: 1.12, marginBottom: 4, fontFeatureSettings: '"ss01"' }}>{isKo ? `안녕하세요, ${userName} 👋` : `Hello, ${userName} 👋`}</div>
            <div style={{ fontSize: 14, color: C.body }}>
              {isKo
                ? <><strong style={{ fontWeight: 400, color: C.navy }}>{interviews.filter(i => i.status === "active").length}</strong>개 진행 중인 인터뷰 · 전체 응답 <strong style={{ fontWeight: 400, color: C.navy }}>{totalSessions}</strong>개</>
                : <><strong style={{ fontWeight: 400, color: C.navy }}>{interviews.filter(i => i.status === "active").length}</strong> active interviews, <strong style={{ fontWeight: 400, color: C.navy }}>{totalSessions}</strong> total responses</>
              }
            </div>
          </div>
          <Btn onClick={() => go("editor")}>{isKo ? "+ 새 프로젝트" : "+ New Project"}</Btn>
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14, marginBottom: 32 }}>
          {[
            { label: isKo ? "전체 프로젝트" : "Total Projects", value: loading ? "—" : String(interviews.length), sub: isKo ? "생성된 인터뷰" : "Interviews created", color: C.purple, iconIdx: 0 },
            { label: isKo ? "전체 응답" : "Total Responses", value: loading ? "—" : String(totalSessions), sub: isKo ? "인터뷰 패널 응답" : "Panelist responses", color: C.success, iconIdx: 1 },
            { label: isKo ? "진행 중" : "In Progress", value: loading ? "—" : String(interviews.filter(i => i.status === "active").length), sub: isKo ? "진행 중인 인터뷰" : "Active interviews", color: C.navy, iconIdx: 2 },
            { label: isKo ? "완료" : "Completed", value: loading ? "—" : String(interviews.filter(i => i.status === "closed").length), sub: isKo ? "마감된 인터뷰" : "Closed interviews", color: C.body, iconIdx: 3 },
          ].map(stat => (
            <div key={stat.label} style={{ background: C.white, borderRadius: 16, padding: "20px 20px", boxShadow: S.standard, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: C.body, letterSpacing: "0.16px" }}>{stat.label}</div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `rgba(${stat.color === C.purple ? "83,58,253" : stat.color === C.success ? "21,190,83" : "6,27,49"},0.08)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {STAT_ICONS[stat.iconIdx]?.(stat.color)}
                </div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 600, color: stat.color, lineHeight: 1.0, marginBottom: 6, fontFamily: F, letterSpacing: "-1px", fontFeatureSettings: '"tnum"' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: C.body, letterSpacing: "0.16px" }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { icon: "users", title: isKo ? "인터뷰 패널 모집" : "Panelist Recruiting", desc: isKo ? "지원자를 검토하고 승인해요" : "Review and approve applicants", screen: "recruiter_admin" },
            { icon: "search", title: isKo ? "모집 보드" : "Recruitment Board", desc: isKo ? "공개 모집 공고를 관리해요" : "Manage public recruitment listings", screen: "panel_board" },
          ].map(item => (
            <div key={item.title} onClick={() => go(item.screen)} style={{ background: C.white, borderRadius: 16, padding: "16px 18px", boxShadow: S.ambient, border: "1px solid rgba(110,75,255,0.10)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "transform 0.12s ease-out, filter 0.12s ease-out, border-color 0.12s ease-out" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.filter = "brightness(1.03)"; e.currentTarget.style.borderColor = "rgba(110,75,255,0.22)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.borderColor = "rgba(110,75,255,0.10)"; }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{({users:Ic.Users,search:Ic.Search})[item.icon]?.({s:20,c:C.purple})}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.navy, marginBottom: 2 }}>{item.title}</div>
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
                placeholder={isKo ? "프로젝트 검색..." : "Search projects..."}
                style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, background: C.white, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {STATUS_KEYS.map((key, idx) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${statusFilter === key ? C.purple : C.border}`, background: statusFilter === key ? C.purple : C.white, color: statusFilter === key ? C.white : C.body, fontSize: 12, fontFamily: F, cursor: "pointer", fontWeight: statusFilter === key ? 500 : 400, transition: "all 0.08s ease-out" }}>
                  {STATUS_LABELS[idx]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 400, color: C.label }}>
            {isKo ? "프로젝트" : "Projects"}
            {statusFilter !== "all" && <span style={{ fontSize: 12, color: C.body, marginLeft: 6 }}>— {STATUS_LABELS[STATUS_KEYS.indexOf(statusFilter)]} ({filteredInterviews.length})</span>}
          </div>
          <div style={{ fontSize: 12, color: C.body }}>
            {filteredInterviews.length > 0 ? (isKo ? `${filteredInterviews.length}개` : `${filteredInterviews.length} project${filteredInterviews.length !== 1 ? "s" : ""}`) : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!loading && interviews.length === 0 && (
            <div style={{ background: C.white, border: "1px solid rgba(110,75,255,0.10)", borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                {Ic.Pencil({ s: 20, c: C.purple })}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 8, letterSpacing: "-0.02em" }}>{isKo ? "첫 인터뷰를 만들어보세요" : "Create your first interview"}</div>
              <div style={{ fontSize: 13, color: C.body, marginBottom: 20, lineHeight: 1.6 }}>
                {isKo ? "질문을 설계하면 AI가 자동으로 인터뷰를 진행해줘요." : "Design your questions and let AI conduct interviews automatically."}
              </div>
              <Btn onClick={() => go("editor")}>{isKo ? "+ 새 프로젝트" : "+ New Project"}</Btn>
            </div>
          )}
          {!loading && interviews.length > 0 && filteredInterviews.length === 0 && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: C.body }}>{isKo ? "조건에 맞는 프로젝트가 없어요" : "No matching projects found"}</div>
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
                onClick={() => { markAsSeen(p.id, sessionCount); go(p.status === "closed" ? "report" : sessionCount > 0 ? "responses" : "editor", p.id); }}
                style={{ background: C.white, borderRadius: 16, padding: isMobile ? "16px" : "20px 24px", border: "1px solid rgba(110,75,255,0.10)", cursor: "pointer" }}>
                {/* Title + status */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: C.body, letterSpacing: "0.04em", opacity: 0.6, flexShrink: 0 }}>VCS-{String(interviews.findIndex(i => i.id === p.id) + 1).padStart(3, "0")}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: C.navy, fontFeatureSettings: '"ss01"', flex: 1, minWidth: 0 }}>{p.title}</span>
                  {newResponses > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.white, background: C.ruby, borderRadius: 20, padding: "2px 8px", letterSpacing: "0.1px" }}>{isKo ? `${newResponses}개의 새 응답` : `${newResponses} new response${newResponses !== 1 ? "s" : ""}`}</span>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20, background: "rgba(0,0,0,0.04)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: C.body, fontWeight: 500 }}>{label}</span>
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.body, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{isKo ? `질문 ${questionCount}개` : `${questionCount} question${questionCount !== 1 ? "s" : ""}`}</span>
                  <span style={{ color: C.border }}>·</span>
                  <span>{timeAgo(p.created_at, isKo)}</span>
                </div>
                {/* Response count */}
                <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: C.body }}>{isKo ? "응답" : "Responses"}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: sessionCount > 0 ? C.purple : C.body, fontFeatureSettings: '"tnum"' }}>{sessionCount}</span>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  {p.share_code && (
                    <Btn variant="ghost" size="sm" onClick={e => handleCopyLink(e, p.share_code)}>
                      {copiedId === p.share_code ? (isKo ? "복사됨 ✓" : "Copied ✓") : (isKo ? "링크 복사" : "Copy Link")}
                    </Btn>
                  )}
                  {p.status !== "closed" && <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); go("editor", p.id); }}>{isKo ? "수정" : "Edit"}</Btn>}
                  {sessionCount > 0 && <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); go("responses", p.id); }}>{isKo ? "응답 보기" : "View Responses"}</Btn>}
                  {p.status === "closed" && <Btn size="sm" onClick={e => { e.stopPropagation(); go("report", p.id); }}>{isKo ? "리포트" : "Report"}</Btn>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
