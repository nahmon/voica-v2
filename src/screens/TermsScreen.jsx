import { useState } from "react";
import { C, F } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function TermsScreen({ go, user, logout, lang = "ko", onLangChange }) {
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{isKo ? "이용약관" : "Terms of Service"}</h1>
          <p style={{ fontSize: 13, color: C.body, marginBottom: 40 }}>{isKo ? "시행일: 2026년 4월 11일 · 최종 수정: 2026년 4월 11일" : "Effective Date: April 11, 2026 · Last Updated: April 11, 2026"}</p>

          <Section title={isKo ? "제1조 (목적)" : "Article 1 (Purpose)"}>
            {isKo
              ? "이 이용약관은 Voice Survey Inc.(이하 \"회사\")가 제공하는 AI 기반 음성 인터뷰 플랫폼 Voice Survey(이하 \"서비스\")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다."
              : "These Terms of Service govern the conditions, procedures, and rights and responsibilities of Voice Survey Inc. (the \"Company\") and its users with respect to the AI-powered voice interview platform Voice Survey (the \"Service\"), and any other matters necessary for the use of the Service."}
          </Section>

          <Section title={isKo ? "제2조 (정의)" : "Article 2 (Definitions)"}>
            <ol>
              <li>{isKo ? "\"서비스\"란 회사가 제공하는 AI 기반 음성 인터뷰 설계·진행·분석 플랫폼 및 이에 부수된 일체의 서비스를 의미합니다." : "\"Service\" means the AI-based voice interview design, facilitation, and analysis platform provided by the Company, along with all related services."}</li>
              <li>{isKo ? "\"연구자\"란 서비스에 가입하여 인터뷰를 설계하고 결과를 분석하는 기업 또는 개인 이용자를 의미합니다." : "\"Researcher\" means a business or individual user who signs up for the Service to design interviews and analyze results."}</li>
              <li>{isKo ? "\"패널\"이란 서비스를 통해 음성 인터뷰에 참여하는 응답자를 의미합니다." : "\"Panelist\" means a respondent who participates in voice interviews through the Service."}</li>
              <li>{isKo ? "\"인터뷰\"란 연구자가 설계한 질문 세트와 AI 진행자의 음성 대화를 통해 패널의 의견을 수집하는 과정을 의미합니다." : "\"Interview\" means the process of collecting Panelist opinions through a set of questions designed by a Researcher and an AI-facilitated voice conversation."}</li>
              <li>{isKo ? "\"콘텐츠\"란 이용자가 서비스를 통해 게시·등록·제공하는 텍스트, 음성, 이미지, 데이터 등 일체의 정보를 의미합니다." : "\"Content\" means all information, including text, audio, images, and data, that users post, register, or provide through the Service."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제3조 (약관의 효력 및 변경)" : "Article 3 (Effectiveness and Amendment of Terms)"}>
            <ol>
              <li>{isKo ? "이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다." : "These Terms become effective upon being posted on the Service interface or otherwise communicated to users."}</li>
              <li>{isKo ? "회사는 소비자보호 및 정보보안 관련 법령 등 관계 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다." : "The Company may amend these Terms to the extent permitted by applicable law, including consumer protection and information security regulations."}</li>
              <li>{isKo ? "회사가 약관을 개정하는 경우 적용일자 및 개정 사유를 명시하여 현행 약관과 함께 서비스 초기화면에 그 적용일자 7일 전부터 공지합니다. 다만, 이용자에게 불리한 내용으로 변경하는 경우에는 최소 30일 전에 공지하며, 이메일 등을 통해 개별 통지합니다." : "When amending these Terms, the Company will post a notice stating the effective date and reason for the amendment at least 7 days in advance. For changes that are materially unfavorable to users, at least 30 days' advance notice will be given, including individual notification by email."}</li>
              <li>{isKo ? "이용자가 개정 약관에 동의하지 않는 경우 서비스 이용을 중단하고 계정 삭제를 요청할 수 있습니다. 개정 약관 적용일 이후에도 서비스를 계속 이용하면 변경된 약관에 동의한 것으로 봅니다." : "If a user does not agree to the amended Terms, the user may discontinue use and request account deletion. Continued use of the Service after the effective date of the amended Terms constitutes acceptance of the changes."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제4조 (이용계약의 성립)" : "Article 4 (Formation of Service Agreement)"}>
            <ol>
              <li>{isKo ? "이용계약은 이용자가 이 약관에 동의하고 회원가입 신청을 하면 회사가 이를 승낙함으로써 성립합니다." : "A Service agreement is formed when a prospective user agrees to these Terms, submits a registration application, and the Company accepts it."}</li>
              <li>{isKo
                ? "회사는 다음 각 호에 해당하는 경우 가입 신청을 거부할 수 있습니다:"
                : "The Company may decline a registration application in the following cases:"}
                <ul>
                  <li>{isKo ? "타인의 명의를 도용하거나 허위 명의로 신청한 경우" : "The applicant uses a false name or another person's identity"}</li>
                  <li>{isKo ? "허위 정보를 기재하거나 필수 정보를 기재하지 않은 경우" : "The applicant provides false information or fails to provide required information"}</li>
                  <li>{isKo ? "이전에 이 약관 위반으로 계정이 정지 또는 해지된 경우" : "The applicant's account was previously suspended or terminated for violation of these Terms"}</li>
                  <li>{isKo ? "법정대리인의 동의 없이 14세 미만인 경우" : "The applicant is under 14 years of age without consent from a legal guardian"}</li>
                  <li>{isKo ? "회사가 정한 기타 가입 요건을 충족하지 못한 경우" : "The applicant does not meet other registration requirements set by the Company"}</li>
                </ul>
              </li>
            </ol>
          </Section>

          <Section title={isKo ? "제5조 (서비스의 제공 및 변경)" : "Article 5 (Provision and Modification of Service)"}>
            <ol>
              <li>{isKo ? "회사는 이용자에게 다음과 같은 서비스를 제공합니다:" : "The Company provides users with the following services:"}
                <ul>
                  <li>{isKo ? "AI 음성 인터뷰 설계 및 생성" : "AI voice interview design and creation"}</li>
                  <li>{isKo ? "패널 모집 및 인터뷰 진행" : "Panelist recruitment and interview facilitation"}</li>
                  <li>{isKo ? "음성 녹음, 전사(STT) 및 AI 분석 리포트 제공" : "Audio recording, transcription, and AI-generated analysis reports"}</li>
                  <li>{isKo ? "회사가 자체 개발하거나 제휴를 통해 제공하는 기타 서비스" : "Other services developed or provided through partnerships by the Company"}</li>
                </ul>
              </li>
              <li>{isKo ? "서비스의 내용, 방식, 제공 여부가 변경되는 경우 회사는 공지사항을 통해 사전에 안내합니다." : "If there are changes to the content, method, or availability of the Service, the Company will post advance notice through announcements."}</li>
              <li>{isKo ? "회사는 서비스를 일시적으로 중단할 수 있으며, 이 경우 사전 또는 사후에 이용자에게 통지합니다." : "The Company may temporarily suspend the Service and will notify users before or after such suspension."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제6조 (이용자의 의무)" : "Article 6 (User Obligations)"}>
            <ol>
              <li>{isKo ? "이용자는 다음 각 호에 해당하는 행위를 해서는 안 됩니다:" : "Users must not engage in any of the following:"}
                <ul>
                  <li>{isKo ? "회원가입 또는 정보 변경 시 허위 정보를 등록하는 행위" : "Registering false information during sign-up or profile updates"}</li>
                  <li>{isKo ? "타인의 명의 또는 정보를 도용하는 행위" : "Misappropriating another person's identity or information"}</li>
                  <li>{isKo ? "회사가 게시한 정보를 변경하는 행위" : "Altering information posted by the Company"}</li>
                  <li>{isKo ? "회사가 정하지 않은 정보(컴퓨터 프로그램 등)를 송신하거나 게시하는 행위" : "Transmitting or posting unauthorized information (e.g., computer programs) not specified by the Company"}</li>
                  <li>{isKo ? "회사 또는 제3자의 지적재산권을 침해하는 행위" : "Infringing on the intellectual property rights of the Company or third parties"}</li>
                  <li>{isKo ? "회사 또는 제3자의 명예를 훼손하거나 업무를 방해하는 행위" : "Damaging the reputation of or interfering with the operations of the Company or third parties"}</li>
                  <li>{isKo ? "서비스를 통해 음란, 폭력적 또는 기타 불쾌한 콘텐츠를 게시하는 행위" : "Publishing or posting obscene, violent, or otherwise objectionable content through the Service"}</li>
                  <li>{isKo ? "회사의 사전 동의 없이 서비스를 통해 얻은 정보를 복제·배포하거나 상업적으로 이용하는 행위" : "Reproducing, distributing, or commercially exploiting information obtained through the Service without the Company's prior consent"}</li>
                  <li>{isKo ? "서비스 운영을 불안정하게 할 수 있는 정보를 전송하거나 스팸 메시지를 발송하는 행위" : "Transmitting information that could destabilize Service operations, or sending unsolicited commercial messages"}</li>
                  <li>{isKo ? "기타 불법적이거나 부당한 행위" : "Any other illegal or improper conduct"}</li>
                </ul>
              </li>
              <li>{isKo ? "이용자는 관계 법령, 이 약관, 이용 안내 및 회사가 고지하는 사항을 준수하여야 하며, 회사의 업무를 방해해서는 안 됩니다." : "Users must comply with applicable laws, these Terms, usage guidelines, notices, and other communications from the Company, and must not interfere with the Company's operations."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제7조 (지적재산권)" : "Article 7 (Intellectual Property)"}>
            <ol>
              <li>{isKo ? "서비스와 관련된 저작권 및 지적재산권은 회사에 귀속됩니다. 다만, 이용자가 직접 작성한 콘텐츠(인터뷰 질문, 음성 응답, 리포트 등)의 저작권은 해당 이용자에게 있습니다." : "Copyrights and intellectual property related to the Service belong to the Company. However, copyrights to content created directly by users (such as interview questions, audio responses, and reports) belong to those users."}</li>
              <li>{isKo ? "이용자는 회사의 사전 동의 없이 서비스를 이용하여 얻은 정보를 복제·전송·출판·배포·방송하거나 기타 방법으로 영리 목적으로 이용하거나 제3자가 이용하게 해서는 안 됩니다." : "Users may not reproduce, transmit, publish, distribute, broadcast, or otherwise use for commercial purposes any information obtained through the Service without the Company's prior consent, nor may they enable third parties to do so."}</li>
              <li>{isKo ? "회사는 이용자가 게시한 콘텐츠를 서비스 운영·개선·홍보 목적으로 이용자의 개인정보를 포함하지 않는 범위 내에서 활용할 수 있습니다." : "The Company may use user-posted content for Service operation, improvement, and promotion purposes, without including any personal information of the user."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제8조 (음성 데이터의 처리)" : "Article 8 (Processing of Audio Data)"}>
            <ol>
              <li>{isKo ? "회사는 인터뷰 중 패널로부터 수집된 음성 데이터를 다음 목적에 한하여 처리합니다:" : "The Company processes audio data collected from Panelists during interviews solely for the following purposes:"}
                <ul>
                  <li>{isKo ? "음성-텍스트 변환(STT) 서비스 제공" : "Speech-to-text (STT) transcription services"}</li>
                  <li>{isKo ? "AI 분석 리포트 생성" : "AI-generated analysis report creation"}</li>
                  <li>{isKo ? "연구자에게 응답 검토 기능 제공" : "Providing Researchers with response review functionality"}</li>
                </ul>
              </li>
              <li>{isKo ? "음성 데이터는 암호화되어 Supabase Storage에 저장되며, 인터뷰 완료일로부터 1년 후 자동 삭제됩니다." : "Audio data is encrypted and stored in Supabase Storage. The retention period is one year from the date the interview is completed, after which it is automatically deleted."}</li>
              <li>{isKo ? "회사는 법령에서 요구하는 경우를 제외하고 음성 데이터를 제3자와 공유하지 않습니다." : "The Company does not share audio data with third parties except as required by law."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제9조 (서비스의 중단)" : "Article 9 (Service Interruption)"}>
            <ol>
              <li>{isKo ? "회사는 정보통신설비의 보수·교체·고장 또는 통신 두절 등의 사유로 서비스를 일시적으로 중단할 수 있습니다." : "The Company may temporarily suspend the Service due to maintenance, replacement, or failure of information and communications equipment, or disruption of communications."}</li>
              <li>{isKo ? "회사는 이로 인해 이용자 또는 제3자가 입은 손해를 배상합니다. 다만, 회사의 고의 또는 과실이 없는 경우에는 책임을 지지 않습니다." : "The Company will compensate users or third parties for damages caused by such temporary suspension. However, the Company is not liable where the suspension was not due to the Company's intent or negligence."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제10조 (계정 해지 및 이용 정지)" : "Article 10 (Account Termination and Suspension)"}>
            <ol>
              <li>{isKo ? "이용자는 언제든지 계정 설정 메뉴를 통해 계정 삭제를 요청할 수 있으며, 회사는 이를 즉시 처리합니다." : "Users may request account deletion at any time through the account settings menu, and the Company will process such requests immediately."}</li>
              <li>{isKo ? "회사는 다음 각 호에 해당하는 경우 서비스 이용을 제한하거나 이용자 자격을 박탈할 수 있습니다:" : "The Company may restrict Service access or revoke user status in the following cases:"}
                <ul>
                  <li>{isKo ? "가입 시 허위 정보를 등록한 경우" : "The user registered false information during sign-up"}</li>
                  <li>{isKo ? "다른 이용자의 서비스 이용을 방해하거나 그 정보를 도용한 경우" : "The user interferes with other users' access to the Service or misappropriates their information"}</li>
                  <li>{isKo ? "법령, 이 약관 또는 공서양속에 위반되는 행위를 한 경우" : "The user engages in conduct that violates applicable law, these Terms, or public order and morals"}</li>
                </ul>
              </li>
            </ol>
          </Section>

          <Section title={isKo ? "제11조 (손해배상)" : "Article 11 (Damages)"}>
            <ol>
              <li>{isKo ? "회사는 서비스와 관련하여 회사의 고의 또는 과실로 인해 이용자에게 발생한 손해를 배상합니다." : "The Company will compensate users for damages caused by the Company's intentional or negligent acts in connection with the Service."}</li>
              <li>{isKo ? "회사의 손해배상 책임은 직접적이고 예견 가능한 손해에 한정됩니다. 이용자의 특별한 사정으로 인한 손해는 회사가 그 사정을 알았거나 알 수 있었던 경우에 한하여 책임을 집니다." : "The Company's liability for damages is limited to direct and foreseeable damages. Liability for damages arising from the user's special circumstances exists only where the Company knew or should have known of such circumstances."}</li>
              <li>{isKo ? "이용자가 이 약관을 위반하여 회사에 손해를 입힌 경우, 이용자는 그 손해를 배상하여야 합니다." : "If a user's violation of these Terms causes damage to the Company, the user shall compensate the Company for such damage."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제12조 (면책조항)" : "Article 12 (Disclaimer)"}>
            <ol>
              <li>{isKo ? "회사는 천재지변 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임을 지지 않습니다." : "The Company is not liable for failure to provide the Service due to force majeure events, including natural disasters or other circumstances beyond its control."}</li>
              <li>{isKo ? "회사는 이용자 귀책사유로 인한 서비스 장애에 대해 책임을 지지 않습니다." : "The Company is not liable for Service disruptions caused by the user's own fault."}</li>
              <li>{isKo ? "회사는 이용자의 서비스 이용으로 인해 발생한 기대 수익 손실에 대해 회사의 고의 또는 과실이 없는 한 책임을 지지 않습니다." : "The Company is not liable for lost expected revenue resulting from the user's use of the Service, unless caused by the Company's intent or negligence."}</li>
              <li>{isKo ? "회사는 이용자가 게시한 정보, 자료, 사실의 신뢰성 또는 정확성에 대해 책임을 지지 않습니다." : "The Company is not liable for the reliability or accuracy of information, materials, or facts posted by users."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제13조 (분쟁의 해결)" : "Article 13 (Dispute Resolution)"}>
            <ol>
              <li>{isKo ? "회사는 이용자가 제기하는 정당한 의견이나 불만을 처리하기 위한 분쟁 해결 절차를 운영합니다." : "The Company maintains a dispute resolution process to address legitimate complaints and grievances raised by users."}</li>
              <li>{isKo ? "회사는 이용자가 제출한 불만 및 의견을 우선적으로 처리합니다. 신속한 처리가 어려운 경우 그 사유와 처리 일정을 즉시 이용자에게 통보합니다." : "The Company prioritizes complaints and feedback submitted by users. If prompt resolution is not possible, the Company will immediately notify the user of the reason and expected timeline."}</li>
              <li>{isKo ? "이용자가 분쟁 조정을 요청하는 경우 회사는 관련 조정 기관 또는 소비자 보호 당국과 협력할 수 있습니다." : "In cases of user-requested dispute resolution, the Company may cooperate with applicable mediation bodies or consumer protection authorities."}</li>
            </ol>
          </Section>

          <Section title={isKo ? "제14조 (준거법 및 관할)" : "Article 14 (Governing Law and Jurisdiction)"}>
            <ol>
              <li>{isKo ? "이 약관 및 서비스 이용으로 인한 분쟁은 미국 델라웨어주 법률에 따라 규율됩니다." : "These Terms and any disputes arising from use of the Service shall be governed by the laws of the State of Delaware, United States."}</li>
              <li>{isKo ? "회사의 분쟁 해결 절차로 해결되지 않는 분쟁은 미국 델라웨어주 소재 법원의 전속 관할 또는 구속력 있는 중재에 따릅니다." : "Any disputes that cannot be resolved through the Company's dispute resolution process shall be subject to binding arbitration or the exclusive jurisdiction of the courts located in Delaware, United States."}</li>
            </ol>
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.body, lineHeight: 1.8 }}>
            <strong style={{ color: C.navy }}>Voice Survey Inc.</strong><br />
            {isKo ? "사업자 등록: 진행 중" : "Business Registration: Pending"}<br />
            Email: support@voicesurvey.app<br />
            <span style={{ fontSize: 11, color: "#aaa" }}>{isKo ? "※ 사업자 정보는 등록 완료 후 업데이트될 예정입니다." : "※ Business information will be updated upon registration completion."}</span><br />
            <br />
            {isKo ? "이 이용약관은 2026년 4월 11일부터 시행됩니다." : "These Terms of Service are effective as of April 11, 2026."}
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
      <div style={{ fontSize: 13, color: "#3a3a3a", lineHeight: 2, whiteSpace: "pre-line" }}>
        {typeof children === "string" ? children : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
        )}
      </div>
    </div>
  );
}
