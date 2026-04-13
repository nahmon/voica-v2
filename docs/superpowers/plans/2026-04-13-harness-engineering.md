# Harness Engineering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Telegram으로 지시하면 Opus 팀장 + Sonnet 워커 5명이 24/7 작업을 처리하고 GitHub에 결과를 커밋하는 AI 에이전트 오케스트레이션 시스템을 구축한다.

**Architecture:** Vercel webhook이 Telegram 메시지를 Supabase `agent_tasks` 큐에 삽입한다. Mac Mini의 PM2 데몬(dispatcher.js)이 Supabase Realtime으로 즉시 수신해 `claude -p /team 5 ...` 서브프로세스를 실행한다. Claude Code의 `/team` 스킬이 내부 오케스트레이션을 담당하고 완료 시 GitHub URL을 stdout 마지막 줄에 출력한다.

**Tech Stack:** Node.js 24 (ESM), Supabase JS v2, Vercel Serverless, PM2, Claude Code CLI (`claude`), Telegram Bot API

---

## File Map

| 파일 | 역할 |
|------|------|
| `supabase/migrations/003_agent_tasks.sql` | agent_tasks 테이블 + Realtime 활성화 |
| `api/telegram-webhook.js` | Vercel: Telegram 메시지 수신 → Supabase INSERT |
| `harness/package.json` | Mac Mini 디스패처 Node 프로젝트 |
| `harness/.env.example` | 필수 환경변수 템플릿 |
| `harness/notify.js` | Telegram 완료 알림 전송 |
| `harness/runner.js` | `claude -p` 서브프로세스 실행 + 결과 저장 |
| `harness/dispatcher.js` | Supabase Realtime 구독 + 태스크 디스패치 |
| `harness/ecosystem.config.cjs` | PM2 프로세스 설정 |

---

## Task 1: Supabase 마이그레이션

**Files:**
- Create: `supabase/migrations/003_agent_tasks.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- supabase/migrations/003_agent_tasks.sql
create table if not exists agent_tasks (
  id             uuid        primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  status         text        not null default 'pending'
                             check (status in ('pending','running','done','failed')),
  instruction    text        not null,
  tg_chat_id     text        not null,
  tg_message_id  text        not null,
  result_url     text,
  error_msg      text,
  started_at     timestamptz,
  done_at        timestamptz
);

-- 디스패처 시작 시 pending 재조회 인덱스
create index on agent_tasks (status, created_at)
  where status = 'pending';

-- Realtime 활성화
alter publication supabase_realtime add table agent_tasks;
```

- [ ] **Step 2: Supabase 대시보드에서 마이그레이션 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 붙여넣기 → Run

확인: Table Editor에서 `agent_tasks` 테이블이 보이면 성공.

- [ ] **Step 3: Realtime 활성화 확인**

Supabase 대시보드 → Database → Replication → `agent_tasks`가 `supabase_realtime` publication에 포함되어 있는지 확인.

- [ ] **Step 4: 커밋**

```bash
cd /Users/mh/voica-v2
git add supabase/migrations/003_agent_tasks.sql
git commit -m "feat: add agent_tasks table with realtime"
```

---

## Task 2: Vercel Telegram Webhook

**Files:**
- Create: `api/telegram-webhook.js`

- [ ] **Step 1: webhook 파일 생성**

```javascript
// api/telegram-webhook.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message } = req.body ?? {}
  if (!message?.text) return res.status(200).end()

  // Telegram 3초 타임아웃 방지: 먼저 응답, 그 다음 삽입
  res.status(200).json({ ok: true })

  const { error } = await supabase.from('agent_tasks').insert({
    instruction: message.text,
    tg_chat_id: String(message.chat.id),
    tg_message_id: String(message.message_id),
    status: 'pending',
  })

  if (error) console.error('[webhook] insert failed:', error)
}
```

- [ ] **Step 2: Vercel 환경변수 확인**

Vercel 대시보드 → voica 프로젝트 → Settings → Environment Variables에
`SUPABASE_SERVICE_KEY` (service_role 키, anon 키 아님)가 있는지 확인.
없으면 Supabase → Project Settings → API → service_role 키 복사해서 추가.

- [ ] **Step 3: 배포 및 동작 확인**

```bash
cd /Users/mh/voica-v2
git add api/telegram-webhook.js
git commit -m "feat: add telegram webhook endpoint"
git push
```

Vercel 배포 완료 후 curl로 테스트:
```bash
curl -X POST https://voica.vercel.app/api/telegram-webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"테스트","chat":{"id":123},"message_id":1}}'
```

