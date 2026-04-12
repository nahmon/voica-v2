# Voica Analytics Playbook

> 이 파일을 Claude에게 붙여넣으면 "이번 주 완료율이 왜 낮지?", "어떤 질문에서 이탈이 많아?" 같은 질문에 즉시 SQL 쿼리와 해석을 받을 수 있습니다.

---

## 서비스 개요

**Voica** — 음성 AI 인터뷰 플랫폼 (한국어)
- 리서처: 인터뷰 생성 → 링크 공유 → 응답 분석
- 패널: 링크 접속 → 정보 입력 → 음성 인터뷰 진행

**Tech stack**: React SPA / Supabase (PostgreSQL + Storage) / Vercel Serverless / OpenAI Whisper + GPT-4o

---

## 이벤트 카탈로그

### 테이블: `funnel_events`

```sql
id          uuid        PK
created_at  timestamptz default now()
event_name  text        -- 이벤트 종류 (아래 목록)
share_code  text        -- 인터뷰 share_code (interviews.share_code)
session_id  text        -- 패널 세션 ID (sessions.id)
q_index     integer     -- 질문 번호 (0-based, interview_q_* 이벤트에만)
properties  jsonb       -- 추가 속성
```

### 추적 이벤트 전체 목록

| event_name | 발생 시점 | 주요 properties |
|---|---|---|
| `interview_link_opened` | 패널이 /i/[code] 접속 후 인터뷰 로드 성공 | — |
| `interview_info_submitted` | 이름/나이/성별 입력 후 시작 버튼 클릭 → 세션 생성 성공 | sessionId |
| `interview_q_started` | 각 질문이 활성화될 때 (q_index=0이 인터뷰 실제 시작) | q_index, total |
| `interview_q_answered` | 답변 제출 완료 (음성·객관식·리커트 공통) | q_index, qType |
| `interview_completed` | 마지막 질문 답변 후 완료 처리 | total |
| `interview_abandoned` | 나가기 버튼 확인 클릭 | q_index (어디서 나갔는지) |
| `interview_published` | 리서처가 새 인터뷰 최초 배포 | shareCode, questionCount |

---

## 핵심 쿼리 라이브러리

### 1. 인터뷰별 깔때기 전환율

```sql
select
  event_name,
  count(*)                                                        as cnt,
  round(count(*) * 100.0 / max(count(*)) over (), 1)             as pct_of_max
from funnel_events
where share_code = 'YOUR_SHARE_CODE'
  and event_name in (
    'interview_link_opened',
    'interview_info_submitted',
    'interview_completed',
    'interview_abandoned'
  )
group by event_name
order by cnt desc;
```

### 2. 어느 질문에서 이탈이 많은가

```sql
select
  q_index,
  count(*) as abandoned_count
from funnel_events
where share_code = 'YOUR_SHARE_CODE'
  and event_name = 'interview_abandoned'
group by q_index
order by q_index;
```

### 3. 질문별 답변 완료율 (Q0 기준)

```sql
with base as (
  select count(distinct session_id) as q0_sessions
  from funnel_events
  where share_code = 'YOUR_SHARE_CODE'
    and event_name = 'interview_q_started'
    and q_index = 0
)
select
  q_index,
  count(*) as answered,
  round(count(*) * 100.0 / (select q0_sessions from base), 1) as completion_pct
from funnel_events
where share_code = 'YOUR_SHARE_CODE'
  and event_name = 'interview_q_answered'
group by q_index
order by q_index;
```

### 4. 전체 서비스 일별 트래픽

```sql
select
  date_trunc('day', created_at at time zone 'Asia/Seoul') as day,
  event_name,
  count(*) as cnt
from funnel_events
where created_at >= now() - interval '30 days'
group by 1, 2
order by 1 desc, 3 desc;
```

### 5. 인터뷰별 전환율 비교 (전체)

```sql
select
  share_code,
  count(*) filter (where event_name = 'interview_link_opened')    as opened,
  count(*) filter (where event_name = 'interview_info_submitted') as started,
  count(*) filter (where event_name = 'interview_completed')      as completed,
  count(*) filter (where event_name = 'interview_abandoned')      as abandoned,
  round(
    count(*) filter (where event_name = 'interview_completed') * 100.0
    / nullif(count(*) filter (where event_name = 'interview_link_opened'), 0),
    1
  ) as completion_rate_pct
from funnel_events
where share_code is not null
group by share_code
order by opened desc;
```

### 6. 퍼블리시된 인터뷰 수 (주별)

```sql
select
  date_trunc('week', created_at at time zone 'Asia/Seoul') as week,
  count(*) as published
from funnel_events
where event_name = 'interview_published'
group by 1
order by 1 desc;
```

### 7. 이탈 없이 완료한 세션 비율

```sql
select
  count(distinct case when event_name = 'interview_completed' then session_id end)  as completed_sessions,
  count(distinct case when event_name = 'interview_abandoned' then session_id end)  as abandoned_sessions,
  count(distinct session_id)                                                         as total_sessions
from funnel_events
where share_code = 'YOUR_SHARE_CODE';
```

---

## 정상 벤치마크 (목표치)

| 구간 | 현재 목표 | 경고 신호 |
|---|---|---|
| 링크 접속 → 정보 입력 | > 50% | < 30%: 정보 폼이 과함 |
| 정보 입력 → Q1 시작 | > 90% | < 70%: 로딩·권한 문제 |
| Q1 → 완료 | > 55% | < 35%: 질문이 너무 많거나 어려움 |
| 전체 완료율 (접속 기준) | > 25% | < 15%: 전반적 UX 개선 필요 |

---

## 진단 흐름

```
완료율이 낮다
  ├─ 링크 접속 → 정보 입력 전환율이 낮다
  │    → 정보 입력 폼 간소화 (이름만 받기 등)
  │    → 리워드 금액을 인트로에서 더 크게 보여주기
  │
  ├─ 정보 입력 → Q1 전환율이 낮다
  │    → TTS 로딩 느림 (ttsBlocked 빈도 확인)
  │    → 마이크 권한 거부 (브라우저별 확인)
  │
  └─ 특정 q_index에서 이탈 집중
       → 해당 질문 내용·길이 검토
       → 음성 질문이면 TTS 발음 확인
```

---

## 데이터 활용 예시 질문

이 파일을 컨텍스트로 붙여넣고 아래처럼 물어보세요:

- "share_code `ah6jlgj4` 의 깔때기 분석해줘"
- "이번 주 전체 완료율이 낮아졌어. 어디서 막히는지 쿼리 짜줘"
- "3번 질문에서 이탈이 많은데 원인 가설 세워줘"
- "지난 30일 퍼블리시된 인터뷰 수 추이 보고 싶어"
- "완료율 30% 넘는 인터뷰와 그 이하 인터뷰 차이 분석해줘"

---

## 파일 위치 참조

| 파일 | 역할 |
|---|---|
| `src/lib/analytics.js` | `track()` 유틸리티 — 모든 이벤트 이 함수로 기록 |
| `src/screens/InterviewScreen.jsx` | 패널 인터뷰 6개 이벤트 |
| `src/screens/EditorScreen.jsx` | `interview_published` 이벤트 |
| `src/screens/ResponsesScreen.jsx` | 리서처용 FunnelCard UI |
| `supabase/migrations/002_funnel_events.sql` | 테이블 DDL + RLS 정책 |
