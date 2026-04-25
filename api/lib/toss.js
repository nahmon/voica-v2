const TOSS_API_BASE = "https://api.tosspayments.com/v1";

function basicAuth() {
  return "Basic " + Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString("base64");
}

async function tossRequest(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: { Authorization: basicAuth(), "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${TOSS_API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || "Toss API error");
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function issueBillingKey(authKey, customerKey) {
  return tossRequest("/billing/authorizations/issue", "POST", { authKey, customerKey });
}

export async function chargeBillingKey({ billingKey, customerKey, orderId, orderName, amount, customerEmail }) {
  return tossRequest(`/billing/${billingKey}`, "POST", {
    customerKey, orderId, orderName, amount, customerEmail, taxFreeAmount: 0,
  });
}

export async function confirmPayment({ paymentKey, orderId, amount }) {
  return tossRequest("/payments/confirm", "POST", { paymentKey, orderId, amount });
}
