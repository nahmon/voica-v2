import { useState, useEffect, useRef } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export function Badge({ children, variant = "neutral", style: sx = {} }) {
  const v = {
    neutral: { background: C.bg, color: C.navy, border: "none" },
    purple: { background: "rgba(0,113,227,0.08)", color: C.purple, border: "none" },
    ai: { background: "rgba(0,113,227,0.08)", color: C.purple, border: "none" },
    success: { background: "rgba(29,125,58,0.08)", color: C.successText, border: "none" },
    negative: { background: "rgba(217,48,37,0.08)", color: C.ruby, border: "none" },
    warning: { background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.56)", border: "none" },
    dark: { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", border: "none" },
  };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 5, fontSize: 12, fontWeight: 400, fontFamily: F, letterSpacing: "0.16px", whiteSpace: "nowrap", ...v[variant], ...sx }}>{children}</span>;
}

export function Btn({ children, variant = "primary", size = "md", onClick, disabled, full, style: sx = {} }) {
  const [hov, setHov] = useState(false);
  const sz = { sm: { padding: "5px 14px", fontSize: 13 }, md: { padding: "9px 20px", fontSize: 15 }, lg: { padding: "13px 32px", fontSize: 16 } };
  const vr = {
    primary: { background: disabled ? "#a09de8" : hov ? C.purpleHover : C.purple, color: C.white, border: "none" },
    ghost: { background: hov ? C.purpleBg : "transparent", color: C.purple, border: `1px solid ${C.purpleLight}` },
    dark: { background: hov ? "#2a2d6a" : C.brandDark, color: C.white, border: "none" },
    white: { background: hov ? "rgba(255,255,255,0.9)" : C.white, color: C.navy, border: "none" },
    kakao: { background: hov ? "#e6c200" : "#FEE500", color: "#191919", border: "none" },
    naver: { background: hov ? "#02b351" : "#03C75A", color: C.white, border: "none" },
    toss: { background: hov ? "#0057e0" : "#0064FF", color: C.white, border: "none" },
    naverpay: { background: hov ? "#02b351" : "#03C75A", color: C.white, border: "none" },
    tossspay: { background: hov ? "#0057e0" : "#0064FF", color: C.white, border: "none" },
    stripe: { background: hov ? "#5851d8" : "#635bff", color: C.white, border: "none" },
  };
  return (
    <button disabled={disabled} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 9999, cursor: disabled ? "not-allowed" : "pointer", fontFamily: F, fontFeatureSettings: '"ss01"', fontWeight: 500, transition: "all 0.18s", width: full ? "100%" : "auto", ...sz[size], ...vr[variant], ...sx }}>
      {children}
    </button>
  );
}

export function NavTab({ label, onClick, active }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: "relative", display: "flex", alignItems: "center", padding: "0 14px", fontSize: 14, fontFamily: F, fontWeight: 400, color: active ? C.purple : C.navy, background: "transparent", border: "none", cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap", letterSpacing: "0.16px", textDecoration: hov ? "underline" : "none" }}>
      {label}
    </button>
  );
}

export function Input({ label, type = "text", placeholder, value, onChange, helper }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 14, fontWeight: 400, color: C.navy, marginBottom: 6, fontFamily: F, letterSpacing: "0.16px" }}>{label}</label>}
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

