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
