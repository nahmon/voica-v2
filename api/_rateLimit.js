// Simple in-memory rate limiter (per Vercel function instance)
// Resets on cold start — good enough for burst protection without external deps.
const store = new Map();
const WINDOW_MS = 60_000;

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param {string} key  — e.g. IP address or "ip:endpoint"
 * @param {number} max  — max requests per WINDOW_MS (default 30)
 */
export function rateLimit(key, max = 30) {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count++;
  store.set(key, entry);
  return entry.count <= max;
}

/** Extract best-effort IP from Vercel request headers */
export function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ??
    req.socket?.remoteAddress ??
    "unknown"
  );
}