export function BackBtn({ onClick, label = "홈으로", dark = false }) {
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
export function GlobalNav({ go, activeTab, variant = "public", logout, isMobile: isMobileProp, user }) {
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileHook;
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks =
    variant === "app"
      ? [["대시보드", "dashboard"], ["요금제", "pricing"], ["FAQ", "faq"], ["고객센터", "support"]]
      : variant === "panel"
      ? [["인터뷰 모집", "panel_board"], ["내 인터뷰", "panel_mypage"], ["FAQ", "faq"], ["고객센터", "support"]]
      : [["서비스 소개", "about"], ["패널 모집 보드", "panel_board"], ["요금제", "pricing"], ["FAQ", "faq"], ["고객센터", "support"]];

  const homeTarget = "landing";

  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.96)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: `1px solid ${C.border}`, padding: isMobile ? "0 20px" : "0 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "stretch", justifyContent: "space-between", height: 56, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => go(homeTarget)}>
            <span style={{ fontSize: 17, fontWeight: 600, color: C.navy, letterSpacing: "0.16px" }}><span style={{ color: C.purple }}>Vo</span>ica</span>
          </div>
          {!isMobile && (
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, transform: "translateX(-50%)", display: "flex", alignItems: "stretch" }}>
              {navLinks.map(([label, target]) => (
                <NavTab key={label} label={label} active={activeTab === target} onClick={() => go(target)} />
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {variant === "app" && !isMobile && (
              <>
                <Btn size="sm" onClick={() => go("editor")}>+ 인터뷰 시작하기</Btn>
                {logout && <Btn variant="ghost" size="sm" onClick={logout}>로그아웃</Btn>}
                <div style={{ width: 1, height: 16, background: C.border }} />
                {(() => {
                  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
                  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "U";
                  return avatarUrl
                    ? <img src={avatarUrl} alt="profile" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: `1px solid ${C.border}` }} />
                    : <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.purpleBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.purple }}>
                        {displayName[0].toUpperCase()}
                      </div>;
                })()}
                <div style={{ fontSize: 12, color: C.body, letterSpacing: "0.16px" }}>
                  {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || ""}
                </div>
              </>
            )}
            {variant === "panel" && !isMobile && (
              <>
                {logout && <Btn variant="ghost" size="sm" onClick={logout}>로그아웃</Btn>}
              </>
            )}
            {(variant === "public" || variant === "sub") && !isMobile && (
              <>
                <Btn variant="ghost" size="sm" style={{ border: "1px solid rgba(23,23,23,0.2)", borderRadius: 56 }} onClick={() => go("panel_entry")}>패널 등록하기</Btn>
                <Btn size="sm" onClick={() => go("advertiser_login")}>로그인</Btn>
              </>
            )}
            {isMobile && (
              <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: C.navy, fontSize: 20, lineHeight: 1 }}>☰</button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, backdropFilter: "blur(2px)" }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 280, background: C.white, zIndex: 201, boxShadow: S.card, display: "flex", flexDirection: "column", fontFamily: F }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, borderBottom: `1px solid rgba(0,0,0,0.08)` }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: C.navy, letterSpacing: "0.16px" }}><span style={{ color: C.purple }}>Vo</span>ica</span>
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.body, lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
              {variant === "app" ? (
                <>
                  <div style={{ padding: "8px 20px 4px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.8 }}>리서처</div>
                  {[
                    { label: "대시보드", target: "dashboard", desc: "진행 중인 인터뷰 관리" },
                    { label: "인터뷰 만들기", target: "editor", desc: "새 인터뷰 설계" },
                    { label: "요금제", target: "pricing", desc: "플랜별 기능 비교" },
                    { label: "FAQ", target: "faq", desc: "자주 묻는 질문" },
                    { label: "고객센터", target: "support", desc: "문의 및 도움말" },
                  ].map(item => (
                    <div key={item.label} onClick={() => { go(item.target); setMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer", background: "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div>
                        <div style={{ fontSize: 14, color: C.navy }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: C.body, marginTop: 1 }}>{item.desc}</div>
                      </div>
                      <span style={{ fontSize: 12, color: C.border }}>›</span>
                    </div>
                  ))}
                </>
              ) : variant === "panel" ? (
                <>
                  <div style={{ padding: "8px 20px 4px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.8 }}>패널</div>
                  {[
                    { label: "인터뷰 모집", target: "panel_board", desc: "모집 중인 공고 보기" },
                    { label: "내 인터뷰", target: "panel_mypage", desc: "신청·진행 현황" },
                    { label: "FAQ", target: "faq", desc: "자주 묻는 질문" },
                    { label: "고객센터", target: "support", desc: "문의 및 도움말" },
                  ].map(item => (
                    <div key={item.label} onClick={() => { go(item.target); setMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer", background: "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div>
                        <div style={{ fontSize: 14, color: C.navy }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: C.body, marginTop: 1 }}>{item.desc}</div>
                      </div>
                      <span style={{ fontSize: 12, color: C.border }}>›</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ padding: "8px 20px 4px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.8 }}>서비스</div>
                  {[
                    { label: "서비스 소개", target: "about", desc: "Voica가 하는 일" },
                    { label: "요금제", target: "pricing", desc: "플랜별 기능 비교" },
                    { label: "FAQ", target: "faq", desc: "자주 묻는 질문" },
                    { label: "고객센터", target: "support", desc: "문의 및 도움말" },
                  ].map(item => (
                    <div key={item.label} onClick={() => { go(item.target); setMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer", background: "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div>
                        <div style={{ fontSize: 14, color: C.navy }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: C.body, marginTop: 1 }}>{item.desc}</div>
                      </div>
                      <span style={{ fontSize: 12, color: C.border }}>›</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: C.border, margin: "8px 20px" }} />
                  <div style={{ padding: "8px 20px 4px", fontSize: 10, fontWeight: 600, color: C.body, letterSpacing: 0.8 }}>패널 참여</div>
                  {[
                    { label: "참여 가능한 인터뷰", target: "panel_board", desc: "모집 중인 공고 보기" },
                    { label: "패널 등록하기", target: "panel_entry", desc: "리워드 받고 인터뷰 참여" },
                  ].map(item => (
                    <div key={item.label} onClick={() => { go(item.target); setMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer", background: "transparent", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div>
                        <div style={{ fontSize: 14, color: C.navy }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: C.body, marginTop: 1 }}>{item.desc}</div>
                      </div>
                      <span style={{ fontSize: 12, color: C.border }}>›</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
              {(variant === "app" || variant === "panel") && logout ? (
                <Btn full size="md" variant="ghost" onClick={() => { logout(); setMenuOpen(false); }}>로그아웃</Btn>
              ) : (
                <>
                  <Btn full size="md" onClick={() => { go("advertiser_login"); setMenuOpen(false); }}>로그인 / 회원가입</Btn>
                  <Btn full variant="ghost" size="md" onClick={() => { go("panel_entry"); setMenuOpen(false); }}>패널로 참여하기</Btn>
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
  { quote: "평소 사용자 인터뷰 하나 진행하려면 섭외부터 일정 조율까지 최소 일주일이 걸렸는데, Voica로 하루 만에 100명 인터뷰 결과를 받았습니다. 리포트 퀄리티도 기대 이상이었어요.", name: "이강인", title: "과장", company: "**전자 MX사업부 마케팅팀", photo: "/profiles/male-1.png" },
  { quote: "기존엔 FGI 한 번 진행하면 진행비만 수백만 원이었어요. Voica는 비용도 10분의 1 수준이고, 결과물은 훨씬 빠르게 나오더라고요. 이제 정성 리서치 방식이 완전히 바뀔 것 같습니다.", name: "김지수", title: "브랜드 매니저", company: "LG**건강 브랜드전략팀", photo: "/profiles/female-1.png" },
  { quote: "신제품 론칭 전 2주 안에 소비자 반응을 확인해야 했는데, Voica 덕분에 3일 만에 200명 인터뷰 분석 결과를 받을 수 있었습니다. 의사결정 속도가 완전히 달라졌어요.", name: "박성현", title: "PM", company: "**카오 서비스기획팀" },
  { quote: "AI가 인터뷰를 직접 진행한다는 게 처음엔 반신반의했는데, 실제 녹취록을 보니 사용자가 자연스럽게 속마음을 털어놓더라고요. 면접관 눈치 없이 솔직한 답변이 많이 나왔습니다.", name: "최예린", title: "UX 리서처", company: "**이버 UX리서치실", photo: "/profiles/female-2.png" },
  { quote: "글로벌 시장 진출 전 국내 타깃 유저 인터뷰가 필요했어요. 지역·연령·직군 조건 설정하니까 딱 맞는 패널이 빠르게 모였고, 리포트까지 영업일 3일 안에 나왔습니다.", name: "정우진", title: "사업개발 팀장", company: "**스 신사업팀", photo: "/profiles/female-4.png" },
  { quote: "분기마다 진행하던 사용성 테스트를 이제 매달 할 수 있게 됐어요. 비용과 시간 장벽이 낮아지니 리서치를 훨씬 자주 의사결정에 활용하게 됐습니다.", name: "한소희", title: "서비스 기획자", company: "**자동차 Connected Car팀", photo: "/profiles/female-3.png" },
  { quote: "외부 리서치 에이전시 대비 비용은 80% 절감되고, 결과물은 2배 빠르게 나왔습니다. 특히 테마 분류와 감성 분석이 자동으로 되니 별도 분석 시간이 거의 필요 없었어요.", name: "오민준", title: "마케팅 이사", company: "**팡 그로스마케팅본부" },
];

export function VoCCarousel() {
  const [idx, setIdx] = useState(0);
  const total = VOC_LIST.length;
  const trackRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % total), 4200);
    return () => clearInterval(t);
  }, [total]);

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${idx * 100}%)`;
    }
  }, [idx]);

  return (
    <section style={{ background: C.bg, padding: "72px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ fontSize: 12, fontWeight: 400, color: C.body, letterSpacing: "0.16px", textAlign: "center", marginBottom: 8, textTransform: "uppercase" }}>REVIEWS</div>
        <h2 style={{ fontSize: 28, fontWeight: 400, color: C.navy, letterSpacing: "0.16px", lineHeight: 1.14, textAlign: "center", margin: "0 0 40px", fontFamily: F }}>직접 써본 분들의 이야기</h2>
        <div style={{ overflow: "hidden" }}>
          <div ref={trackRef} style={{ display: "flex", transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)" }}>
            {VOC_LIST.map((v, i) => (
              <div key={i} style={{ minWidth: "100%", padding: "0 4px", boxSizing: "border-box" }}>
                <div style={{ background: C.white, border: `1px solid rgba(23,23,23,0.15)`, borderRadius: 16, padding: "32px 40px" }}>
                  <div style={{ fontSize: 24, color: C.purple, marginBottom: 16, lineHeight: 1 }}>❝</div>
                  <p style={{ margin: "0 0 24px", fontSize: 17, fontWeight: 400, color: C.navy, lineHeight: 1.7, letterSpacing: "0.16px" }}>{v.quote}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {v.photo ? (
                      <img src={v.photo} alt={v.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.white, fontWeight: 600, flexShrink: 0 }}>
                        {v.name[0]}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, letterSpacing: "0.16px" }}>{v.name} {v.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(10,11,13,0.56)", marginTop: 2, letterSpacing: "0.16px" }}>{v.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24 }}>
          {VOC_LIST.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, border: "none", cursor: "pointer", background: i === idx ? "#533afd" : "rgba(23,23,23,0.3)", transition: "all 0.3s", padding: 0 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksCarousel() {
  const isMobile = useIsMobile();
  const researcherSteps = [
    { icon: "pencil", step: "01", title: "질문 설계", desc: "인터뷰 목적과 질문 흐름을 설정합니다. AI가 자연스러운 대화 구조를 제안해 줍니다." },
    { icon: "users", step: "02", title: "패널 모집", desc: "조건에 맞는 패널을 공고로 모집하고 AI 매칭으로 적합한 참여자를 선정합니다." },
    { icon: "sparkle", step: "03", title: "AI 인터뷰 자동 진행", desc: "AI가 24시간 보이스 인터뷰를 진행합니다. 리서처 개입 없이 자동 수집됩니다." },
    { icon: "barchart", step: "04", title: "리포트 수령", desc: "테마 분석 · 감성 분류 · 인사이트 요약이 담긴 리포트를 즉시 받아보세요." },
  ];
  const panelSteps = [
    { icon: "search", step: "01", title: "모집 공고 탐색", desc: "패널 모집 보드에서 관심 있는 인터뷰 기회를 찾아보세요." },
    { icon: "check", step: "02", title: "신청 & 선정", desc: "조건을 확인하고 신청합니다. AI가 적합성을 평가해 빠르게 선정합니다." },
    { icon: "mic", step: "03", title: "보이스 인터뷰 참여", desc: "링크를 통해 AI와 자연스럽게 대화합니다. 장소 무관, 평균 8분 소요." },
    { icon: "gift", step: "04", title: "리워드 수령", desc: "인터뷰 완료 후 포인트 리워드가 즉시 지급됩니다." },
  ];

  function Row({ steps, title, sub, scrollRef }) {
    const ref = scrollRef || useRef(null);
    const cardW = isMobile ? Math.min(window.innerWidth - 56, 280) : 240;
    const scroll = (dir) => { ref.current.scrollBy({ left: dir * (cardW + 14), behavior: "smooth" }); };
    return (
      <div style={{ marginBottom: isMobile ? 32 : 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 400, color: C.navy, letterSpacing: "0.16px", marginBottom: 3, lineHeight: 1.47 }}>{title}</div>
            <div style={{ fontSize: 14, color: "rgba(10,11,13,0.56)", letterSpacing: "0.16px" }}>{sub}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
            {["←", "→"].map((arrow, i) => (
              <button key={arrow} onClick={() => scroll(i === 0 ? -1 : 1)}
                style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontSize: 13, color: C.body, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.purple; e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = C.purple; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.body; e.currentTarget.style.borderColor = C.border; }}>
                {arrow}
              </button>
            ))}
          </div>
        </div>
        <div ref={ref} style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: `0 0 ${cardW}px`, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 18px", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = S.standard; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ display:"flex",alignItems:"center" }}>{({pencil:Ic.Pencil,users:Ic.Users,sparkle:Ic.Sparkle,barchart:Ic.BarChart,search:Ic.Search,check:Ic.Check,mic:Ic.Mic,gift:Ic.Gift})[s.icon]?.({s:22,c:C.purple})}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.purple, letterSpacing: "0.16px" }}>{s.step}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 8, letterSpacing: "0.16px", lineHeight: 1.47 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "rgba(10,11,13,0.56)", lineHeight: 1.6, letterSpacing: "0.16px" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rRef = useRef(null);
  const pRef = useRef(null);

  return (
    <section style={{ background: C.white, padding: isMobile ? "60px 20px" : "80px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 56 }}>
          <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", margin: "0 0 14px", lineHeight: 1.10, fontFamily: F }}>
            {isMobile ? "소비자의 목소리를 정확하고 빠르게" : <>소비자의 목소리를<br />정확하고 빠르게 들어보세요</>}
          </h2>
          <p style={{ fontSize: 16, color: "rgba(10,11,13,0.56)", margin: 0, letterSpacing: "0.16px", lineHeight: 1.47 }}>처음부터 끝까지 알아서 되는 인터뷰 플랫폼</p>
        </div>
        <Row steps={researcherSteps} title="인터뷰를 설계하고 싶다면" sub="질문만 만들면 AI가 수천 명과 대화하고 리포트를 드립니다" scrollRef={rRef} />
        <Row steps={panelSteps} title="인터뷰 참여하고 리워드 받고 싶다면" sub="짧은 보이스 인터뷰로 참여하고 즉시 포인트를 받으세요" scrollRef={pRef} />
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
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f", marginBottom: 16 }}>회원가입</div>
        {["이름", "이메일", "비밀번호"].map(f => (
          <div key={f} style={{ height: 32, borderRadius: 6, border: "1px solid #dadce0", marginBottom: 8, padding: "0 10px", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#aab" }}>{f}</span>
          </div>
        ))}
        <div style={{ height: 32, borderRadius: 6, background: "#1a73e8", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 12 }}>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>가입하기</span>
        </div>
      </div>
    ),
    home: (
      <div style={{ width: "100%", height: "100%", background: "#ffffff", borderRadius: 16, padding: "14px 12px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1d1d1f" }}>홈</span>
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
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1d1d1f", marginBottom: 10 }}>대시보드</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          {[["#1a73e8", "38%"], ["#1e8e3e", "신규"], ["#ea2261", "↓12%"], ["#f59e0b", "94%"]].map(([c, v], i) => (
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
    { id: "naverpay", label: "네이버페이", color: "#03C75A", icon: <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>N Pay</span> },
    { id: "tosspay",  label: "토스페이",   color: "#0064FF", icon: <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>toss</span> },
    { id: "stripe",   label: "신용/체크카드 (Stripe)", color: "#635bff", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg> },
  ];

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
            <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 8 }}>결제 완료!</div>
            <div style={{ fontSize: 14, color: C.body, marginBottom: 24 }}>{plan.name} 플랜이 시작되었습니다</div>
            <Btn full onClick={() => { onClose(); onDone(); }}>대시보드로 이동</Btn>
          </div>
        ) : (
          <>
            <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleLight}`, borderRadius: 8, padding: "14px 16px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{plan.name} 플랜 · {billing === "annual" ? "연 결제" : "월 결제"}</div>
                  <div style={{ fontSize: 12, color: C.body, marginTop: 3 }}>{plan.interviews ? `월 ${plan.interviews.toLocaleString()}건 슬롯` : "무제한 인터뷰"} · {plan.report} 리포트</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.purple, fontFeatureSettings: '"tnum"' }}>₩{price.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: C.label, marginBottom: 12 }}>결제 수단 선택</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {methods.map(m => (
                <div key={m.id} onClick={() => setMethod(m.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 8, border: `2px solid ${method === m.id ? m.color : C.border}`, cursor: "pointer", background: method === m.id ? `${m.color}08` : C.white, transition: "all 0.15s" }}>
                  <div style={{ width: 40, height: 26, borderRadius: 6, background: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {m.icon}
                  </div>
                  <span style={{ fontSize: 14, color: C.navy, fontWeight: method === m.id ? 500 : 400 }}>{m.label}</span>
                  <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === m.id ? m.color : C.border}`, background: method === m.id ? m.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {method === m.id && <span style={{ color: C.white, fontSize: 10 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <Btn full size="lg" disabled={!method || processing} onClick={confirm}>
              {processing ? "결제 처리 중..." : `₩${price.toLocaleString()} 결제하기`}
            </Btn>
            <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 10 }}>
              SSL 암호화 보안 결제 · 언제든 해지 가능
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Footer — 모든 페이지 하단 공통 ───
export function Footer({ go }) {
  const isMobile = useIsMobile();
  const links = [
    { label: "서비스 소개", screen: "about" },
    { label: "요금제", screen: "pricing" },
    { label: "FAQ", screen: "faq" },
    { label: "고객지원", screen: "support" },
    { label: "이용약관", screen: "terms" },
    { label: "개인정보처리방침", screen: "privacy" },
  ];
  return (
    <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: isMobile ? "28px 20px" : "32px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Voica</div>
          <div style={{ fontSize: 11, color: C.body, lineHeight: 1.7 }}>
            AI 보이스 인터뷰 플랫폼<br />
            사업자등록번호: [000-00-00000] · 대표: [대표자명]<br />
            이메일: voica.support@gmail.com
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? "8px 16px" : "8px 24px" }}>
          {links.map(l => (
            <button key={l.screen} onClick={() => go(l.screen)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.body, fontFamily: F, padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = C.navy}
              onMouseLeave={e => e.currentTarget.style.color = C.body}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "12px auto 0", fontSize: 11, color: C.body }}>
        © {new Date().getFullYear()} Voica Inc. All rights reserved.
      </div>
    </footer>
  );
}

// ─── VoicePlayer — 공유 오디오 플레이어 (ResponsesScreen, ReportScreen 공용) ───
export function VoicePlayer({ audioUrl, transcript }) {
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

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const pct = duration ? Math.min((current / duration) * 100, 100) : 0;

  if (!audioUrl) return <div style={{ fontSize: 13, color: C.body, fontStyle: "italic" }}>녹음 없음</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={e => setCurrent(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
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
            style={{ height: 4, background: C.border, borderRadius: 2, cursor: "pointer", position: "relative" }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: C.purple, borderRadius: 2, transition: "width 0.1s linear" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: C.body, fontFeatureSettings: '"tnum"' }}>{fmt(current)}</span>
            <span style={{ fontSize: 10, color: C.body, fontFeatureSettings: '"tnum"' }}>{fmt(duration)}</span>
          </div>
        </div>
      </div>
      {transcript && (
        <div style={{ padding: "10px 14px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.body, fontWeight: 600, marginBottom: 6, letterSpacing: 0.4 }}>전사 텍스트</div>
          <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.75 }}>{transcript}</div>
        </div>
      )}
    </div>
  );
}
