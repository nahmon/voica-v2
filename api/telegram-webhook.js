// api/telegram-webhook.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const { message } = req.body ?? {}
  if (!message?.text) return res.status(200).end()

  // Telegram 3초 타임아웃 방지: 먼저 응답, 그 다음 삽입
  res.status(200).json({ ok: true })

  const { error } = await supabase.from('agent_tasks').insert({
    instruction: message.text,
    tg_chat_id: String(message.chat?.id ?? ''),
    tg_message_id: String(message.message_id),
    status: 'pending',
  })

  if (error) console.error('[webhook] insert failed:', error)
}