Expected: `{"ok":true}`
Supabase Table Editor에서 `agent_tasks`에 새 행이 status=pending으로 삽입됐는지 확인.

---

## Task 3: Telegram Bot Webhook 등록

- [ ] **Step 1: Bot Token 확인**

@BotFather에서 토큰 확인. 없으면 `/newbot` 으로 생성.

- [ ] **Step 2: Webhook 등록**

```bash
BOT_TOKEN="여기에_봇_토큰"
curl "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=https://voica.vercel.app/api/telegram-webhook"
```

Expected 응답:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

- [ ] **Step 3: Webhook 확인**

```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

`"url": "https://voica.vercel.app/api/telegram-webhook"` 확인.

- [ ] **Step 4: 실제 Telegram 메시지 테스트**

봇에게 "안녕" 메시지 전송 → Supabase Table Editor에서 `agent_tasks`에 새 행 확인.

---

## Task 4: Harness 프로젝트 초기화

**Files:**
- Create: `harness/package.json`
- Create: `harness/.env.example`

- [ ] **Step 1: harness 디렉토리 및 package.json 생성**

```bash
mkdir -p /Users/mh/voica-v2/harness/logs
```

```json
// harness/package.json
{
  "name": "harness",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node dispatcher.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.103.0",
    "dotenv": "^16.4.0"
  }
}
```

- [ ] **Step 2: .env.example 생성**

```bash
# harness/.env.example
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
TELEGRAM_BOT_TOKEN=
GITHUB_TOKEN=
# claude -p 실행 시 작업 디렉토리 (기본값: $HOME)
WORKSPACE_DIR=/Users/mh/voica-v2
```

- [ ] **Step 3: .env 파일 생성 및 실제 값 입력**

```bash
cp /Users/mh/voica-v2/harness/.env.example /Users/mh/voica-v2/harness/.env
# .env 파일에 실제 값 입력
```

- [ ] **Step 4: .gitignore에 .env 추가 확인**

```bash
grep -q "harness/.env" /Users/mh/voica-v2/.gitignore || \
  echo "harness/.env" >> /Users/mh/voica-v2/.gitignore
```

- [ ] **Step 5: 의존성 설치**

```bash
cd /Users/mh/voica-v2/harness && npm install
```

Expected: `node_modules/` 생성.

- [ ] **Step 6: 커밋**

```bash
cd /Users/mh/voica-v2
git add harness/package.json harness/package-lock.json harness/.env.example .gitignore
git commit -m "feat: initialize harness node project"
```

---

## Task 5: notify.js — Telegram 완료 알림

**Files:**
- Create: `harness/notify.js`

- [ ] **Step 1: notify.js 생성**

```javascript
// harness/notify.js
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
```

- [ ] **Step 2: 동작 확인**

`.env`의 `TELEGRAM_BOT_TOKEN`과 실제 chat_id로 테스트:

```bash
cd /Users/mh/voica-v2/harness
node -e "
import('./notify.js').then(({ notify }) =>
  notify('여기에_chat_id', '1', 'https://github.com/test', true)
)"
```

Expected: Telegram에 `✅ 완료\nhttps://github.com/test` 메시지 수신.

- [ ] **Step 3: 커밋**

```bash
cd /Users/mh/voica-v2
git add harness/notify.js
git commit -m "feat: add telegram notify module"
```

---

## Task 6: runner.js — claude -p 서브프로세스 실행

**Files:**
- Create: `harness/runner.js`

- [ ] **Step 1: runner.js 생성**

