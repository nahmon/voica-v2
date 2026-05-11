# Anti-Recording iPhone App Feasibility Study

**Date:** 2026-05-11
**Concept:** 사람이 못 듣는 초음파 화이트 노이즈를 스피커로 재생하여 AI 노트테이킹 앱의 녹음을 무력화하는 iPhone 앱 서비스

---

## Executive Summary

초음파 마이크 재밍은 학술적으로 입증된 기술이며, AI 녹음 반발에 따른 시장 수요는 실재한다. 그러나 **iPhone 내장 스피커만으로는 초음파 재밍이 물리적으로 불가능**하다. 실현하려면 외장 하드웨어(초음파 트랜스듀서)가 필수이며, 소프트웨어 전용 앱은 "프라이버시 노이즈" 수준의 제한적 기능만 제공할 수 있다.

### Verdict: 조건부 실현 가능

| 접근 방식 | 기술적 실현 | 시장성 | 권장 |
|-----------|:----------:|:------:|:----:|
| 앱 전용 (내장 스피커) | **불가** | 낮음 | X |
| 앱 + 외장 초음파 하드웨어 | **가능** | 높음 | **O** |
| 앱 + 가청 노이즈 마스킹 | 가능 | 중간 | 보조 |

---

## 1. Technical Feasibility

### 1.1 초음파 재밍 원리

MEMS 마이크의 비선형 왜곡(nonlinearity)을 이용한다. 24-26 kHz 초음파가 마이크에 입력되면, 회로의 2차 비선형 항이 상호변조 왜곡(IMD)을 일으켜 가청 대역에 노이즈를 생성한다. 이 노이즈가 음성 신호를 덮어씌워 녹음을 무력화한다.

**핵심 수식:** `V_out = A1·S + A2·S² + A3·S³ + ...` (A2 항이 초음파를 가청 노이즈로 변환)

### 1.2 학술 연구 실적

| 연구 | 연도 | 유효 거리 | WER 달성 | 핵심 혁신 |
|------|------|----------|---------|----------|
| UChicago Bracelet of Silence | 2020 | 1-3m | 70-92% | 24개 PZT 트랜스듀서 링 배열, 손 움직임으로 블라인드스팟 해소 |
| MicFrozen (Zhejiang Univ.) | 2023 | 1-5m | 81-98% | 음성 취소 + 노이즈 이중 방식 |
| UltraJam | 2023 | 1-3m | 높음 | 적응형 초음파 신호 |
| Hedgehog | 2025 | **8-10m** | 80-95% | 방 전체 규모, 가청 노이즈 억제 |

**결론:** 전용 하드웨어 사용 시 기술은 충분히 성숙해 있다.

### 1.3 iPhone 스피커의 근본적 한계

| 항목 | 수치 |
|------|------|
| iPhone 스피커 설계 범위 | 80 Hz - 17 kHz |
| 18 kHz 이상 출력 | -20 ~ -40 dB 급락 |
| 재밍 필요 주파수 | 24-26 kHz |
| 재밍 필요 SPL | 90-110 dB (PZT 트랜스듀서) |
| iPhone 20 kHz 출력 SPL | 사실상 무음 수준 |

**결론:** iPhone 내장 스피커는 초음파 대역에서 재밍에 필요한 음압을 만들 수 없다. 이는 물리적 한계이며 소프트웨어로 극복 불가능하다.

### 1.4 자기 재밍 역설

설령 스피커가 초음파를 낼 수 있더라도:
- 스피커→자기 마이크 거리: ~5cm
- 스피커→타인 폰 거리: 1-3m
- 역제곱 법칙에 의해 자기 마이크가 훨씬 강하게 재밍됨
- **자기 폰으로 타인 폰을 재밍하는 것은 물리적으로 모순**

---

## 2. iOS Platform Constraints

### 2.1 가능한 것

| 기능 | API | 상태 |
|------|-----|------|
| 고주파 사인파 생성 (19 kHz) | AVAudioEngine + AVAudioSourceNode | 가능 |
| 백그라운드 연속 재생 | UIBackgroundModes: audio | 가능 |
| AirPlay/BT 외부 스피커 출력 | AVAudioSession | 가능 (17-20 kHz 개선) |
| 48 kHz 샘플레이트 | Core Audio HAL | 지원됨 |

