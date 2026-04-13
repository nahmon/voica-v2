// harness/dispatcher.js
import 'dotenv/config'
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

  // pending 상태인 경우에만 atomic claim (running은 이미 claim된 것)
  if (task.status === 'pending') {
    const { data: claimed } = await supabase
      .from('agent_tasks')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', task.id)
      .eq('status', 'pending')
      .select('id')
    if (!claimed?.length) return  // 다른 쪽에서 이미 처리 중
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

// 시작 시 이전 실행에서 중단된 running 태스크를 failed로 정리
await supabase
  .from('agent_tasks')
  .update({ status: 'failed', error_msg: 'harness restart', done_at: new Date().toISOString() })
  .eq('status', 'running')

// 시작 시 오프라인 동안 쌓인 pending 처리
await drainPending()

// Telegram long polling
async function pollTelegram() {
  let offset = 0
  const token = process.env.TELEGRAM_BOT_TOKEN
  console.log('[poll] Telegram 폴링 시작')

  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`,
        { signal: AbortSignal.timeout(40000) }
      )
      const { ok, result } = await res.json()
      if (!ok || !result?.length) continue

      for (const update of result) {
        offset = update.update_id + 1
        const message = update.message
        if (!message?.text) continue

        const msgId = String(message.message_id)
        const { data: existing } = await supabase
          .from('agent_tasks')
          .select('id')
          .eq('tg_message_id', msgId)
          .maybeSingle()
        if (existing) continue

        const { error } = await supabase.from('agent_tasks').insert({
          instruction: message.text,
          tg_chat_id: String(message.chat?.id ?? ''),
          tg_message_id: msgId,
          status: 'pending',
        })
        if (error) console.error('[poll] insert failed:', error)
        else console.log('[poll] 태스크 등록:', message.text.slice(0, 60))
      }
    } catch (err) {
      console.error('[poll] 오류:', err.message)
      await new Promise((r) => setTimeout(r, 5000))
    }
  }
}

console.log(`[harness] 디스패처 실행 중. MAX_PARALLEL=${MAX_PARALLEL}`)
pollTelegram()
