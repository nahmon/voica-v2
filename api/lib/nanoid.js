import { randomBytes } from "crypto";

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function nanoid(len = 12) {
  return Array.from(randomBytes(len), b => CHARS[b % CHARS.length]).join("");
}
