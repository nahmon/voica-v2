import { C } from "./constants.jsx";

export const PROJECTS = [
  { id: 1, name: "App Usability Interview Q2", status: "In Progress", goal: 300, done: 187, questions: 5, date: "2026.04.08", themes: 4 },
  { id: 2, name: "New Product Concept Test", status: "Recruiting", goal: 500, done: 312, questions: 6, date: "2026.04.05", themes: 0 },
  { id: 3, name: "Brand Perception Study Q1", status: "Completed", goal: 200, done: 200, questions: 8, date: "2026.03.28", themes: 6 },
];
export const QUESTIONS = [
  { id: 1, text: "Hi there! Thanks for joining today's interview. To start, could you briefly introduce yourself — your job and what you mainly do day-to-day?", label: "Opening", duration: 60, visual: null },
  { id: 2, text: "Looking at the app onboarding screen shown here, what was your first impression when you used it for the first time? Feel free to share whatever comes to mind.", label: "First Impression", duration: 90, visual: { type: "screenshot", label: "Onboarding Screen", tag: "v2.1", screens: ["splash", "signup", "home"] } },
  { id: 3, text: "Was there anything on the screen you just saw that felt inconvenient or disappointing? A specific situation would be especially helpful.", label: "Pain Points", duration: 90, visual: { type: "screenshot", label: "Main Dashboard", tag: "Current Version", screens: ["dashboard"] } },
  { id: 4, text: "If you were recommending this service to a friend, what would be the first thing you'd tell them about it?", label: "Recommendation", duration: 90, visual: null },
  { id: 5, text: "Finally, is there anything else you'd like to share with our team? Feel free to say anything on your mind.", label: "Closing", duration: 120, visual: null },
];
export const REPORT_THEMES = [
  { label: "Feature Utility", count: 14, pct: 37, sentiment: "positive", color: C.purple, bg: "rgba(26,115,232,0.08)", border: "rgba(26,115,232,0.18)", icon: "✦" },
  { label: "Price Sensitivity", count: 11, pct: 29, sentiment: "negative", color: C.ruby, bg: "rgba(217,48,37,0.08)", border: "rgba(217,48,37,0.2)", icon: "coin" },
  { label: "Onboarding Experience", count: 8, pct: 21, sentiment: "positive", color: C.success, bg: "rgba(30,142,62,0.08)", border: "rgba(30,142,62,0.2)", icon: "check" },
  { label: "Data Export", count: 5, pct: 13, sentiment: "negative", color: C.magenta, bg: "rgba(232,113,10,0.08)", border: "rgba(232,113,10,0.2)", icon: "arrowup" },
];
export const MOCK_TRANSCRIPTS = [
  { qId: 1, text: "I work as a UX researcher at a startup. My main responsibilities are user interviews and usability testing.", sentiment: "neutral" },
  { qId: 2, text: "I was surprised by how intuitive it was — more so than I expected. The onboarding in particular felt very smooth.", sentiment: "positive" },
  { qId: 3, text: "The pricing felt a little steep. It would be great to have a team plan, and I'd love more options for data export.", sentiment: "negative" },
  { qId: 4, text: "I'd say it saves an enormous amount of time. Before, just organizing notes used to take two or three hours.", sentiment: "positive" },
  { qId: 5, text: "Keep up the great work. I think this is exactly the kind of service the research industry needs.", sentiment: "positive" },
];

