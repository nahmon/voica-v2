# Voicebox x VoiceSurvey 통합 리서치

> 작성일: 2026-04-25
> 대상: [Voicebox](https://github.com/jamiepine/voicebox) — Jamie Pine(Spacedrive 창시자)의 오픈소스 AI Voice Studio (23.1k stars, MIT)

---

## 요약 (Executive Summary)

Spacedrive 만든 Jamie Pine이 공개한 **Voicebox**는 로컬 퍼스트 오픈소스 음성 AI 스튜디오다. 3개월 만에 GitHub 23,000+ stars를 달성했고, 7개 TTS 엔진, 23개 언어, 음성 복제(Voice Cloning)를 지원한다. MIT 라이선스로 상용 제한 없이 사용 가능하다.

**VoiceSurvey에 Voicebox를 통합하면:**

| 항목 | 현재 (OpenAI TTS) | Voicebox 통합 후 |
|------|-------------------|-----------------|
| TTS 비용 | ~$15/1M chars | **$0** (인프라 비용만) |
| 음성 옵션 | nova 단일 보이스 | 50+ 프리셋 + 무제한 클로닝 |
| 언어 | 한국어 중심 | 23개 언어 |
| 프라이버시 | 음성 데이터 OpenAI 전송 | 100% 로컬 처리 (GDPR/PIPA 자동 충족) |
| Voice Cloning | 불가 | 수초 샘플로 즉시 클로닝 |

### 핵심 권고

**Phase 1을 즉시 시작하라.** Kokoro-82M 기반 MVP는 2~3주면 가능하고, "AI가 진짜 음성으로 인터뷰하는 플랫폼"이라는 카테고리를 선점할 수 있다.

---

## 리서치 문서 목록

| # | 문서 | 내용 |
|---|------|------|
| 01 | [Voicebox API 분석](01-voicebox-api.md) | REST API 90+ 엔드포인트, 7개 TTS 엔진 비교, Voice Cloning, STT, 오디오 이펙트 |
| 02 | [Voica-v2 음성 아키텍처](02-voica-voice-architecture.md) | 현재 TTS/STT 파이프라인, OpenAI 연동, Supabase Storage 캐싱 구조 |
| 03 | [통합 시나리오 5가지](03-integration-scenarios.md) | TTS 교체, 커스텀 보이스, 다국어, STT 강화, 감정 분석 |
| 04 | [배포 & 인프라](04-deployment-infra.md) | Docker, GPU 클라우드 비용, 아키텍처 설계, 보안 |
| 05 | [경쟁 분석 & 전략](05-competitive-strategy.md) | 상용/오픈소스 비교, 로드맵 4단계, 해시태그 |

---

## 통합 로드맵

```
Phase 1 (2~3주)     Phase 2 (4~6주)      Phase 3 (6~8주)      Phase 4 (8~12주)
Kokoro MVP ────────> 커스텀 페르소나 ────> 다국어 인터뷰 ─────> 감정 분석
- TTS 엔진 교체      - Voice Cloning       - 23개 언어 지원      - 톤/감정 분석
- Bridge phrase 음성  - 인터뷰어 캐릭터     - Chatterbox ML       - 리포트 통합
- RunPod 배포        - 브랜드 보이스       - 언어 자동 감지      - 대시보드 시각화
```

## 배포 전략 요약

| 단계 | 인프라 | 월 비용 | 적합 시점 |
|------|--------|---------|-----------|
| MVP | RunPod Serverless (A10G) | ~$25~50 | 즉시 |
| Growth | 전용 GPU 서버 | ~$400~750 | MAU 1,000+ |
| Scale | Kubernetes + Auto-scaling | $1,500+ | MAU 10,000+ |

## Break-even 분석

RunPod 기준, 하루 **16~32분** TTS 생성 시 self-hosting이 ElevenLabs보다 유리하다. 고품질 모델(ElevenLabs Standard $0.24/분) 대비는 하루 **6분**이면 break-even.

---

## 핵심 API 통합 포인트

현재 VoiceSurvey의 TTS 파이프라인:
```
InterviewScreen → POST /api/speech?type=tts → OpenAI TTS API → Supabase Storage 캐싱
```

Voicebox 통합 후:
```
InterviewScreen → POST /api/speech?type=tts → Voicebox POST /generate → Supabase Storage 캐싱
```

`api/speech.js`의 OpenAI 호출을 Voicebox HTTP 호출로 교체하면 되므로, 프론트엔드 변경 없이 백엔드만 수정하면 된다.

---

## 해시태그

```
#VoiceSurvey #AI음성인터뷰 #VoiceAI #TTS #TextToSpeech
#Voicebox #오픈소스AI #OpenSourceTTS #AIResearch #리서치테크
#음성합성 #VoiceCloning #GDPR #개인정보보호 #PIPA
#MarketResearch #SurveyTech #AI인터뷰 #스타트업 #ProductHunt
```

---

## 참고

- Voicebox GitHub: https://github.com/jamiepine/voicebox
- Voicebox 공식 사이트: https://voicebox.sh
- 라이선스: MIT (상용 제한 없음)
