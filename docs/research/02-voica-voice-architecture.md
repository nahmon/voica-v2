# Voica-v2 Voice Architecture 분석

> 작성일: 2026-04-25
> 분석 대상: `/Users/mh/voica-v2` (main branch, commit 138bde9)

---

## 1. 아키텍처 개요

Voica-v2는 **AI 음성 인터뷰 플랫폼**으로, 다음 기술 스택 위에서 동작한다:

| 계층 | 기술 |
|------|------|
| Frontend | React SPA (Vite) |
| Backend API | Vercel Serverless Functions (`/api/*.js`) |
| Database / Auth / Storage | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI (Whisper STT, TTS-1-HD, GPT-4o, GPT-4o-mini) |

개발 시 Vite dev server가 `/api` 경로를 `localhost:3000`으로 프록시한다 (`vite.config.js`).

---

## 2. 전체 오디오 데이터 플로우

```
[패널리스트 브라우저]
        │
        ▼
┌─────────────────────┐
│  1. TTS 재생         │  AI 인터뷰어가 질문을 읽어줌
│  (OpenAI TTS-1-HD)  │  voice: "nova", format: mp3
└────────┬────────────┘
         │ audio.play()
         ▼
┌─────────────────────┐
│  2. 음성 녹음        │  MediaRecorder API
│  (WebM/MP4)         │  + Silence Detection (Web Audio API)
└────────┬────────────┘
         │ Blob
         ▼
┌─────────────────────┐         ┌──────────────────────┐
│  3a. 오디오 업로드    │────────▶│  Supabase Storage    │
│  (Signed Upload URL) │         │  bucket: audio-responses│
└────────┬────────────┘         │  path: {sessionId}/   │
         │                      │        {questionId}.ext│
         │ Blob (parallel)      └──────────────────────┘
         ▼
┌─────────────────────┐
│  3b. STT 변환        │  OpenAI Whisper-1, language: "ko"
│  POST /api/speech    │
│  ?type=stt           │
└────────┬────────────┘
         │ transcript
         ▼
┌─────────────────────┐
│  4. 응답 저장         │  Supabase: responses 테이블
│  POST /api/survey    │  { audio_url, transcript, type, value }
│  ?resource=response  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  5a. Bridge TTS      │  "네, 감사해요." 등 자연스러운 전환 문구
│  5b. Follow-up 생성   │  GPT-4o-mini로 맥락 기반 후속 질문 생성
└────────┬────────────┘
         │
         ▼
   다음 질문으로 이동 또는 인터뷰 완료
         │
         ▼
┌─────────────────────┐
│  6. 리포트 생성       │  GPT-4o로 전체 transcript 분석
│  POST /api/report/[id]│  themes, sentiment, recommendations
└─────────────────────┘
```

---

## 3. TTS (Text-to-Speech) — AI 인터뷰어 음성

### 3.1 엔드포인트
- **`POST /api/speech?type=tts`** (`api/speech.js:64-104`)

### 3.2 OpenAI TTS 설정
- **Model**: `tts-1-hd` (고품질)
- **Voice**: `nova` (여성 음성, 한국어 자연스러운 톤)
- **Output**: MP3 (audio/mpeg)

### 3.3 캐싱 전략 (2단계)

**서버 캐싱** — question별로 Supabase Storage에 영구 저장:
1. 첫 TTS 요청 시 OpenAI API 호출
2. 결과 MP3를 `tts-cache` 버킷에 `{question_id}.mp3`로 업로드
3. public URL을 `questions.tts_url` 컬럼에 저장
4. 이후 요청은 DB에서 `tts_url`을 반환 (OpenAI 재호출 없음)

**클라이언트 캐싱** — `ttsCacheRef` (in-memory Map):
- `InterviewScreen.jsx:107` — `ttsCacheRef = useRef({})`
- question ID를 key로, TTS URL을 value로 메모리 캐싱
- 인터뷰 시작 전 모든 질문의 TTS를 prefetch (`InterviewScreen.jsx:167-171`)
- 현재 답변 중 다음 질문 TTS를 prefetch (`InterviewScreen.jsx:219-225`)

### 3.4 Bridge Phrases (전환 문구)
- 응답 완료 후 다음 질문 전에 재생되는 짧은 acknowledgment
- 5개 한국어 문구 중 랜덤 선택 (`InterviewScreen.jsx:16-22`):
  - "네, 감사해요.", "알겠습니다.", "말씀해 주셔서 감사해요." 등
- `question_id` 없이 TTS 요청 → 캐싱 없이 매번 base64 data URI로 반환
- `playBridgeTts()` (`InterviewScreen.jsx:399-418`)

