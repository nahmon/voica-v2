import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, S, F } from "../lib/constants.jsx";
import { Btn, Input, Divider, GlobalNav } from "../components/shared.jsx";

export default function AdvertiserLoginScreen({ go }) {
  const [lang] = useState("ko");
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
    if (!email) { setAuthError("Please enter your email address to reset your password"); return; }
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
      setAuthError(error.message === "Invalid login credentials" ? "Incorrect email or password" : error.message);
    } else {
      const userRole = data.user?.user_metadata?.role;
      go(userRole === "panel" ? "panel_board" : "dashboard");
    }
  };

  const handleSignup = async () => {
    setAuthError("");
    if (pw.length < 8) { setAuthError("Password must be at least 8 characters"); return; }
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

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      <GlobalNav go={go} variant="sub" lang={lang} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: tab === "signup" ? "32px 24px 48px" : "60px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: C.navy, letterSpacing: "0.196px", lineHeight: 1.14, marginBottom: 6, fontFamily: F }}>
              {tab === "login" ? "Sign In" : "Sign Up"}
            </div>
            <div style={{ fontSize: 14, color: C.body }}>{tab === "login" ? "Sign in with your email" : "Create your Voice Survey account"}</div>
          </div>

          {tab === "signup" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {[["researcher", "Researcher / Business", "Design interviews · Reports"], ["panel", "Panelist", "Participate in interviews · Earn rewards"]].map(([v, label, desc]) => (
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
                  {t === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {tab === "login" && !resetMode && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Input label="Email" type="email" placeholder="hello@brand.com" value={email} onChange={e => setEmail(e.target.value)} />
                  <Input label="Password" type="password" placeholder="8+ characters" value={pw} onChange={e => setPw(e.target.value)} />
                </div>
                <div style={{ textAlign: "right", marginTop: 8 }}>
                  <a href="#" onClick={e => { e.preventDefault(); setResetMode(true); setAuthError(""); setResetSent(false); }} style={{ fontSize: 12, color: C.purple, textDecoration: "none" }}>
                    Forgot password?
                  </a>
                </div>
                {authError && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(217,48,37,0.08)", color: C.ruby, fontSize: 13 }}>{authError}</div>}
                <Btn full size="lg" style={{ marginTop: 20 }} disabled={loading || !email || !pw} onClick={handleLogin}>{loading ? "Signing in..." : "Sign In"}</Btn>
                <Divider label="Or continue with" />
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 4 }}>
                  <Btn variant="white" full size="md" style={{ background: "#f5f5f7" }} onClick={() => handleSocialLogin("google")}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </Btn>
                  {socialMsg && <div style={{ marginTop: 8, fontSize: 12, color: C.body, textAlign: "center" }}>{socialMsg}</div>}
                </div>
              </>
            )}

            {tab === "login" && resetMode && (
              <>
                <div style={{ fontSize: 14, color: C.navy, marginBottom: 14 }}>We'll send a password reset link to your email.</div>
                <Input label="Email" type="email" placeholder="Your registered email address" value={email} onChange={e => setEmail(e.target.value)} />
                {resetSent ? (
                  <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(30,142,62,0.08)", color: C.successText, fontSize: 13 }}>
                    Reset link sent. Please check your inbox.
                  </div>
                ) : (
                  <>
                    {authError && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: "rgba(217,48,37,0.08)", color: C.ruby, fontSize: 13 }}>{authError}</div>}
                    <Btn full size="lg" style={{ marginTop: 14 }} disabled={loading || !email} onClick={handleResetPassword}>
                      {loading ? "Sending..." : "Send Reset Link"}
                    </Btn>
                  </>
                )}
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <a href="#" onClick={e => { e.preventDefault(); setResetMode(false); setAuthError(""); }} style={{ fontSize: 12, color: C.body, textDecoration: "none" }}>
                    ← Back to Sign In
                  </a>
                </div>
              </>
            )}

            {tab === "signup" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  <Input label="Full Name" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} />
                  {role === "researcher" && <Input label="Company / Brand" placeholder="Acme Corp" value={company} onChange={e => setCompany(e.target.value)} />}
                  <Input label="Email" type="email" placeholder="hello@brand.com" value={email} onChange={e => setEmail(e.target.value)} />
                  <Input label="Password" type="password" placeholder="8+ characters" value={pw} onChange={e => setPw(e.target.value)} helper="At least 8 characters including letters, numbers, and symbols" />
                </div>

                {authError && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(217,48,37,0.08)", color: C.ruby, fontSize: 13 }}>{authError}</div>}
                <Btn full size="lg" disabled={loading || !email || !pw || !name} onClick={handleSignup}>{loading ? "Creating account..." : role === "panel" ? "Join as Panelist" : "Create Account"}</Btn>
                <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                  By signing up, you agree to our <a href="#" onClick={e => { e.preventDefault(); go("terms"); }} style={{ color: C.purple }}>Terms of Service</a> and <a href="#" onClick={e => { e.preventDefault(); go("privacy"); }} style={{ color: C.purple }}>Privacy Policy</a>.
                </div>
                <Divider label="Or sign up with" />
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 4 }}>
                  <Btn variant="white" full size="md" style={{ background: "#f5f5f7" }} onClick={() => handleSocialLogin("google")}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </Btn>
                  {socialMsg && <div style={{ marginTop: 8, fontSize: 12, color: C.body, textAlign: "center" }}>{socialMsg}</div>}
                </div>
              </>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.body }}>
            {tab === "login" ? (
              <>New here? <span onClick={() => setTab("signup")} style={{ color: C.purple, cursor: "pointer" }}>Sign Up</span></>
            ) : (
              <>Already have an account? <span onClick={() => setTab("login")} style={{ color: C.purple, cursor: "pointer" }}>Sign In</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
