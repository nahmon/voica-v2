import { C } from "./constants.jsx";

export const PROJECTS = [
  { id: 1, name: "앱 사용성 인터뷰 Q2", status: "진행 중", goal: 300, done: 187, questions: 5, date: "2026.04.08", themes: 4 },
  { id: 2, name: "신제품 컨셉 테스트", status: "모집 중", goal: 500, done: 312, questions: 6, date: "2026.04.05", themes: 0 },
  { id: 3, name: "브랜드 인식 조사 Q1", status: "완료", goal: 200, done: 200, questions: 8, date: "2026.03.28", themes: 6 },
];
export const QUESTIONS = [
  { id: 1, text: "안녕하세요! 오늘 인터뷰에 참여해 주셔서 감사합니다. 먼저 본인의 직업과 주로 하시는 업무를 간단히 소개해 주시겠어요?", label: "오프닝", duration: 60, visual: null },
  { id: 2, text: "화면에 보이는 앱 온보딩 화면을 보시면서, 처음 사용하셨을 때 어떤 느낌이었나요? 기억나시는 첫인상을 자유롭게 말씀해 주세요.", label: "첫인상", duration: 90, visual: { type: "screenshot", label: "온보딩 화면", tag: "v2.1", screens: ["splash", "signup", "home"] } },
  { id: 3, text: "지금 보여드리는 화면에서 불편하거나 아쉬웠던 점이 있다면 무엇인가요? 구체적인 상황이 있으시면 더욱 좋습니다.", label: "불편함", duration: 90, visual: { type: "screenshot", label: "메인 대시보드", tag: "현재 버전", screens: ["dashboard"] } },
  { id: 4, text: "이 서비스를 가까운 지인에게 추천한다면, 어떤 점을 가장 먼저 이야기하실 것 같으세요?", label: "추천 포인트", duration: 90, visual: null },
  { id: 5, text: "마지막으로 저희 팀에게 자유롭게 하시고 싶은 말씀이 있으시면 편하게 전해 주세요.", label: "클로징", duration: 120, visual: null },
];
export const REPORT_THEMES = [
  { label: "기능 효용성", count: 14, pct: 37, sentiment: "positive", color: C.purple, bg: "rgba(26,115,232,0.08)", border: "rgba(26,115,232,0.18)", icon: "✦" },
  { label: "가격 민감도", count: 11, pct: 29, sentiment: "negative", color: C.ruby, bg: "rgba(217,48,37,0.08)", border: "rgba(217,48,37,0.2)", icon: "coin" },
  { label: "온보딩 경험", count: 8, pct: 21, sentiment: "positive", color: C.success, bg: "rgba(30,142,62,0.08)", border: "rgba(30,142,62,0.2)", icon: "check" },
  { label: "데이터 Export", count: 5, pct: 13, sentiment: "negative", color: C.magenta, bg: "rgba(232,113,10,0.08)", border: "rgba(232,113,10,0.2)", icon: "arrowup" },
];
export const MOCK_TRANSCRIPTS = [
  { qId: 1, text: "저는 스타트업에서 UX 리서처로 일하고 있어요. 주로 사용자 인터뷰와 사용성 테스트를 담당합니다.", sentiment: "neutral" },
  { qId: 2, text: "처음에는 생각보다 훨씬 직관적이어서 놀랐어요. 특히 온보딩이 굉장히 매끄럽게 느껴졌습니다.", sentiment: "positive" },
  { qId: 3, text: "가격이 조금 부담스러웠어요. 팀 요금제가 있으면 좋겠고, 데이터 내보내기 기능도 더 다양했으면 합니다.", sentiment: "negative" },
  { qId: 4, text: "시간을 엄청 아껴준다고 이야기할 것 같아요. 예전에는 정리하는 데만 두세 시간이 걸렸거든요.", sentiment: "positive" },
  { qId: 5, text: "계속 잘 만들어 주세요. 리서치 업계에 꼭 필요한 서비스라고 생각합니다.", sentiment: "positive" },
];

