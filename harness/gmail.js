// harness/gmail.js
import nodemailer from 'nodemailer'

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function transporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function sendGmail(instruction, resultUrl, content) {
  const safeInstruction = escapeHtml(instruction)
  const safeResultUrl = escapeHtml(resultUrl)
  const safeContent = escapeHtml(String(content ?? '').slice(0, 5000))
  const displayUrl = safeResultUrl || '없음'
  const hrefUrl = resultUrl ? safeResultUrl : '#'

  await transporter().sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: `[Harness] ${String(instruction ?? '').slice(0, 60)}`,
    html: `
      <h2>${safeInstruction}</h2>
      <p><strong>결과 URL:</strong> <a href="${hrefUrl}">${displayUrl}</a></p>
      <hr/>
      <pre style="font-size:13px;white-space:pre-wrap">${safeContent}</pre>
    `,
  })
}