// ─── Panel Board Mock Data ───
export const PANEL_JOBS = [
  { id: 1, title: "App Usability Interview", company: "Fintech Startup A", duration: "~10 min", reward: "$3", conditions: ["Ages 20–40", "Smartphone app users"], deadline: "2026.04.15", filled: 187, total: 300, category: "Tech", urgent: true, matchTags: ["Tech/IT", "Finance/Investment"], ageRange: [20,40],
    description: "We're validating the onboarding flow and core feature usability of an upcoming mobile payment app. Please share your honest thoughts on friction points, intuitiveness, and trustworthiness.",
    targetProfile: { age: "20–40", gender: "Any", region: "Nationwide", lifestyle: "Uses a financial app on smartphone at least once a week", exclude: "Excludes finance industry employees" } },
  { id: 2, title: "New Product Brand Perception Study", company: "Beauty Brand B", duration: "~15 min", reward: "$5", conditions: ["Women ages 20–35", "Interested in beauty products"], deadline: "2026.04.20", filled: 312, total: 500, category: "Beauty", urgent: false, matchTags: ["Beauty/Fashion"], ageRange: [20,35], genderMatch: "Female",
    description: "We're surveying consumer awareness and purchase intent before launching a new skincare line. Please share your honest thoughts on your beauty product selection criteria and brand preferences.",
    targetProfile: { age: "20–35", gender: "Female", region: "Metro areas preferred (nationwide OK)", lifestyle: "Purchases beauty products at least once a month", exclude: "Excludes beauty industry employees" } },
  { id: 3, title: "Streaming Service Satisfaction Interview", company: "Entertainment Co. C", duration: "~8 min", reward: "$2", conditions: ["All ages", "Has streamed content"], deadline: "2026.04.12", filled: 91, total: 100, category: "Media", urgent: true, matchTags: ["Media/Entertainment"], ageRange: [10,60],
    description: "We're exploring usage patterns and satisfaction with major streaming platforms (Netflix, HBO Max, etc.). We'd love your honest opinions on why you subscribe or cancel, content satisfaction, and pricing.",
    targetProfile: { age: "All ages", gender: "Any", region: "Nationwide", lifestyle: "Currently subscribed to a streaming service or subscribed within the past 6 months", exclude: "Excludes broadcast/media industry employees" } },
  { id: 4, title: "Grocery Shopping Behavior Interview", company: "Food Company D", duration: "~12 min", reward: "$4", conditions: ["Ages 30–50", "Online grocery shopper (weekly+)"], deadline: "2026.04.25", filled: 78, total: 400, category: "Food", urgent: false, matchTags: ["Food/Dining", "Shopping/Retail"], ageRange: [30,50],
    description: "We're researching online grocery purchasing behavior and brand preferences, with a focus on households with children who shop online 3+ times per week.",
    targetProfile: { age: "30–50", gender: "Any (households with children preferred)", region: "Metro areas preferred", lifestyle: "Uses online grocery delivery (Amazon Fresh, Instacart, etc.) at least once a week. Households with children preferred.", exclude: "Excludes food/retail industry employees" } },
  { id: 5, title: "Banking App UX Research", company: "Bank Subsidiary E", duration: "~20 min", reward: "$8", conditions: ["Ages 25–45", "Mobile banking users"], deadline: "2026.04.18", filled: 143, total: 200, category: "Finance", urgent: false, matchTags: ["Finance/Investment", "Tech/IT"], ageRange: [25,45],
    description: "We're evaluating the UX of asset management, transfers, and loan inquiry features in a major banking app. Please share specific screens that frustrated you, features you'd like, and comparisons with other apps.",
    targetProfile: { age: "25–45", gender: "Any", region: "Nationwide", lifestyle: "Uses mobile banking at least twice a week and holds at least one savings, deposit, or investment product", exclude: "Excludes current finance/fintech employees" } },
  { id: 6, title: "Online Learning Platform Experience Study", company: "EdTech Co. F", duration: "~10 min", reward: "$3.50", conditions: ["Parents or students", "Has taken online courses"], deadline: "2026.04.30", filled: 34, total: 150, category: "Education", urgent: false, matchTags: ["Education"], ageRange: [20,50],
    description: "We're studying learning experiences on online education platforms (Coursera, Udemy, Skillshare, etc.). We're exploring course selection criteria, completion rates, and satisfaction drivers to improve the platform.",
    targetProfile: { age: "Students (middle/high/college) or parents ages 30–50", gender: "Any", region: "Nationwide", lifestyle: "Has taken an online course within the past year. Parents interested in children's education also welcome.", exclude: "Excludes education professionals (teachers, instructors, tutors)" } },
  { id: 7, title: "Medical AI Diagnostic Tool Evaluation", company: "Healthcare Startup G", duration: "~25 min", reward: "$120", conditions: ["Physicians, nurses, or medical staff", "3+ years clinical experience"], deadline: "2026.04.22", filled: 18, total: 50, category: "Expert", urgent: false, expert: true, expertTag: "Medical", matchTags: ["Medical/Healthcare"], ageRange: [25,60], jobMatch: ["Professional (doctor/lawyer/accountant)"],
    description: "We're evaluating the clinical applicability of an AI-assisted radiology diagnostic solution. We're seeking expert opinions on AI tool acceptance, trust criteria, and workflow integration considerations in clinical settings.",
    targetProfile: { age: "25–60", gender: "Any", region: "Nationwide", lifestyle: "Active physician, nurse, or radiologist with 3+ years of clinical experience", exclude: "Excludes medical device and healthcare startup employees" } },
  { id: 8, title: "Startup Investment Decision Process Interview", company: "VC Research H", duration: "~30 min", reward: "$200", conditions: ["VC, angel investors, or analysts", "Has executed investments"], deadline: "2026.04.18", filled: 7, total: 30, category: "Expert", urgent: true, expert: true, expertTag: "Investment", matchTags: ["Finance/Investment"], ageRange: [25,55], jobMatch: ["Professional (doctor/lawyer/accountant)", "Corporate employee (large/mid-size)"],
    description: "We're researching decision-making frameworks and due diligence processes in early-stage startup investing. We're seeking insights on actual investment cases, rejection criteria, and how team, market, and technology are weighted.",
    targetProfile: { age: "25–55", gender: "Any", region: "Nationwide (Seoul/Pangyo focus)", lifestyle: "VC, CVC, or accelerator analyst, or angel investor who has directly executed at least one investment", exclude: "Excludes founders and startup CEOs" } },
  { id: 9, title: "Legal SaaS Usability Review", company: "LegalTech Co. I", duration: "~20 min", reward: "$150", conditions: ["Attorneys, paralegals, or law clerks", "Corporate legal experience"], deadline: "2026.04.28", filled: 11, total: 40, category: "Expert", urgent: false, expert: true, expertTag: "Legal", matchTags: ["Legal/Tax"], ageRange: [25,55], jobMatch: ["Professional (doctor/lawyer/accountant)"],
    description: "We're reviewing the corporate legal applicability of a contract review and legal research SaaS. We're seeking expert opinions on current legal document workflows, barriers to adopting AI tools, and pricing benchmarks.",
    targetProfile: { age: "25–55", gender: "Any", region: "Nationwide", lifestyle: "Practicing attorney, paralegal, or corporate legal team member whose primary work involves contracts and legal documents", exclude: "Excludes legal IT solution developers and sales staff" } },
  { id: 10, title: "B2B SaaS Procurement Decision Interview", company: "Enterprise Co. J", duration: "~20 min", reward: "$80", conditions: ["IT procurement leads, CTOs, or managers+", "Has led software adoption"], deadline: "2026.05.02", filled: 29, total: 100, category: "Expert", urgent: false, expert: true, expertTag: "Enterprise IT", matchTags: ["Tech/IT"], ageRange: [30,55], jobMatch: ["Corporate employee (large/mid-size)", "Corporate employee (small/medium)"],
    description: "We're researching the SaaS procurement decision process and evaluation criteria in enterprises. We're exploring the decision flow from RFP through vendor comparison and contract, internal approval structures, and post-adoption ROI measurement.",
    targetProfile: { age: "30–55", gender: "Any", region: "Nationwide (metro preferred)", lifestyle: "IT procurement lead, CTO, or manager+ at a company with 50+ employees who has directly decided or strongly influenced a SaaS/software adoption", exclude: "Excludes SaaS vendors and IT solution sales staff" } },
];

