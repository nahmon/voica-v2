import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, S, F } from "../lib/constants.jsx";
import { Btn, Input, Divider, GlobalNav } from "../components/shared.jsx";

export default function AdvertiserLoginScreen({ go }) {
  const [role, setRole] = useState("researcher");
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [socialMsg, setSocialMsg] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) { setAuthError("비밀번호를 재설정할 이메일을 입력해 주세요"); return; }
    setAuthError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setLoading(false);
    if (error) { setAuthError(error.message); } else { setResetSent(true); }
  };

  const handleLogin = async () => {
    setAuthError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) {
      setAuthError(error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 맞지 않아요" : error.message);
    } else {
      const userRole = data.user?.user_metadata?.role;
      go(userRole === "panel" ? "panel_board" : "dashboard");
    }
  };

  const handleSignup = async () => {
    setAuthError("");
    if (pw.length < 8) { setAuthError("비밀번호는 8자 이상이에요"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: { data: { name, company, role } }
    });
    setLoading(false);
    if (error) {
      setAuthError(error.message);
    } else {
      go(role === "panel" ? "panel_entry" : "dashboard");
    }
  };

  const handleSocialLogin = async (provider) => {
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    });
    if (error) setAuthError(error.message);
  };

  const toggleMulti = (val, arr, setArr) =>
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const PillGroup = ({ label, options, value, onChange, multi = false }) => (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.label, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map(opt => {
          const active = multi ? value.includes(opt) : value === opt;
          return (
            <button key={opt} onClick={() => multi ? toggleMulti(opt, value, onChange) : onChange(opt)}
              style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? C.purple : C.border}`, background: active ? C.purpleBg : C.white, color: active ? C.purple : C.body, fontSize: 12, fontFamily: F, cursor: "pointer", transition: "all 0.15s", fontWeight: active ? 500 : 400 }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  const handleNaverLogin = () => {
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    if (!clientId) {
      setSocialMsg("네이버 로그인 설정이 필요해요. VITE_NAVER_CLIENT_ID 환경변수를 설정해 주세요");
      return;
    }
    const state = crypto.randomUUID();
    sessionStorage.setItem("naver_oauth_state", state);
    const redirectUri = encodeURIComponent(window.location.origin + "/auth/naver/callback");
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  };

  const handleTossLogin = () => {
    setSocialMsg("토스 로그인은 준비 중이에요");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      <GlobalNav go={go} variant="sub" />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: tab === "signup" ? "32px 24px 48px" : "60px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: C.navy, letterSpacing: "0.196px", lineHeight: 1.14, marginBottom: 6, fontFamily: F }}>
              {tab === "login" ? "로그인" : "회원가입"}
            </div>
            <div style={{ fontSize: 14, color: C.body }}>{tab === "login" ? "이메일로 로그인해요" : "Voice Survey에 가입해요"}</div>
          </div>

          {tab === "signup" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {[["researcher", "리서처 / 기업", "인터뷰 설계 · 리포트"], ["panel", "패널 참여자", "인터뷰 참여 · 리워드"]].map(([v, label, desc]) => (
                <div key={v} onClick={() => setRole(v)}
                  style={{ flex: 1, padding: "14px 16px", borderRadius: 10, border: `2px solid ${role === v ? C.purple : C.border}`, background: role === v ? C.purpleBg : C.white, cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: role === v ? C.purple : C.navy, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 11, color: role === v ? C.purple : C.body, opacity: role === v ? 0.8 : 1 }}>{desc}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: C.white, borderRadius: 12, padding: "28px 28px", boxShadow: S.card }}>
            <div style={{ display: "flex", background: C.bg, borderRadius: 6, padding: 3, marginBottom: 24 }}>
              {["login", "signup"].map(t => (
                <button key={t} onClick={() => { setTab(t); setResetMode(false); setAuthError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 13, fontFamily: F, fontWeight: 400, transition: "all 0.15s", background: tab === t ? C.white : "transparent", color: tab === t ? C.navy : C.body, boxShadow: tab === t ? S.ambient : "none" }}>
                  {t === "login" ? "로그인" : "회원가입"}
                </button>
              ))}
            </div>

            {tab === "login" && !resetMode && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Input label="이메일" type="email" placeholder="hello@brand.com" value={email} onChange={e => setEmail(e.target.value)} />
                  <Input label="비밀번호" type="password" placeholder="8자 이상" value={pw} onChange={e => setPw(e.target.value)} />
                </div>
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <a href="#" onClick={e => { e.preventDefault(); setResetMode(true); setAuthError(""); setResetSent(false); }} style={{ fontSize: 12, color: C.purple, textDecoration: "none" }}>
                    비밀번호 찾기
                  </a>
                </div>
                {authError && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(217,48,37,0.08)", color: C.ruby, fontSize: 13 }}>{authError}</div>}
                <Btn full size="lg" style={{ marginTop: 20 }} disabled={loading || !email || !pw} onClick={handleLogin}>{loading ? "로그인 중..." : "로그인"}</Btn>
                <Divider label="간편 로그인" />
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 4 }}>
                  <Btn variant="white" full size="md" style={{ background: "#f5f5f7" }} onClick={() => handleSocialLogin("google")}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google로 계속하기
                  </Btn>
                  <Btn variant="white" full size="md" style={{ background: "#03C75A", color: "white" }} onClick={handleNaverLogin}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
                    </svg>
                    Naver로 계속하기
                  </Btn>
                  <Btn variant="white" full size="md" style={{ background: "#0064FF", color: "white" }} onClick={handleTossLogin}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>toss</span>
                    Toss로 계속하기
                  </Btn>
                  {socialMsg && <div style={{ marginTop: 8, fontSize: 12, color: C.body, textAlign: "center" }}>{socialMsg}</div>}
                </div>
              </>
            )}

            {tab === "login" && resetMode && (
              <>
                <div style={{ fontSize: 14, color: C.navy, marginBottom: 14 }}>비밀번호 재설정 링크를 이메일로 보내드려요.</div>
                <Input label="이메일" type="email" placeholder="가입한 이메일 주소" value={email} onChange={e => setEmail(e.target.value)} />
                {resetSent ? (
                  <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(30,142,62,0.08)", color: C.successText, fontSize: 13 }}>
                    재설정 링크를 보냈어요. 받은편지함을 확인해요.
                  </div>
                ) : (
                  <>
                    {authError && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: "rgba(217,48,37,0.08)", color: C.ruby, fontSize: 13 }}>{authError}</div>}
                    <Btn full size="lg" style={{ marginTop: 14 }} disabled={loading || !email} onClick={handleResetPassword}>
                      {loading ? "보내는 중..." : "재설정 링크 보내기"}
                    </Btn>
                  </>
                )}
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <a href="#" onClick={e => { e.preventDefault(); setResetMode(false); setAuthError(""); }} style={{ fontSize: 12, color: C.body, textDecoration: "none" }}>
                    ← 로그인으로 돌아가기
                  </a>
                </div>
              </>
            )}

            {tab === "signup" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  <Input label="이름" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} />
                  {role === "researcher" && <Input label="회사 / 브랜드명" placeholder="(주)브랜드랩" value={company} onChange={e => setCompany(e.target.value)} />}
                  <Input label="이메일" type="email" placeholder="hello@brand.com" value={email} onChange={e => setEmail(e.target.value)} />
                  <Input label="비밀번호" type="password" placeholder="8자 이상" value={pw} onChange={e => setPw(e.target.value)} helper="영문, 숫자, 특수문자 포함 8자 이상" />
                </div>

                {authError && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(217,48,37,0.08)", color: C.ruby, fontSize: 13 }}>{authError}</div>}
                <Btn full size="lg" disabled={loading || !email || !pw || !name} onClick={handleSignup}>{loading ? "가입 중..." : role === "panel" ? "패널로 가입하기" : "가입하고 시작하기"}</Btn>
                <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                  가입 시 <a href="#" onClick={e => { e.preventDefault(); go("terms"); }} style={{ color: C.purple }}>서비스 이용약관</a> 및 <a href="#" onClick={e => { e.preventDefault(); go("privacy"); }} style={{ color: C.purple }}>개인정보처리방침</a>에 동의하게 됩니다.
                </div>
                <Divider label="간편 가입" />
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 4 }}>
                  <Btn variant="white" full size="md" style={{ background: "#f5f5f7" }} onClick={() => handleSocialLogin("google")}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google로 계속하기
                  </Btn>
                  <Btn variant="white" full size="md" style={{ background: "#03C75A", color: "white" }} onClick={handleNaverLogin}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
                    </svg>
                    Naver로 계속하기
                  </Btn>
                  <Btn variant="white" full size="md" style={{ background: "#0064FF", color: "white" }} onClick={handleTossLogin}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>toss</span>
                    Toss로 계속하기
                  </Btn>
                  {socialMsg && <div style={{ marginTop: 8, fontSize: 12, color: C.body, textAlign: "center" }}>{socialMsg}</div>}
                </div>
              </>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.body }}>
            {tab === "login" ? (
              <>처음이에요? <span onClick={() => setTab("signup")} style={{ color: C.purple, cursor: "pointer" }}>회원가입</span></>
            ) : (
              <>이미 계정이 있어요? <span onClick={() => setTab("login")} style={{ color: C.purple, cursor: "pointer" }}>로그인</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