// ─── Panel Board Mock Data ───
export const PANEL_JOBS = [
  { id: 1, title: "앱 사용성 인터뷰", company: "핀테크 스타트업 A", duration: "약 10분", reward: "3,000원", conditions: ["20~40대", "스마트폰 앱 사용자"], deadline: "2026.04.15", filled: 187, total: 300, category: "테크", urgent: true, matchTags: ["테크/IT", "금융/투자"], ageRange: [20,40],
    description: "신규 출시 예정인 간편 송금 앱의 온보딩 플로우와 핵심 기능 사용성을 검증합니다. 실제 사용 중 불편했던 경험, 직관성, 신뢰감 등을 솔직하게 말씀해 주시면 됩니다.",
    targetProfile: { age: "20~40대", gender: "무관", region: "전국", lifestyle: "스마트폰으로 금융 앱을 주 1회 이상 사용하는 분", exclude: "금융업 종사자 제외" } },
  { id: 2, title: "신제품 브랜드 인식 조사", company: "뷰티 브랜드 B", duration: "약 15분", reward: "5,000원", conditions: ["20~35세 여성", "뷰티 제품 관심자"], deadline: "2026.04.20", filled: 312, total: 500, category: "뷰티", urgent: false, matchTags: ["뷰티/패션"], ageRange: [20,35], genderMatch: "여성",
    description: "국내 중저가 스킨케어 브랜드의 신규 라인 론칭 전 소비자 인식 및 구매 의향을 조사합니다. 평소 뷰티 제품 선택 기준과 브랜드 호감도에 대해 자유롭게 이야기해 주세요.",
    targetProfile: { age: "20~35세", gender: "여성", region: "수도권 우대 (전국 가능)", lifestyle: "월 1회 이상 뷰티 제품을 구매하는 분", exclude: "뷰티업계 종사자 제외" } },
  { id: 3, title: "OTT 서비스 만족도 인터뷰", company: "엔터테인먼트 C", duration: "약 8분", reward: "2,000원", conditions: ["전 연령", "OTT 구독 경험"], deadline: "2026.04.12", filled: 91, total: 100, category: "미디어", urgent: true, matchTags: ["미디어/엔터테인먼트"], ageRange: [10,60],
    description: "주요 OTT 플랫폼(넷플릭스·웨이브·티빙 등) 사용 경험과 콘텐츠 소비 패턴을 파악합니다. 구독 유지·해지 이유, 콘텐츠 만족도, 가격 민감도에 대해 솔직한 의견을 듣고자 합니다.",
    targetProfile: { age: "전 연령", gender: "무관", region: "전국", lifestyle: "OTT 서비스를 현재 구독 중이거나 최근 6개월 내 구독한 경험이 있는 분", exclude: "방송·미디어 업계 종사자 제외" } },
  { id: 4, title: "식품 소비 패턴 인터뷰", company: "식품 기업 D", duration: "약 12분", reward: "4,000원", conditions: ["30~50대", "주 1회 이상 온라인 장보기"], deadline: "2026.04.25", filled: 78, total: 400, category: "식품", urgent: false, matchTags: ["식품/요식업", "쇼핑/유통"], ageRange: [30,50],
    description: "온라인 식료품 구매 행동과 브랜드 선호도를 조사합니다. 특히 주간 3회 이상 장을 보는 30~40대 유자녀 가구의 구매 동선, 가격 민감도, 신선도 기준을 심층 파악합니다.",
    targetProfile: { age: "30~50대", gender: "무관 (유자녀 가구 우대)", region: "수도권·광역시 우대", lifestyle: "주 1회 이상 쿠팡·마켓컬리·SSG 등 온라인 장보기 이용자. 자녀 있는 가구 우대.", exclude: "식품·유통업 종사자 제외" } },
  { id: 5, title: "금융 앱 UX 리서치", company: "은행 계열사 E", duration: "약 20분", reward: "8,000원", conditions: ["25~45세", "모바일 뱅킹 사용자"], deadline: "2026.04.18", filled: 143, total: 200, category: "금융", urgent: false, matchTags: ["금융/투자", "테크/IT"], ageRange: [25,45],
    description: "시중 은행 앱의 자산 관리·이체·대출 조회 기능 UX를 평가합니다. 실제 사용 시 불편했던 화면, 원하는 기능, 타 앱과의 비교 경험을 구체적으로 공유해 주시면 됩니다.",
    targetProfile: { age: "25~45세", gender: "무관", region: "전국", lifestyle: "모바일 뱅킹 앱을 주 2회 이상 사용하며, 예·적금·투자 상품 중 1개 이상 보유한 분", exclude: "금융·핀테크 업계 현직 종사자 제외" } },
  { id: 6, title: "교육 플랫폼 학습 경험 조사", company: "에듀테크 F", duration: "약 10분", reward: "3,500원", conditions: ["학부모 또는 학생", "온라인 강의 수강 경험"], deadline: "2026.04.30", filled: 34, total: 150, category: "교육", urgent: false, matchTags: ["교육"], ageRange: [20,50],
    description: "온라인 교육 플랫폼(클래스101·패스트캠퍼스·인프런 등) 학습 경험을 조사합니다. 강의 선택 기준, 완강률, 만족·불만족 요인을 파악해 플랫폼 개선에 반영합니다.",
    targetProfile: { age: "학생(중고대학생) 또는 30~50대 학부모", gender: "무관", region: "전국", lifestyle: "최근 1년 내 온라인 강의를 수강한 경험이 있는 분. 자녀 교육에 관심 있는 학부모도 환영.", exclude: "교육업 종사자(교사·강사·튜터) 제외" } },
  { id: 7, title: "의료 AI 진단 보조 도구 평가", company: "헬스케어 스타트업 G", duration: "약 25분", reward: "120,000원", conditions: ["의사·간호사·의료진", "임상 경력 3년 이상"], deadline: "2026.04.22", filled: 18, total: 50, category: "전문가", urgent: false, expert: true, expertTag: "의료", matchTags: ["의료/헬스케어"], ageRange: [25,60], jobMatch: ["전문직 (의사·변호사·회계사 등)"],
    description: "AI 기반 영상의학 판독 보조 솔루션의 임상 적용 가능성을 평가합니다. 현장에서의 AI 도구 수용도, 신뢰 기준, 워크플로우 통합 시 고려 사항에 대한 전문적 의견을 구합니다.",
    targetProfile: { age: "25~60세", gender: "무관", region: "전국", lifestyle: "현직 의사·간호사·방사선사 등 의료진으로 임상 경력 3년 이상인 분", exclude: "의료기기·헬스케어 스타트업 종사자 제외" } },
  { id: 8, title: "스타트업 투자 의사결정 프로세스 인터뷰", company: "VC 리서치 H", duration: "약 30분", reward: "200,000원", conditions: ["VC·엔젤투자자·심사역", "투자 집행 경험"], deadline: "2026.04.18", filled: 7, total: 30, category: "전문가", urgent: true, expert: true, expertTag: "투자", matchTags: ["금융/투자"], ageRange: [25,55], jobMatch: ["전문직 (의사·변호사·회계사 등)", "직장인 (대기업/중견)"],
    description: "초기 스타트업 투자 심사 시 의사결정 프레임워크와 실사(DD) 프로세스를 연구합니다. 실제 투자 집행 사례와 거절 기준, 팀·시장·기술 평가 비중에 대한 인사이트를 구합니다.",
    targetProfile: { age: "25~55세", gender: "무관", region: "전국 (서울·판교 집중)", lifestyle: "VC·CVC·엑셀러레이터 소속 심사역 또는 엔젤투자자로 최소 1건 이상 직접 투자를 집행한 경험이 있는 분", exclude: "창업자·스타트업 대표 제외" } },
  { id: 9, title: "법률 SaaS 사용성 검토", company: "리걸테크 I", duration: "약 20분", reward: "150,000원", conditions: ["변호사·법무사·로클럭", "기업 법무 경험"], deadline: "2026.04.28", filled: 11, total: 40, category: "전문가", urgent: false, expert: true, expertTag: "법률", matchTags: ["법률/세무"], ageRange: [25,55], jobMatch: ["전문직 (의사·변호사·회계사 등)"],
    description: "계약서 자동 검토 및 법률 리서치 SaaS의 기업 법무 현장 적용 가능성을 검토합니다. 현재 사용 중인 법률 문서 작업 방식, AI 툴 도입 시 장벽, 가격 기준에 대한 전문 의견을 구합니다.",
    targetProfile: { age: "25~55세", gender: "무관", region: "전국", lifestyle: "현직 변호사·법무사·기업 법무팀 담당자로 계약서·법률 문서를 주 업무로 다루는 분", exclude: "법률 IT 솔루션 개발·영업 종사자 제외" } },
  { id: 10, title: "B2B SaaS 구매 의사결정 인터뷰", company: "엔터프라이즈 J", duration: "약 20분", reward: "80,000원", conditions: ["IT 구매 담당자·CTO·팀장급 이상", "솔루션 도입 경험"], deadline: "2026.05.02", filled: 29, total: 100, category: "전문가", urgent: false, expert: true, expertTag: "기업 IT", matchTags: ["테크/IT"], ageRange: [30,55], jobMatch: ["직장인 (대기업/중견)", "직장인 (중소기업)"],
    description: "기업의 SaaS 솔루션 도입 결정 프로세스와 평가 기준을 연구합니다. RFP 작성부터 벤더 비교·계약까지의 의사결정 흐름, 사내 승인 구조, 도입 후 ROI 측정 방식을 파악합니다.",
    targetProfile: { age: "30~55세", gender: "무관", region: "전국 (수도권 우대)", lifestyle: "50인 이상 기업의 IT 구매 담당자, CTO, 팀장급 이상으로 SaaS·솔루션 도입을 직접 결정하거나 강하게 영향을 준 경험이 있는 분", exclude: "SaaS 벤더·IT 솔루션 영업직 종사자 제외" } },
];