// Panelist user profile (demo) — in production, fetched from Supabase
export const MOCK_PANEL_PROFILE = {
  age: "30s",
  gender: "Male",
  job: "Corporate employee (large/mid-size)",
  interests: ["Tech/IT", "Finance/Investment", "Media/Entertainment"],
};

export function getMatchScore(job, profile) {
  let score = 0;
  // Interest match (most important)
  const interestMatch = job.matchTags?.some(t => profile.interests.includes(t));
  if (interestMatch) score += 3;
  // Age match
  if (job.ageRange) {
    const ageNum = parseInt(profile.age);
    if (!isNaN(ageNum) && ageNum >= job.ageRange[0] && ageNum <= job.ageRange[1]) score += 2;
  }
  // Gender match (no restriction = +1, match = +1)
  if (!job.genderMatch) score += 1;
  else if (job.genderMatch === profile.gender) score += 1;
  // Job match
  if (job.jobMatch?.includes(profile.job)) score += 2;
  return score;
}

export const PANEL_APPLICANTS = [
  { id: 1, name: "K. Kim", age: "30s", gender: "Female", applied: "2026.04.07 14:32", status: "Applied", score: 92, intv: 3 },
  { id: 2, name: "J. Lee", age: "20s", gender: "Male", applied: "2026.04.07 15:10", status: "Qualified", score: 88, intv: 1 },
  { id: 3, name: "S. Park", age: "40s", gender: "Female", applied: "2026.04.07 16:44", status: "Qualified", score: 95, intv: 7 },
  { id: 4, name: "M. Choi", age: "30s", gender: "Male", applied: "2026.04.08 09:12", status: "Applied", score: 74, intv: 0 },
  { id: 5, name: "Y. Jung", age: "20s", gender: "Female", applied: "2026.04.08 10:03", status: "Not Qualified", score: 45, intv: 2 },
  { id: 6, name: "T. Kang", age: "50s", gender: "Male", applied: "2026.04.08 11:20", status: "Completed", score: 91, intv: 5 },
  { id: 7, name: "H. Yoon", age: "30s", gender: "Female", applied: "2026.04.08 13:05", status: "Applied", score: 83, intv: 4 },
];

