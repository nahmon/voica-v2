# Research Link MVP — Design Spec

## Overview

**Research Link (리서치 링크)** — 연구자가 질문을 입력하면 공유 가능한 링크가 생성되고, 누구나 그 링크로 AI와 음성 인터뷰를 하면 리포트가 자동 생성되는 기능.

**검증 가설:**
- AI 음성 인터뷰가 실제 리서치 품질을 낼 수 있는가
- 연구자가 셀프서브로 인터뷰를 설계하고 운영할 수 있는가

**MVP 규모:** 연구자 1-2명 + 패널 5-10명, 1-2주 테스트

---

## Tech Stack

| 레이어 | 기술 | 비고 |
|---|---|---|
| Frontend | React 18 + Vite 6 | 기존 프로토타입 기반 |
| API | Vercel Serverless Functions | Node.js, REST |
| DB | Supabase PostgreSQL | |
| Auth | Supabase Auth | 이메일/비밀번호 |
| Storage | Supabase Storage | 음성 파일 |
| TTS | OpenAI TTS (tts-1) | |
| STT | OpenAI Whisper | |
| LLM | OpenAI GPT-4o | 리포트 생성 |
| Deploy | Vercel | 프론트 + API 통합 배포 |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Vite + React)         │
│                  Vercel 배포                      │
├─────────────────────────────────────────────────┤
│  연구자 화면          │  패널(응답자) 화면         │
│  - 질문 편집기        │  - 인터뷰 진행 화면        │
│  - 링크 생성/공유     │  - TTS 재생 + 녹음         │
│  - 리포트 열람        │  - 객관식/리커트 응답       │
└────────┬────────────────────────┬───────────────┘
         │ REST API              │
┌────────▼────────────────────────▼───────────────┐
│           Vercel Serverless Functions            │
│  /api/interview/create  — 인터뷰 생성 + 링크     │
│  /api/interview/[id]    — 인터뷰 데이터 조회      │
│  /api/tts               — OpenAI TTS 호출        │
│  /api/stt               — Whisper STT 변환       │
│  /api/report/generate   — GPT-4o 리포트 생성     │
└────────┬────────────────────────┬───────────────┘
         │                        │
┌────────▼──────────┐  ┌─────────▼───────────────┐
│   Supabase DB     │  │  Supabase Storage       │
│  - interviews     │  │  - 음성 녹음 파일        │
│  - questions      │  │  - TTS 캐시             │
│  - responses      │  │                         │
│  - reports        │  │                         │
│  - users (Auth)   │  │                         │
└───────────────────┘  └─────────────────────────┘
         │
┌────────▼──────────┐
│   OpenAI API      │
│  - TTS (tts-1)    │
│  - STT (whisper)  │
│  - GPT-4o (report)│
└───────────────────┘
```

**핵심 원칙:**
- 프론트엔드와 API가 모두 Vercel 한 곳에서 배포
- Supabase는 DB + Auth + Storage 역할만
- OpenAI API 호출은 반드시 서버사이드 (API key 보호)
- 모든 API는 stateless REST — 세션/소켓 없음
- 턴 기반 인터뷰: 질문 하나씩 TTS 재생 → 녹음 → 업로드 → STT → 다음 질문

---

## Data Model

```sql
-- 연구자가 만드는 인터뷰 프로젝트
interviews
  id            uuid (PK)
  user_id       uuid (FK → auth.users)
  title         text
  description   text
  share_code    text (UNIQUE, 8자리 — 링크용)
  status        enum: draft | active | closed
  created_at    timestamp
  updated_at    timestamp

-- 인터뷰에 속한 질문들 (순서 보장)
questions
  id            uuid (PK)
  interview_id  uuid (FK → interviews)
  order_num     int
  type          enum: voice | multiple_choice | likert
  content       text (질문 텍스트)
  options       jsonb (객관식: ["A","B","C"], 리커트: {min:1, max:5, labels:[]})
  tts_url       text (생성된 TTS 음성 파일 URL, nullable)
  created_at    timestamp

-- 패널의 응답 세션
sessions
  id            uuid (PK)
  interview_id  uuid (FK → interviews)
  respondent    jsonb ({name, age, gender} — 익명도 가능)
  status        enum: in_progress | completed | abandoned
  started_at    timestamp
  completed_at  timestamp

-- 질문별 개별 응답
responses
  id            uuid (PK)
  session_id    uuid (FK → sessions)
  question_id   uuid (FK → questions)
  type          enum: voice | multiple_choice | likert
  audio_url     text (음성 녹음 파일 URL, voice만)
  transcript    text (STT 변환 결과, voice만)
  value         jsonb (객관식: ["B"], 리커트: 4)
  created_at    timestamp

-- 생성된 리포트
reports
  id            uuid (PK)
  interview_id  uuid (FK → interviews)
  content       jsonb (요약, 테마, 통계 등 구조화된 결과)
  status        enum: generating | completed | failed
  created_at    timestamp
