export const STARTER_PLAN = {
  id: "starter_monthly",
  name: "Voica Starter 월간 구독",
  amount: 59000,
};

export const STARTER_PLAN_YEARLY = {
  id: "starter_yearly",
  name: "Voica Starter 연간 구독",
  amount: 528000, // 44,000 × 12
};

export const PRO_PLAN = {
  id: "pro_monthly",
  name: "Voica Pro 월간 구독",
  amount: 149000,
};

export const PRO_PLAN_YEARLY = {
  id: "pro_yearly",
  name: "Voica Pro 연간 구독",
  amount: 1068000, // 89,000 × 12
};

export const CREDIT_PACKAGES = [
  { id: "credit_100k",  name: "크레딧 100,000원",   amount: 100000,  credits: 100000 },
  { id: "credit_300k",  name: "크레딧 300,000원",   amount: 300000,  credits: 300000 },
  { id: "credit_1m",    name: "크레딧 1,000,000원", amount: 1000000, credits: 1000000 },
];

export function getCreditPackageById(id) {
  return CREDIT_PACKAGES.find(p => p.id === id) ?? null;
}

const ALL_PLANS = [STARTER_PLAN, STARTER_PLAN_YEARLY, PRO_PLAN, PRO_PLAN_YEARLY];
export function getPlanById(id) {
  return ALL_PLANS.find(p => p.id === id) ?? null;
}