export const FAQ_DATA = [
  {
    category: "Using the Service",
    items: [
      {
        q: "What is Voice Survey?",
        a: "Voice Survey is a user research platform where AI takes on the role of interviewer, conducting simultaneous voice and text interviews with hundreds of panelists and automatically analyzing and summarizing the results."
      },
      {
        q: "How are interviews conducted?",
        a: "The researcher sets up a question scenario, and AI delivers those questions to panelists via voice or text. Responses are collected in real time, and after the interview AI generates a report with key insights and statistics."
      },
      {
        q: "How many people can be interviewed simultaneously?",
        a: "It depends on your plan. The Pro plan supports up to 300 simultaneous interviews per session, and the Enterprise plan has no limit."
      },
      {
        q: "When will I receive the interview results report?",
        a: "An AI analysis report is typically generated within 5–10 minutes after the last panelist completes their response. Reports can be viewed on the dashboard or exported as a PDF."
      },
    ]
  },
  {
    category: "Billing / Pricing",
    items: [
      {
        q: "Can I try it for free?",
        a: "Yes. The free plan allows up to 3 interviews per month, with a maximum of 10 responses per interview and a basic AI report included."
      },
      {
        q: "What plans are available?",
        a: "There are three plans: Free, Pro ($149/mo), and Enterprise (contact us). The Pro plan is 20% off with annual billing. See the Pricing page for a detailed comparison."
      },
      {
        q: "What payment methods are supported?",
        a: "We support credit/debit cards (via Stripe), Kakao Pay, and Naver Pay. Invoiced payment (bank transfer) is also available for enterprise customers who need receipts."
      },
      {
        q: "What is your refund policy?",
        a: "A full refund is available within 7 days of payment if no interviews have been conducted. After that, a prorated refund for the remaining period applies."
      },
    ]
  },
  {
    category: "Panelist Participation / Rewards",
    items: [
      {
        q: "How do I participate as a panelist?",
        a: "Sign up through the Panelist menu, then browse the interview board and select an interview you'd like to join. No special qualifications are required — anyone can apply."
      },
      {
        q: "How are rewards paid out?",
        a: "Rewards are paid within 24 hours of completing an interview, to your registered bank account or as a digital gift card. The reward amount is listed on each interview posting."
      },
      {
        q: "What happens if I leave an interview partway through?",
        a: "Rewards are only paid for fully completed interviews. If you exit early, no reward is issued. Re-participation depends on the researcher's settings."
      },
      {
        q: "What is the panelist quality policy?",
        a: "To protect interview quality, we operate a quality warning system. The following behaviors result in cumulative warnings, and accounts with 3 or more warnings are suspended:\n\n• Low-effort, off-topic, or trolling responses\n• Dropping out mid-interview without valid reason (3+ times)\n• Duplicate responses or falsifying eligibility\n\nYou can view your warning history in your account. To appeal, please contact support. During a suspension, new interview applications and reward payments are restricted."
      },
    ]
  },
  {
    category: "Technical / Account",
    items: [
      {
        q: "Which devices and browsers are supported?",
        a: "Both desktop and mobile are supported. We recommend the latest versions of Chrome, Safari, or Edge. Microphone permission is required for voice interviews."
      },
      {
        q: "Is my interview data kept secure?",
        a: "All data is encrypted at rest. Personal information is not shared with researchers after interview completion. See our Privacy Policy for details."
      },
      {
        q: "I forgot my password.",
        a: "Click 'Forgot password' on the login screen and a reset link will be sent to your registered email. If you signed up with a social login, manage your account through that provider."
      },
    ]
  },
];

