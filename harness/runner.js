// harness/runner.js
import { spawn } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import { notify } from './notify.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function runTask(task) {
  await supabase
    .from('agent_tasks')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', task.id)

  const prompt =
    `/team 5 "${task.instruction}. ` +
    `결과는 GitHub에 커밋하고 완료 시 결과 URL(GitHub PR 또는 커밋 링크)을 stdout 마지막 줄에 단독으로 출력해줘."`

  let output = ''

  const proc = spawn(
    '/opt/homebrew/bin/claude',
    ['-p', prompt, '--allowedTools', 'all'],
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

  return new Promise((resolve) => {
    proc.on('close', async (code) => {
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

      await notify(task.tg_chat_id, task.tg_message_id, resultUrl, success)
      resolve()
    })
  })
}
