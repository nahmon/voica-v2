// harness/runner.js
import { spawn } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import { notify, sendUpdate } from './notify.js'
import { postToNotion } from './notion.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function wantsNotion(instruction) {
  return /notion/i.test(instruction)
}

export async function runTask(task) {
  await supabase
    .from('agent_tasks')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', task.id)

  // 시작 알림
  await sendUpdate(
    task.tg_chat_id,
    task.tg_message_id,
    `🔄 작업 시작\n${task.instruction.slice(0, 80)}`
  )

  const prompt =
    `/team 5 "${task.instruction}. ` +
    `결과는 GitHub에 커밋하고 완료 시 결과 URL(GitHub PR 또는 커밋 링크)을 stdout 마지막 줄에 단독으로 출력해줘."`

  let output = ''

  const proc = spawn(
    '/opt/homebrew/bin/claude',
    ['-p', prompt, '--allowedTools', 'all', '--dangerously-skip-permissions'],
    {
      cwd: process.env.WORKSPACE_DIR ?? process.env.HOME,
      env: process.env,
    }
  )

  proc.stdout.on('data', (chunk) => {
    output += chunk.toString()
    process.stdout.write(chunk)
  })

  proc.stderr.on('data', (chunk) => {
    process.stderr.write(chunk)
  })

  // 60초마다 진행 상황 Telegram 전송
  let lastSent = ''
  const progressInterval = setInterval(async () => {
    const recent = output.slice(-300).trim()
    if (recent && recent !== lastSent) {
      lastSent = recent
      await sendUpdate(
        task.tg_chat_id,
        task.tg_message_id,
        `⏳ 진행 중...\n${recent.slice(0, 300)}`
      )
    }
  }, 60000)

  return new Promise((resolve) => {
    proc.on('close', async (code) => {
      clearInterval(progressInterval)

      const lines = output.trim().split('\n').filter(Boolean)
      const resultUrl = lines[lines.length - 1] ?? ''
      const success = code === 0

      const { error } = await supabase
        .from('agent_tasks')
        .update({
          status: success ? 'done' : 'failed',
          result_url: success ? resultUrl : null,
          error_msg: success ? null : `exit code ${code}`,
          done_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (error) console.error('[runner] update failed:', error)

      // Notion 업로드 (지시문에 "notion" 포함 시)
      if (success && wantsNotion(task.instruction)) {
        try {
          const notionUrl = await postToNotion(task.instruction, resultUrl, output.slice(-3000))
          await notify(task.tg_chat_id, task.tg_message_id, resultUrl, true)
          await sendUpdate(task.tg_chat_id, task.tg_message_id, `📝 Notion 저장 완료\n${notionUrl}`)
        } catch (err) {
          console.error('[runner] notion failed:', err.message)
          await notify(task.tg_chat_id, task.tg_message_id, resultUrl, true)
        }
      } else {
        await notify(task.tg_chat_id, task.tg_message_id, resultUrl, success)
      }

      resolve()
    })
  })
}
