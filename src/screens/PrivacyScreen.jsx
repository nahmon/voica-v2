import { useState } from "react";
import { C, F } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PrivacyScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const isMobile = useIsMobile();
  const isKo = lang === "ko";
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F, display: "flex", flexDirection: "column" }}>
      <GlobalNav go={go} variant={user ? "app" : "sub"} user={user} logout={logout} lang={lang} />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px", flex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <Btn variant="ghost" size="sm" onClick={() => go(user ? "dashboard" : "landing")}>{isKo ? "← 뒤로" : "← Back"}</Btn>
        </div>

        <div style={{ background: C.white, borderRadius: 16, padding: isMobile ? "24px 20px" : "40px 48px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{isKo ? "개인정보 처리방침" : "Privacy Policy"}</h1>
          <p style={{ fontSize: 13, color: C.body, marginBottom: 40 }}>{isKo ? "시행일: 2026년 4월 11일 · 최종 수정: 2026년 4월 11일" : "Effective Date: April 11, 2026 · Last Updated: April 11, 2026"}</p>

          <div style={{ fontSize: 13, color: "#3a3a3a", lineHeight: 2, marginBottom: 32, padding: "16px 20px", background: "rgba(83,58,253,0.04)", borderRadius: 8, borderLeft: "3px solid #533afd" }}>
            {isKo
              ? "Voice Survey Inc.(이하 \"회사\")는 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다."
              : "Voice Survey Inc. (the \"Company\") is committed to protecting your personal information in accordance with applicable privacy laws and regulations. This Privacy Policy explains how we collect, use, and protect your personal data, and how you can exercise your rights."}
          </div>

          <Section title={isKo ? "제1조 (개인정보의 처리 목적)" : "Article 1 (Purpose of Processing Personal Information)"}>
            {isKo
              ? "회사는 다음 목적으로 개인정보를 처리합니다. 처리된 개인정보는 다음 목적 이외의 용도로 사용되지 않으며, 목적이 변경될 경우 별도 동의를 받는 등 필요한 조치를 취할 예정입니다."
              : "The Company processes personal information for the following purposes. Personal information will not be used for any purpose other than those listed below. If the purpose of processing changes, the Company will take necessary measures, such as obtaining separate consent."}
            <Table rows={isKo ? [
              ["회원 가입·관리", "가입 의사 확인, 회원 식별·인증, 회원 자격 유지·관리, 서비스 부정 이용 방지, 공지 전달"],
              ["서비스 제공", "AI 음성 인터뷰 설계·진행, 음성 녹음·전사, 분석 리포트 생성, 인터뷰 결과 제공"],
              ["인터뷰 패널 서비스 운영", "인터뷰 패널 모집·관리, 보상 지급, 인터뷰 참여 이력 관리"],
              ["고객 지원", "민원인 신원 확인, 사실 조사, 처리 결과 통보"],
              ["마케팅·광고", "신규 서비스 개발 및 맞춤 서비스 제공, 이벤트·홍보 정보 제공(별도 동의)"],
            ] : [
              ["Account Registration & Management", "Verifying intent to register, identifying and authenticating members, maintaining membership status, preventing misuse, and delivering notices"],
              ["Service Delivery", "AI voice interview design and facilitation, audio recording and transcription, analysis report generation, and delivery of interview results"],
              ["Panelist Service Operations", "Panelist recruitment and management, reward disbursement, and interview participation history management"],
              ["Customer Support", "Verifying identity of inquirers, confirming issues, contacting users for fact-finding, and communicating resolution outcomes"],
              ["Marketing & Advertising", "Developing new services and providing personalized experiences, delivering event and promotional information (with separate consent)"],
            ]} />
          </Section>

          <Section title={isKo ? "제2조 (처리하는 개인정보의 항목)" : "Article 2 (Categories of Personal Information Processed)"}>
            <SubTitle>{isKo ? "① 연구자 계정" : "① Researcher Accounts"}</SubTitle>
            <Table rows={isKo ? [
              ["필수", "이메일, 비밀번호(암호화), 이름"],
              ["선택", "회사명, 직함, 부서, 규모, 업종, 리서치 목적·분야"],
              ["자동 수집", "IP 주소, 쿠키, 서비스 이용 기록, 접속 로그"],
            ] : [
              ["Required", "Email address, password (encrypted), name"],
              ["Optional", "Company name, job title, department, company size, company type, research purpose and categories"],
              ["Automatically Collected", "IP address, cookies, service usage records, access logs"],
            ]} />
            <SubTitle style={{ marginTop: 16 }}>{isKo ? "② 인터뷰 패널 계정" : "② Panelist Accounts"}</SubTitle>
            <Table rows={isKo ? [
              ["필수", "이메일, 비밀번호(암호화), 이름"],
              ["선택", "나이, 성별, 직업, 거주지역"],
              ["인터뷰 중 수집", "음성 녹음 파일, 전사 텍스트, 객관식·평점 응답 데이터"],
              ["자동 수집", "IP 주소, 쿠키, 서비스 이용 기록, 접속 로그, 기기 정보(OS, 브라우저)"],
            ] : [
              ["Required", "Email address, password (encrypted), name"],
              ["Optional", "Age, gender, occupation, region of residence"],
              ["Collected During Interviews", "Audio recording files, transcription text, multiple-choice and rating response data"],
              ["Automatically Collected", "IP address, cookies, service usage records, access logs, device information (OS, browser)"],
            ]} />
          </Section>

          <Section title={isKo ? "제3조 (개인정보의 보유 및 처리 기간)" : "Article 3 (Retention and Processing Period)"}>
            {isKo
              ? "회사는 수집 시 동의받은 기간 또는 법령에서 정한 기간 내에서 개인정보를 처리·보유합니다."
              : "The Company processes and retains personal information within the period consented to at the time of collection, or as required by applicable law."}
            <Table rows={isKo ? [
              ["계정 정보", "탈퇴 시까지(탈퇴 즉시 삭제)"],
              ["인터뷰 응답 데이터(음성·전사·선택지)", "인터뷰 완료일로부터 1년 후 삭제", "개인정보 수집 동의 기준"],
              ["계약·청약철회 기록", "5년", "전자상거래 소비자보호법"],
              ["결제·재화 공급 기록", "5년", "전자상거래 소비자보호법"],
              ["소비자 불만·분쟁 기록", "3년", "전자상거래 소비자보호법"],
              ["접속 로그", "3개월", "통신비밀보호법"],
            ] : [
              ["Account information", "Until account deletion (deleted immediately upon withdrawal)", ""],
              ["Interview response data (audio, transcription, selections)", "1 year from interview completion date, then deleted", "Based on personal data collection consent"],
              ["Contract and cancellation records", "5 years", "Electronic Commerce Consumer Protection Act"],
              ["Payment and product delivery records", "5 years", "Electronic Commerce Consumer Protection Act"],
              ["Consumer complaint and dispute records", "3 years", "Electronic Commerce Consumer Protection Act"],
              ["Access logs", "3 months", "Communications Privacy Protection Act"],
            ]} hasHeader />
          </Section>

          <Section title={isKo ? "제4조 (개인정보의 제3자 제공)" : "Article 4 (Third-Party Disclosure)"}>
            <ol>
              {isKo ? (
                <>
                  <li>회사는 제1조에서 명시한 범위 내에서 개인정보를 처리하며, 이용자 동의 또는 법령에 따른 경우에만 제3자에게 제공합니다.</li>
                  <li>현재 회사는 개인정보를 제3자에게 제공하지 않습니다. 향후 필요 시 사전 동의를 받겠습니다.</li>
                </>
              ) : (
                <>
                  <li>The Company processes personal information only within the scope of purposes stated in Article 1, and shares personal information with third parties only with user consent or as permitted by applicable law.</li>
                  <li>The Company does not currently share personal information with third parties. If such sharing becomes necessary in the future, the Company will obtain prior user consent.</li>
                </>
              )}
            </ol>
          </Section>

          <Section title={isKo ? "제5조 (개인정보 처리 위탁)" : "Article 5 (Data Processing Subcontractors)"}>
            {isKo
              ? "회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다."
              : "The Company engages the following subcontractors to facilitate smooth service delivery."}
            <Table rows={isKo ? [
              ["Supabase Inc.", "데이터베이스 운영 및 인증 서비스", "계약 종료 시까지"],
              ["OpenAI, LLC", "음성 인식(STT), 텍스트 음성 변환(TTS), AI 분석 처리", "계약 종료 시까지"],
              ["Vercel Inc.", "서비스 호스팅 및 서버리스 기능 운영", "계약 종료 시까지"],
            ] : [
              ["Supabase Inc.", "Database operations and authentication services", "Until end of service contract"],
              ["OpenAI, LLC", "Speech recognition (STT), text-to-speech (TTS), and AI analysis processing", "Until end of service contract"],
              ["Vercel Inc.", "Service hosting and serverless function operations", "Until end of service contract"],
            ]} hasHeader headerRow={isKo ? ["수탁업체", "위탁 업무", "보유 기간"] : ["Subcontractor", "Scope of Work", "Retention Period"]} />
            <p style={{ fontSize: 12, color: C.body, marginTop: 12, lineHeight: 1.7 }}>{isKo ? "모든 수탁업체는 GDPR 등 관련 개인정보 보호 법령에 따라 데이터 보호 조치를 시행합니다." : "All subcontractors maintain data protection measures in compliance with applicable privacy laws including GDPR."}</p>
          </Section>

          <Section title={isKo ? "제6조 (이용자의 권리 및 행사 방법)" : "Article 6 (User Rights and How to Exercise Them)"}>
            <ol>
              {isKo ? (
                <>
                  <li>이용자는 언제든지 다음 권리를 행사할 수 있습니다:
                    <ul>
                      <li>개인정보 열람권</li>
                      <li>정정 요구권</li>
                      <li>삭제 요구권</li>
                      <li>처리 제한 요구권</li>
                    </ul>
                  </li>
                  <li>위 권리는 회사에 서면 또는 support@voicesurvey.app으로 연락하여 행사할 수 있습니다.</li>
                  <li>부정확한 정보의 정정·삭제 요청 시 완료될 때까지 해당 정보를 이용하거나 제공하지 않습니다.</li>
                  <li>권리 행사는 법정대리인을 통해서도 가능하며, 이 경우 적절한 위임 서류를 제출해야 합니다.</li>
                </>
              ) : (
                <>
                  <li>Users may exercise the following rights with respect to their personal information at any time:
                    <ul>
                      <li>Right to access personal information</li>
                      <li>Right to correction if information is inaccurate</li>
                      <li>Right to deletion</li>
                      <li>Right to restriction of processing</li>
                    </ul>
                  </li>
                  <li>These rights may be exercised by contacting the Company in writing or by email at support@voicesurvey.app. The Company will respond promptly.</li>
                  <li>If a user requests correction or deletion of inaccurate personal information, the Company will not use or share that information until the correction or deletion is completed.</li>
                  <li>Rights may also be exercised through a legally authorized representative. In such cases, appropriate documentation of authorization must be provided.</li>
                </>
              )}
            </ol>
          </Section>

          <Section title={isKo ? "제7조 (쿠키의 설치·운영 및 거부)" : "Article 7 (Cookies and Automatic Data Collection)"}>
            <ol>
              {isKo ? (
                <>
                  <li>회사는 맞춤형 서비스 제공을 위해 쿠키를 통해 이용 정보를 저장하고 수시로 불러옵니다.</li>
                  <li>쿠키는 웹 서버가 이용자 브라우저로 보내는 소량의 정보로, 이용자 기기에 저장됩니다.</li>
                  <li>이용자는 쿠키 허용 여부를 선택할 수 있습니다. 브라우저 설정에서 모든 쿠키 허용, 쿠키 저장 시 확인, 모든 쿠키 거부를 선택할 수 있습니다. 다만, 쿠키를 거부하면 로그인이 필요한 일부 기능의 이용이 제한될 수 있습니다.</li>
                </>
              ) : (
                <>
                  <li>The Company uses cookies to store and retrieve usage information in order to provide personalized services.</li>
                  <li>Cookies are small pieces of data sent from the web server to the user's browser and stored on the user's device.</li>
                  <li>Users have the right to choose whether to accept cookies. Users can configure their browser to allow all cookies, prompt before storing cookies, or reject all cookies. Please note that disabling cookies may limit access to certain features that require login.</li>
                </>
              )}
            </ol>
          </Section>

          <Section title={isKo ? "제8조 (개인정보의 파기)" : "Article 8 (Deletion of Personal Information)"}>
            <ol>
              {isKo ? (
                <>
                  <li>회사는 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 개인정보를 파기합니다.</li>
                  <li>법령에 따라 보존해야 하는 경우 별도 데이터베이스(DB) 또는 보관 장소로 이전합니다.</li>
                  <li>파기 절차 및 방법은 다음과 같습니다:
                    <ul>
                      <li><strong>파기 절차:</strong> 파기 대상 정보를 파악하고 개인정보 보호 책임자 승인 후 파기합니다.</li>
                      <li><strong>파기 방법:</strong> 전자 파일은 복구 불가한 기술적 방법으로 삭제하고, 인쇄물은 파쇄·소각합니다.</li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li>The Company deletes personal information without delay once it is no longer necessary — for example, when the retention period expires or the processing purpose is achieved.</li>
                  <li>If personal information must be retained beyond the original consent period due to legal requirements, it will be moved to a separate database or storage location.</li>
                  <li>Deletion procedures and methods are as follows:
                    <ul>
                      <li><strong>Deletion Procedure:</strong> The Company identifies personal information subject to deletion and deletes it upon approval from the Company's Privacy Officer.</li>
                      <li><strong>Deletion Method:</strong> Electronic files are deleted using technical methods that prevent recovery. Personal information in printed form is shredded or incinerated.</li>
                    </ul>
                  </li>
                </>
              )}
            </ol>
          </Section>

          <Section title={isKo ? "제9조 (개인정보의 안전성 확보 조치)" : "Article 9 (Security Measures)"}>
            {isKo
              ? "회사는 개인정보의 안전성 확보를 위해 다음 조치를 시행합니다."
              : "The Company implements the following measures to ensure the security of personal information."}
            <ul>
              {isKo ? (
                <>
                  <li><strong>관리적:</strong> 내부 관리 계획 수립, 정기적 직원 교육</li>
                  <li><strong>기술적:</strong> 개인정보 처리 시스템 접근 통제, 접근 권한 관리, 민감 정보 암호화, 보안 소프트웨어</li>
                  <li><strong>물리적:</strong> 서버실 및 데이터 보관 시설 접근 통제</li>
                  <li><strong>암호화:</strong> 비밀번호·음성 파일은 저장·전송 시 암호화 처리(TLS 1.2+, AES-256)</li>
                </>
              ) : (
                <>
                  <li><strong>Administrative:</strong> Internal management plans, regular employee training</li>
                  <li><strong>Technical:</strong> Access control for personal data systems, access control systems, encryption of sensitive identifiers, security software</li>
                  <li><strong>Physical:</strong> Access controls for server rooms and data storage facilities</li>
                  <li><strong>Encryption:</strong> Passwords and audio files are encrypted in storage and transit (TLS 1.2+, AES-256)</li>
                </>
              )}
            </ul>
          </Section>

          <Section title={isKo ? "제10조 (개인정보 보호 책임자)" : "Article 10 (Privacy Officer)"}>
            <ol>
              <li>{isKo ? "회사는 개인정보 처리에 관한 총괄 책임 및 이용자 불만·피해 구제를 위해 개인정보 보호 책임자를 지정합니다." : "The Company designates a Privacy Officer responsible for overseeing personal data processing and handling user complaints and remediation."}</li>
            </ol>
            <div style={{ marginTop: 12, padding: "14px 18px", background: C.bg, borderRadius: 8, fontSize: 13, color: "#3a3a3a", lineHeight: 2 }}>
              <strong>{isKo ? "개인정보 보호 책임자" : "Privacy Officer"}</strong><br />
              {isKo ? "성명: Voice Survey 운영팀" : "Name: Voice Survey Operations Team"}<br />
              {isKo ? "이메일: support@voicesurvey.app" : "Email: support@voicesurvey.app"}<br />
              {isKo ? "전화: 이메일로 문의 부탁드립니다" : "Phone: Please submit inquiries via email"}
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: "#3a3a3a", lineHeight: 1.8 }}>
              {isKo
                ? "서비스 이용 중 발생하는 개인정보 관련 문의, 불만, 피해 구제 요청은 아래 담당자에게 연락 주시면 신속히 처리해 드립니다."
                : "For any privacy-related inquiries, complaints, or requests for remediation arising from your use of the Service, please contact our Privacy Officer. The Company will respond promptly."}
            </p>
          </Section>

          <Section title={isKo ? "제11조 (개인정보 침해 구제 방법)" : "Article 11 (Remedies for Privacy Violations)"}>
            {isKo
              ? "개인정보 침해로 인한 구제를 받기 위하여 다음 기관에 분쟁 해결을 신청할 수 있습니다:"
              : "If you believe your privacy rights have been violated, you may seek resolution through the following channels:"}
            <ul style={{ marginTop: 8 }}>
              <li>Federal Trade Commission (FTC): ftc.gov/privacy</li>
              <li>Internet Crime Complaint Center (IC3): ic3.gov</li>
              <li>Your state Attorney General's office</li>
              <li>Voice Survey support: support@voicesurvey.app</li>
            </ul>
          </Section>

          <Section title={isKo ? "제12조 (개인정보 처리방침의 변경)" : "Article 12 (Changes to This Privacy Policy)"}>
            {isKo
              ? "이 처리방침은 위에 명시된 날짜부터 시행됩니다. 법령·정책 변경으로 추가·삭제·수정이 있는 경우 시행 7일 전에 공지합니다. 이용자에게 불리한 변경의 경우 최소 30일 전 공지하고, 필요 시 이메일로 개별 통지합니다."
              : "This Privacy Policy is effective as of the date stated above. If there are additions, deletions, or corrections due to changes in law or policy, the Company will post notice at least 7 days before the changes take effect. For changes that are materially unfavorable to users, at least 30 days' notice will be given, and individual notification by email will be provided where necessary."}
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.body, lineHeight: 1.8 }}>
            <strong style={{ color: C.navy }}>Voice Survey Inc.</strong><br />
            {isKo ? "개인정보 보호 책임자 이메일: support@voicesurvey.app" : "Privacy Officer Email: support@voicesurvey.app"}<br />
            <br />
            {isKo ? "이 개인정보 처리방침은 2026년 4월 11일부터 시행됩니다." : "This Privacy Policy is effective as of April 11, 2026."}
          </div>
        </div>
      </main>
      <Footer go={go} lang={lang} onLangChange={onLangChange} />
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