export const FAQ_DATA_KO = [
  {
    category: "서비스 이용",
    items: [
      { q: "보이스서베이란 무엇인가요?", a: "보이스서베이는 AI가 인터뷰어 역할을 맡아 수백 명의 패널리스트에게 동시에 음성 및 텍스트 인터뷰를 진행하고, 결과를 자동으로 분석·요약하는 사용자 조사 플랫폼입니다." },
      { q: "인터뷰는 어떻게 진행되나요?", a: "연구자가 질문 시나리오를 설정하면, AI가 패널리스트에게 음성 또는 텍스트로 질문을 전달합니다. 응답은 실시간으로 수집되고, 인터뷰가 끝나면 AI가 핵심 인사이트와 통계가 담긴 리포트를 생성합니다." },
      { q: "몇 명을 동시에 인터뷰할 수 있나요?", a: "플랜에 따라 달라요. Pro 플랜은 세션당 최대 300명, Enterprise 플랜은 제한 없이 동시 인터뷰할 수 있어요." },
      { q: "인터뷰 결과 리포트는 언제 받을 수 있나요?", a: "마지막 패널리스트가 응답을 완료한 후 보통 5~10분 내에 AI 분석 리포트가 만들어져요. 대시보드에서 확인하거나 PDF로 내보낼 수 있어요." },
    ]
  },
  {
    category: "결제 / 요금",
    items: [
      { q: "무료로 체험할 수 있나요?", a: "네. 무료 플랜에서는 월 최대 3회 인터뷰가 가능하며, 인터뷰당 최대 10개 응답과 기본 AI 리포트를 드려요." },
      { q: "어떤 플랜이 있나요?", a: "Free, Pro(월 $149), Enterprise(문의 필요) 세 가지 플랜이 있어요. Pro 플랜은 연간 결제 시 20% 할인돼요. 자세한 비교는 요금제 페이지를 확인하세요." },
      { q: "어떤 결제 수단을 지원하나요?", a: "신용/체크카드(Stripe), 카카오페이, 네이버페이를 지원해요. 영수증이 필요한 기업 고객에게는 계좌이체(세금계산서 발행)도 할 수 있어요." },
      { q: "환불 정책이 어떻게 되나요?", a: "결제 후 7일 이내, 인터뷰가 진행되지 않은 경우 전액 환불돼요. 이후에는 잔여 기간에 대한 일할 환불이 적용돼요." },
    ]
  },
  {
    category: "패널 참여 / 보상",
    items: [
      { q: "패널리스트로 어떻게 참여할 수 있나요?", a: "패널리스트 메뉴에서 회원가입 후, 인터뷰 보드를 탐색해 원하는 인터뷰를 신청하면 돼요. 특별한 자격 요건 없이 누구나 지원할 수 있어요." },
      { q: "보상은 어떻게 지급되나요?", a: "인터뷰 완료 후 24시간 이내에 등록된 계좌나 디지털 상품권으로 보상을 드려요. 보상 금액은 각 인터뷰 공고에 표시돼 있어요." },
      { q: "인터뷰 도중 나가면 어떻게 되나요?", a: "인터뷰를 완전히 완료해야만 보상이 지급돼요. 중도 이탈 시 보상이 지급되지 않으며, 재참여 여부는 연구자 설정에 따라 달라요." },
      { q: "패널리스트 품질 정책은 무엇인가요?", a: "인터뷰 품질 보호를 위해 품질 경고 시스템을 운영해요. 아래 행동은 누적 경고 대상이며, 3회 이상 경고 시 계정이 정지돼요:\n\n• 성의 없는 답변, 주제 이탈 응답, 도배성 응답\n• 정당한 사유 없는 중도 이탈(3회 이상)\n• 중복 응답 또는 참여 자격 허위 기재\n\n경고 내역은 계정에서 확인할 수 있어요. 이의 신청은 고객 지원팀에 문의해 주세요." },
    ]
  },
  {
    category: "기술 / 계정",
    items: [
      { q: "어떤 기기와 브라우저를 지원하나요?", a: "데스크톱과 모바일 모두 지원해요. Chrome, Safari, Edge 최신 버전을 권장해요. 음성 인터뷰에는 마이크 권한이 필요해요." },
      { q: "인터뷰 데이터는 안전하게 보관되나요?", a: "모든 데이터는 암호화되어 저장돼요. 개인 정보는 인터뷰 완료 후 연구자에게 공유되지 않아요. 자세한 내용은 개인정보처리방침을 확인하세요." },
      { q: "비밀번호를 잊어버렸어요.", a: "로그인 화면에서 '비밀번호 찾기'를 클릭하면 등록된 이메일로 재설정 링크를 보내드려요. 소셜 로그인으로 가입한 경우 해당 서비스를 통해 계정을 관리해 주세요." },
    ]
  },
];
