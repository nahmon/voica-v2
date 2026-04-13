function mkId() { return Math.random().toString(36).slice(2, 10); }

export const TEMPLATES = [
  {
    id: "new_grad",
    title: "신입 공채 면접",
    desc: "신입사원 역량 파악용",
    icon: "🎓",
    questions: [
      { text: "간단하게 자기소개를 해 주세요. 학교, 전공, 주요 활동을 중심으로 말씀해 주세요.", type: "voice" },
      { text: "저희 회사에 지원하신 동기는 무엇인가요?", type: "voice" },
      { text: "본인의 가장 큰 강점과 약점을 각각 하나씩 말씀해 주세요.", type: "voice" },
      { text: "팀 내 갈등이 생겼을 때 어떻게 해결하셨나요? 실제 경험을 말씀해 주세요.", type: "voice" },
      { text: "입사 후 첫 1년 동안 어떤 목표를 달성하고 싶으신가요?", type: "voice" },
    ],
  },
  {
    id: "experienced",
    title: "경력직 면접",
    desc: "경력자 검증용",
    icon: "💼",
    questions: [
      { text: "지금까지 맡으신 주요 직무 경험을 간략하게 설명해 주세요.", type: "voice" },
      { text: "가장 자랑스럽게 생각하는 성과는 무엇인가요? 수치로 설명해 주시면 좋겠습니다.", type: "voice" },
      { text: "이직을 결심하신 가장 큰 이유는 무엇인가요?", type: "voice" },
      { text: "다양한 의견을 가진 팀원들과 함께 성과를 낸 경험이 있으신가요? 구체적으로 말씀해 주세요.", type: "voice" },
      { text: "희망 연봉과 그 근거를 말씀해 주세요.", type: "voice" },
    ],
  },
  {
    id: "ux_research",
    title: "UX 리서치",
    desc: "제품/서비스 사용성 조사",
    icon: "🔍",
    questions: [
      { text: "처음 이 제품을 접했을 때 첫인상은 어떠셨나요?", type: "voice" },
      { text: "실제로 사용해 보신 경험을 설명해 주세요. 어떤 상황에서 어떻게 사용하셨나요?", type: "voice" },
      { text: "사용하면서 불편하거나 이해하기 어려웠던 부분이 있었나요?", type: "voice" },
      { text: "어떤 기능이나 부분이 개선됐으면 좋겠나요?", type: "voice" },
      { text: "이 제품을 다시 사용하실 의향이 있으신가요?", type: "likert" },
    ],
  },
  {
    id: "csat",
    title: "고객 만족도 조사",
    desc: "NPS + 상세 피드백",
    icon: "⭐",
    questions: [
      { text: "이 서비스를 지인에게 추천할 의향이 있으신가요?", type: "likert" },
      { text: "서비스에서 가장 만족스러운 점은 무엇인가요?", type: "voice" },
      { text: "아쉽거나 실망스러웠던 점이 있다면 말씀해 주세요.", type: "voice" },
      { text: "앞으로 어떤 점이 개선됐으면 좋겠나요?", type: "voice" },
    ],
  },
  {
    id: "executive",
    title: "임원 면접",
    desc: "리더십 역량 심층 검증",
    icon: "🏢",
    questions: [
      { text: "리더십에 대한 본인만의 철학을 말씀해 주세요.", type: "voice" },
      { text: "예상치 못한 위기 상황에서 조직을 이끈 경험이 있으신가요? 어떻게 대처하셨나요?", type: "voice" },
      { text: "조직 내 혁신을 주도한 사례를 구체적으로 말씀해 주세요.", type: "voice" },
      { text: "5년 후 본인과 조직의 모습을 어떻게 그리고 계신가요?", type: "voice" },
      { text: "마지막으로 저희 회사나 면접 과정에서 궁금하신 점이 있으신가요?", type: "voice" },
    ],
  },
];

export function templateToQuestions(template) {
  return template.questions.map(q => {
    const id = mkId();
    if (q.type === "likert") {
      return { id, type: "likert", content: q.text, options: { min: 1, max: 5, labels: ["매우 아니다", "아니다", "보통", "그렇다", "매우 그렇다"] } };
    }
    if (q.type === "mc") {
      return { id, type: "multiple_choice", content: q.text, options: q.options ?? ["", "", ""] };
    }
    return { id, type: "voice", content: q.text };
  });
}
