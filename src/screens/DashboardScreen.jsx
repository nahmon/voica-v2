import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { Badge, Btn, GlobalNav, Footer } from "../components/shared.jsx";

export default function DashboardScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const statusLabel = { draft: "초안", active: "진행 중", closed: "완료" };
  const statusStyle = {
    "진행 중": { variant: "success", dot: C.success },
    "초안":    { variant: "warning", dot: "#f59e0b" },
    "완료":    { variant: "neutral", dot: C.body },
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "사용자";
  const totalSessions = interviews.reduce((s, i) => s + (i.sessions?.[0]?.count ?? 0), 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} activeTab="dashboard" variant="app" logout={logout} isMobile={isMobile} user={user} />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 500, color: C.navy, letterSpacing: "0.16px", lineHeight: 1.12, marginBottom: 4, fontFeatureSettings: '"ss01"' }}>안녕하세요, {userName}님 👋</div>
            <div style={{ fontSize: 14, color: C.body }}>진행 중인 인터뷰 <strong style={{ fontWeight: 400, color: C.navy }}>{interviews.filter(i => i.status === "active").length}건</strong>, 누적 응답 <strong style={{ fontWeight: 400, color: C.navy }}>{totalSessions}건</strong></div>
          </div>
          <Btn onClick={() => go("editor")}>+ 새 프로젝트</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14, marginBottom: 32 }}>
          {[
            { label: "전체 프로젝트", value: loading ? "—" : String(interviews.length), sub: "생성된 인터뷰", color: C.purple },
            { label: "누적 응답", value: loading ? "—" : String(totalSessions), sub: "패널 응답 완료", color: C.success },
            { label: "진행 중", value: loading ? "—" : String(interviews.filter(i => i.status === "active").length), sub: "활성 인터뷰", color: C.navy },
            { label: "완료", value: loading ? "—" : String(interviews.filter(i => i.status === "closed").length), sub: "종료된 인터뷰", color: C.ruby },
          ].map(stat => (
            <div key={stat.label} style={{ background: C.white, borderRadius: 16, padding: "20px 20px", boxShadow: S.standard, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.body, marginBottom: 10, letterSpacing: "0.16px" }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: stat.color, lineHeight: 1.10, marginBottom: 6, fontFamily: F }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: C.body, letterSpacing: "0.16px" }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { icon: "users", title: "패널 리쿠르팅", desc: "지원자 검토 및 승인", screen: "recruiter_admin", badge: "신청 3건", badgeColor: "#f59e0b" },
            { icon: "search", title: "패널 모집 보드", desc: "공개 모집 공고 관리", screen: "panel_board", badge: "6개 공고", badgeColor: C.purple },
          ].map(item => (
            <div key={item.title} onClick={() => go(item.screen)} style={{ background: C.white, borderRadius: 16, padding: "16px 18px", boxShadow: S.ambient, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = S.card; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = S.ambient; }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{({users:Ic.Users,search:Ic.Search})[item.icon]?.({s:20,c:C.purple})}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 400, color: C.navy, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: C.body }}>{item.desc}</div>
              </div>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: `${item.badgeColor}18`, color: item.badgeColor, border: `1px solid ${item.badgeColor}40`, whiteSpace: "nowrap" }}>{item.badge}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 400, color: C.label }}>프로젝트</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!loading && interviews.length === 0 && (
            <div style={{ background: C.white, border: `2px dashed ${C.border}`, borderRadius: 8, padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: C.navy, marginBottom: 8 }}>아직 프로젝트가 없습니다</div>
              <div style={{ fontSize: 13, color: C.body, marginBottom: 24, lineHeight: 1.6 }}>
                첫 번째 인터뷰 프로젝트를 만들어 보세요.<br />
                질문을 설계하면 AI가 패널과 인터뷰를 자동 진행합니다.
              </div>
              <Btn onClick={() => go("editor")}>+ 첫 프로젝트 만들기</Btn>
            </div>
          )}
          {interviews.map(p => {
            const sessionCount = p.sessions?.[0]?.count ?? 0;
            const questionCount = p.questions?.[0]?.count ?? 0;
            const label = statusLabel[p.status] ?? p.status;
            const st = statusStyle[label] ?? { variant: "neutral", dot: C.body };
            const date = new Date(p.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "");
            return (
              <div key={p.id} onClick={() => go(p.status === "closed" ? "report" : "editor", p.id)} style={{ background: C.white, borderRadius: 16, padding: isMobile ? "16px" : "20px 24px", boxShadow: S.ambient, border: `1px solid ${C.border}`, cursor: "pointer", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = S.card; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = S.ambient; }}>
                {/* Title + status */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 400, color: C.navy, fontFeatureSettings: '"ss01"', flex: 1, minWidth: 0 }}>{p.title}</span>
                  <Badge variant={st.variant}>{label}</Badge>
                </div>
                <div style={{ fontSize: 12, color: C.body, marginBottom: 12 }}>질문 {questionCount}개 · {date}</div>
                {/* Response count */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: C.body }}>응답</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: C.navy, fontFeatureSettings: '"tnum"' }}>{sessionCount}명</span>
                  </div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${Math.min((sessionCount / Math.max(sessionCount, 20)) * 100, 100)}%`, background: C.purple, borderRadius: 2, transition: "width 0.5s" }} />
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  {p.status !== "closed" && <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); go("editor", p.id); }}>편집</Btn>}
                  {sessionCount > 0 && <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); go("responses", p.id); }}>응답 보기</Btn>}
                  {p.status === "closed" && <Btn size="sm" onClick={e => { e.stopPropagation(); go("report", p.id); }}>리포트</Btn>}
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