### 2.2 불가능한 것

| 기능 | 이유 |
|------|------|
| 다른 앱의 마이크 소프트웨어 차단 | iOS TCC 샌드박싱 |
| 20 kHz+ 초음파 내장 스피커 출력 | 스피커 물리적 한계 + DAC LPF |
| "마이크 차단" 마케팅으로 앱스토어 출시 | Guidelines 위반 + 기술적 거짓 주장 |

### 2.3 App Store 전략

- **승인 가능:** "프라이버시 사운드", "집중 노이즈", "회의실 프라이버시" 프레이밍
- **거절 위험:** "안티 레코딩", "마이크 차단", "도청 방지" 마케팅

---

## 3. Competitive Landscape

### 3.1 하드웨어 제품 (시장 존재)

| 제품 | 가격 | 유효 거리 | 특징 |
|------|------|----------|------|
| SpyAssociates Privacy Shield | $50-150 | 2-10m | 음성 감지 자동 활성화 |
| iSecus AJS-333 | $100-400 | 회의실 규모 | BT 스피커 겸용 |
| TheSignalJammer Portable | $20-30 | 1-5m | 120dB SPL |
| JammerMfg F11 | $30-80 | 1-15m | 파워뱅크 형태 |

### 3.2 모바일 앱 (효과 미미)

| 앱 | 플랫폼 | 평가 |
|----|--------|------|
| PilferShush Jammer | Android | "완전히 무용" (LinuxReviews 평가) — API 수준 잠금만, 물리적 효과 없음 |
| Skewy | Android | 광고 비콘 차단용, 도청 방지 아님 |
| Audio Jammer Pro | Android | 가청 화이트 노이즈, 130 다운로드 |

### 3.3 학술 프로토타입 (미상용화)

UChicago Bracelet of Silence: Fast Company 혁신상 후보, NYT 보도. 제조 원가 ~$20. **투자자 접촉 있었으나 2026년 현재까지 상용 제품 출시 없음.**

### 3.4 핵심 특허

| 특허 | 출원인 | 내용 |
|------|--------|------|
| US20230131816A1 | University of Chicago | 웨어러블 마이크 재머 (링 배열 + 제스처 보상) |
| WO2021202686A1 | University of Chicago | 동일 기술 PCT 국제 특허 |

**진입 시 라이선스 협상 또는 회피 설계 필요.**

---

## 4. Market Opportunity

### 4.1 AI 녹음 시장 규모 (위협의 크기)

- AI 미팅 어시스턴트 시장: **$1.2-3.5B (2025)**, 18-26% CAGR
- Granola: 10개월에 밸류에이션 6x 성장 ($1.5B, 2026.3)
- Clova Note: 한국 164만 사용자
- Notta: 닛케이 225 기업 68% 사용

### 4.2 수요 시그널: 소송과 규제

**진행 중인 집단소송:**
- **Brewer v. Otter.ai** (N.D. Cal., 2025) — 무단 녹음 + AI 학습 사용
- **Cruz v. Fireflies.AI** (IL BIPA, 2025)
- **Galanter v. Cresta** (CIPA, 2025)

**규제 압박:**
- EU AI Act 전면 시행: 2026.8
- 한국 AI 기본법: 2026.1 시행
- 미국 12개 주 전원 동의 요구
- GDPR 누적 벌금: €71억 (2025년 중반)

### 4.3 시장 규모 추정

| 구분 | 사용자 | 연간 매출 잠재력 |
|------|--------|-----------------|
| TAM | 60M | $7.2B |
| SAM (지불 의향 10%) | 6M | $720M |
| SOM Year 1 (0.1%) | 6,000 | ~$720K ARR |
| SOM Year 3 (1%) | 60,000 | ~$7.2M ARR |

### 4.4 타겟 세그먼트 우선순위

| 순위 | 세그먼트 | WTP (월) | 트리거 |
|------|---------|---------|--------|
| 1 | 변호사/로펌 | $25-75 | AI 사용 시 변호사-의뢰인 특권 상실 판결 |
| 2 | 투자은행/헤지펀드 | $40-150 | 내부자 거래 위험, Fireflies 차단 사례 |
| 3 | 기업 임원/M&A팀 | $30-100 | 연간 $6000억 영업비밀 탈취 피해 |
| 4 | 의료 (HIPAA) | $15-40 | BAA 없는 AI 도구에 PHI 업로드 = 위반 |
| 5 | 일반 프라이버시 소비자 | $10-15 | VPN 가격 멘탈 모델 |

