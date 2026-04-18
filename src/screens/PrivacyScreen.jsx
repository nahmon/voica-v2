import { C, F } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PrivacyScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} variant={user ? "app" : "sub"} user={user} logout={logout} />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <Btn variant="ghost" size="sm" onClick={() => go(user ? "dashboard" : "landing")}>← Back</Btn>
        </div>

        <div style={{ background: C.white, borderRadius: 16, padding: isMobile ? "24px 20px" : "40px 48px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: C.body, marginBottom: 40 }}>Effective Date: April 11, 2026 · Last Updated: April 11, 2026</p>

          <div style={{ fontSize: 13, color: "#3a3a3a", lineHeight: 2, marginBottom: 32, padding: "16px 20px", background: "rgba(83,58,253,0.04)", borderRadius: 8, borderLeft: "3px solid #533afd" }}>
            Voice Survey Inc. (the "Company") is committed to protecting your personal information in accordance with applicable privacy laws and regulations. This Privacy Policy explains how we collect, use, and protect your personal data, and how you can exercise your rights.
          </div>

          <Section title="Article 1 (Purpose of Processing Personal Information)">
            The Company processes personal information for the following purposes. Personal information will not be used for any purpose other than those listed below. If the purpose of processing changes, the Company will take necessary measures, such as obtaining separate consent.
            <Table rows={[
              ["Account Registration & Management", "Verifying intent to register, identifying and authenticating members, maintaining membership status, preventing misuse, and delivering notices"],
              ["Service Delivery", "AI voice interview design and facilitation, audio recording and transcription, analysis report generation, and delivery of interview results"],
              ["Panelist Service Operations", "Panelist recruitment and management, reward disbursement, and interview participation history management"],
              ["Customer Support", "Verifying identity of inquirers, confirming issues, contacting users for fact-finding, and communicating resolution outcomes"],
              ["Marketing & Advertising", "Developing new services and providing personalized experiences, delivering event and promotional information (with separate consent)"],
            ]} />
          </Section>

          <Section title="Article 2 (Categories of Personal Information Processed)">
            <SubTitle>① Researcher Accounts</SubTitle>
            <Table rows={[
              ["Required", "Email address, password (encrypted), name"],
              ["Optional", "Company name, job title, department, company size, company type, research purpose and categories"],
              ["Automatically Collected", "IP address, cookies, service usage records, access logs"],
            ]} />
            <SubTitle style={{ marginTop: 16 }}>② Panelist Accounts</SubTitle>
            <Table rows={[
              ["Required", "Email address, password (encrypted), name"],
              ["Optional", "Age, gender, occupation, region of residence"],
              ["Collected During Interviews", "Audio recording files, transcription text, multiple-choice and rating response data"],
              ["Automatically Collected", "IP address, cookies, service usage records, access logs, device information (OS, browser)"],
            ]} />
          </Section>

          <Section title="Article 3 (Retention and Processing Period)">
            The Company processes and retains personal information within the period consented to at the time of collection, or as required by applicable law.
            <Table rows={[
              ["Account information", "Until account deletion (deleted immediately upon withdrawal)", ""],
              ["Interview response data (audio, transcription, selections)", "1 year from interview completion date, then deleted", "Based on personal data collection consent"],
              ["Contract and cancellation records", "5 years", "Electronic Commerce Consumer Protection Act"],
              ["Payment and product delivery records", "5 years", "Electronic Commerce Consumer Protection Act"],
              ["Consumer complaint and dispute records", "3 years", "Electronic Commerce Consumer Protection Act"],
              ["Access logs", "3 months", "Communications Privacy Protection Act"],
            ]} hasHeader />
          </Section>

          <Section title="Article 4 (Third-Party Disclosure)">
            <ol>
              <li>The Company processes personal information only within the scope of purposes stated in Article 1, and shares personal information with third parties only with user consent or as permitted by applicable law.</li>
              <li>The Company does not currently share personal information with third parties. If such sharing becomes necessary in the future, the Company will obtain prior user consent.</li>
            </ol>
          </Section>

          <Section title="Article 5 (Data Processing Subcontractors)">
            The Company engages the following subcontractors to facilitate smooth service delivery.
            <Table rows={[
              ["Supabase Inc.", "Database operations and authentication services", "Until end of service contract"],
              ["OpenAI, LLC", "Speech recognition (STT), text-to-speech (TTS), and AI analysis processing", "Until end of service contract"],
              ["Vercel Inc.", "Service hosting and serverless function operations", "Until end of service contract"],
            ]} hasHeader headerRow={["Subcontractor", "Scope of Work", "Retention Period"]} />
            <p style={{ fontSize: 12, color: C.body, marginTop: 12, lineHeight: 1.7 }}>All subcontractors maintain data protection measures in compliance with applicable privacy laws including GDPR.</p>
          </Section>

          <Section title="Article 6 (User Rights and How to Exercise Them)">
            <ol>
              <li>Users may exercise the following rights with respect to their personal information at any time:
                <ul>
                  <li>Right to access personal information</li>
                  <li>Right to correction if information is inaccurate</li>
                  <li>Right to deletion</li>
                  <li>Right to restriction of processing</li>
                </ul>
              </li>
              <li>These rights may be exercised by contacting the Company in writing or by email at voica.support@gmail.com. The Company will respond promptly.</li>
              <li>If a user requests correction or deletion of inaccurate personal information, the Company will not use or share that information until the correction or deletion is completed.</li>
              <li>Rights may also be exercised through a legally authorized representative. In such cases, appropriate documentation of authorization must be provided.</li>
            </ol>
          </Section>

          <Section title="Article 7 (Cookies and Automatic Data Collection)">
            <ol>
              <li>The Company uses cookies to store and retrieve usage information in order to provide personalized services.</li>
              <li>Cookies are small pieces of data sent from the web server to the user's browser and stored on the user's device.</li>
              <li>Users have the right to choose whether to accept cookies. Users can configure their browser to allow all cookies, prompt before storing cookies, or reject all cookies. Please note that disabling cookies may limit access to certain features that require login.</li>
            </ol>
          </Section>

          <Section title="Article 8 (Deletion of Personal Information)">
            <ol>
              <li>The Company deletes personal information without delay once it is no longer necessary — for example, when the retention period expires or the processing purpose is achieved.</li>
              <li>If personal information must be retained beyond the original consent period due to legal requirements, it will be moved to a separate database or storage location.</li>
              <li>Deletion procedures and methods are as follows:
                <ul>
                  <li><strong>Deletion Procedure:</strong> The Company identifies personal information subject to deletion and deletes it upon approval from the Company's Privacy Officer.</li>
                  <li><strong>Deletion Method:</strong> Electronic files are deleted using technical methods that prevent recovery. Personal information in printed form is shredded or incinerated.</li>
                </ul>
              </li>
            </ol>
          </Section>

          <Section title="Article 9 (Security Measures)">
            The Company implements the following measures to ensure the security of personal information.
            <ul>
              <li><strong>Administrative:</strong> Internal management plans, regular employee training</li>
              <li><strong>Technical:</strong> Access control for personal data systems, access control systems, encryption of sensitive identifiers, security software</li>
              <li><strong>Physical:</strong> Access controls for server rooms and data storage facilities</li>
              <li><strong>Encryption:</strong> Passwords and audio files are encrypted in storage and transit (TLS 1.2+, AES-256)</li>
            </ul>
          </Section>

          <Section title="Article 10 (Privacy Officer)">
            <ol>
              <li>The Company designates a Privacy Officer responsible for overseeing personal data processing and handling user complaints and remediation.</li>
            </ol>
            <div style={{ marginTop: 12, padding: "14px 18px", background: C.bg, borderRadius: 8, fontSize: 13, color: "#3a3a3a", lineHeight: 2 }}>
              <strong>Privacy Officer</strong><br />
              Name: Voice Survey Operations Team<br />
              Email: voica.support@gmail.com<br />
              Phone: Please submit inquiries via email
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: "#3a3a3a", lineHeight: 1.8 }}>
              For any privacy-related inquiries, complaints, or requests for remediation arising from your use of the Service, please contact our Privacy Officer. The Company will respond promptly.
            </p>
          </Section>

          <Section title="Article 11 (Remedies for Privacy Violations)">
            If you believe your privacy rights have been violated, you may seek resolution through the following channels:
            <ul style={{ marginTop: 8 }}>
              <li>Federal Trade Commission (FTC): ftc.gov/privacy</li>
              <li>Internet Crime Complaint Center (IC3): ic3.gov</li>
              <li>Your state Attorney General's office</li>
              <li>Voice Survey support: voica.support@gmail.com</li>
            </ul>
          </Section>

          <Section title="Article 12 (Changes to This Privacy Policy)">
            This Privacy Policy is effective as of the date stated above. If there are additions, deletions, or corrections due to changes in law or policy, the Company will post notice at least 7 days before the changes take effect. For changes that are materially unfavorable to users, at least 30 days' notice will be given, and individual notification by email will be provided where necessary.
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.body, lineHeight: 1.8 }}>
            <strong style={{ color: C.navy }}>Voice Survey Inc.</strong><br />
            Privacy Officer Email: voica.support@gmail.com<br />
            <br />
            This Privacy Policy is effective as of April 11, 2026.
          </div>
        </div>
      </main>
      <Footer go={go} />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#061b31", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 13, color: "#3a3a3a", lineHeight: 2 }}>
        {children}
      </div>
    </div>
  );
}

function SubTitle({ children, style }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "#3a3a3a", marginBottom: 8, ...style }}>{children}</div>
  );
}

function Table({ rows, hasHeader, headerRow }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, color: "#3a3a3a" }}>
        {hasHeader && headerRow && (
          <thead>
            <tr>
              {headerRow.map((h, i) => (
                <th key={i} style={{ padding: "8px 12px", background: "#f4f4f8", borderBottom: "1px solid #e4e4e8", textAlign: "left", fontWeight: 600, color: "#061b31", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid #ebebf0" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "10px 12px", verticalAlign: "top", lineHeight: 1.7, background: ri % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)" }}>
                  {ci === 0 ? <strong>{cell}</strong> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
