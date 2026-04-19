import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function RoleSelectScreen({ go, user }) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);

  const handleSelect = async (role) => {
    setLoading(true);
    await supabase.auth.updateUser({ data: { role } });
    setLoading(false);
    if (role === "researcher") go("dashboard");
    else go("panel_entry");
  };

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24 }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
          <span style={{ color: C.purple }}>Vo</span>ica
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
          {name ? `How will you be using voicesurvey, ${name}?` : "How will you be using voicesurvey?"}
        </div>
        <div style={{ fontSize: 14, color: C.body }}>Choose your role to get started</div>
      </div>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, width: "100%", maxWidth: isMobile ? 400 : 560 }}>
        {/* Researcher */}
        <button
          onClick={() => !loading && handleSelect("researcher")}
          disabled={loading}
          style={{ flex: 1, minWidth: isMobile ? "auto" : 220, maxWidth: isMobile ? "100%" : 260, background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: isMobile ? "24px 20px" : "36px 28px", cursor: "pointer", textAlign: "left", transition: "all 0.18s", fontFamily: F }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.boxShadow = "0 8px 32px rgba(83,58,253,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            {Ic.BarChart({ s: 24, c: C.purple })}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Researcher / Business</div>
          <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6, marginBottom: 20 }}>
            Design interviews and receive AI-generated reports from completed sessions.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["Design interview questions", "Generate shareable links", "Automatic AI reports"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.success, fontSize: 11 }}>✓</span>
                <span style={{ fontSize: 12, color: C.body }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, fontSize: 14, fontWeight: 600, color: C.purple }}>
            {loading ? "Loading..." : "Get started as a Researcher →"}
          </div>
        </button>

        {/* Panel */}
        <button
          onClick={() => !loading && handleSelect("panel")}
          disabled={loading}
          style={{ flex: 1, minWidth: isMobile ? "auto" : 220, maxWidth: isMobile ? "100%" : 260, background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: isMobile ? "24px 20px" : "36px 28px", cursor: "pointer", textAlign: "left", transition: "all 0.18s", fontFamily: F }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.success; e.currentTarget.style.boxShadow = "0 8px 32px rgba(21,190,83,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(21,190,83,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            {Ic.Mic({ s: 24, c: C.success })}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>voicesurvey Panelist</div>
          <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6, marginBottom: 20 }}>
            Participate in voice interviews and earn rewards. Just 8 minutes of your time.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["Join interviews & earn rewards", "Flexible time and location", "Great for side income"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.success, fontSize: 11 }}>✓</span>
                <span style={{ fontSize: 12, color: C.body }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, fontSize: 14, fontWeight: 600, color: C.success }}>
            {loading ? "Loading..." : "Join as a Panelist →"}
          </div>
        </button>
      </div>

      <div style={{ marginTop: 32, fontSize: 12, color: C.body }}>
        You can change your role later by contacting support
      </div>
    </div>
  );
}
