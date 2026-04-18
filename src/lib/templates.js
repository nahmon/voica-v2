function mkId() { return Math.random().toString(36).slice(2, 10); }

export const TEMPLATES = [
  {
    id: "new_grad",
    title: "Entry-Level Interview",
    desc: "Assess new graduate competencies",
    icon: "🎓",
    questions: [
      { text: "Please give us a brief introduction — your school, major, and key activities.", type: "voice" },
      { text: "What motivated you to apply to our company?", type: "voice" },
      { text: "What would you say is your greatest strength and your biggest area for growth?", type: "voice" },
      { text: "Can you walk us through a time you resolved a conflict within a team?", type: "voice" },
      { text: "What goals would you like to accomplish in your first year with us?", type: "voice" },
    ],
  },
  {
    id: "experienced",
    title: "Experienced Hire Interview",
    desc: "Validate seasoned candidates",
    icon: "💼",
    questions: [
      { text: "Please give a brief overview of your key roles and responsibilities to date.", type: "voice" },
      { text: "What achievement are you most proud of? Please quantify the impact if possible.", type: "voice" },
      { text: "What is the primary reason you are looking to make a change?", type: "voice" },
      { text: "Tell us about a time you delivered results by working with a team of diverse opinions.", type: "voice" },
      { text: "What are your salary expectations, and how did you arrive at that number?", type: "voice" },
    ],
  },
  {
    id: "ux_research",
    title: "UX Research",
    desc: "Product and service usability study",
    icon: "🔍",
    questions: [
      { text: "What was your first impression when you encountered this product?", type: "voice" },
      { text: "Walk us through your actual experience using it — what were you trying to do and how did you go about it?", type: "voice" },
      { text: "Were there any moments where you felt confused or frustrated while using it?", type: "voice" },
      { text: "What feature or aspect would you most like to see improved?", type: "voice" },
      { text: "How likely are you to use this product again?", type: "likert" },
    ],
  },
  {
    id: "csat",
    title: "Customer Satisfaction Survey",
    desc: "NPS + detailed feedback",
    icon: "⭐",
    questions: [
      { text: "How likely are you to recommend this service to a friend or colleague?", type: "likert" },
      { text: "What aspect of the service are you most satisfied with?", type: "voice" },
      { text: "Was there anything that disappointed or frustrated you?", type: "voice" },
      { text: "What improvements would make the biggest difference for you?", type: "voice" },
    ],
  },
  {
    id: "executive",
    title: "Executive Interview",
    desc: "Deep leadership competency assessment",
    icon: "🏢",
    questions: [
      { text: "How would you describe your personal leadership philosophy?", type: "voice" },
      { text: "Tell us about a time you led your organization through an unexpected crisis. How did you handle it?", type: "voice" },
      { text: "Give us a specific example of an initiative you championed to drive innovation within your organization.", type: "voice" },
      { text: "How do you envision yourself and the organization you lead five years from now?", type: "voice" },
      { text: "Do you have any questions for us about the company or the interview process?", type: "voice" },
    ],
  },
];

export function templateToQuestions(template) {
  return template.questions.map(q => {
    const id = mkId();
    if (q.type === "likert") {
      return { id, type: "likert", content: q.text, options: { min: 1, max: 5, labels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] } };
    }
    if (q.type === "mc") {
      return { id, type: "multiple_choice", content: q.text, options: q.options ?? ["", "", ""] };
    }
    return { id, type: "voice", content: q.text };
  });
}
