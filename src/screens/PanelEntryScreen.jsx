import { useState } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { Btn, Input, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PanelEntryScreen({ go }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "", region: "", gender: "", age: "",
    job: "", income: "", interests: [],
  });
  const [agreed, setAgreed] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleInterest = (v) => setForm(f => ({
    ...f,
    interests: f.interests.includes(v) ? f.interests.filter(i => i !== v) : [...f.interests, v],
  }));

  const REGIONS = ["Seoul", "Gyeonggi/Incheon", "Busan/South Gyeongsang", "Daegu/North Gyeongsang", "Gwangju/Jeolla", "Daejeon/Chungcheong", "Gangwon", "Jeju", "Living Abroad"];
  const GENDERS = ["Male", "Female", "Prefer not to say"];
  const AGES = ["Teens", "20s", "30s", "40s", "50s", "60+"];
  const JOBS = ["Corporate (Large/Mid-size)", "Corporate (Small Business)", "Freelancer/Self-employed", "Professional (Doctor, Lawyer, Accountant, etc.)", "Government/Public Sector", "Student", "Homemaker", "Job Seeking", "Other"];
  const INCOMES = ["None", "Under $1,000/mo", "$1,000–$3,000/mo", "$3,000–$5,000/mo", "$5,000–$7,000/mo", "$7,000+/mo", "Prefer not to say"];
  const INTERESTS = ["Tech/IT", "Beauty/Fashion", "Food & Dining", "Finance/Investing", "Healthcare/Medical", "Education", "Travel/Leisure", "Media/Entertainment", "Real Estate", "Automotive/Mobility", "Shopping/Retail", "Sports/Fitness", "Environment/Sustainability", "Legal/Tax"];

  const STEPS = ["Basic Info", "Matching Profile", "Consent & Finish"];
  const step0Valid = form.name && form.phone && form.region && form.gender && form.age;
  const step1Valid = form.job && form.income && form.interests.length > 0;

  function FieldLabel({ children }) {
    return <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.label, marginBottom: 8, fontFamily: F }}>{children}</label>;
  }
  function ChipGroup({ options, value, onSelect, multi }) {
    return (
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {options.map(o => {
          const active = multi ? value.includes(o) : value === o;
          return (
            <button key={o} onClick={() => onSelect(o)}
              style={{ padding: "10px 16px", borderRadius: 6, fontSize: 13, fontFamily: F, cursor: "pointer", border: `1.5px solid ${active ? C.purple : C.border}`, background: active ? C.purple : C.white, color: active ? C.white : C.body, transition: "all 0.15s", fontWeight: active ? 500 : 400 }}>
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  function StepBar() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, background: i < step ? C.purple : i === step ? C.purple : C.border, color: i <= step ? C.white : C.body, transition: "all 0.3s" }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === step ? C.purple : C.body, whiteSpace: "nowrap", fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? C.purple : C.border, margin: "0 6px", marginBottom: 18, transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>
    );
  }

  const navBar = <GlobalNav go={go} variant="sub" />;

  if (step === 0) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>Tell us a bit about yourself</div>
            <div style={{ fontSize: 13, color: C.body }}>Used for reward delivery and interview matching</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard, display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <Input label="Full Name" placeholder="Jane Smith" value={form.name} onChange={e => upd("name", e.target.value)} />
              <Input label="Phone Number" type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={e => upd("phone", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Region</FieldLabel>
              <ChipGroup options={REGIONS} value={form.region} onSelect={v => upd("region", v)} />
            </div>
            <div>
              <FieldLabel>Gender</FieldLabel>
              <ChipGroup options={GENDERS} value={form.gender} onSelect={v => upd("gender", v)} />
            </div>
            <div>
              <FieldLabel>Age Group</FieldLabel>
              <ChipGroup options={AGES} value={form.age} onSelect={v => upd("age", v)} />
            </div>
            <Btn full size="lg" disabled={!step0Valid} onClick={() => setStep(1)}>Next</Btn>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 1) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>Set up your matching profile</div>
            <div style={{ fontSize: 13, color: C.body }}>Researchers use this to find the right panelists</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard, display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <FieldLabel>Occupation</FieldLabel>
              <ChipGroup options={JOBS} value={form.job} onSelect={v => upd("job", v)} />
            </div>
            <div>
              <FieldLabel>Monthly Income</FieldLabel>
              <ChipGroup options={INCOMES} value={form.income} onSelect={v => upd("income", v)} />
            </div>
            <div>
              <FieldLabel>Areas of Expertise / Interest <span style={{ fontWeight: 400, color: C.body }}>(select all that apply)</span></FieldLabel>
              <ChipGroup options={INTERESTS} value={form.interests} onSelect={toggleInterest} multi />
              {form.interests.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.purple }}>{form.interests.length} selected</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => setStep(0)}>Back</Btn>
              <Btn size="lg" style={{ flex: 2 }} disabled={!step1Valid} onClick={() => setStep(2)}>Next</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 3) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(30,142,62,0.12)", border: "1px solid rgba(30,142,62,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✓</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 10 }}>You're registered as a Panelist</div>
          <div style={{ fontSize: 14, color: C.body, lineHeight: 1.75, marginBottom: 32 }}>
            Welcome, {form.name}.<br />
            Browse the interview board to find opportunities.<br />
            Rewards are automatically disbursed after AI quality review upon interview completion.
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "18px 20px", marginBottom: 24, textAlign: "left", boxShadow: S.ambient }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 10 }}>What happens next</div>
            {[
              ["1", "Browse the interview board and choose an interview"],
              ["2", "Apply → AI screening → Researcher final confirmation"],
              ["3", "Once confirmed, sign the consent form and complete your voice interview"],
              ["4", "After completion, AI quality review → reward automatically disbursed"],
            ].map(([n, txt]) => (
              <div key={n} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.purpleBg, border: `1px solid ${C.purpleLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: C.purple, flexShrink: 0 }}>{n}</div>
                <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.5, paddingTop: 2 }}>{txt}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => go("landing")}>Go Home</Btn>
            <Btn size="lg" style={{ flex: 2 }} onClick={() => go("panel_board")}>
              Browse Interviews
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Consent
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>Data Collection &amp; Use Consent</div>
            <div style={{ fontSize: 13, color: C.body }}>Please review and agree to the following</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard }}>
            <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleLight}`, borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 8 }}>Your profile summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                {[
                  ["Name", form.name], ["Region", form.region],
                  ["Age/Gender", `${form.age} · ${form.gender}`], ["Occupation", form.job],
                  ["Monthly Income", form.income], ["Interests", form.interests.slice(0, 3).join(", ") + (form.interests.length > 3 ? ` +${form.interests.length - 3} more` : "")],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={{ fontSize: 11, color: C.body }}>{k} </span>
                    <span style={{ fontSize: 12, color: C.navy, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: C.label, marginBottom: 12 }}>Data Collection &amp; Use Details</div>
            {[
              ["Data Collected", "Name, phone number, region, gender, age, occupation, income, interests, voice responses"],
              ["Purpose", "Panelist matching for interviews, research analysis, and report generation"],
              ["Retention", "Until account deletion or 2 years after last interview completion"],
              ["Third-party Sharing", "Anonymized analysis data shared with client companies (no personally identifiable information)"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.body, minWidth: 72, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, color: C.navy, lineHeight: 1.5 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.body, lineHeight: 1.75 }}>
                ✦ Audio is transcribed by AI and deleted immediately after<br />
                ✦ Personally identifiable information is never shared with advertisers<br />
                ✦ You can withdraw consent and delete your account at any time
              </div>
            </div>

            <div onClick={() => setAgreed(a => !a)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${agreed ? C.purple : C.border}`, background: agreed ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                {agreed && <span style={{ color: C.white, fontSize: 12, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: C.navy }}>I have read and agree to all of the above</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Btn>
              <Btn size="lg" style={{ flex: 2 }} disabled={!agreed} onClick={() => setStep(3)}>
                Register as Panelist
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