### 3.5 TTS Fallback
- 브라우저 autoplay 정책으로 TTS 재생 실패 시 `ttsBlocked` 상태 활성화
- 사용자에게 두 가지 옵션 제공:
  - "소리 켜고 다시 듣기" — 수동 play() 재시도
  - "질문 읽고 계속하기" — `ttsReadFallback` 모드로 텍스트만 표시

### 3.6 Rate Limiting
- IP당 분당 30회 (`api/speech.js:65`)

---

## 4. 음성 녹음 (Voice Recording)

### 4.1 녹음 시작 — `startRecording()` (`InterviewScreen.jsx:478-493`)
```
navigator.mediaDevices.getUserMedia({ audio: true })
  → MediaRecorder(stream, { mimeType })
  → mr.start()
```

### 4.2 오디오 포맷
- **Primary**: `audio/webm` (Chrome, Firefox, Edge)
- **Fallback**: `audio/mp4` (Safari, iOS)
- 포맷 감지: `MediaRecorder.isTypeSupported("audio/webm")` (`InterviewScreen.jsx:482`)

### 4.3 녹음 데이터 수집
- `ondataavailable` 이벤트로 chunk를 `chunksRef`에 누적
- 녹음 종료 시 `new Blob(chunksRef, { type: mimeType })`로 결합

### 4.4 녹음 제약
- **최소 녹음 시간**: 5초 (`MIN_RECORD_SECS = 5`, line 14)
- 5초 미만 시 UI에 "{N}초 더" 카운트다운 표시

### 4.5 녹음 중지 트리거
1. **수동**: 사용자가 Stop 버튼 클릭 / Space 키 누름
2. **자동 (Silence Detection)**: 2.5초간 무음 감지 시 자동 종료
3. **페이지 숨김**: `visibilitychange` 이벤트 → 녹음 중단 + 경고 메시지

### 4.6 Silence Detection (`InterviewScreen.jsx:447-475`)
- **Web Audio API** 기반: `AudioContext` → `AnalyserNode` → `getFloatTimeDomainData`
- **RMS threshold**: 0.015
- **Silence duration**: 2,500ms 연속 무음
- **조건**: `recordTimeRef >= MIN_RECORD_SECS` (5초 이상 녹음 후에만 작동)
- `requestAnimationFrame` 루프로 실시간 모니터링

### 4.7 Warmup (마이크 테스트) (`InterviewScreen.jsx:624-655`)
- 인터뷰 시작 전 마이크 확인 단계 (voice 질문이 1개 이상일 때)
- 녹음 → Blob 생성 → `URL.createObjectURL`로 즉시 재생 확인
- `VoicePlayer` 컴포넌트로 플레이백 UI 제공
- 서버 업로드 없음 (순수 클라이언트 사이드)

---

## 5. 오디오 업로드 및 스토리지

### 5.1 업로드 플로우 (`InterviewScreen.jsx:509-522`)
1. **Signed URL 발급**: `POST /api/storage` → `{ signedUrl, downloadUrl }`
2. **직접 업로드**: `PUT signedUrl` (blob 전송, Content-Type: mimeType)
3. 업로드 실패 시 toast 경고, 인터뷰는 계속 진행 (transcript만 저장)

### 5.2 Supabase Storage 구조
| Bucket | 용도 | 파일명 패턴 |
|--------|------|-------------|
| `audio-responses` | 패널리스트 음성 응답 | `{sessionId}/{questionId}.{webm\|mp4}` |
| `tts-cache` | AI TTS 캐시 (질문 음성) | `{questionId}.mp3` |

### 5.3 서버 측 (`api/storage.js`)
- **Service Role Key** 사용 (anon RLS bypass)
- `createSignedUploadUrl()` — 업로드용 임시 URL
- `createSignedUrl(path, 7776000)` — 다운로드용 URL (90일 유효)
- **보안**: path traversal 방지 (`SAFE_ID_RE`), 허용 확장자 whitelist

### 5.4 오디오 재생 (연구자 측) — `api/storage.js` GET
- 연구자가 응답을 청취할 때 `createSignedUrl(path, 3600)` (1시간 유효)
- 인증 + 인터뷰 소유권 검증 필수

---

## 6. STT (Speech-to-Text)

### 6.1 엔드포인트
- **`POST /api/speech?type=stt`** (`api/speech.js:27-61`)

### 6.2 구현
- OpenAI **Whisper-1** model
- `language: "ko"` (한국어 고정)
- `FormData`로 audio blob 전송 (`audio.{webm|mp4}`)
- 최대 파일 크기: 25MB (`formidable maxFileSize`)
- `openai.audio.transcriptions.create()` → `{ transcript: text }`

