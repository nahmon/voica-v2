import { useState } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { Badge, Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PricingScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [billing, setBilling] = useState("monthly");

  const proMonthly = 149;
  const proYearlyMonthly = Math.round(proMonthly * 0.8);
  const proYearlyTotal = proYearlyMonthly * 12;
  const proDisplayPrice = billing === "yearly"
    ? `$${proYearlyMonthly}/mo`
    : `$${proMonthly}/mo`;
  const proDisplaySub = billing === "yearly"
    ? `$${proYearlyTotal} billed annually · save 20%`
    : "Billed monthly · cancel anytime";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, fontFeatureSettings: '"ss01"' }}>
      <GlobalNav go={go} activeTab="pricing" variant={user ? "app" : "public"} user={user} logout={logout} />

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 24px 44px", background: C.white, borderBottom: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(83,58,253,0.07),transparent 70%)", filter: "blur(70px)", pointerEvents: "none" }} />
        <Badge variant="purple" style={{ marginBottom: 16 }}>Pricing</Badge>
        <h1 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 700, color: C.navy, margin: "0 0 12px", lineHeight: 1.08 }}>Simple pricing that scales with you</h1>
        <p style={{ fontSize: 15, color: C.body, margin: 0 }}>Choose the plan that fits your team</p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Billing toggle — Pro tier only */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3, gap: 2 }}>
            {[["monthly", "Monthly"], ["yearly", "Annually"]].map(([val, label]) => (
              <button key={val} onClick={() => setBilling(val)}
                style={{ padding: "6px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontFamily: F, fontWeight: billing === val ? 600 : 400, background: billing === val ? C.white : "transparent", color: billing === val ? C.navy : C.body, boxShadow: billing === val ? S.ambient : "none", transition: "all 0.15s" }}>
                {label}
                {val === "yearly" && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: C.success }}>20% off</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 2-tier grid */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 20, alignItems: "stretch", maxWidth: 780, margin: "0 auto" }}>

          {/* Tier 1 — Pro (highlighted) */}
          <div style={{ background: C.white, border: `2px solid ${C.purple}`, borderRadius: 20, padding: "32px 28px", boxShadow: S.elevated, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${C.purple},#f96bee)` }} />
            <div style={{ position: "absolute", top: 14, right: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: C.purpleBg, color: C.purple, padding: "3px 8px", borderRadius: 4 }}>Most popular</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 8, letterSpacing: 0.5 }}>Pro</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.navy, lineHeight: 1, marginBottom: 4 }}>{proDisplayPrice}</div>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 28 }}>{proDisplaySub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {[
                "500 responses/mo included (then $0.49 per response)",
                "AI deep analysis + theme drill-down",
                "Auto-extracted representative quotes",
                "Cross-tab analysis & segment comparison",
                "CSV / PDF export",
                "Up to 5 team members",
                "1 year data retention",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
            <Btn full onClick={() => go("advertiser_login")}>Start Pro →</Btn>
          </div>

          {/* Tier 2 — Enterprise */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px", boxShadow: S.standard, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.body, marginBottom: 8, letterSpacing: 0.5 }}>Enterprise</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, lineHeight: 1.2, marginBottom: 4 }}>Custom pricing</div>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 28 }}>Annual contract · volume discounts available</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {[
                "Unlimited interviews",
                "Dedicated CSM",
                "Custom reports",
                "99.9% SLA",
                "Auto-generated PPT slides",
                "Slack & Notion integration",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
            </div>
            <Btn full onClick={() => go("support")}>Contact sales →</Btn>
          </div>

        </div>
      </div>
      <Footer go={go} />
    </div>
  );
}