### 4.5 지역 우선순위

| 시장 | 수요 수준 | 이유 |
|------|----------|------|
| 한국 | 높음 | 164만 Clova Note 사용자, AI 기본법 시행 |
| 미국 | 높음 | 최대 시장, 12개 주 전원 동의, 집단소송 |
| EU | 매우 높음 | GDPR + AI Act 이중 규제 |
| 일본 | 높음 | 닛케이 68% Notta 사용, 문화적 프라이버시 중시 |

---

## 5. Legal & Regulatory

### 5.1 핵심 결론: 대부분의 주요 법역에서 원칙적 합법

| 법역 | 초음파 재밍 합법성 | 근거 |
|------|:-----------------:|------|
| 미국 | **합법** | FCC는 RF만 규제, 음향은 관할 밖 |
| 한국 | **합법** | 전파법은 전파만 규제, 초음파 음향은 사각지대 |
| EU | **합법** | GDPR과 오히려 방향 일치 (자기정보결정권) |
| 일본 | **합법** | 1-party consent, APPI 보호 방향 |

### 5.2 위법 시나리오 (사용 맥락 의존)

| 시나리오 | 법률 | 위험도 |
|---------|------|:------:|
| 경찰 수사 집행 방해 | 공무집행방해 (KR), 18 U.S.C. § 1510 (US) | 높음 |
| 법원 감청 명령 방해 | 통신비밀보호법 (KR), ECPA (US) | 높음 |
| 노동자 녹음권 침해 | 노동관계법, NLRA (US) | 중간 |
| 일반 프라이버시 보호 | 해당 없음 | **없음** |

### 5.3 형사 기소 선례

**초음파 마이크 재밍 기기만을 이유로 형사 기소된 공개 사례는 현재까지 확인되지 않는다.**

---

## 6. Recommended Go-to-Market Strategy

### 6.1 Phase 1: App + 외장 하드웨어 (MVP)

```
Product: iPhone 앱 (제어/UI) + 소형 초음파 트랜스듀서 (BLE 연결)
Target: 변호사, 금융 전문직 (한국/미국)
Price: $299 하드웨어 + $24.99/mo 구독
Timeline: 6-9 months

App 역할:
- 재밍 세션 시작/중지
- 트랜스듀서 방향/강도 제어
- 세션 로그 (컴플라이언스 증빙)
- 재밍 유효 범위 시각화

하드웨어:
- 24개+ PZT 트랜스듀서 원형 배열 (UChicago 설계 참조)
- BLE 5.0 연결
- USB-C 충전, 4시간+ 배터리
- 회의 테이블 위 거치 형태
```

### 6.2 Phase 2: 앱 단독 (보조 기능)

```
Product: 가청 프라이버시 노이즈 앱 (하드웨어 없이 동작)
Target: 일반 소비자
Price: $9.99/mo
기능:
- 17-19 kHz 고주파 노이즈 (일부 마이크 품질 저하)
- 가청 화이트/핑크 노이즈 마스킹
- 정직한 마케팅: "프라이버시 노이즈" (재밍 주장 X)
```

### 6.3 Phase 3: Enterprise

```
Product: 회의실 설치형 재밍 시스템
Target: 로펌, 은행, 병원
Price: $999-2999 하드웨어 + $80/seat/mo
기능:
- 다중 트랜스듀서 천장/벽면 설치
- 10m+ 유효 범위 (Hedgehog 기술 기반)
- 중앙 관리 대시보드
- 컴플라이언스 감사 로그
```

---

## 7. Risk Assessment

| 리스크 | 심각도 | 완화 방안 |
|--------|:------:|----------|
| UChicago 특허 침해 | 높음 | 라이선스 협상 or 회피 설계 (링 배열 아닌 다른 배열) |
| App Store 거절 | 중간 | "프라이버시 사운드" 프레이밍, 하드웨어 제어 앱으로 포지셔닝 |
| AI 디노이징 우회 | 중간 | 적응형/시간-주파수 모자이크 신호 (UltraJam/Hedgehog 기법) |
| 하드웨어 제조 복잡성 | 높음 | 기존 OEM (iSecus 등) 화이트 라벨링 or 파트너십 |
| "재밍 불법" 인식 | 낮음 | 법적 근거 명시 마케팅 (음향 ≠ RF), 변호사 자문 마크 |

