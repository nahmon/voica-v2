export const PRO_PLAN = {
  id: "pro_monthly",
  name: "Voica Pro 월간 구독",
  amount: 199000,
};

export const PRO_PLAN_YEARLY = {
  id: "pro_yearly",
  name: "Voica Pro 연간 구독",
  amount: 1908000, // 159,000 × 12
};

export const CREDIT_PACKAGES = [
  { id: "credit_100k",  name: "크레딧 100,000원",   amount: 100000,  credits: 100000 },
  { id: "credit_300k",  name: "크레딧 300,000원",   amount: 300000,  credits: 300000 },
  { id: "credit_1m",    name: "크레딧 1,000,000원", amount: 1000000, credits: 1000000 },
];

export function getCreditPackageById(id) {
  return CREDIT_PACKAGES.find(p => p.id === id) ?? null;
}