```javascript
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

  const safeInstruction = task.instruction.replace(/"/g, '\\"')
  const prompt =
    `/team 5 "${safeInstruction}. ` +
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
    process.stdout.write(chunk) // 로컬 로그용
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
```

- [ ] **Step 2: claude CLI 경로 확인**

```bash
which claude
```

Expected: `/opt/homebrew/bin/claude`
다른 경로라면 runner.js의 `spawn` 첫 번째 인자를 해당 경로로 수정.

- [ ] **Step 3: 커밋**

```bash
cd /Users/mh/voica-v2
git add harness/runner.js
git commit -m "feat: add task runner with claude subprocess"
```

---

## Task 7: dispatcher.js — Supabase Realtime 구독

**Files:**
- Create: `harness/dispatcher.js`

- [ ] **Step 1: dispatcher.js 생성**

```javascript
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
    // 슬롯이 빌 때마다 대기 중인 태스크 확인 (Realtime은 INSERT만 감지)
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
```

- [ ] **Step 2: 직접 실행 테스트**

```bash
cd /Users/mh/voica-v2/harness && node dispatcher.js
```

Expected 출력:
```
[realtime] 구독 상태: SUBSCRIBED
[harness] 디스패처 실행 중. MAX_PARALLEL=3
```

Supabase Table Editor에서 `agent_tasks`에 직접 pending 행 INSERT → 디스패처 터미널에 `[realtime] 새 태스크: ...` 출력 확인.

Ctrl+C로 종료.

- [ ] **Step 3: 커밋**

```bash
cd /Users/mh/voica-v2
git add harness/dispatcher.js
git commit -m "feat: add supabase realtime dispatcher"
```

---

## Task 8: PM2 설정 및 24/7 실행

**Files:**
- Create: `harness/ecosystem.config.cjs`

- [ ] **Step 1: PM2 설치**

```bash
npm install -g pm2
```

Expected: `pm2 --version` 출력 확인.

- [ ] **Step 2: ecosystem.config.cjs 생성**

PM2 설정은 CommonJS여야 합니다 (`.cjs` 확장자).

```javascript
// harness/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'harness',
      script: 'dispatcher.js',
      cwd: '/Users/mh/voica-v2/harness',
      interpreter: 'node',
      restart_delay: 3000,
      max_restarts: 10,
      out_file: './logs/out.log',
      error_file: './logs/err.log',
      merge_logs: true,
      env_file: '/Users/mh/voica-v2/harness/.env',
    },
  ],
}
```

- [ ] **Step 3: PM2로 실행**

```bash
cd /Users/mh/voica-v2/harness
pm2 start ecosystem.config.cjs
pm2 save
```

Expected: `pm2 list` 에서 `harness` 상태가 `online`.

- [ ] **Step 4: Mac 재부팅 시 자동 시작 설정**

```bash
pm2 startup
# 출력된 sudo 명령어 그대로 실행
pm2 save
```

- [ ] **Step 5: 로그 확인**

```bash
pm2 logs harness --lines 20
```

Expected:
```
[realtime] 구독 상태: SUBSCRIBED
[harness] 디스패처 실행 중. MAX_PARALLEL=3
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/mh/voica-v2
git add harness/ecosystem.config.cjs
git commit -m "feat: add pm2 ecosystem config for 24/7 operation"
```

---

## Task 9: 엔드투엔드 통합 테스트

- [ ] **Step 1: 가벼운 태스크로 전체 흐름 테스트**

Telegram 봇에게 메시지 전송:
```
README에 오늘 날짜(2026-04-13)를 마지막 줄에 추가해줘
```

- [ ] **Step 2: 각 단계 확인**

1. Supabase `agent_tasks` 테이블에 `status=pending` 행 생성 확인
2. PM2 로그에 `[realtime] 새 태스크: ...` 출력 확인
3. `status=running` 으로 변경 확인
4. `claude -p` 서브프로세스 실행 → PM2 로그에 팀 스킬 출력 확인
5. `status=done`, `result_url` 채워짐 확인
6. Telegram에 `✅ 완료\nhttps://github.com/...` 메시지 수신 확인
7. GitHub에 커밋 생성 확인

```bash
pm2 logs harness --lines 50
```

- [ ] **Step 3: 실패 케이스 확인**

Supabase SQL Editor에서 직접 실패 케이스 삽입:
```sql
insert into agent_tasks (instruction, tg_chat_id, tg_message_id, status)
values ('존재하지않는명령어xyz', '여기에_chat_id', '999', 'pending');
```

Expected: Telegram에 `❌ 실패\n로그를 확인해주세요.` 수신.

- [ ] **Step 4: 병렬 실행 테스트**

Telegram에서 3개 메시지 빠르게 전송 → PM2 로그에서 3개가 동시에 `active=1,2,3` 으로 올라가는지 확인.

- [ ] **Step 5: 최종 커밋**

```bash
cd /Users/mh/voica-v2
git add -A
git commit -m "docs: harness engineering implementation complete"
git push
```

---

## 환경변수 체크리스트

| 변수 | 위치 | 값 출처 |
|------|------|---------|
| `SUPABASE_URL` | Vercel + harness/.env | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | Vercel + harness/.env | Supabase → Settings → API → service_role |
| `TELEGRAM_BOT_TOKEN` | harness/.env | @BotFather |
| `ANTHROPIC_API_KEY` | harness/.env | Anthropic Console |
| `GITHUB_TOKEN` | harness/.env | GitHub → Settings → Developer settings → PAT |
| `WORKSPACE_DIR` | harness/.env | `/Users/mh/voica-v2` |
