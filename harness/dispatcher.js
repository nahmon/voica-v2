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
  .subscribe((status) => {
    console.log('[realtime] 구독 상태:', status)
  })

// 시작 시 오프라인 동안 쌓인 pending 처리
await drainPending()

console.log(`[harness] 디스패처 실행 중. MAX_PARALLEL=${MAX_PARALLEL}`)