### 6.3 보안
- session_id 필수 → sessions 테이블에서 `status === "in_progress"` 확인
- IP당 분당 20회 rate limit

### 6.4 클라이언트 사용 (`InterviewScreen.jsx:524-531`)
- 오디오 업로드와 **독립적으로** (parallel) 실행
- STT 실패 시 transcript 없이 응답 저장 (audio_url만)

---

## 7. Follow-up 질문 생성

### 7.1 엔드포인트
- **`POST /api/followup`** (`api/followup.js`)

### 7.2 구현
- **GPT-4o-mini** (빠른 응답, 저비용)
- temperature: 0.7, max_tokens: 150
- 시스템 프롬프트: "expert qualitative researcher" 역할
- 응답이 충분하면 `NO_FOLLOWUP` 반환 → follow-up 생략

### 7.3 클라이언트 플로우 (`InterviewScreen.jsx:570-603`)
1. Bridge TTS 재생과 follow-up 생성을 **병렬** 실행
2. follow-up이 있으면: TTS로 읽어주고 → 추가 녹음 → 다음 질문
3. follow-up이 없으면: 즉시 다음 질문으로 이동
4. follow-up은 **1회만** (연쇄 follow-up 없음)

---

## 8. OpenAI API 사용 요약

| 기능 | Model | 용도 | 엔드포인트 |
|------|-------|------|-----------|
| TTS | `tts-1-hd` (voice: nova) | AI 인터뷰어 음성 | `/api/speech?type=tts` |
| STT | `whisper-1` | 패널 응답 텍스트 변환 | `/api/speech?type=stt` |
| Follow-up | `gpt-4o-mini` | 맥락 기반 후속 질문 | `/api/followup` |
| Report | `gpt-4o` | 인터뷰 분석 리포트 | `/api/report/[id]` |
| Question Gen | `gpt-4o` | 인터뷰 질문 자동 생성 | `/api/generate-questions` |

---

## 9. VoicePlayer 컴포넌트 (`shared.jsx:748-851`)

연구자가 응답을 청취하고, warmup 재생에 사용되는 공유 오디오 플레이어.

### 기능
- Play/Pause 토글
- Seekable progress bar (클릭으로 탐색)
- 시간 표시 (current / duration)
- Download 버튼 (`.webm` 파일 다운로드)
- Transcript 표시 (있는 경우)
- `dark` 모드 지원 (인터뷰 화면용)

### 구현
- `<audio>` 엘리먼트 기반
- `onTimeUpdate`, `onLoadedMetadata`, `onEnded` 이벤트로 상태 관리

---

## 10. 인터뷰 세션 생명주기

```
[Info 입력] → [Warmup 마이크 테스트] → [인터뷰 진행] → [완료]
    │              │                        │              │
    │   POST /api/survey                    │              │
    │   ?resource=session                   │    PATCH /api/survey
    │   → session_id 발급                   │    ?resource=session
    │                                       │    status: "completed"
    │                                       │
    │                            각 질문마다:
    │                            1. TTS 재생 (ai_speaking)
    │                            2. 녹음 대기 (ready)
    │                            3. 녹음 중 (recording)
    │                            4. 업로드+STT (submitting)
    │                            5. Bridge TTS + Follow-up
    │                            6. 다음 질문 이동
    │
    └── 세션 재개: localStorage에 { sessionId, qIndex, startedAt } 저장
        2시간 이내면 이어서 진행 가능
```

---

## 11. 주요 특이사항 및 제약

### 현재 제약
1. **언어 고정**: STT가 `language: "ko"` 하드코딩 — 다국어 인터뷰 미지원
2. **TTS 음성 고정**: `nova` 음성 하나만 사용
3. **Follow-up 1회 제한**: 각 질문당 최대 1개의 follow-up만 생성
4. **실시간 스트리밍 없음**: 전체 녹음 완료 후 일괄 업로드/STT 처리
5. **오디오 다운로드 URL 유효기간**: 90일 (signed URL 만료)

### 보안 장치
- Rate limiting: 모든 엔드포인트에 IP 기반 제한
- Session validation: STT/Upload 시 세션 상태 확인 (in_progress만 허용)
- Path traversal 방지: storage 경로에 `SAFE_ID_RE` 패턴 검증
- Audio URL 검증: Supabase storage URL만 허용 (외부 URL 차단)

### 성능 최적화
- TTS prefetch: 인터뷰 로드 시 전체 질문 TTS 사전 다운로드
- Bridge TTS + Follow-up 병렬 실행
- Audio upload와 STT 독립 실행 (한쪽 실패해도 다른 쪽 진행)