// 패널 사용자 프로필 (데모) — 실제로는 Supabase에서 가져옴
export const MOCK_PANEL_PROFILE = {
  age: "30대",
  gender: "남성",
  job: "직장인 (대기업/중견)",
  interests: ["테크/IT", "금융/투자", "미디어/엔터테인먼트"],
};

export function getMatchScore(job, profile) {
  let score = 0;
  // 관심 분야 매칭 (가장 중요)
  const interestMatch = job.matchTags?.some(t => profile.interests.includes(t));
  if (interestMatch) score += 3;
  // 연령 매칭
  if (job.ageRange) {
    const ageNum = parseInt(profile.age);
    if (!isNaN(ageNum) && ageNum >= job.ageRange[0] && ageNum <= job.ageRange[1]) score += 2;
  }
  // 성별 매칭 (성별 제한 없으면 +1, 일치하면 +1)
  if (!job.genderMatch) score += 1;
  else if (job.genderMatch === profile.gender) score += 1;
  // 직업 매칭
  if (job.jobMatch?.includes(profile.job)) score += 2;
  return score;
}

export const PANEL_APPLICANTS = [
  { id: 1, name: "김○○", age: "30대", gender: "여성", applied: "2026.04.07 14:32", status: "신청", score: 92, intv: 3 },
  { id: 2, name: "이○○", age: "20대", gender: "남성", applied: "2026.04.07 15:10", status: "적합", score: 88, intv: 1 },
  { id: 3, name: "박○○", age: "40대", gender: "여성", applied: "2026.04.07 16:44", status: "적합", score: 95, intv: 7 },
  { id: 4, name: "최○○", age: "30대", gender: "남성", applied: "2026.04.08 09:12", status: "신청", score: 74, intv: 0 },
  { id: 5, name: "정○○", age: "20대", gender: "여성", applied: "2026.04.08 10:03", status: "부적합", score: 45, intv: 2 },
  { id: 6, name: "강○○", age: "50대", gender: "남성", applied: "2026.04.08 11:20", status: "완료", score: 91, intv: 5 },
  { id: 7, name: "윤○○", age: "30대", gender: "여성", applied: "2026.04.08 13:05", status: "신청", score: 83, intv: 4 },
];

