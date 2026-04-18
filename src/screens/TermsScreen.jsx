import { C, F } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function TermsScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} variant={user ? "app" : "sub"} user={user} logout={logout} />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <Btn variant="ghost" size="sm" onClick={() => go(user ? "dashboard" : "landing")}>← Back</Btn>
        </div>

        <div style={{ background: C.white, borderRadius: 16, padding: isMobile ? "24px 20px" : "40px 48px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: C.body, marginBottom: 40 }}>Effective Date: April 11, 2026 · Last Updated: April 11, 2026</p>

          <Section title="Article 1 (Purpose)">
            These Terms of Service govern the conditions, procedures, and rights and responsibilities of Voice Survey Inc. (the "Company") and its users with respect to the AI-powered voice interview platform Voice Survey (the "Service"), and any other matters necessary for the use of the Service.
          </Section>

          <Section title="Article 2 (Definitions)">
            <ol>
              <li>"Service" means the AI-based voice interview design, facilitation, and analysis platform provided by the Company, along with all related services.</li>
              <li>"Researcher" means a business or individual user who signs up for the Service to design interviews and analyze results.</li>
              <li>"Panelist" means a respondent who participates in voice interviews through the Service.</li>
              <li>"Interview" means the process of collecting Panelist opinions through a set of questions designed by a Researcher and an AI-facilitated voice conversation.</li>
              <li>"Content" means all information, including text, audio, images, and data, that users post, register, or provide through the Service.</li>
            </ol>
          </Section>

          <Section title="Article 3 (Effectiveness and Amendment of Terms)">
            <ol>
              <li>These Terms become effective upon being posted on the Service interface or otherwise communicated to users.</li>
              <li>The Company may amend these Terms to the extent permitted by applicable law, including consumer protection and information security regulations.</li>
              <li>When amending these Terms, the Company will post a notice stating the effective date and reason for the amendment at least 7 days in advance. For changes that are materially unfavorable to users, at least 30 days' advance notice will be given, including individual notification by email.</li>
              <li>If a user does not agree to the amended Terms, the user may discontinue use and request account deletion. Continued use of the Service after the effective date of the amended Terms constitutes acceptance of the changes.</li>
            </ol>
          </Section>

          <Section title="Article 4 (Formation of Service Agreement)">
            <ol>
              <li>A Service agreement is formed when a prospective user agrees to these Terms, submits a registration application, and the Company accepts it.</li>
              <li>The Company may decline a registration application in the following cases:
                <ul>
                  <li>The applicant uses a false name or another person's identity</li>
                  <li>The applicant provides false information or fails to provide required information</li>
                  <li>The applicant's account was previously suspended or terminated for violation of these Terms</li>
                  <li>The applicant is under 14 years of age without consent from a legal guardian</li>
                  <li>The applicant does not meet other registration requirements set by the Company</li>
                </ul>
              </li>
            </ol>
          </Section>

          <Section title="Article 5 (Provision and Modification of Service)">
            <ol>
              <li>The Company provides users with the following services:
                <ul>
                  <li>AI voice interview design and creation</li>
                  <li>Panelist recruitment and interview facilitation</li>
                  <li>Audio recording, transcription, and AI-generated analysis reports</li>
                  <li>Other services developed or provided through partnerships by the Company</li>
                </ul>
              </li>
              <li>If there are changes to the content, method, or availability of the Service, the Company will post advance notice through announcements.</li>
              <li>The Company may temporarily suspend the Service and will notify users before or after such suspension.</li>
            </ol>
          </Section>

          <Section title="Article 6 (User Obligations)">
            <ol>
              <li>Users must not engage in any of the following:
                <ul>
                  <li>Registering false information during sign-up or profile updates</li>
                  <li>Misappropriating another person's identity or information</li>
                  <li>Altering information posted by the Company</li>
                  <li>Transmitting or posting unauthorized information (e.g., computer programs) not specified by the Company</li>
                  <li>Infringing on the intellectual property rights of the Company or third parties</li>
                  <li>Damaging the reputation of or interfering with the operations of the Company or third parties</li>
                  <li>Publishing or posting obscene, violent, or otherwise objectionable content through the Service</li>
                  <li>Reproducing, distributing, or commercially exploiting information obtained through the Service without the Company's prior consent</li>
                  <li>Transmitting information that could destabilize Service operations, or sending unsolicited commercial messages</li>
                  <li>Any other illegal or improper conduct</li>
                </ul>
              </li>
              <li>Users must comply with applicable laws, these Terms, usage guidelines, notices, and other communications from the Company, and must not interfere with the Company's operations.</li>
            </ol>
          </Section>

          <Section title="Article 7 (Intellectual Property)">
            <ol>
              <li>Copyrights and intellectual property related to the Service belong to the Company. However, copyrights to content created directly by users (such as interview questions, audio responses, and reports) belong to those users.</li>
              <li>Users may not reproduce, transmit, publish, distribute, broadcast, or otherwise use for commercial purposes any information obtained through the Service without the Company's prior consent, nor may they enable third parties to do so.</li>
              <li>The Company may use user-posted content for Service operation, improvement, and promotion purposes, without including any personal information of the user.</li>
            </ol>
          </Section>

          <Section title="Article 8 (Processing of Audio Data)">
            <ol>
              <li>The Company processes audio data collected from Panelists during interviews solely for the following purposes:
                <ul>
                  <li>Speech-to-text (STT) transcription services</li>
                  <li>AI-generated analysis report creation</li>
                  <li>Providing Researchers with response review functionality</li>
                </ul>
              </li>
              <li>Audio data is encrypted and stored in Supabase Storage. The retention period is one year from the date the interview is completed, after which it is automatically deleted.</li>
              <li>The Company does not share audio data with third parties except as required by law.</li>
            </ol>
          </Section>

          <Section title="Article 9 (Service Interruption)">
            <ol>
              <li>The Company may temporarily suspend the Service due to maintenance, replacement, or failure of information and communications equipment, or disruption of communications.</li>
              <li>The Company will compensate users or third parties for damages caused by such temporary suspension. However, the Company is not liable where the suspension was not due to the Company's intent or negligence.</li>
            </ol>
          </Section>

          <Section title="Article 10 (Account Termination and Suspension)">
            <ol>
              <li>Users may request account deletion at any time through the account settings menu, and the Company will process such requests immediately.</li>
              <li>The Company may restrict Service access or revoke user status in the following cases:
                <ul>
                  <li>The user registered false information during sign-up</li>
                  <li>The user interferes with other users' access to the Service or misappropriates their information</li>
                  <li>The user engages in conduct that violates applicable law, these Terms, or public order and morals</li>
                </ul>
              </li>
            </ol>
          </Section>

          <Section title="Article 11 (Damages)">
            <ol>
              <li>The Company will compensate users for damages caused by the Company's intentional or negligent acts in connection with the Service.</li>
              <li>The Company's liability for damages is limited to direct and foreseeable damages. Liability for damages arising from the user's special circumstances exists only where the Company knew or should have known of such circumstances.</li>
              <li>If a user's violation of these Terms causes damage to the Company, the user shall compensate the Company for such damage.</li>
            </ol>
          </Section>

          <Section title="Article 12 (Disclaimer)">
            <ol>
              <li>The Company is not liable for failure to provide the Service due to force majeure events, including natural disasters or other circumstances beyond its control.</li>
              <li>The Company is not liable for Service disruptions caused by the user's own fault.</li>
              <li>The Company is not liable for lost expected revenue resulting from the user's use of the Service, unless caused by the Company's intent or negligence.</li>
              <li>The Company is not liable for the reliability or accuracy of information, materials, or facts posted by users.</li>
            </ol>
          </Section>

          <Section title="Article 13 (Dispute Resolution)">
            <ol>
              <li>The Company maintains a dispute resolution process to address legitimate complaints and grievances raised by users.</li>
              <li>The Company prioritizes complaints and feedback submitted by users. If prompt resolution is not possible, the Company will immediately notify the user of the reason and expected timeline.</li>
              <li>In cases of user-requested dispute resolution, the Company may cooperate with applicable mediation bodies or consumer protection authorities.</li>
            </ol>
          </Section>

          <Section title="Article 14 (Governing Law and Jurisdiction)">
            <ol>
              <li>These Terms and any disputes arising from use of the Service shall be governed by the laws of the State of Delaware, United States.</li>
              <li>Any disputes that cannot be resolved through the Company's dispute resolution process shall be subject to binding arbitration or the exclusive jurisdiction of the courts located in Delaware, United States.</li>
            </ol>
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.body, lineHeight: 1.8 }}>
            <strong style={{ color: C.navy }}>Voice Survey Inc.</strong><br />
            Business Registration: Pending<br />
            Email: voica.support@gmail.com<br />
            <span style={{ fontSize: 11, color: "#aaa" }}>※ Business information will be updated upon registration completion.</span><br />
            <br />
            These Terms of Service are effective as of April 11, 2026.
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
      <div style={{ fontSize: 13, color: "#3a3a3a", lineHeight: 2, whiteSpace: "pre-line" }}>
        {typeof children === "string" ? children : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
        )}
      </div>
    </div>
  );
}
