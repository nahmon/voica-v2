export const STARTER_PLAN = {
  id: "starter_monthly",
  name: "Voica Starter 월간 구독",
  amount: 690000,
};

export const STARTER_PLAN_YEARLY = {
  id: "starter_yearly",
  name: "Voica Starter 연간 구독",
  amount: 7452000, // 621,000 × 12 (10% off)
};

export const PRO_PLAN = {
  id: "pro_monthly",
  name: "Voica Pro 월간 구독",
  amount: 1690000,
};

export const PRO_PLAN_YEARLY = {
  id: "pro_yearly",
  name: "Voica Pro 연간 구독",
  amount: 18252000, // 1,521,000 × 12 (10% off)
};

// 인터뷰 건 단위 단건 결제
export const CREDIT_PACKAGES = [
  { id: "interview_1",  name: "인터뷰 1건",  amount: 280000,  credits: 1 },
  { id: "interview_3",  name: "인터뷰 3건",  amount: 795000,  credits: 3 },
  { id: "interview_5",  name: "인터뷰 5건",  amount: 1275000, credits: 5 },
  { id: "interview_10", name: "인터뷰 10건", amount: 2380000, credits: 10 },
];

export function getCreditPackageById(id) {
  return CREDIT_PACKAGES.find(p => p.id === id) ?? null;
}

const ALL_PLANS = [STARTER_PLAN, STARTER_PLAN_YEARLY, PRO_PLAN, PRO_PLAN_YEARLY];
export function getPlanById(id) {
  return ALL_PLANS.find(p => p.id === id) ?? null;
}
