# Voicebox API 및 기능 분석

> **Voicebox** — Jamie Pine(Spacedrive 창시자)이 만든 오픈소스 AI Voice Studio
> GitHub: https://github.com/jamiepine/voicebox | 공식 사이트: https://voicebox.sh
> 라이선스: MIT | GitHub Stars: 23.1k+ | 최신 버전: v0.4.0 (2026-04)

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [REST API 엔드포인트 전체 목록](#2-rest-api-엔드포인트-전체-목록)
3. [핵심 API 상세](#3-핵심-api-상세)
4. [TTS 엔진 비교](#4-tts-엔진-비교)
5. [Voice Cloning](#5-voice-cloning)
6. [다국어 지원](#6-다국어-지원)
7. [오디오 후처리 Effects](#7-오디오-후처리-effects)
8. [STT (Speech-to-Text)](#8-stt-speech-to-text)
9. [SDK / Client Library](#9-sdk--client-library)
10. [알려진 제한사항](#10-알려진-제한사항)

---

## 1. 아키텍처 개요

| 구성 요소 | 기술 스택 |
|-----------|-----------|
| **Backend** | FastAPI (Python), localhost:17493 |
| **Frontend** | Tauri (Rust) + Web |
| **Database** | SQLite |
| **AI Framework** | MLX (Apple Silicon), PyTorch (CUDA/ROCm/CPU/XPU) |
| **API 문서** | http://localhost:17493/docs (Swagger UI) |
| **모델 저장소** | HuggingFace Hub, 로컬 캐시 |

**API-First 설계**: 모든 TTS 엔진이 REST endpoint로 노출됨. API 키, rate limit, 과금 없이 완전한 프로그래밍 제어 가능.

---

## 2. REST API 엔드포인트 전체 목록

총 **90개 이상** 의 엔드포인트가 도메인별로 구성되어 있다.

### 2.1 TTS Generation (음성 합성)

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/generate` | 텍스트 → 음성 합성 (비동기, 큐 기반) |
| `POST` | `/generate/stream` | 텍스트 → 음성 합성 (실시간 WAV 스트리밍) |
| `POST` | `/generate/{generation_id}/retry` | 실패한 generation 재시도 |
| `POST` | `/generate/{generation_id}/regenerate` | 완료된 generation 재생성 (새 버전) |
| `POST` | `/generate/{generation_id}/cancel` | 진행 중 generation 취소 |
| `GET` | `/generate/{generation_id}/status` | SSE로 generation 상태 실시간 스트리밍 |

### 2.2 Voice Profiles (음성 프로필)

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/profiles` | 새 프로필 생성 |
| `GET` | `/profiles` | 전체 프로필 목록 |
| `GET` | `/profiles/{profile_id}` | 프로필 상세 조회 |
| `PUT` | `/profiles/{profile_id}` | 프로필 수정 |
| `DELETE` | `/profiles/{profile_id}` | 프로필 삭제 |
| `POST` | `/profiles/import` | ZIP 파일로 프로필 가져오기 (최대 100MB) |
| `GET` | `/profiles/{profile_id}/export` | 프로필 ZIP 내보내기 |
| `GET` | `/profiles/presets/{engine}` | Preset 음성 목록 (kokoro/qwen_custom_voice) |

### 2.3 Voice Samples (음성 샘플)

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/profiles/{profile_id}/samples` | 샘플 업로드 (최대 50MB) |
| `GET` | `/profiles/{profile_id}/samples` | 프로필 샘플 목록 |
| `PUT` | `/profiles/samples/{sample_id}` | 샘플 메타데이터 수정 |
| `DELETE` | `/profiles/samples/{sample_id}` | 샘플 삭제 |

지원 오디오 포맷: WAV, MP3, M4A, OGG, FLAC, AAC, WebM, Opus

### 2.4 Avatar

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/profiles/{profile_id}/avatar` | 아바타 이미지 업로드 |
| `GET` | `/profiles/{profile_id}/avatar` | 아바타 이미지 조회 |
| `DELETE` | `/profiles/{profile_id}/avatar` | 아바타 삭제 |

### 2.5 History (생성 이력)

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/history` | 이력 조회 (검색, 페이지네이션 지원) |
| `GET` | `/history/stats` | 생성 통계 |
| `GET` | `/history/{generation_id}` | 특정 생성 상세 |
| `POST` | `/history/{generation_id}/favorite` | 즐겨찾기 토글 |
| `DELETE` | `/history/{generation_id}` | 이력 삭제 |
| `DELETE` | `/history/failed` | 실패 이력 일괄 삭제 |
| `POST` | `/history/import` | ZIP으로 이력 가져오기 |
| `GET` | `/history/{generation_id}/export` | ZIP으로 이력 내보내기 |
| `GET` | `/history/{generation_id}/export-audio` | WAV 파일 다운로드 |

### 2.6 Audio Effects (후처리)

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/effects/available` | 사용 가능 이펙트 목록 및 파라미터 정의 |
| `POST` | `/effects/preview/{generation_id}` | 이펙트 미리듣기 (저장 안 함, WAV 스트림) |
| `POST` | `/generations/{generation_id}/versions/apply-effects` | 이펙트 적용 → 새 버전 생성 |
| `GET` | `/effects/presets` | 이펙트 프리셋 목록 |
| `GET` | `/effects/presets/{preset_id}` | 프리셋 상세 |
| `POST` | `/effects/presets` | 프리셋 생성 |
| `PUT` | `/effects/presets/{preset_id}` | 프리셋 수정 |
| `DELETE` | `/effects/presets/{preset_id}` | 프리셋 삭제 |

### 2.7 Generation Versions

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/generations/{generation_id}/versions` | 버전 목록 |
| `PUT` | `/generations/{generation_id}/versions/{version_id}/set-default` | 기본 버전 설정 |
| `DELETE` | `/generations/{generation_id}/versions/{version_id}` | 버전 삭제 |

### 2.8 Models (모델 관리)

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/models/status` | 전체 모델 상태 (다운로드/로드 여부) |
| `POST` | `/models/download` | 모델 다운로드 시작 |
| `POST` | `/models/download/cancel` | 다운로드 취소 |
| `POST` | `/models/load` | 모델 로드 (query: `model_size`) |
| `POST` | `/models/unload` | 현재 모델 언로드 |
| `POST` | `/models/{model_name}/unload` | 특정 모델 언로드 |
| `DELETE` | `/models/{model_name}` | 모델 삭제 |
| `GET` | `/models/progress/{model_name}` | 다운로드 진행률 (SSE) |
| `GET` | `/models/cache-dir` | 모델 캐시 디렉토리 경로 |
| `POST` | `/models/migrate` | 모델 디렉토리 이전 |
| `GET` | `/models/migrate/progress` | 이전 진행률 (SSE) |

### 2.9 Stories (타임라인 편집)

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/stories` | 스토리 목록 |
| `POST` | `/stories` | 스토리 생성 |
| `GET` | `/stories/{story_id}` | 스토리 상세 (아이템 포함) |
| `PUT` | `/stories/{story_id}` | 스토리 수정 |
| `DELETE` | `/stories/{story_id}` | 스토리 삭제 |
| `POST` | `/stories/{story_id}/items` | 아이템 추가 |
| `DELETE` | `/stories/{story_id}/items/{item_id}` | 아이템 삭제 |
| `PUT` | `/stories/{story_id}/items/times` | 아이템 시간 일괄 업데이트 |
| `PUT` | `/stories/{story_id}/items/reorder` | 아이템 순서 변경 |
| `PUT` | `/stories/{story_id}/items/{item_id}/move` | 아이템 이동 (시간+트랙) |
| `PUT` | `/stories/{story_id}/items/{item_id}/trim` | 아이템 트리밍 |
| `POST` | `/stories/{story_id}/items/{item_id}/split` | 아이템 분할 |
| `POST` | `/stories/{story_id}/items/{item_id}/duplicate` | 아이템 복제 |
| `PUT` | `/stories/{story_id}/items/{item_id}/version` | 아이템 버전 변경 |
| `GET` | `/stories/{story_id}/export-audio` | 스토리 WAV 내보내기 |

### 2.10 Audio Channels

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/channels` | 채널 목록 |
| `POST` | `/channels` | 채널 생성 |
| `GET` | `/channels/{channel_id}` | 채널 상세 |
| `PUT` | `/channels/{channel_id}` | 채널 수정 |
| `DELETE` | `/channels/{channel_id}` | 채널 삭제 |
| `GET` | `/channels/{channel_id}/voices` | 채널 할당 음성 목록 |
| `PUT` | `/channels/{channel_id}/voices` | 채널 음성 할당 |

### 2.11 Audio Serving

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/audio/{generation_id}` | generation WAV 파일 서빙 |
| `GET` | `/audio/version/{version_id}` | version WAV 파일 서빙 |
| `GET` | `/samples/{sample_id}` | 샘플 WAV 파일 서빙 |

### 2.12 Transcription (STT)

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/transcribe` | 오디오 → 텍스트 변환 |

### 2.13 System

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/` | 서비스 정보 / Web UI |
| `GET` | `/health` | 헬스 체크 (모델, GPU 상태) |
| `GET` | `/health/filesystem` | 파일시스템 헬스 체크 |
| `POST` | `/shutdown` | 서버 종료 |
| `POST` | `/watchdog/disable` | Watchdog 비활성화 |
| `GET` | `/tasks/active` | 활성 작업 목록 (다운로드/생성) |
| `POST` | `/tasks/clear` | 작업 상태 초기화 |
| `POST` | `/cache/clear` | 음성 프롬프트 캐시 삭제 |

### 2.14 Profile Effects & Channels

| Method | Path | 설명 |
|--------|------|------|
| `PUT` | `/profiles/{profile_id}/effects` | 프로필 기본 이펙트 체인 설정 |
| `GET` | `/profiles/{profile_id}/channels` | 프로필 채널 목록 |
| `PUT` | `/profiles/{profile_id}/channels` | 프로필 채널 할당 |

---

## 3. 핵심 API 상세

### 3.1 POST /generate — 음성 합성

**Request Body** (`GenerationRequest`):

```json
{
  "profile_id": "uuid-string",          // 필수. 음성 프로필 ID
  "text": "합성할 텍스트",                // 필수. 1~50,000자
  "language": "ko",                      // 기본값: "en"
  "engine": "qwen",                      // 기본값: "qwen"
  "model_size": "1.7B",                  // "0.6B" | "1.7B" | "1b" | "3b-ml"
  "seed": 42,                            // optional. 재현 가능한 생성
  "instruct": "따뜻하고 친근한 톤으로",    // optional. 음성 스타일 지시 (Qwen CustomVoice만 완전 지원)
  "max_chunk_chars": 800,                // 100~5,000. 긴 텍스트 청크 분할 크기
  "crossfade_ms": 50,                    // 0~500. 청크 간 크로스페이드
  "normalize": true,                     // 오디오 정규화
  "effects_chain": [                     // optional. 후처리 이펙트
    {"type": "reverb", "enabled": true, "params": {"room_size": 0.5}}
  ]
}
```

**유효 engine 값**: `qwen`, `qwen_custom_voice`, `luxtts`, `chatterbox`, `chatterbox_turbo`, `tada`, `kokoro`

**Response** (`GenerationResponse`):

```json
{
  "id": "gen-uuid",
  "profile_id": "profile-uuid",
  "text": "합성할 텍스트",
  "language": "ko",
  "audio_path": "data/generations/gen-uuid.wav",
  "duration": 3.5,
  "seed": 42,
  "instruct": null,
  "engine": "qwen",
  "model_size": "1.7B",
  "status": "completed",               // "generating" | "loading_model" | "completed" | "failed"
  "error": null,
  "is_favorited": false,
  "created_at": "2026-04-25T10:00:00",
  "versions": [...],
  "active_version_id": "ver-uuid"
}
```

**특이 동작**:
- 모델 미다운로드 시 HTTP 202 반환 + 백그라운드 다운로드 시작
- 긴 텍스트는 `max_chunk_chars` 기준으로 자동 청킹 (PR #266)
- 비동기 큐 기반 처리 (PR #269)
- `GET /generate/{id}/status`로 SSE 폴링 가능

### 3.2 POST /generate/stream — 실시간 스트리밍

Request body는 `/generate`와 동일하되, 응답이 WAV 바이너리 스트림(64KB 청크)으로 반환된다. DB에 저장하지 않고 메모리에서 직접 생성. MLX 백엔드에서 최적 성능.

### 3.3 POST /transcribe — 음성 인식

**Request**: `multipart/form-data`
- `file`: 오디오 파일 (필수)
- `language`: 타겟 언어 (optional)
- `model`: Whisper 모델 크기 (optional)

**Response** (`TranscriptionResponse`):

```json
{
  "text": "인식된 텍스트",
  "duration": 5.2
}
```

### 3.4 POST /profiles — 프로필 생성

**Request Body** (`VoiceProfileCreate`):

```json
{
  "name": "내 음성",                      // 필수. 1~100자
  "description": "설명",                  // optional. 최대 500자
  "language": "ko",                       // 기본값: "en"
  "voice_type": "cloned",                 // "cloned" | "preset" | "designed"
  "preset_engine": "kokoro",              // preset 타입일 때 필수
  "preset_voice_id": "af_heart",          // preset 타입일 때 필수
  "design_prompt": "30대 남성, 차분한 톤",  // designed 타입일 때
  "default_engine": "qwen"                // optional. 기본 엔진
}
```

---

## 4. TTS 엔진 비교

### 4.1 전체 비교표

| 엔진 | 파라미터 | 모델 크기 | 언어 수 | Voice Cloning | Preset | 특징 |
|------|---------|----------|--------|---------------|--------|------|
| **Qwen3-TTS** | 0.6B / 1.7B | ~1.2 / ~3.5 GB | 10 | O | X | 최고 품질, delivery instruction 지원 |
| **Qwen CustomVoice** | (Qwen3-TTS 공유) | ~3.5 GB | 10 | X | O (9 voices) | 자연어 스타일 지시 (`instruct`) 완전 지원 |
| **LuxTTS** | 경량 | ~300 MB | 1 (EN) | O | X | CPU 150x 실시간, 48kHz, VRAM ~1GB |
| **Chatterbox Multilingual** | — | ~3.2 GB | **23** | O | X | 가장 넓은 언어 커버리지 |
| **Chatterbox Turbo** | 350M | ~1.5 GB | 1 (EN) | O | X | `[laugh]`, `[sigh]` paralinguistic 태그 지원 |
| **TADA (HumeAI)** | 1B / 3B | 4~8 GB | 10 | O | X | 700초+ 긴 오디오 일관성, hallucination 0건/1088 |
| **Kokoro** | 82M | ~350 MB | 8 | X | O (50 voices) | Apache 2.0, CPU 실시간, 96x RT on GPU |

### 4.2 엔진별 상세 분석

#### Qwen3-TTS (권장 기본 엔진)
- **장점**: 10개 언어 고품질 클로닝, 두 가지 모델 크기 선택, 스트리밍 지원
- **단점**: 큰 모델 크기(3.5GB), VRAM 소비 높음
- **Voice Cloning 방식**: Pre-computed tensor 기반
- **적합 용도**: 고품질 다국어 음성 합성

#### LuxTTS
- **장점**: 초경량(300MB), CPU만으로 150x 실시간, 48kHz 고해상도 출력
- **단점**: 영어만 지원
- **Voice Cloning 방식**: Pre-computed tensor 기반
- **적합 용도**: 빠른 영어 프로토타이핑, 저사양 환경

#### Chatterbox Multilingual
- **장점**: **23개 언어** 지원 (아랍어, 히브리어, 스와힐리어 포함)
- **단점**: 모델 크기 큼(3.2GB)
- **Voice Cloning 방식**: Deferred file path 기반
- **적합 용도**: 다국어 서비스 (한국어 포함)

#### Chatterbox Turbo
- **장점**: Paralinguistic 태그(`[laugh]`, `[cough]`, `[sigh]`) 해석, 빠른 추론
- **단점**: 영어만 지원
- **적합 용도**: 감정 표현이 중요한 콘텐츠

#### TADA (HumeAI)
- **장점**: Hallucination 0건(1,088 샘플 중), 700초 이상 긴 오디오 일관성 유지
- **단점**: 가장 큰 모델 크기(4~8GB), CUDA 사실상 필수
- **적합 용도**: 오디오북, 장편 콘텐츠

#### Kokoro
- **장점**: 초경량(82M/350MB), Apache 2.0 라이선스, 50개 preset 음성, CPU 실시간
- **단점**: Voice cloning 불가 (preset만), 8개 언어
- **적합 용도**: 빠른 프로토타이핑, 다양한 화자가 필요한 경우

#### Qwen CustomVoice
- **장점**: `instruct` 파라미터로 자연어 음성 스타일 제어, 9개 preset 음성
- **단점**: Cloning 불가, Qwen3-TTS 모델 필요
- **적합 용도**: 스타일 지시가 중요한 TTS

### 4.3 엔진 호환성 규칙

- **Cloned 프로필**: qwen, luxtts, chatterbox, chatterbox_turbo, tada 사용 가능
- **Preset 프로필**: kokoro, qwen_custom_voice만 사용 가능
- UI에서 비호환 엔진은 자동으로 grey-out 처리
- 비호환 프로필 선택 시 엔진 자동 전환

---

## 5. Voice Cloning

### 5.1 클로닝 워크플로우

1. **프로필 생성**: `POST /profiles` (`voice_type: "cloned"`)
2. **샘플 업로드**: `POST /profiles/{id}/samples` (오디오 파일 + `reference_text`)
3. **음성 합성**: `POST /generate` (`profile_id` 지정)

### 5.2 샘플 요구사항

| 항목 | 값 |
|------|-----|
| **최소 길이** | 3~5초 |
| **권장 길이** | 10~60초 |
| **최대 업로드** | 50MB |
| **지원 포맷** | WAV, MP3, M4A, OGG, FLAC, AAC, WebM, Opus |
| **reference_text** | 필수 (1~1,000자). 샘플 오디오의 전사 텍스트 |

### 5.3 멀티 샘플 클로닝

여러 샘플을 업로드하면 `combine_voice_prompts()` 메서드로 결합되어 더 높은 품질의 클로닝이 가능하다. TTSBackend protocol의 시그니처:

```python
async combine_voice_prompts(
    audio_paths: List[str],
    reference_texts: List[str]
) -> Tuple[np.ndarray, str]
```

### 5.4 Voice Prompt 캐싱

- 생성된 voice prompt는 메모리 + 디스크에 캐시
- `create_voice_prompt(use_cache=True)`로 제어
- `POST /cache/clear`로 전체 캐시 초기화 가능
- 현재 PyTorch tensor 기반으로 구현 — MLX/Chatterbox 등 비-PyTorch 엔진과의 호환성은 제한적 (알려진 아키텍처 제약)

### 5.5 프로필 Import/Export

- `GET /profiles/{id}/export` → ZIP 파일 (메타데이터 + 샘플 오디오)
- `POST /profiles/import` → ZIP 업로드로 프로필 복원
- 팀 간 음성 프로필 공유 가능

---

## 6. 다국어 지원

### 6.1 지원 언어 (23개)

| 언어 | 코드 | Qwen3 | LuxTTS | CB Multi | CB Turbo | TADA | Kokoro | Qwen CV |
|------|------|-------|--------|----------|----------|------|--------|---------|
| English | en | O | O | O | O | O | O | O |
| Chinese | zh | O | | O | | O | | O |
| Japanese | ja | O | | O | | O | O | O |
| Korean | ko | O | | O | | O | O | O |
| French | fr | O | | O | | O | O | O |
| German | de | O | | O | | O | | O |
| Spanish | es | O | | O | | O | O | O |
| Italian | it | O | | O | | | | O |
| Portuguese | pt | O | | O | | O | | O |
| Russian | ru | O | | O | | O | | O |
| Arabic | ar | | | O | | | | |
| Danish | da | | | O | | | | |
| Dutch | nl | | | O | | | | |
| Finnish | fi | | | O | | | | |
| Greek | el | | | O | | | | |
| Hebrew | he | | | O | | | | |
| Hindi | hi | | | O | | O | O | |
| Malay | ms | | | O | | | | |
| Norwegian | no | | | O | | | | |
| Polish | pl | | | O | | | | |
| Swedish | sv | | | O | | | | |
| Swahili | sw | | | O | | | | |
| Turkish | tr | | | O | | | | |

### 6.2 한국어 지원 엔진

한국어(`ko`)를 지원하는 엔진: **Qwen3-TTS**, **Chatterbox Multilingual**, **Kokoro**, **Qwen CustomVoice**

- Voice cloning + 한국어: Qwen3-TTS 또는 Chatterbox Multilingual
- Preset + 한국어: Kokoro 또는 Qwen CustomVoice

---

## 7. 오디오 후처리 Effects

Spotify의 **pedalboard** 라이브러리 기반, 8개 이펙트 지원.

### 7.1 사용 가능 이펙트

| 이펙트 | 설명 | 주요 파라미터 |
|--------|------|-------------|
| **Pitch Shift** | 피치 조절 (최대 ±12 semitones) | `semitones` |
| **Reverb** | 잔향 효과 | `room_size`, `damping`, `wet_level`, `dry_level` |
| **Delay** | 에코/딜레이 | `delay_seconds`, `feedback`, `mix` |
| **Chorus / Flanger** | 코러스/플랜저 변조 | `rate_hz`, `depth`, `mix` |
| **Compressor** | 다이내믹 레인지 압축 | `threshold_db`, `ratio`, `attack_ms`, `release_ms` |
| **Gain** | 볼륨 조절 | `gain_db` (-40 ~ +40) |
| **High-Pass Filter** | 저주파 제거 | `cutoff_frequency_hz` |
| **Low-Pass Filter** | 고주파 제거 | `cutoff_frequency_hz` |

### 7.2 이펙트 체인 구조

```json
{
  "effects_chain": [
    {"type": "pitch_shift", "enabled": true, "params": {"semitones": -2}},
    {"type": "reverb", "enabled": true, "params": {"room_size": 0.3, "wet_level": 0.2}},
    {"type": "compressor", "enabled": false, "params": {}}
  ]
}
```

### 7.3 Built-in 프리셋

| 프리셋 | 설명 |
|--------|------|
| Robotic | 로봇 음성 |
| Radio | 라디오 방송 음성 |
| Echo Chamber | 에코 효과 |
| Deep Voice | 저음 음성 |

### 7.4 이펙트 적용 방식

1. **생성 시 적용**: `POST /generate`의 `effects_chain` 파라미터
2. **미리듣기**: `POST /effects/preview/{generation_id}` (WAV 스트림, 저장 안 함)
3. **버전 생성**: `POST /generations/{id}/versions/apply-effects` (새 버전으로 저장)
4. **프로필 기본값**: `PUT /profiles/{id}/effects` (해당 프로필 모든 생성에 적용)

---

## 8. STT (Speech-to-Text)

### 8.1 Whisper 통합

OpenAI Whisper 모델을 로컬에서 실행. PyTorch 및 MLX 백엔드 모두 지원.

### 8.2 모델 옵션

| 모델 | 크기 | 속도 | 정확도 |
|------|------|------|--------|
| `base` | ~74MB | 매우 빠름 | 기본 |
| `small` | ~244MB | 빠름 | 양호 |
| `medium` | ~769MB | 보통 | 좋음 |
| `large` | ~1.5GB | 느림 | 최고 |
| `turbo` | ~809MB | 빠름 | large 근접 |

### 8.3 API 사용

```bash
curl -X POST http://localhost:17493/transcribe \
  -F "file=@audio.wav" \
  -F "language=ko" \
  -F "model=turbo"
```

- 모델 미다운로드 시 HTTP 202 반환 + 자동 다운로드
- 인앱 녹음 기능 포함 (파형 시각화)
- macOS/Windows 시스템 오디오 캡처 지원

---

## 9. SDK / Client Library

### 9.1 공식 SDK

**공식 SDK는 없다.** 표준 HTTP 클라이언트로 REST API를 직접 호출하는 방식.

### 9.2 사용 예시

**Python**:
```python
import requests

# 음성 합성
response = requests.post("http://localhost:17493/generate", json={
    "profile_id": "your-profile-uuid",
    "text": "안녕하세요, 테스트입니다.",
    "language": "ko",
    "engine": "chatterbox"
})
generation = response.json()

# 오디오 다운로드
audio = requests.get(f"http://localhost:17493/audio/{generation['id']}")
with open("output.wav", "wb") as f:
    f.write(audio.content)
```

**JavaScript / TypeScript**:
```typescript
const response = await fetch("http://localhost:17493/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    profile_id: "your-profile-uuid",
    text: "Hello, this is a test.",
    language: "en",
    engine: "kokoro",
  }),
});
const generation = await response.json();
```

**cURL**:
```bash
curl -X POST http://localhost:17493/generate \
  -H "Content-Type: application/json" \
  -d '{"profile_id":"uuid","text":"Hello","engine":"qwen"}'
```

### 9.3 SSE (Server-Sent Events) 활용

생성 상태 모니터링과 모델 다운로드 진행률은 SSE로 제공된다:

```javascript
const eventSource = new EventSource(
  `http://localhost:17493/generate/${generationId}/status`
);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { id, status, duration, error }
};
```

---

## 10. 알려진 제한사항

| 항목 | 설명 |
|------|------|
| **텍스트 최대 길이** | 50,000자 (청킹으로 분할 처리) |
| **장문 안정성** | 50k자 제한에도 청킹 안정성 추가 검증 필요 |
| **Voice Prompt 캐시** | PyTorch tensor 기반 — MLX/Chatterbox와 호환성 제한 |
| **instruct 파라미터** | Qwen CustomVoice만 완전 지원, 나머지 엔진은 무시 |
| **Paralinguistic 태그** | Chatterbox Turbo만 해석, 나머지는 텍스트로 읽음 |
| **RTX 50-series** | sm_120 커널 지원 되나 일부 사용자 cudaError 보고 |
| **ROCm** | RDNA 3/4에서 HSA_OVERRIDE_GFX_VERSION 하드코딩 이슈 |
| **WebAudio** | 오디오 세션 중단 시 AudioContext 복구 불가 (앱 재시작 필요) |
| **인증** | 없음. localhost 전용 설계. 외부 노출 시 별도 인증 레이어 필요 |
| **공식 SDK** | 없음. REST 직접 호출 |

---

## 부록: Pydantic 모델 요약

<details>
<summary>주요 Request/Response 모델 필드 요약 (펼치기)</summary>

### GenerationRequest
| 필드 | 타입 | 기본값 | 제약 |
|------|------|--------|------|
| `profile_id` | str | 필수 | UUID |
| `text` | str | 필수 | 1~50,000자 |
| `language` | str | "en" | 검증 패턴 |
| `seed` | int? | null | >= 0 |
| `model_size` | str? | "1.7B" | "0.6B"\|"1.7B"\|"1b"\|"3b-ml" |
| `instruct` | str? | null | 최대 500자 |
| `engine` | str? | "qwen" | 7개 엔진 |
| `max_chunk_chars` | int | 800 | 100~5,000 |
| `crossfade_ms` | int | 50 | 0~500 |
| `normalize` | bool | true | — |
| `effects_chain` | List[EffectConfig]? | null | — |

### VoiceProfileCreate
| 필드 | 타입 | 기본값 | 제약 |
|------|------|--------|------|
| `name` | str | 필수 | 1~100자 |
| `description` | str? | null | 최대 500자 |
| `language` | str | "en" | 22개 언어 코드 |
| `voice_type` | str? | "cloned" | "cloned"\|"preset"\|"designed" |
| `preset_engine` | str? | null | 최대 50자 |
| `preset_voice_id` | str? | null | 최대 100자 |
| `design_prompt` | str? | null | 최대 2,000자 |
| `default_engine` | str? | null | 최대 50자 |

### EffectConfig
| 필드 | 타입 | 기본값 |
|------|------|--------|
| `type` | str | 필수 |
| `enabled` | bool | true |
| `params` | dict | {} |

### TranscriptionRequest
| 필드 | 타입 | 설명 |
|------|------|------|
| `file` | UploadFile | 오디오 파일 (필수) |
| `language` | str? | 10개 언어 |
| `model` | str? | 5개 Whisper 모델 |

</details>

---

*마지막 업데이트: 2026-04-25*
*Sources: [GitHub](https://github.com/jamiepine/voicebox), [voicebox.sh](https://voicebox.sh/), [docs.voicebox.sh](https://docs.voicebox.sh/), [v0.4.0 Release](https://github.com/jamiepine/voicebox/releases/tag/v0.4.0), [BrightCoding](https://www.blog.brightcoding.dev/2026/04/18/voicebox-the-revolutionary-local-voice-studio-every-developer-needs)*