---

## 8. Final Verdict

### 순수 소프트웨어 앱으로는 실현 불가능하다.

iPhone 스피커는 초음파 재밍에 필요한 주파수(24-26 kHz)와 음압(90+ dB)을 물리적으로 생성할 수 없다. 이것은 소프트웨어 한계가 아니라 하드웨어의 물리 법칙이다.

### 그러나 앱 + 하드웨어 결합 서비스로는 강력히 실현 가능하다.

- 기술: 학술적으로 충분히 검증됨 (2020-2025 논문 다수)
- 시장: AI 녹음 반발 + 소송 + 규제로 수요 급증 중
- 법률: 대부분 법역에서 합법
- 경쟁: UChicago 프로토타입 외 상용 소프트웨어+하드웨어 결합 제품 부재 → **빈 공간**
- 타이밍: EU AI Act (2026.8), 한국 AI 기본법 (2026.1), Otter 소송 (2026.5) → **지금이 진입 적기**

### 추천 전략

> **"프라이버시 노이즈 앱"으로 시작하여 인지도를 구축하고,
> 외장 초음파 하드웨어를 핵심 제품으로 출시하여 실질적 보호를 제공하라.**

---

## Sources

### Technical Research
- [Wearable Microphone Jamming — UChicago SAND Lab (CHI 2020)](https://sandlab.cs.uchicago.edu/jammer/)
- [MicFrozen — Zhejiang University (MobiCom 2023)](https://gaomingppm.github.io/MicFrozen_Mobicom23.pdf)
- [UltraJam — ScienceDirect 2023](https://www.sciencedirect.com/science/article/pii/S2667295223000272)
- [Hedgehog Room-Scale Jamming — ACM MobiCom 2025](https://dl.acm.org/doi/10.1145/3680207.3723460)
- [SurfingAttack — NDSS 2020](https://surfingattack.github.io/)
- [Understanding Ultrasonic Jammer Effectiveness — arXiv 2019](https://arxiv.org/abs/1904.08490)

### Market & Industry
- [Granola vs Otter vs Fireflies — YipitData 2026](https://www.yipitdata.com/resources/blog/granola-vs-fathom-otter-fireflies-ai-notetaking)
- [AI Meeting Assistants Market — Precedence Research](https://www.precedenceresearch.com/press-release/ai-meeting-assistants-market)
- [Otter.ai Class Action — NPR Aug 2025](https://www.npr.org/2025/08/15/g-s1-83087/otter-ai-transcription-class-action-lawsuit)
- [GDPR Fines Hit €7.1B — Kiteworks 2026](https://www.kiteworks.com/gdpr-compliance/gdpr-fines-data-privacy-enforcement-2026/)
- [Counter Surveillance Market $4.2B — FutureDataStats](https://www.futuredatastats.com/counter-surveillance-system-market)

### Legal & Regulatory
- [FCC Jammer Enforcement](https://www.fcc.gov/general/jammer-enforcement)
- [Recording Laws 50 State Survey — Justia](https://www.justia.com/50-state-surveys/recording-phone-calls-and-conversations/)
- [South Korea AI Basic Act — CSET Georgetown](https://cset.georgetown.edu/publication/south-korea-ai-law-2025/)
- [UChicago Wearable Jammer Patent US20230131816A1](https://patents.google.com/patent/US20230131816A1/en)
- [AI Notetaking Legal Risks — National Law Review](https://natlawreview.com/article/when-ai-notetakers-take-stand-legal-risks-lurking-your-virtual-meetings)

### Competitors
- [iSecus Audio Jammer Products](https://www.isecus.com/audio-recording-jammer-comparison/)
- [SpyAssociates Privacy Shield](https://us.amazon.com/Associates-Ultrasonic-Privacy-Protector-Conversations/dp/B0G16LP6N7)
- [PilferShush Jammer — F-Droid](https://f-droid.org/en/packages/cityfreqs.com.pilfershushjammer/)
- [DIY Antispy Jammer — GitHub](https://github.com/mcore1976/antispy-jammer)
