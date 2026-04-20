import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";

function LogoMark({ size = 20, dark = false }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.22),
        background: C.purple,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <div style={{ width: Math.round(size * 0.38), height: Math.round(size * 0.38), borderRadius: Math.round(size * 0.07), background: "#fff" }} />
      </div>
      <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.03em", color: dark ? "#ffffff" : "#0f172a", fontFamily: F }}>
        voicesurvey
      </span>
    </div>
  );
}
import { useIsMobile } from "../hooks/useIsMobile.js";
import { supabase } from "../supabase.js";

const _interviewCountCache = {};

// ─── Toast ──────────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, variant = "info") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, variant }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  const bg = { success: "#1e8e3e", error: "#d93025", info: C.purple };
  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", bottom: "calc(28px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: bg[t.variant] ?? C.purple, color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontFamily: F, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.22)", whiteSpace: "nowrap", animation: "toast-in 0.22s ease", letterSpacing: "0.16px" }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { showToast: () => {} };
  return ctx;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ width = "100%", height = 16, borderRadius = 6, style: sx = {} }) {
  return (
    <div style={{ width, height, borderRadius, background: "linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%)", backgroundSize: "800px 100%", animation: "shimmer 1.4s infinite linear", ...sx }} />
  );
}

export function Badge({ children, variant = "neutral", style: sx = {} }) {
  const v = {
    neutral: { background: C.bg, color: C.navy, border: "none" },
    purple: { background: "rgba(0,113,227,0.08)", color: C.purple, border: "none" },
    ai: { background: "rgba(0,113,227,0.08)", color: C.purple, border: "none" },
    success: { background: "rgba(29,125,58,0.08)", color: C.successText, border: "none" },
    negative: { background: "rgba(217,48,37,0.08)", color: C.ruby, border: "none" },
    warning: { background: "#fef3c7", color: "#92400e", border: "none" },
    dark: { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", border: "none" },
  };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 5, fontSize: 12, fontWeight: 400, fontFamily: F, letterSpacing: "0.16px", whiteSpace: "nowrap", ...v[variant], ...sx }}>{children}</span>;
}

export function Btn({ children, variant = "primary", size = "md", onClick, disabled, full, style: sx = {} }) {
  const [hov, setHov] = useState(false);
  const sz = { sm: { padding: "5px 14px", fontSize: 13 }, md: { padding: "9px 20px", fontSize: 15 }, lg: { padding: "13px 32px", fontSize: 16 } };
  const vr = {
    primary: { background: disabled ? "#a09de8" : hov ? C.purpleHover : C.purple, color: C.white, border: "none", transform: !disabled && hov ? "scale(1.02)" : "scale(1)", filter: !disabled && hov ? "brightness(1.05)" : "brightness(1)" },
    ghost: { background: "transparent", color: C.purple, border: `1px solid ${C.purpleLight}`, transform: hov ? "scale(1.02)" : "scale(1)", filter: hov ? "brightness(1.05)" : "brightness(1)" },
    dark: { background: hov ? "#2a2d6a" : C.brandDark, color: C.white, border: "none", transform: hov ? "scale(1.02)" : "scale(1)", filter: hov ? "brightness(1.05)" : "brightness(1)" },
    white: { background: hov ? "rgba(255,255,255,0.9)" : C.white, color: C.navy, border: "none", transform: hov ? "scale(1.02)" : "scale(1)", filter: hov ? "brightness(0.97)" : "brightness(1)" },
    kakao: { background: hov ? "#e6c200" : "#FEE500", color: "#191919", border: "none", transform: hov ? "scale(1.02)" : "scale(1)", filter: hov ? "brightness(1.05)" : "brightness(1)" },
    naver: { background: hov ? "#02b351" : "#03C75A", color: C.white, border: "none", transform: hov ? "scale(1.02)" : "scale(1)", filter: hov ? "brightness(1.05)" : "brightness(1)" },
    toss: { background: hov ? "#0057e0" : "#0064FF", color: C.white, border: "none", transform: hov ? "scale(1.02)" : "scale(1)", filter: hov ? "brightness(1.05)" : "brightness(1)" },
    naverpay: { background: hov ? "#02b351" : "#03C75A", color: C.white, border: "none" },
    tossspay: { background: hov ? "#0057e0" : "#0064FF", color: C.white, border: "none" },
    stripe: { background: hov ? "#5851d8" : "#635bff", color: C.white, border: "none" },
  };
  return (
    <button disabled={disabled} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontFamily: F, fontFeatureSettings: '"ss01"', fontWeight: 500, transition: "transform 0.18s, filter 0.18s, background 0.18s, border-color 0.18s", width: full ? "100%" : "auto", boxShadow: "none", WebkitAppearance: "none", appearance: "none", ...sz[size], ...vr[variant], ...sx }}>
      {children}
    </button>
  );
}

export function NavTab({ label, onClick, active, dark = false }) {
  const [hov, setHov] = useState(false);
  const color = dark
    ? active ? "rgba(190,180,255,0.95)" : hov ? "rgba(255,255,255,0.85)" : "rgba(200,205,230,0.65)"
    : active ? C.purple : hov ? C.navy : C.navy;
  const bg = dark
    ? "transparent"
    : active ? "rgba(110,75,255,0.08)" : hov ? "rgba(110,75,255,0.06)" : "transparent";
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: "relative", display: "flex", alignItems: "center", margin: "10px 2px", padding: "0 12px", height: 36, borderRadius: 8, fontSize: 14, fontFamily: F, fontWeight: active ? 500 : 400, color, background: bg, border: "none", cursor: "pointer", transition: "background 0.12s ease-out, color 0.12s ease-out", whiteSpace: "nowrap", letterSpacing: "0.16px" }}>
      {label}
    </button>
  );
}

