# Harness Engineering Design

**Date:** 2026-04-13  
**Status:** Approved  
**Scope:** AI 에이전트 팀 오케스트레이션 시스템 — Telegram으로 지시하면 Opus 팀장 + Sonnet 워커 5명이 24/7 작업 처리

---

## 목표

사용자가 Telegram으로 작업을 지시하면:
1. Opus 팀장이 작업을 분석하고 서브태스크로 분해
2. Sonnet 워커 5명이 병렬로 실행
3. 결과를 GitHub에 커밋하고 Telegram으로 완료 알림

지원 작업 유형: 개발(dev), 리서치(research), 운영 자동화(ops)

---

## 아키텍처

```
사용자 (Telegram)
    │ POST
    ▼
Vercel: api/telegram-webhook.js
    - Telegram 메시지 파싱
    - Supabase agent_tasks INSERT
    - "✓ 접수" 즉시 응답
    │ Supabase Realtime
    ▼
Mac Mini: harness/dispatcher.js (PM2 데몬)
    - Supabase Realtime 구독 (폴링 없음)
    - 새 태스크 → claude -p 서브프로세스 실행
    - 최대 3개 Claude Code 세션 병렬 실행 (Mac Mini 부하 고려)
    - 각 세션 내부에서 Sonnet 워커 5명 실행 → 최대 15 Sonnet 동시 실행
    │ claude -p 서브프로세스
    ▼
Claude Code 세션 (태스크당 1개)
    /team 5 "[태스크]"
    Opus 팀장 → 분석 & 서브태스크 분해
    Sonnet 워커 1~5 → 병렬 실행
    (dev: git worktree 격리 / research&ops: API 호출)
    │
    ├── GitHub (커밋/PR)
    └── Telegram (완료 알림)
```

---

## 컴포넌트

### 1. Vercel Webhook (intake layer)

**파일:** `voica-v2/api/telegram-webhook.js`

Telegram Bot webhook 수신 엔드포인트. 메시지를 파싱해 Supabase에 태스크를 삽입하고 즉시 200 응답 반환 (3초 타임아웃 방지).

```javascript
// api/telegram-webhook.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message } = req.body
  if (!message?.text) return res.status(200).end()

  res.status(200).json({ ok: true })

  await supabase.from('agent_tasks').insert({
    instruction: message.text,
    tg_chat_id: String(message.chat.id),
    tg_message_id: String(message.message_id),
    status: 'pending'
  })
}
```

**Telegram Bot 등록 (최초 1회):**
```bash
curl "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -d "url=https://voica.vercel.app/api/telegram-webhook"
```

---

### 2. Supabase 데이터 모델

**테이블:** `agent_tasks`

```sql
id           uuid          PK, default gen_random_uuid()
created_at   timestamptz   default now()
status       text          -- pending | running | done | failed
instruction  text          -- 사용자 지시 원문
tg_chat_id   text          -- 완료 알림 보낼 Telegram 채팅 ID
tg_message_id text         -- 원본 메시지 ID (스레드 답장용)
result_url   text          -- 완료 후 GitHub PR/커밋 링크
error_msg    text          -- 실패 시 이유
started_at   timestamptz   -- 디스패처가 집어간 시각
done_at      timestamptz   -- 완료 시각
```

**Realtime 활성화:**
```sql
alter publication supabase_realtime add table agent_tasks;
```

---

### 3. Mac Mini 디스패처 (dispatch layer)

**디렉토리:** `harness/`

```
harness/
├── dispatcher.js          # PM2 진입점 — Supabase 구독 + 서브프로세스 관리
├── runner.js              # claude -p 실행 + 완료/실패 처리
├── notify.js              # Telegram 완료 알림 전송
├── ecosystem.config.js    # PM2 설정
└── .env                   # 시크릿 키 모음
```

**dispatcher.js 핵심 로직:**
```javascript
const MAX_PARALLEL = 3
let activeJobs = 0

// Realtime: 새 태스크 INSERT 즉시 수신
supabase.channel('tasks')
  .on('postgres_changes', { event: 'INSERT', table: 'agent_tasks' },
    async (payload) => {
      await tryDispatch(payload.new)
    })
  .subscribe()

async function tryDispatch(task) {
  if (activeJobs >= MAX_PARALLEL) return  // 슬롯 초과 시 pending 유지
  activeJobs++
  await runTask(task)
  activeJobs--
  // 슬롯이 빌 때마다 pending 태스크 재조회 (Realtime은 INSERT만 감지)
  await drainPending()
}

async function drainPending() {
  if (activeJobs >= MAX_PARALLEL) return
  const { data } = await supabase.from('agent_tasks')
    .select('*').eq('status', 'pending').order('created_at').limit(1)
  if (data?.[0]) await tryDispatch(data[0])
}
```

**runner.js 핵심 로직:**
```javascript
async function runTask(task) {
  await supabase.from('agent_tasks')
    .update({ status: 'running', started_at: new Date() })
    .eq('id', task.id)

  let output = ''
  const proc = spawn('claude', [
    '-p',
    `/team 5 "${task.instruction}. 결과는 GitHub에 커밋하고 완료 시 결과 URL을 마지막 줄에 출력해줘."`,
    '--allowedTools', 'all'
  ])
  proc.stdout.on('data', (chunk) => { output += chunk.toString() })

  proc.on('close', async (code) => {
    const lines = output.trim().split('\n')
    const resultUrl = lines[lines.length - 1] || ''
    await supabase.from('agent_tasks')
      .update({
        status: code === 0 ? 'done' : 'failed',
        result_url: resultUrl,
        done_at: new Date()
      })
      .eq('id', task.id)
    await notify(task.tg_chat_id, task.tg_message_id, resultUrl, code === 0)
  })
}
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'harness',
    script: 'dispatcher.js',
    restart_delay: 3000,
    max_restarts: 10,
    log_file: './logs/harness.log'
  }]
}
```

**환경변수 (.env):**
```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
TELEGRAM_BOT_TOKEN=
GITHUB_TOKEN=
```

---

### 4. Claude Code 실행 레이어 (execution layer)

디스패처가 `claude -p "/team 5 ..."` 서브프로세스를 실행하면 기존 `oh-my-claudecode:team` 스킬이 담당:

- **Opus 팀장:** 태스크 분석 → 서브태스크 분해 → 워커 배정
- **Sonnet 워커 5명:** 병렬 실행
  - `dev` 태스크: git worktree 격리 → 코드 작성 → GitHub PR
  - `research` 태스크: 웹 리서치 → 문서 작성 → GitHub 커밋
  - `ops` 태스크: 콘텐츠 생성 → GitHub 커밋
- 완료 시 GitHub URL을 stdout 마지막 줄에 출력 (디스패처가 파싱)

---

## 에러 처리

| 상황 | 처리 |
|------|------|
| Mac Mini 오프라인 | PM2 자동 재시작, Supabase에 pending 태스크 보존 |
| claude -p 프로세스 크래시 | runner.js close 이벤트에서 status=failed 업데이트 |
| 병렬 슬롯 초과 | 태스크가 pending으로 Supabase에 대기, 슬롯 빌 때 재구독 이벤트로 처리 |
| Telegram 알림 실패 | notify.js에서 1회 재시도, 실패 시 로그만 기록 |

---

## 미결 사항

- 병렬 슬롯 초과 시 Realtime 이벤트 누락 방지: 디스패처 시작 시 pending 태스크 재조회 필요
- `claude -p` 최대 실행 시간 제한 (장시간 태스크 타임아웃 정책)
- Telegram 허용 사용자 화이트리스트 (현재 모든 메시지 수락)
