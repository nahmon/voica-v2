import { supabase } from "./_supabase.js";

// Fallback in-memory store for when DB is unavailable
const fallback = new Map();
const WINDOW_MS = 60_000;

function fallbackRateLimit(key, max) {
  const now = Date.now();
  let entry = fallback.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count++;
  fallback.set(key, entry);
  return entry.count <= max;
}

/**
 * Supabase-backed rate limiter (global across Vercel instances).
 * Falls back to in-memory if DB call fails (fail open — availability > strict limiting).
 * Returns true if request is allowed, false if rate-limited.
 */
export async function rateLimit(key, max = 30) {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_ms: WINDOW_MS,
    });
    if (error) throw error;
    return data === true;
  } catch {
    return fallbackRateLimit(key, max);
  }
}

/** Extract best-effort IP from Vercel request headers */
export function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ??
    req.socket?.remoteAddress ??
    "unknown"
  );
}
