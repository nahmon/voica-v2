import { rateLimit, getIp } from "./_rateLimit.js";
import { sendSlack } from "./lib/slack.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!rateLimit(`support:${getIp(req)}`, 5)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const { category, email, subject, body } = req.body ?? {};
  if (!category || !email || !subject || !body) {
    return res.status(400).json({ error: "All fields required" });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  if (body.length > 2000) return res.status(400).json({ error: "Body too long" });

  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    await sendSlack(
      slackWebhook,
      `📨 문의 접수\n유형: ${category}\n이메일: ${email}\n제목: ${subject}\n\n${body}`
    ).catch(() => {});
  }

  return res.status(200).json({ ok: true });
}
