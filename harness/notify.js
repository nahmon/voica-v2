const BASE = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

async function sendMessage(chatId, replyToMessageId, text) {
  const res = await fetch(`${BASE()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_to_message_id: replyToMessageId,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function notify(chatId, replyToMessageId, resultUrl, success) {
  const text = success
    ? `✅ 완료\n${resultUrl}`
    : `❌ 실패\n로그를 확인해주세요.`

  try {
    await sendMessage(chatId, replyToMessageId, text)
  } catch (err) {
    console.error('[notify] 1차 실패:', err.message)
    // 1회 재시도
    await new Promise((r) => setTimeout(r, 2000))
    try {
      await sendMessage(chatId, replyToMessageId, text)
    } catch (err2) {
      console.error('[notify] 재시도 실패:', err2.message)
    }
  }
}
