import { C, F } from "../lib/constants.jsx";
import { Btn, GlobalNav } from "../components/shared.jsx";

export default function PrivacyScreen({ go, user, logout }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: F }}>
      <GlobalNav go={go} variant={user ? "app" : "sub"} user={user} logout={logout} />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <Btn variant="ghost" size="sm" onClick={() => go("advertiser_login")}>← 돌아가기</Btn>
        </div>

        <div style={{ background: C.white, borderRadius: 16, padding: "40px 48px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 6 }}>개인정보처리방침</h1>
          <p style={{ fontSize: 13, color: C.body, marginBottom: 40 }}>시행일: 2026년 4월 11일 · 최종 개정일: 2026년 4월 11일</p>

          <div style={{ fontSize: 13, color: "#3a3a3a", lineHeight: 2, marginBottom: 32, padding: "16px 20px", background: "rgba(83,58,253,0.04)", borderRadius: 8, borderLeft: "3px solid #533afd" }}>
            Voica Inc.(이하 "회사")은 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호에 관한 법률」 등 관련 법령에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </div>

          <Section title="제1조 (개인정보의 처리 목적)">
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경될 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            <Table rows={[
              ["회원 가입 및 관리", "회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원 자격 유지·관리, 서비스 부정 이용 방지, 각종 고지·통지"],
              ["서비스 제공", "AI 음성 인터뷰 설계·진행, 음성 녹취·전사, 분석 리포트 생성, 인터뷰 결과 제공"],
              ["패널 서비스 운영", "패널 모집·관리, 리워드 지급, 인터뷰 참여 이력 관리"],
              ["고충 처리", "민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보"],
              ["마케팅 및 광고 활용", "신규 서비스 개발 및 맞춤 서비스 제공, 이벤트·광고성 정보 제공 (별도 동의 시)"],
            ]} />
          </Section>

          <Section title="제2조 (처리하는 개인정보의 항목)">
            <SubTitle>① 리서처 회원</SubTitle>
            <Table rows={[
              ["필수", "이메일 주소, 비밀번호(암호화 저장), 이름"],
              ["선택", "회사명, 직급, 담당 부서, 회사 규모, 회사 유형, 리서치 목적 및 카테고리"],
              ["자동 수집", "IP 주소, 쿠키, 서비스 이용 기록, 접속 로그"],
            ]} />
            <SubTitle style={{ marginTop: 16 }}>② 패널 회원</SubTitle>
            <Table rows={[
              ["필수", "이메일 주소, 비밀번호(암호화 저장), 이름"],
              ["선택", "연령, 성별, 직업, 거주 지역"],
              ["인터뷰 참여 시 수집", "음성 녹음 파일, 음성 전사 텍스트, 객관식·평점 응답 데이터"],
              ["자동 수집", "IP 주소, 쿠키, 서비스 이용 기록, 접속 로그, 기기 정보(OS, 브라우저)"],
            ]} />
          </Section>

          <Section title="제3조 (개인정보의 처리 및 보유 기간)">
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            <Table rows={[
              ["회원 정보", "회원 탈퇴 시까지 (탈퇴 후 즉시 파기)", ""],
              ["인터뷰 응답 데이터(음성, 전사, 선택지)", "해당 인터뷰 프로젝트 종료 후 3년 또는 리서처 요청 시까지", "「전자상거래 등에서의 소비자보호에 관한 법률」"],
              ["계약·청약철회 기록", "5년", "「전자상거래 등에서의 소비자보호에 관한 법률」"],
              ["대금결제 및 재화 공급 기록", "5년", "「전자상거래 등에서의 소비자보호에 관한 법률」"],
              ["소비자 불만·분쟁 처리 기록", "3년", "「전자상거래 등에서의 소비자보호에 관한 법률」"],
              ["접속 로그", "3개월", "「통신비밀보호법」"],
            ]} hasHeader />
          </Section>

          <Section title="제4조 (개인정보의 제3자 제공)">
            <ol>
              <li>회사는 이용자의 개인정보를 제1조에서 명시한 목적 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</li>
              <li>현재 회사는 개인정보를 제3자에게 제공하지 않습니다. 향후 제공이 필요한 경우 사전에 이용자의 동의를 받겠습니다.</li>
            </ol>
          </Section>

          <Section title="제5조 (개인정보 처리 업무의 위탁)">
            회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.
            <Table rows={[
              ["Supabase Inc.", "데이터베이스 운영 및 인증 서비스", "서비스 이용 계약 종료 시"],
              ["OpenAI, LLC", "음성 인식(STT), 텍스트 음성 변환(TTS), AI 분석 처리", "서비스 이용 계약 종료 시"],
              ["Vercel Inc.", "서비스 호스팅 및 서버리스 함수 운영", "서비스 이용 계약 종료 시"],
            ]} hasHeader headerRow={["수탁업체", "위탁 업무 내용", "보유 및 이용 기간"]} />
            <p style={{ fontSize: 12, color: C.body, marginTop: 12, lineHeight: 1.7 }}>위탁업체들은 「개인정보 보호법」 및 GDPR 등 관련 법령에 따른 개인정보 보호 조치를 이행하고 있습니다.</p>
          </Section>

          <Section title="제6조 (정보주체의 권리·의무 및 행사 방법)">
            <ol>
              <li>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
                <ul>
                  <li>개인정보 열람 요구</li>
                  <li>오류 등이 있을 경우 정정 요구</li>
                  <li>삭제 요구</li>
                  <li>처리 정지 요구</li>
                </ul>
              </li>
              <li>제1항에 따른 권리 행사는 회사에 대해 「개인정보 보호법」 시행령 제41조 제1항에 따라 서면, 전자우편(voica.support@gmail.com) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</li>
              <li>정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</li>
              <li>제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우 「개인정보 보호법」 시행규칙 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.</li>
            </ol>
          </Section>

          <Section title="제7조 (처리하는 개인정보의 항목 — 자동 수집)">
            <ol>
              <li>회사는 이용자에게 개별화된 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</li>
              <li>쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자의 PC 컴퓨터 내 하드디스크에 저장됩니다.</li>
              <li>이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 이용자는 웹 브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다. 단, 쿠키의 저장을 거부할 경우에는 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.</li>
            </ol>
          </Section>

          <Section title="제8조 (개인정보의 파기)">
            <ol>
              <li>회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</li>
              <li>정보주체로부터 동의받은 개인정보 보유 기간이 경과하거나 처리 목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관 장소를 달리하여 보존합니다.</li>
              <li>개인정보 파기의 절차 및 방법은 다음과 같습니다.
                <ul>
                  <li><strong>파기 절차:</strong> 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                  <li><strong>파기 방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                </ul>
              </li>
            </ol>
          </Section>

          <Section title="제9조 (개인정보의 안전성 확보 조치)">
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
            <ul>
              <li><strong>관리적 조치:</strong> 내부 관리 계획 수립·시행, 정기적 직원 교육</li>
              <li><strong>기술적 조치:</strong> 개인정보처리시스템 등의 접근 권한 관리, 접근 통제 시스템 설치, 고유 식별 정보 등의 암호화, 보안 프로그램 설치</li>
              <li><strong>물리적 조치:</strong> 전산실, 자료 보관실 등의 접근 통제</li>
              <li><strong>암호화:</strong> 비밀번호 및 음성 파일은 암호화되어 저장·전송됩니다(TLS 1.2 이상, AES-256)</li>
            </ul>
          </Section>

          <Section title="제10조 (개인정보 보호책임자)">
            <ol>
              <li>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</li>
            </ol>
            <div style={{ marginTop: 12, padding: "14px 18px", background: C.bg, borderRadius: 8, fontSize: 13, color: "#3a3a3a", lineHeight: 2 }}>
              <strong>개인정보 보호책임자</strong><br />
              성명: Voica 운영팀<br />
              이메일: voica.support@gmail.com<br />
              전화: 문의는 이메일로 접수해 주세요
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: "#3a3a3a", lineHeight: 1.8 }}>
              정보주체는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당 부서로 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해 드릴 것입니다.
            </p>
          </Section>

          <Section title="제11조 (권익 침해 구제 방법)">
            정보주체는 개인정보 침해로 인한 구제를 받기 위하여 개인정보 분쟁조정위원회, 한국인터넷진흥원 개인정보 침해신고센터 등에 분쟁 해결이나 상담 등을 신청할 수 있습니다.
            <ul style={{ marginTop: 8 }}>
              <li>개인정보 분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보 침해신고센터: 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청 사이버범죄수사단: 02-3480-3573 (www.spo.go.kr)</li>
              <li>경찰청 사이버안전국: 182 (cyberbureau.police.go.kr)</li>
            </ul>
          </Section>

          <Section title="제12조 (개인정보처리방침의 변경)">
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경 사항의 시행일 7일 전부터 공지사항을 통하여 고지할 것입니다. 이용자에게 불리한 내용의 변경 시에는 30일 이전에 공지하며, 필요한 경우 이메일로 개별 통지합니다.
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.body, lineHeight: 1.8 }}>
            <strong style={{ color: C.navy }}>Voica Inc.</strong><br />
            개인정보 보호책임자 이메일: voica.support@gmail.com<br />
            <br />
            본 개인정보처리방침은 2026년 4월 11일부터 시행됩니다.
          </div>
        </div>
      </main>
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