export const FAQ_DATA = [
  {
    category: "서비스 이용",
    items: [
      {
        q: "Voica는 어떤 서비스인가요?",
        a: "Voica는 AI가 인터뷰어 역할을 맡아 수백 명의 패널과 동시에 음성·텍스트 인터뷰를 진행하고, 결과를 자동으로 분석·요약해 드리는 사용자 리서치 플랫폼입니다."
      },
      {
        q: "인터뷰는 어떤 방식으로 진행되나요?",
        a: "리서처가 질문 시나리오를 설정하면, AI가 패널에게 음성 또는 텍스트로 질문합니다. 패널의 응답은 실시간으로 수집되며, 인터뷰 종료 후 AI가 핵심 인사이트와 통계를 리포트로 제공합니다."
      },
      {
        q: "한 번에 몇 명까지 동시 인터뷰가 가능한가요?",
        a: "요금제에 따라 다르며, 스탠다드 플랜 기준 회당 최대 300명, 엔터프라이즈 플랜은 제한 없이 동시 인터뷰를 진행할 수 있습니다."
      },
      {
        q: "인터뷰 결과 리포트는 언제 받을 수 있나요?",
        a: "마지막 패널 응답 완료 후 보통 5~10분 이내에 AI 분석 리포트가 생성됩니다. 리포트는 대시보드에서 확인하거나 PDF로 내보낼 수 있습니다."
      },
    ]
  },
  {
    category: "결제 / 요금",
    items: [
      {
        q: "무료로 사용해볼 수 있나요?",
        a: "네, 가입 후 월 3회까지 인터뷰를 무료로 진행할 수 있습니다. 패널 수는 회당 최대 10명으로 제한됩니다."
      },
      {
        q: "요금제는 어떻게 구성되어 있나요?",
        a: "스타터(무료), 스탠다드(월 99,000원), 프로(월 249,000원), 엔터프라이즈(별도 문의) 네 가지 플랜이 있습니다. 요금제 페이지에서 상세 비교가 가능합니다."
      },
      {
        q: "결제 수단은 무엇을 지원하나요?",
        a: "신용카드/체크카드, 카카오페이, 네이버페이, 토스페이를 지원합니다. 세금계산서가 필요한 경우 기업 결제(계좌이체)도 가능합니다."
      },
      {
        q: "환불 정책이 어떻게 되나요?",
        a: "결제일로부터 7일 이내이고, 인터뷰를 한 건도 진행하지 않은 경우 전액 환불 가능합니다. 이후에는 잔여 기간에 비례한 부분 환불이 적용됩니다."
      },
    ]
  },
  {
    category: "패널 참여 / 리워드",
    items: [
      {
        q: "패널로 참여하려면 어떻게 해야 하나요?",
        a: "패널 참여 메뉴에서 회원가입 후, 인터뷰 보드에서 참여 가능한 인터뷰를 선택하시면 됩니다. 별도 자격 조건은 없으며 누구나 신청할 수 있습니다."
      },
      {
        q: "리워드는 어떻게 지급되나요?",
        a: "인터뷰 완료 후 24시간 이내에 등록하신 계좌 또는 모바일 상품권으로 지급됩니다. 리워드 금액은 각 인터뷰 공고에 명시되어 있습니다."
      },
      {
        q: "인터뷰 도중 중단하면 어떻게 되나요?",
        a: "인터뷰를 끝까지 완료한 경우에만 리워드가 지급됩니다. 중도 이탈 시 리워드는 지급되지 않으며, 재참여는 리서처의 설정에 따라 달라집니다."
      },
      {
        q: "블랙리스트 패널 제도란 무엇인가요?",
        a: "인터뷰 품질 보호를 위해 블랙리스트 패널 제도를 운영합니다. 아래 기준에 해당하는 경우 누적 경고가 부여되며, 3회 이상 시 패널 자격이 정지됩니다.\n\n• 질문에 성의 없이 단답·무관한 내용·장난성 응답\n• 정당한 사유 없는 인터뷰 중도 이탈 3회 이상\n• 동일 인터뷰 중복 응답 또는 허위 자격 기재\n\n경고 내역은 내 계정에서 확인할 수 있으며, 이의신청은 고객센터로 접수해 주세요. 자격 정지 기간 중에는 새 인터뷰 신청 및 리워드 지급이 제한됩니다."
      },
    ]
  },
  {
    category: "기술 / 계정",
    items: [
      {
        q: "어떤 기기와 브라우저를 지원하나요?",
        a: "PC와 모바일 모두 지원하며, Chrome, Safari, Edge 최신 버전을 권장합니다. 음성 인터뷰의 경우 마이크 권한이 필요합니다."
      },
      {
        q: "인터뷰 데이터는 안전하게 보호되나요?",
        a: "모든 데이터는 암호화하여 저장하며, 개인정보는 인터뷰 완료 후 리서처에게 제공되지 않습니다. 자세한 내용은 개인정보 처리방침을 확인해 주세요."
      },
      {
        q: "비밀번호를 잊어버렸어요.",
        a: "로그인 화면의 '비밀번호 찾기'를 누르면 가입 이메일로 재설정 링크가 발송됩니다. 소셜 로그인으로 가입하신 경우 해당 서비스의 계정 관리를 이용해 주세요."
      },
    ]
  },
];
