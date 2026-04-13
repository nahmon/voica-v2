// harness/dispatcher.js
import 'dotenv/config'
import { createServer } from 'http'
import { createClient } from '@supabase/supabase-js'
import { runTask } from './runner.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const MAX_PARALLEL = 3
let activeJobs = 0

async function tryDispatch(task) {
  if (activeJobs >= MAX_PARALLEL) {
    console.log(`[dispatch] 슬롯 초과 (${activeJobs}/${MAX_PARALLEL}), 태스크 ${task.id} 대기`)
    return
  }
  activeJobs++
  console.log(`[dispatch] 시작 task=${task.id} active=${activeJobs} "${task.instruction.slice(0, 60)}"`)

  try {
    await runTask(task)
  } catch (err) {
    console.error(`[dispatch] task ${task.id} 예외:`, err)
  } finally {
    activeJobs--
    console.log(`[dispatch] 완료 task=${task.id} active=${activeJobs}`)
    await drainPending()
  }
}

async function drainPending() {
  if (activeJobs >= MAX_PARALLEL) return
  const { data, error } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('status', 'pending')
    .order('created_at')
    .limit(1)

  if (error) { console.error('[drain] 오류:', error); return }
  if (data?.[0]) await tryDispatch(data[0])
}

// Supabase Realtime 구독
supabase
  .channel('agent-tasks')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'agent_tasks' },
    async (payload) => {
      console.log('[realtime] 새 태스크:', payload.new.id)
      await tryDispatch(payload.new)
    }
  )
  .subscribe(async (status) => {
    console.log('[realtime] 구독 상태:', status)
    if (status === 'SUBSCRIBED') await drainPending()
  })

// 시작 시 오프라인 동안 쌓인 pending 처리
await drainPending()

// Telegram webhook 수신 HTTP 서버 (Vercel 대체)
const PORT = process.env.PORT ?? 3000
createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/telegram-webhook') {
    res.writeHead(200).end('ok')
    return
  }
  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', async () => {
    res.writeHead(200).end('ok')
    try {
      const { message } = JSON.parse(body)
      if (!message?.text) return
      const { error } = await supabase.from('agent_tasks').insert({
        instruction: message.text,
        tg_chat_id: String(message.chat?.id ?? ''),
        tg_message_id: String(message?.message_id ?? ''),
        status: 'pending',
      })
      if (error) console.error('[webhook] insert failed:', error)
      else console.log('[webhook] 태스크 등록:', message.text.slice(0, 60))
    } catch (err) {
      console.error('[webhook] parse error:', err.message)
    }
  })
}).listen(PORT, () => {
  console.log(`[webhook] HTTP 서버 포트 ${PORT} 에서 수신 중`)
})

console.log(`[harness] 디스패처 실행 중. MAX_PARALLEL=${MAX_PARALLEL}`)