export function Input({ label, type = "text", placeholder, value, onChange, helper, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 14, fontWeight: 400, color: C.navy, marginBottom: 6, fontFamily: F, letterSpacing: "0.16px" }}>{label}{required && <span style={{ color: "#ea2261", marginLeft: 3 }}>*</span>}</label>}
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${focused ? C.purple : C.border}`, fontSize: 17, fontFamily: F, color: C.navy, outline: focused ? `2px solid ${C.purple}` : "none", outlineOffset: 2, boxSizing: "border-box", background: C.white, transition: "border-color 0.15s", letterSpacing: "0.16px" }}
      />
      {helper && <div style={{ fontSize: 12, color: C.body, marginTop: 4, fontFamily: F, letterSpacing: "0.16px" }}>{helper}</div>}
    </div>
  );
}

export function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 12, color: C.body, fontFamily: F }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

export function BackBtn({ onClick, label = "Home", dark = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontSize: 13, fontFamily: F, fontWeight: 500, color: dark ? (hov ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)") : (hov ? C.navy : C.body), transition: "color 0.15s" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {label}
    </button>
  );
}

// ─── Global Navigation Bar ───
// variant: "public" (landing/pricing/faq/support), "app" (dashboard/editor/report/recruiter), "panel" (board/mypage/consent), "sub" (login/panel_entry)
export function GlobalNav({ go, activeTab, variant = "public", logout, isMobile: isMobileProp, user, lang = "en" }) {
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileHook;
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasInterviews, setHasInterviews] = useState(
    user?.id != null ? (_interviewCountCache[user.id] ?? null) : null
  );

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (variant !== "app" || !user?.id) return;
    if (_interviewCountCache[user.id] !== undefined) {
      setHasInterviews(_interviewCountCache[user.id]);
      return;
    }
    supabase
      .from("interviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        const result = (count ?? 0) > 0;
        _interviewCountCache[user.id] = result;
        setHasInterviews(result);
      });
  }, [variant, user?.id]);

  const isKo = lang === "ko";
  const navLinks =
    variant === "app"
      ? [[isKo ? "대시보드" : "Dashboard", "dashboard"], [isKo ? "요금제" : "Pricing", "pricing"], ["FAQ", "faq"], [isKo ? "고객 지원" : "Support", "support"]]
      : variant === "panel"
      ? [[isKo ? "인터뷰 찾기" : "Open Interviews", "panel_board"], [isKo ? "나의 인터뷰" : "My Interviews", "panel_mypage"], ["FAQ", "faq"], [isKo ? "고객 지원" : "Support", "support"]]
      : [[isKo ? "소개" : "About", "about"], [isKo ? "패널 보드" : "Panelist Board", "panel_board"], [isKo ? "요금제" : "Pricing", "pricing"], ["FAQ", "faq"], [isKo ? "고객 지원" : "Support", "support"]];

  const homeTarget = "landing";

  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: isMobile ? "#ffffff" : "rgba(255,255,255,0.97)", borderBottom: `1px solid ${C.border}`, padding: isMobile ? "0 20px" : "0 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "stretch", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => go(homeTarget)}>
            <LogoMark dark={false} />
          </div>
          {!isMobile ? (
            <div style={{ display: "flex", alignItems: "stretch" }}>
              {navLinks.map(([label, target]) => (
                <NavTab key={label} label={label} active={activeTab === target} onClick={() => go(target)} dark={false} />
              ))}
            </div>
          ) : <div />}
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            {variant === "app" && !isMobile && (
              <>
                {hasInterviews !== null && (
                  <Btn size="sm" onClick={() => go(hasInterviews ? "dashboard" : "editor")}>{hasInterviews ? (isKo ? "대시보드" : "Dashboard") : (isKo ? "+ 인터뷰 시작" : "+ Start Interview")}</Btn>
                )}
                {logout && <Btn variant="ghost" size="sm" onClick={logout}>{isKo ? "로그아웃" : "Log Out"}</Btn>}
                <div style={{ width: 1, height: 16, background: C.border }} />
                {(() => {
                  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
                  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "U";
                  const initials = <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.purpleBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.purple }}>{displayName[0].toUpperCase()}</div>;
                  return avatarUrl
                    ? <img src={avatarUrl} alt="profile" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: `1px solid ${C.border}` }} onError={e => { e.currentTarget.style.display = "none"; }} />
                    : initials;
                })()}
                <div style={{ fontSize: 12, color: C.body, letterSpacing: "0.16px" }}>
                  {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || ""}
                </div>
              </>
            )}
            {variant === "panel" && !isMobile && (
              <>
                {logout && <Btn variant="ghost" size="sm" onClick={logout}>{isKo ? "로그아웃" : "Log Out"}</Btn>}
              </>
            )}
            {(variant === "public" || variant === "sub") && !isMobile && (
              <>
                <Btn variant="ghost" size="sm" style={{ border: "1px solid rgba(23,23,23,0.2)", borderRadius: 56 }} onClick={() => go("panel_entry")}>{isKo ? "인터뷰 참여" : "Join as Panelist"}</Btn>
                <Btn size="sm" onClick={() => go("advertiser_login")}>{isKo ? "로그인" : "Log In"}</Btn>
              </>
            )}
            {isMobile && (
              <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "12px", color: C.navy, fontSize: 20, lineHeight: 1, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100dvh", background: "rgba(0,0,0,0.4)", zIndex: 200, backdropFilter: "blur(2px)" }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 280, background: C.white, zIndex: 201, boxShadow: S.card, display: "flex", flexDirection: "column", fontFamily: F }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, borderBottom: `1px solid rgba(0,0,0,0.08)` }}>
              <LogoMark />
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.body, lineHeight: 1, padding: 10 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
              {variant === "app" ? (
                <>
                  <div style={{ padding: "8px 20px 4px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.8 }}>{isKo ? "연구자" : "Researcher"}</div>
                  {[
                    { label: isKo ? "대시보드" : "Dashboard", target: "dashboard", desc: isKo ? "진행 중인 인터뷰 관리" : "Manage active interviews" },
                    { label: isKo ? "인터뷰 만들기" : "Create Interview", target: "editor", desc: isKo ? "새 인터뷰 설계" : "Design a new interview" },
                    { label: isKo ? "요금제" : "Pricing", target: "pricing", desc: isKo ? "플랜 비교" : "Compare plans" },
                    { label: "FAQ", target: "faq", desc: isKo ? "자주 묻는 질문" : "Frequently asked questions" },
                    { label: isKo ? "고객 지원" : "Support", target: "support", desc: isKo ? "도움말 및 문의" : "Help & contact" },
                  ].map(item => (
                    <div key={item.label} onClick={() => { go(item.target); setMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer", background: "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ fontSize: 15, fontWeight: 400, color: C.navy }}>{item.label}</div>
                      <span style={{ fontSize: 12, color: C.border }}>›</span>
                    </div>
                  ))}
                </>
              ) : variant === "panel" ? (
                <>
                  <div style={{ padding: "8px 20px 4px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.8 }}>{isKo ? "인터뷰 패널" : "Panelist"}</div>
                  {[
                    { label: isKo ? "인터뷰 찾기" : "Open Interviews", target: "panel_board", desc: isKo ? "공개 인터뷰 목록" : "Browse open listings" },
                    { label: isKo ? "나의 인터뷰" : "My Interviews", target: "panel_mypage", desc: isKo ? "지원 현황 및 진행 상황" : "Applications & progress" },
                    { label: "FAQ", target: "faq", desc: isKo ? "자주 묻는 질문" : "Frequently asked questions" },
                    { label: isKo ? "고객 지원" : "Support", target: "support", desc: isKo ? "도움말 및 문의" : "Help & contact" },
                  ].map(item => (
                    <div key={item.label} onClick={() => { go(item.target); setMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer", background: "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ fontSize: 15, fontWeight: 400, color: C.navy }}>{item.label}</div>
                      <span style={{ fontSize: 12, color: C.border }}>›</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ padding: "8px 20px 4px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.8 }}>{isKo ? "서비스" : "Product"}</div>
                  {[
                    { label: isKo ? "소개" : "About", target: "about", desc: isKo ? "voicesurvey 소개" : "What voicesurvey does" },
                    { label: isKo ? "요금제" : "Pricing", target: "pricing", desc: isKo ? "플랜 비교" : "Compare plans" },
                    { label: "FAQ", target: "faq", desc: isKo ? "자주 묻는 질문" : "Frequently asked questions" },
                    { label: isKo ? "고객 지원" : "Support", target: "support", desc: isKo ? "도움말 및 문의" : "Help & contact" },
                  ].map(item => (
                    <div key={item.label} onClick={() => { go(item.target); setMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer", background: "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ fontSize: 15, fontWeight: 400, color: C.navy }}>{item.label}</div>
                      <span style={{ fontSize: 12, color: C.border }}>›</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: C.border, margin: "8px 20px" }} />
                  <div style={{ padding: "8px 20px 4px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.8 }}>{isKo ? "인터뷰 패널" : "Panelist"}</div>
                  {[
                    { label: isKo ? "인터뷰 찾기" : "Available Interviews", target: "panel_board", desc: isKo ? "공개 인터뷰 목록" : "Browse open listings" },
                    { label: isKo ? "인터뷰 패널 등록" : "Register as Panelist", target: "panel_entry", desc: isKo ? "참여하고 보상 받기" : "Participate and earn rewards" },
                  ].map(item => (
                    <div key={item.label} onClick={() => { go(item.target); setMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer", background: "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ fontSize: 15, fontWeight: 400, color: C.navy }}>{item.label}</div>
                      <span style={{ fontSize: 12, color: C.border }}>›</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div style={{ padding: "16px 20px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
              {(variant === "app" || variant === "panel") && logout ? (
                <Btn full size="md" variant="ghost" onClick={() => { logout(); setMenuOpen(false); }}>{isKo ? "로그아웃" : "Log Out"}</Btn>
              ) : (
                <>
                  <Btn full size="md" onClick={() => { go("advertiser_login"); setMenuOpen(false); }}>{isKo ? "로그인 / 회원가입" : "Log In / Sign Up"}</Btn>
                  <Btn full variant="ghost" size="md" onClick={() => { go("panel_entry"); setMenuOpen(false); }}>{isKo ? "인터뷰 참여" : "Join as Panelist"}</Btn>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── VoC Carousel ───
const VOC_LIST = [
  { quote: "Recruiting participants and coordinating schedules used to take at least a week for a single user interview. With Voice Survey, I had results from 100 interviews in a single day — and the report quality exceeded my expectations.", name: "James K.", title: "Senior Manager", company: "**Electronics MX Marketing Team", photo: "/profiles/male-1.png" },
  { quote: "Running one focus group used to cost hundreds of thousands of dollars. Voice Survey is a fraction of the cost and delivers results far faster. I think qualitative research will never be the same.", name: "Jennifer K.", title: "Brand Manager", company: "LG** Health Brand Strategy Team", photo: "/profiles/female-1.png" },
  { quote: "We needed consumer reactions within two weeks before a product launch. Voice Survey gave us analysis from 200 interviews in just three days. Our decision-making speed has completely changed.", name: "Patrick S.", title: "PM", company: "**kao Product Planning Team" },
  { quote: "We ran 500 simultaneous interviews for a fraction of what an agency would charge. The quality was on par with traditional methods and the AI report was outstanding.", name: "Paul H.", title: "Product Marketing Manager", company: "**aver Marketing Team" },
  { quote: "I was skeptical that AI could conduct real interviews, but when I read the transcripts, users were opening up naturally. Without a human interviewer watching them, the answers were far more candid.", name: "Christine Y.", title: "UX Researcher", company: "**aver UX Research Lab", photo: "/profiles/female-2.png" },
  { quote: "Participating as a panelist was incredibly easy and the reward arrived immediately. A voice interview felt much more natural than filling out a survey form.", name: "Sarah L.", title: "Freelance Panelist", company: "Individual Participant" },
  { quote: "Before our global expansion, we needed to interview target users domestically. After setting our demographic filters, the right panelists were assembled quickly and we had the report within three business days.", name: "Justin C.", title: "Head of Business Development", company: "**s New Business Team" },
  { quote: "Usability tests we used to run quarterly are now a monthly practice. Lower cost and time barriers mean we actually use research data in decision-making far more often.", name: "Hannah S.", title: "Service Planner", company: "**Motors Connected Car Team", photo: "/profiles/female-3.png" },
  { quote: "Costs dropped 80% compared to an external research agency, and results came in twice as fast. Automatic theme clustering and sentiment analysis eliminated almost all manual analysis time.", name: "Owen M.", title: "Marketing Director", company: "**ang Growth Marketing Division" },
];

const VOC_LIST_KO = [
  { quote: "솔직히 처음엔 반신반의했어요. AI가 인터뷰를 제대로 할 수 있을까 싶었는데, 결과물 보고 생각이 완전히 바뀌었어요. 인터뷰어 없으니까 오히려 응답이 더 솔직하더라고요.", name: "김민준", title: "마케팅팀장", company: "**전자 MX사업부", photo: "/profiles/male-1.png" },
  { quote: "분기에 한 번 하던 사용성 테스트를 이제 매달 해요. 예전엔 섭외부터 진행까지 3주 걸렸는데, 지금은 필터 설정하고 이틀이면 리포트가 나와요.", name: "박지은", title: "UX 리서처", company: "**카카오 서비스디자인팀", photo: "/profiles/female-1.png" },
  { quote: "출시 2주 전에 급하게 유저 의견이 필요했는데, 72시간 만에 200명 분석 리포트를 받았어요. 타이밍이 딱 맞아서 런칭 결정에 바로 반영했습니다.", name: "이승우", title: "프로덕트 매니저", company: "**라인 신규사업팀" },
  { quote: "외부 대행사 맡기면 견적부터 두 달이에요. 보이스서베이는 당일 세팅하고 다음날 결과 보고 있었어요. 비용도 10분의 1도 안 됐고요.", name: "최유나", title: "브랜드 전략 매니저", company: "LG** 뷰티 마케팅팀", photo: "/profiles/female-2.png" },
  { quote: "설문은 답하다가 지쳐서 대충 클릭하게 되는데, 음성 인터뷰는 그냥 대화하는 느낌이라 훨씬 편했어요. 포인트도 바로 적립되고요.", name: "정다현", title: "프리랜서 인터뷰 패널", company: "개인 참여자", photo: "/profiles/female-3.png" },
  { quote: "글로벌 진출 전에 국내 타깃 인터뷰가 필요했어요. 조건 필터 설정하니까 원하는 페르소나가 빠르게 모였고, 3영업일 만에 인사이트 정리된 리포트 받았습니다.", name: "강현석", title: "사업개발 총괄", company: "**s 신사업팀" },
  { quote: "대행사 비용의 20%로 더 큰 표본을 뽑을 수 있다는 게 아직도 신기해요. 주제별로 자동 클러스터링이 돼서 나오니까 분석 시간도 확 줄었어요.", name: "오수빈", title: "서비스 기획자", company: "**모터스 디지털서비스팀", photo: "/profiles/female-4.png" },
  { quote: "처음엔 정성조사를 AI가 할 수 있다는 게 믿기지 않았는데, 실제로 써보니 응답 깊이가 생각보다 훨씬 깊었어요. 팀에서 지금 정기적으로 활용하고 있어요.", name: "한지원", title: "마케팅 디렉터", company: "**앙 그로스마케팅팀" },
  { quote: "동시에 500명 인터뷰가 가능하다는 건 기존 방식으론 상상도 못 했어요. 비용 대비 퀄리티가 너무 좋아서 이제 리서치 안 하는 게 더 이상하게 느껴져요.", name: "임채원", title: "제품 마케팅 매니저", company: "**에이버 마케팅실" },
];

export function VoCCarousel({ lang = "en" }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const isMobile = useIsMobile();
  const list = lang === "ko" ? VOC_LIST_KO : VOC_LIST;
  const total = list.length;
  const trackRef = useRef(null);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % total), 4200);
    return () => clearInterval(t);
  }, [total, paused]);

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${idx * 100}%)`;
    }
  }, [idx]);

  return (
    <section style={{ background: "#ffffff", padding: "72px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.purple, marginBottom: 10 }}>{lang === "ko" ? "고객 리뷰" : "Customer Reviews"}</div>
          <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", lineHeight: 1.14, textAlign: "center", margin: "0", fontFamily: F }}>{lang === "ko" ? "사용자들의 이야기" : "What our users are saying"}</h2>
        </div>
        <div style={{ overflow: "hidden" }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div ref={trackRef} style={{ display: "flex", transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)" }}>
            {list.map((v, i) => (
              <div key={i} style={{ minWidth: "100%", padding: "0 4px", boxSizing: "border-box", display: "flex" }}>
                <div style={{ flex: 1, background: C.white, borderRadius: 16, padding: isMobile ? "24px 20px" : "36px 40px", border: `1px solid ${C.border}`, minHeight: 260, display: "flex", flexDirection: "column" }}>
                  <p style={{ margin: "0 0 24px", fontSize: isMobile ? 14 : 17, fontWeight: 400, color: C.navy, lineHeight: 1.7, letterSpacing: "0.16px", flex: 1 }}>"{v.quote}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                    {v.photo
                      ? <img src={v.photo} alt={v.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={e => { e.currentTarget.style.display = "none"; }} />
                      : <div style={{ width: 48, height: 48, borderRadius: "50%", background: `rgba(83,58,253,0.1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: C.purple, fontWeight: 700, flexShrink: 0 }}>{v.name[0]}</div>
                    }
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, letterSpacing: "0.16px" }}>{v.name}</div>
                      <div style={{ fontSize: 13, color: "rgba(10,11,13,0.56)", marginTop: 2, letterSpacing: "0.16px" }}>{v.title} · {v.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginTop: 24 }}>
          {list.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} aria-label={`Go to review ${i + 1}`}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ display: "block", width: i === idx ? 18 : 6, height: 6, borderRadius: 3, background: i === idx ? C.purple : "rgba(23,23,23,0.3)", transition: "all 0.3s", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const HOW_IT_WORKS_ICONS = {
  pencil: Ic.Pencil, users: Ic.Users, sparkle: Ic.Sparkle, barchart: Ic.BarChart,
  search: Ic.Search, check: Ic.Check, mic: Ic.Mic, gift: Ic.Gift,
};

function HowItWorksCard({ s, isMobile, cardW }) {
  return (
    <div style={{
      background: C.white, borderRadius: 14, padding: "24px 20px",
      flex: isMobile ? `0 0 ${cardW}px` : "1 1 0",
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(83,58,253,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {HOW_IT_WORKS_ICONS[s.icon]?.({ s: 18, c: C.purple })}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.purple, letterSpacing: "0.5px" }}>{s.step}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 8, letterSpacing: "0.16px", lineHeight: 1.47 }}>{s.title}</div>
      <div style={{ fontSize: 13, color: "rgba(10,11,13,0.56)", lineHeight: 1.65, letterSpacing: "0.16px" }}>{s.desc}</div>
    </div>
  );
}

function HowItWorksRow({ steps, title, sub, scrollRef, isMobile }) {
  const ownRef = useRef(null);
  const ref = scrollRef ?? ownRef;
  const cardW = Math.min(window.innerWidth - 56, 280);
  return (
    <div style={{ marginBottom: isMobile ? 32 : 48 }}>
      <div style={{ marginBottom: isMobile ? 16 : 20 }}>
        <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 600, color: C.navy, letterSpacing: "0.16px", marginBottom: 4, lineHeight: 1.47 }}>{title}</div>
        <div style={{ fontSize: 13, color: "rgba(10,11,13,0.48)", letterSpacing: "0.16px" }}>{sub}</div>
      </div>
      {isMobile ? (
        <div style={{ position: "relative" }}>
          <div ref={ref} style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
            {steps.map((s, i) => <HowItWorksCard key={i} s={s} isMobile={isMobile} cardW={cardW} />)}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "stretch", flex: "1 1 0", minWidth: 0 }}>
              <HowItWorksCard s={s} isMobile={isMobile} cardW={cardW} />
              {i < steps.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", padding: "0 4px", flexShrink: 0, color: "rgba(10,11,13,0.2)", fontSize: 16 }}>›</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HowItWorksCarousel({ lang = "en" }) {
  const isMobile = useIsMobile();
  const isKo = lang === "ko";
  const researcherSteps = isKo ? [
    { icon: "pencil", step: "01", title: "질문 설계", desc: "인터뷰 목표와 질문 흐름을 설정하세요. AI가 자연스러운 대화 구조를 제안해드려요." },
    { icon: "users", step: "02", title: "패널 모집", desc: "공고를 올려 적합한 패널을 모집하고, AI 매칭으로 최적의 참여자를 선발하세요." },
    { icon: "sparkle", step: "03", title: "AI 인터뷰 진행", desc: "AI가 24시간 음성 인터뷰를 진행해요. 연구자가 개입하지 않아도 응답이 자동으로 모여요." },
    { icon: "barchart", step: "04", title: "리포트 수령", desc: "주제 분석, 감성 분류, 인사이트 요약이 담긴 즉각적인 리포트를 받아보세요." },
  ] : [
    { icon: "pencil", step: "01", title: "Design Questions", desc: "Set your interview goals and question flow. AI suggests a natural conversation structure." },
    { icon: "users", step: "02", title: "Recruit Panelists", desc: "Post a listing to recruit matching panelists and use AI matching to select the best fit." },
    { icon: "sparkle", step: "03", title: "AI Conducts Interviews", desc: "AI runs voice interviews 24/7. Responses are collected automatically — no researcher involvement needed." },
    { icon: "barchart", step: "04", title: "Receive Your Report", desc: "Get an instant report with theme analysis, sentiment classification, and insight summaries." },
  ];
  const panelSteps = isKo ? [
    { icon: "search", step: "01", title: "공고 탐색", desc: "인터뷰 패널 보드에서 관심 있는 인터뷰 기회를 찾아보세요." },
    { icon: "check", step: "02", title: "지원 및 선발", desc: "조건을 확인하고 지원하세요. AI가 얼마나 잘 맞는지 평가해서 빠르게 선발해요." },
    { icon: "mic", step: "03", title: "음성 인터뷰 참여", desc: "링크로 AI와 자연스럽게 대화하세요. 어디서든 참여할 수 있고, 평균 8분이면 끝나요." },
    { icon: "gift", step: "04", title: "보상 수령", desc: "인터뷰 완료 후 포인트 보상이 즉시 지급돼요." },
  ] : [
    { icon: "search", step: "01", title: "Browse Listings", desc: "Find interview opportunities that interest you on the panelist board." },
    { icon: "check", step: "02", title: "Apply & Get Selected", desc: "Review the criteria and apply. AI evaluates your fit and selects participants quickly." },
    { icon: "mic", step: "03", title: "Take the Voice Interview", desc: "Have a natural conversation with AI via a link. Any location, ~8 minutes on average." },
    { icon: "gift", step: "04", title: "Receive Your Reward", desc: "Your point reward is issued instantly after completing the interview." },
  ];

  const rRef = useRef(null);
  const pRef = useRef(null);

  return (
    <section style={{ background: "#ffffff", padding: isMobile ? "60px 20px" : "80px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 56 }}>
          <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", margin: "0 0 14px", lineHeight: 1.10, fontFamily: F }}>
            {isKo
              ? (isMobile ? <>고객의 목소리를<br /><span style={{ color: C.purple }}>정확하고 빠르게</span></> : <>고객의 목소리를<br /><span style={{ color: C.purple }}>정확하고 빠르게 들으세요</span></>)
              : (isMobile ? <>Hear your customers <span style={{ color: C.purple }}>accurately and fast</span></> : <>Hear your customers<br /><span style={{ color: C.purple }}>accurately and fast</span></>)}
          </h2>
          <p style={{ fontSize: 16, color: "rgba(10,11,13,0.56)", margin: 0, letterSpacing: "0.16px", lineHeight: 1.47 }}>
            {isKo ? "처음부터 끝까지 모든 것을 처리하는 인터뷰 플랫폼" : "The interview platform that handles everything from start to finish"}
          </p>
        </div>
        <HowItWorksRow steps={researcherSteps} title={isKo ? "인터뷰를 설계하고 진행하고 싶으신가요?" : "Want to design and run interviews?"} sub={isKo ? "질문만 작성하면 — AI가 수천 명과 대화하고 리포트를 전달합니다" : "Just write your questions — AI talks to thousands and delivers the report"} scrollRef={rRef} isMobile={isMobile} />
        <HowItWorksRow steps={panelSteps} title={isKo ? "참여하고 보상을 받고 싶으신가요?" : "Want to participate and earn rewards?"} sub={isKo ? "짧은 음성 인터뷰에 참여하고 즉시 포인트를 받아보세요" : "Join a short voice interview and receive your points instantly"} scrollRef={pRef} isMobile={isMobile} />
      </div>
    </section>
  );
}

export function WaveAnimation({ active }) {
  const bars = [3, 5, 8, 6, 4, 9, 7, 5, 8, 4, 6, 9, 5, 7, 4];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 32 }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: 3, borderRadius: 2, background: active ? `rgba(168,199,250,0.8)` : "rgba(255,255,255,0.15)", height: active ? `${h * 3}px` : "4px", transition: `height ${0.3 + i * 0.03}s ease-in-out`, animation: active ? `wave-${i % 3} 0.${7 + i % 4}s ease-in-out infinite alternate` : "none" }} />
      ))}
    </div>
  );
}

export function MockAppScreen({ screenType }) {
  const screens = {
    splash: (
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#1a73e8,#174ea6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✦</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>AppName</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>v2.1.0</div>
      </div>
    ),
    signup: (
      <div style={{ width: "100%", height: "100%", background: "#fff", borderRadius: 16, padding: "20px 16px", boxSizing: "border-box" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f", marginBottom: 16 }}>Sign Up</div>
        {["Name", "Email", "Password"].map(f => (
          <div key={f} style={{ height: 32, borderRadius: 6, border: "1px solid #dadce0", marginBottom: 8, padding: "0 10px", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#aab" }}>{f}</span>
          </div>
        ))}
        <div style={{ height: 32, borderRadius: 6, background: "#1a73e8", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 12 }}>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>Create Account</span>
        </div>
      </div>
    ),
    home: (
      <div style={{ width: "100%", height: "100%", background: "#ffffff", borderRadius: 16, padding: "14px 12px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1d1d1f" }}>Home</span>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.1)" }} />
        </div>
        {[0.7, 0.5, 0.85].map((w, i) => (
          <div key={i} style={{ height: 52, borderRadius: 8, background: "#fff", border: "1px solid #dadce0", marginBottom: 8, padding: "8px 10px" }}>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.1)", width: `${w * 100}%`, marginBottom: 5 }} />
            <div style={{ height: 6, borderRadius: 4, background: "#e8eaed", width: "50%" }} />
          </div>
        ))}
      </div>
    ),
    dashboard: (
      <div style={{ width: "100%", height: "100%", background: "#ffffff", borderRadius: 16, padding: "14px 12px", boxSizing: "border-box" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1d1d1f", marginBottom: 10 }}>Dashboard</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          {[["#1a73e8", "38%"], ["#1e8e3e", "New"], ["#ea2261", "↓12%"], ["#f59e0b", "94%"]].map(([c, v], i) => (
            <div key={i} style={{ height: 40, borderRadius: 6, background: "#fff", border: "1px solid #dadce0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 60, borderRadius: 8, background: "#fff", border: "1px solid #dadce0", padding: "8px 10px" }}>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: "100%" }}>
            {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 2, background: i === 5 ? "#1a73e8" : "rgba(0,0,0,0.1)", height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    ),
  };
  return screens[screenType] || screens.home;
}

export function PaymentModal({ plan, billing, onClose, onDone }) {
  const [method, setMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const price = plan.price[billing];

  const methods = [
    { id: "naverpay",  label: "Naver Pay",           color: "#03C75A", hint: "Redirecting to Naver app...",  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/></svg> },

    { id: "kakaopay",  label: "Kakao Pay",           color: "#FEE500", hint: "Redirecting to Kakao app...", icon: <span style={{ fontSize: 11, fontWeight: 800, color: "#191919" }}>kakao pay</span> },
    { id: "stripe",    label: "Credit / Debit Card (Stripe)", color: "#635bff", hint: null, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg> },
  ];

  const selectedMethod = methods.find(m => m.id === method);

  const confirm = () => {
    if (!method) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(32,33,36,0.6)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 8, padding: "32px", width: "100%", maxWidth: 440, boxShadow: S.elevated, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: C.body, lineHeight: 1 }}>✕</button>

        {done ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.successBg, border: `1px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Payment Complete!</div>
            <div style={{ fontSize: 14, color: C.body, marginBottom: 4 }}>{plan.name} Plan · {billing === "annual" ? "Annual billing" : "Monthly billing"}</div>
            <div style={{ fontSize: 13, color: C.body, marginBottom: 4 }}>${price.toLocaleString()} charged</div>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 24 }}>A receipt has been sent to your email</div>
            <Btn full onClick={() => { onClose(); onDone(); }}>Go to Dashboard</Btn>
          </div>
        ) : (
          <>
            <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleLight}`, borderRadius: 8, padding: "14px 16px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{plan.name} Plan · {billing === "annual" ? "Annual billing" : "Monthly billing"}</div>
                  <div style={{ fontSize: 12, color: C.body, marginTop: 3 }}>{plan.interviews ? `${plan.interviews.toLocaleString()} slots/mo` : "Unlimited interviews"} · {plan.report} report</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.purple, fontFeatureSettings: '"tnum"' }}>₩{price.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: C.label, marginBottom: 12 }}>Select Payment Method</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {methods.map(m => (
                <div key={m.id} onClick={() => setMethod(m.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 8, border: `2px solid ${method === m.id ? m.color : C.border}`, cursor: "pointer", background: method === m.id ? `${m.color}08` : C.white, transition: "all 0.15s" }}>
                  <div style={{ width: 40, height: 26, borderRadius: 6, background: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {m.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, color: C.navy, fontWeight: method === m.id ? 500 : 400 }}>{m.label}</span>
                    <div style={{ fontSize: 10, color: C.body, marginTop: 1 }}>Test mode — no real charge</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === m.id ? m.color : C.border}`, background: method === m.id ? m.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {method === m.id && <span style={{ color: C.white, fontSize: 10 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>

            {method && selectedMethod && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: `${selectedMethod.color}10`, border: `1px solid ${selectedMethod.color}30`, fontSize: 13, color: C.navy }}>
                {selectedMethod.hint ? selectedMethod.hint : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 12, color: C.body, marginBottom: 2 }}>Enter card details (simulation)</div>
                    <input placeholder="Card number 0000 0000 0000 0000" readOnly style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.navy, background: C.white, width: "100%", boxSizing: "border-box", cursor: "default" }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <input placeholder="MM / YY" readOnly style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.navy, background: C.white, flex: 1, cursor: "default" }} />
                      <input placeholder="CVC" readOnly style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.navy, background: C.white, flex: 1, cursor: "default" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginBottom: 8, padding: "6px 12px", background: "rgba(251,191,36,0.08)", borderRadius: 6, border: "1px solid rgba(251,191,36,0.2)" }}>
              ⚠️ Test mode — no real charges will be made.
            </div>

            <Btn full size="lg" disabled={!method || processing} onClick={confirm}>
              {processing ? "Processing..." : `Pay $${price.toLocaleString()}`}
            </Btn>
            <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 10 }}>
              SSL encrypted · Cancel anytime
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Footer — shared across all pages ───
export function Footer({ go, lang = "en", onLangChange, tagline }) {
  const isMobile = useIsMobile();
  const displayTagline = tagline || (lang === "ko" ? "AI가 인터뷰하고, AI가 분석해요." : "AI interviews. AI analyzes.");
  const navLinks = lang === "ko"
    ? [["소개", "about"], ["요금제", "pricing"], ["패널 보드", "panel_board"], ["지원", "support"], ["개인정보처리방침", "privacy"], ["이용약관", "terms"]]
    : [["About", "about"], ["Pricing", "pricing"], ["Panelist Board", "panel_board"], ["Support", "support"], ["Privacy Policy", "privacy"], ["Terms of Service", "terms"]];
  return (
    <footer style={{ background: "#060f1f", padding: isMobile ? "40px 20px" : "48px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", fontFamily: F }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: 28, marginBottom: 28 }}>
          <div>
            <LogoMark dark />
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8, letterSpacing: "0.16px", lineHeight: 1.5 }}>{displayTagline}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? "12px 24px" : "8px 28px" }}>
            {navLinks.map(([l, target]) => (
              <button key={target} onClick={() => go(target)}
                style={{ fontSize: 14, color: "rgba(255,255,255,0.48)", background: "none", border: "none", cursor: "pointer", padding: "10px 0", minHeight: 44, fontFamily: F, letterSpacing: "0.16px", display: "inline-flex", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.88)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.48)"}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.16px" }}>Copyright © {new Date().getFullYear()} Voice Survey Inc. All rights reserved.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "2px", flexShrink: 0 }}>
            {[["ENG", "en"], ["한국어", "ko"]].map(([label, code]) => {
              const isActive = lang === code;
              return onLangChange
                ? <button key={code} onClick={() => onLangChange(code)} style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", borderRadius: 6, padding: "4px 10px", minHeight: 44, minWidth: 44, letterSpacing: "0.02em", border: "none", cursor: "pointer", fontFamily: F, transition: "color 0.15s", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{label}</button>
                : <span key={code} style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", borderRadius: 6, padding: "4px 10px", letterSpacing: "0.02em" }}>{label}</span>;
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── VoicePlayer — shared audio player (used in ResponsesScreen and ReportScreen) ───
export function VoicePlayer({ audioUrl, transcript, dark = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const fmt = s => {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().catch(() => {}); setPlaying(true); }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "voice-clip.webm";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const pct = duration ? Math.min((current / duration) * 100, 100) : 0;

  const bg = dark ? "rgba(255,255,255,0.05)" : C.bg;
  const border = dark ? "rgba(255,255,255,0.08)" : C.border;
  const textMuted = dark ? "rgba(255,255,255,0.35)" : C.body;
  const textMain = dark ? "#e2e8f0" : C.navy;

  if (!audioUrl && !transcript) return <div style={{ fontSize: 13, color: textMuted, fontStyle: "italic" }}>No recording</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {audioUrl && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={e => setCurrent(e.target.currentTime)}
            onLoadedMetadata={e => setDuration(e.target.duration)}
            onEnded={() => { setPlaying(false); setCurrent(0); }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: bg, borderRadius: 10, border: `1px solid ${border}` }}>
            <button
              onClick={toggle}
              style={{ width: 36, height: 36, borderRadius: "50%", background: C.purple, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.12s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#4434d4"}
              onMouseLeave={e => e.currentTarget.style.background = C.purple}
            >
              {playing
                ? <svg width={13} height={13} viewBox="0 0 13 13" fill="white"><rect x="1.5" y="1" width="3.5" height="11" rx="1"/><rect x="8" y="1" width="3.5" height="11" rx="1"/></svg>
                : <svg width={13} height={13} viewBox="0 0 13 13" fill="white"><path d="M2.5 1.5l9 5-9 5z"/></svg>
              }
            </button>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
              <div
                onClick={seek}
                style={{ height: 4, background: border, borderRadius: 2, cursor: "pointer", position: "relative" }}
              >
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: C.purple, borderRadius: 2, transition: "width 0.1s linear" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: textMuted, fontFeatureSettings: '"tnum"' }}>{fmt(current)}</span>
                <span style={{ fontSize: 10, color: textMuted, fontFeatureSettings: '"tnum"' }}>{fmt(duration)}</span>
              </div>
            </div>
          </div>
          {audioUrl && (
            <button
              onClick={download}
              title="Download"
              style={{ width: 30, height: 30, borderRadius: "50%", background: "transparent", border: `1px solid ${border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: textMuted, transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.color = C.purple; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
            >
              <svg width={12} height={12} viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v8.5l3-3 1 1-4 4-4-4 1-1 3 3V1h1zM2 13h12v1H2z"/></svg>
            </button>
          )}
        </>
      )}
      {transcript && (
        <div style={{ padding: "10px 14px", background: bg, borderRadius: 8, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 10, color: textMuted, fontWeight: 600, marginBottom: 6, letterSpacing: 0.4 }}>Transcript</div>
          <div style={{ fontSize: 13, color: textMain, lineHeight: 1.75 }}>{transcript}</div>
        </div>
      )}
    </div>
  );
}

// ─── ProgressSteps ─────────────────────────────────────────────────────────
// Shows numbered step progress with a thin bar. Props: current (1-based), total, color.
export function ProgressSteps({ current, total, color = C.purple }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} style={{
              width: 24, height: 24, borderRadius: "50%",
              background: i < current ? color : "transparent",
              border: `1.5px solid ${i < current ? color : C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, fontFamily: F,
              color: i < current ? "#fff" : C.body,
              transition: "all 0.2s",
            }}>
              {i < current - 1 ? "✓" : i + 1}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: C.body, fontFamily: F, fontFeatureSettings: '"tnum"' }}>
          {current} / {total}
        </span>
      </div>
      <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────
// Centered placeholder with icon, title, description, optional CTA.
export function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center", gap: 12 }}>
      {icon && (
        <div style={{ width: 56, height: 56, borderRadius: 16, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, fontSize: 26 }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: 17, fontWeight: 600, color: C.navy, fontFamily: F, letterSpacing: "0.16px" }}>{title}</div>
      {description && (
        <div style={{ fontSize: 14, color: C.body, fontFamily: F, letterSpacing: "0.16px", lineHeight: 1.6, maxWidth: 320 }}>{description}</div>
      )}
      {action && onAction && (
        <button onClick={onAction} style={{ marginTop: 8, padding: "9px 20px", borderRadius: 9999, border: "none", background: C.purple, color: "#fff", fontSize: 14, fontWeight: 500, fontFamily: F, cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = C.purpleHover}
          onMouseLeave={e => e.currentTarget.style.background = C.purple}>
          {action}
        </button>
      )}
    </div>
  );
}

// ─── Tooltip ────────────────────────────────────────────────────────────────
// Simple hover tooltip. Props: text, children, position ("top"|"bottom").
export function Tooltip({ text, children, position = "top" }) {
  const [visible, setVisible] = useState(false);
  const isTop = position !== "bottom";
  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div style={{
          position: "absolute",
          [isTop ? "bottom" : "top"]: "calc(100% + 6px)",
          left: "50%", transform: "translateX(-50%)",
          background: C.navy, color: "#fff",
          fontSize: 12, fontFamily: F, fontWeight: 400,
          padding: "5px 10px", borderRadius: 6,
          whiteSpace: "nowrap", pointerEvents: "none",
          boxShadow: S.float, zIndex: 9000,
          letterSpacing: "0.16px",
        }}>
          {text}
          <div style={{
            position: "absolute",
            [isTop ? "top" : "bottom"]: "100%",
            left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            [isTop ? "borderBottom" : "borderTop"]: `5px solid ${C.navy}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ─── FadeIn ──────────────────────────────────────────────────────────────────
// Wraps children in a subtle fade + slide-up animation on mount.
// Props: delay (ms, default 0), children.
export function FadeIn({ delay = 0, children }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      animation: visible ? `fadein-up 0.35s ease forwards` : "none",
      animationDelay: "0ms",
    }}>
      {children}
    </div>
  );
}
