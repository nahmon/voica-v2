import { useState } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, Input, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function SupportScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const categories = ["General inquiry", "Billing / Refunds", "Panel rewards", "Account / Login", "Report a bug", "Partnership / Business", "Other"];

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
        <GlobalNav go={go} activeTab="support" variant={user ? "app" : "public"} user={user} logout={logout} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.successBg, border: `1px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              {Ic.Check({s:24,c:C.success})}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, letterSpacing: "0.16px", marginBottom: 10 }}>Message received!</div>
            <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 28 }}>
              We'll reply to your email within 1–2 business days.<br />
              For urgent matters, reach us directly at <span style={{ color: C.purple }}>voica.support@gmail.com</span>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn onClick={() => go(user ? "dashboard" : "landing")}>{user ? "Back to dashboard" : "Back to home"}</Btn>
              {!user && <Btn variant="ghost" onClick={() => go("panel_board")}>Browse interviews</Btn>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      <GlobalNav go={go} activeTab="support" variant={user ? "app" : "public"} user={user} logout={logout} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>Support</div>
            <div style={{ fontSize: 14, color: C.body }}>Send us a message and we'll get back to you by email within 1–2 business days.</div>
          </div>

          {/* FAQ quick link */}
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.navy, marginBottom: 2 }}>Frequently asked questions</div>
              <div style={{ fontSize: 12, color: C.body }}>Need a quick answer?</div>
            </div>
            <Btn size="sm" onClick={() => go("faq")}>View FAQ</Btn>
          </div>

          {/* Form */}
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: isMobile ? "20px 20px" : "28px 28px", boxShadow: S.ambient }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Category */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.label, marginBottom: 8 }}>Category <span style={{ color: C.ruby }}>*</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {categories.map(c => {
                    const active = category === c;
                    return (
                      <button key={c} onClick={() => setCategory(c)}
                        style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? C.purple : C.border}`, background: active ? C.purpleBg : C.white, color: active ? C.purple : C.body, fontSize: 12, fontFamily: F, cursor: "pointer", transition: "all 0.15s", fontWeight: active ? 500 : 400 }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email */}
              <Input label={<>Reply-to email <span style={{ color: C.ruby }}>*</span></>} type="email" placeholder="hello@example.com" value={email} onChange={e => setEmail(e.target.value)} />

              {/* Subject */}
              <Input label={<>Subject <span style={{ color: C.ruby }}>*</span></>} placeholder="Brief summary of your issue" value={subject} onChange={e => setSubject(e.target.value)} />

              {/* Message */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.label, display: "block", marginBottom: 6 }}>
                  Message <span style={{ color: C.ruby }}>*</span>
                </label>
                <textarea
                  placeholder="Please describe your issue in detail. Including screenshots or error messages helps us respond faster."
                  value={body} onChange={e => setBody(e.target.value)}
                  rows={7}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, transition: "border-color 0.15s" }}
                  onFocus={e => e.target.style.borderColor = C.purple}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                <div style={{ fontSize: 11, color: C.body, marginTop: 4, textAlign: "right" }}>{body.length} chars</div>
              </div>
            </div>

            <Btn full size="lg" style={{ marginTop: 24 }}
              disabled={!category || !email || !subject || !body}
              onClick={() => setSent(true)}>
              Send message
            </Btn>

            <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
              Or email us directly: <a href="mailto:voica.support@gmail.com" style={{ color: C.purple }}>voica.support@gmail.com</a>
            </div>
          </div>
        </div>
      </div>
      <Footer go={go} />
    </div>
  );
}