```

**설계 판단:**
- `share_code`로 짧은 공유 링크 생성 (예: `voica.app/i/a3kx92mf`)
- 패널은 로그인 불필요 — 링크만으로 즉시 참여
- 음성 응답은 `audio_url`(원본) + `transcript`(변환) 둘 다 저장
- 객관식/리커트 응답은 `value` jsonb에 유연하게 저장
- 리포트는 비동기 생성 — status로 진행 상태 추적

---

## API Endpoints

| 엔드포인트 | 메서드 | 역할 |
|---|---|---|
| `/api/interview` | POST | 인터뷰 생성 (질문 포함) |
| `/api/interview/[code]` | GET | share_code로 인터뷰 조회 |
| `/api/session` | POST | 응답 세션 시작 |
| `/api/response` | POST | 개별 질문 응답 제출 |
| `/api/tts` | POST | 질문 텍스트 → 음성 변환 |
| `/api/stt` | POST | 음성 파일 → 텍스트 변환 |
| `/api/report/[interviewId]` | POST | 리포트 생성 트리거 |
| `/api/report/[interviewId]` | GET | 리포트 조회 |

---

## User Flows

### Flow A — 연구자 (인터뷰 생성)

```
로그인 → 대시보드 → "+ 인터뷰 시작하기"
    ↓
질문 편집기
  - 제목/설명 입력
  - 질문 추가 (타입 선택: 음성/객관식/리커트)
  - 질문 순서 위/아래 버튼으로 정렬
  - 미리보기 (패널 시점으로 체험)
    ↓
"링크 생성" 클릭
  → share_code 생성
  → 공유 URL 복사
  → 상태: active
    ↓
대시보드에서 모니터링
  - 응답 수 실시간 카운트
  - 개별 응답 열람 가능
    ↓
"리포트 생성" 클릭
  → GPT-4o가 전체 응답 분석
  → 트랜스크립트 + 통계 + 요약/테마
  → 리포트 화면에서 열람
```

### Flow B — 패널 (인터뷰 응답)

```
공유 링크 클릭
    ↓
간단 정보 입력 (이름/나이/성별 — 선택사항)
    ↓
인터뷰 시작
  질문 1 (음성): TTS 재생 → 마이크 녹음 → 제출
  질문 2 (객관식): 보기 선택 → 제출
  질문 3 (리커트): 척도 선택 → 제출
  ... 반복 ...
    ↓
완료 화면 ("감사합니다" + 소요 시간 표시)
```

**핵심 판단:**
- 패널은 로그인 불필요 — 링크만으로 즉시 참여, 진입장벽 최소화
- 질문은 한 번에 하나씩 표시 — 집중도 높이고 이탈 줄임
- 음성 질문은 TTS 자동 재생 후 녹음 버튼 활성화
- 중간 이탈 시 `session.status = abandoned` 기록, 재진입은 MVP 미지원
- 리포트 생성은 연구자가 수동 트리거

---

## Question Types

### 1. Voice (음성)
- TTS로 질문 재생
- 마이크 녹음 (MediaRecorder API, WebM/Opus)
- Supabase Storage 업로드 → Whisper STT 변환
- 녹음 시간 제한: 3분

### 2. Multiple Choice (객관식)
- 단일 선택 / 복수 선택 설정 가능
- 보기 2-6개
- 텍스트로 질문 표시 (TTS 옵션)

### 3. Likert Scale (리커트)
- 1-5 또는 1-7 척도
- 양 끝 레이블 커스터마이즈 가능 (예: "매우 불만족" ~ "매우 만족")
- 텍스트로 질문 표시 (TTS 옵션)

---

## Report Structure

리포트 `content` jsonb 구조:

```json
{
  "summary": "전체 인터뷰 요약 (2-3 문단)",
  "themes": [
    { "name": "테마명", "description": "설명", "mentions": 5 }
  ],
  "statistics": {
    "total_sessions": 10,
    "completed": 8,
    "abandoned": 2,
    "avg_duration_seconds": 420,
    "question_stats": [
      {
        "question_id": "...",
        "type": "multiple_choice",
        "distribution": { "A": 3, "B": 5, "C": 2 }
      },
      {
        "question_id": "...",
        "type": "likert",
        "average": 3.8,
        "distribution": { "1": 0, "2": 1, "3": 2, "4": 4, "5": 3 }
      },
      {
        "question_id": "...",
        "type": "voice",
        "transcript_count": 8
      }
    ]
  },
  "transcripts": [
    {
      "session_id": "...",
      "question_id": "...",
      "text": "변환된 응답 텍스트"
    }
  ]
}
```

---

## MVP Scope Boundary

### 포함
- 질문 편집기 (3가지 타입: 음성/객관식/리커트)
- 공유 링크 생성 + 복사
- 패널 인터뷰 진행 (TTS 재생 + 녹음 + 객관식/리커트)
- 응답 대시보드 (응답 수, 개별 열람)
- 리포트 생성 (트랜스크립트 + 통계 + LLM 요약)
- Supabase Auth (이메일/비밀번호)

### 제외 (MVP 이후)
- 소셜 로그인 (Google/Kakao)
- 질문 드래그 정렬 (MVP는 위/아래 버튼)
- AI 후속 질문 (프로빙)
- 패널 중간이탈 후 재진입
- 패널 보드 연동 (기존 프로토타입과 별개)
- 결제/과금
- 다국어

---

## Cost Estimation (MVP)

| 항목 | 단가 | 인터뷰 10건 기준 |
|---|---|---|
| TTS (tts-1) | ~$0.015/1K chars | ~$0.15 |
| STT (whisper) | $0.006/min | ~$1.80 |
| GPT-4o (report) | ~$0.01/1K tokens | ~$0.50 |
| Supabase | Free tier | $0 |
| Vercel | Free tier | $0 |
| **합계** | | **~$2.45** |

MVP 단계에서는 종량제로 충분. 스케일업 시 엔터프라이즈 구독 전환.
