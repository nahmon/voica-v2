# Voica Design System

> 최종 업데이트: 2026-04-10 | 기준 소스: `src/App.jsx` (2695줄, inline-style SPA)

---

## Brand

**서비스명**: Voica — AI 보이스 인터뷰 플랫폼  
**포지셔닝**: 빠르고 저렴한 대규모 정성 리서치 자동화  
**두 가지 사용자**: 리서처/기업(광고주) ↔ 패널(참여자)  
**브랜드 감성**: 신뢰·정밀함(Google Material 계열) + 에너지·혁신(Orange 액센트)

---

## Color Tokens

| Token | Value | 용도 |
|---|---|---|
| `C.purple` | `#1a73e8` | Primary — 광고주 CTA, 링크, 활성 상태 |
| `C.purpleHover` | `#1557b0` | Primary hover |
| `C.purpleDeep` | `#174ea6` | Enterprise 플랜 강조 |
| `C.purpleLight` | `#a8c7fa` | 다크 배경 위 텍스트/아이콘 |
| `C.purpleBg` | `rgba(26,115,232,0.05)` | 선택 상태 배경 |
| `C.navy` | `#202124` | 제목, 고대비 텍스트 |
| `C.label` | `#3c4043` | 레이블 텍스트 |
| `C.body` | `#5f6368` | 본문·보조 텍스트 |
| `C.white` | `#ffffff` | 흰 배경 |
| `C.bg` | `#ffffff` | 페이지 배경 (= white, 통합 가능) |
| `C.border` | `#dadce0` | 구분선, 비활성 테두리 |
| `C.success` | `#1e8e3e` | 성공, 긍정 감성 |
| `C.successText` | `#137333` | 성공 텍스트 (더 어두운 변형) |
| `C.ruby` | `#d93025` | 에러, 위험, 부정 감성, 녹음 중 |
| `C.magenta` | `#e8710a` | 패널 CTA (Secondary brand color) |
| `C.brandDark` | `#202124` | 푸터 배경 |
| `C.interviewBg` | `#202124` | 인터뷰 화면 전용 다크 배경 |

### 색상 위계 규칙

- **Primary (광고주 경로)**: `C.purple` — 로그인, 대시보드, 리포트, 편집기
- **Secondary (패널 경로)**: `C.magenta` — 패널 등록, 패널 모집 보드 CTA
- 두 색상은 동시에 쓰일 때 `linear-gradient(135deg, C.purple, C.magenta)`로 블렌딩
- `C.bg`와 `C.white`는 동일 값(`#ffffff`)이므로 향후 단일 토큰으로 통합 가능

---

## Typography Scale

| 역할 | 크기 | 굵기 | 사용 화면 |
|---|---|---|---|
| Hero H1 (데스크톱) | 48px | 700 | LandingScreen |
| Hero H1 (모바일) | 32px | 700 | LandingScreen |
| Page H1 | 38px | 700 | PricingScreen |
| Section H2 | 22–26px | 600–700 | Dashboard, Pricing |
| Card Title | 15px | 400 | Dashboard, PanelBoard |
| Body | 14–15px | 400 | 전반 |
| Small / Label | 12–13px | 400–500 | Badge, Input label |
| Micro | 10–11px | 400 | 보조 텍스트, 아이콘 설명 |

**폰트 패밀리**:
- 기본: `'Google Sans', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif`
- 모노: `'Google Sans Mono', 'SF Mono', 'Roboto Mono', monospace`
- `fontFeatureSettings: '"ss01"'` 전역 적용

### 타이포그래피 주의사항
- `fontWeight: 400`이 카드 제목처럼 쓰이는 케이스 다수 → 시각 계층 약화
- 대시보드 섹션 헤더 `fontSize: 14, fontWeight: 400` — 500 이상 권장
- 인터뷰 질문: 데스크톱 20px / 모바일 17px — 적절함

---

## Spacing System

8px 기반 스케일. 대부분 준수하나 예외 존재.

| 비공식 토큰 | 값 | 주 용도 |
|---|---|---|
| xs | 4px | 아이콘-텍스트 gap |
| sm | 8px | 인접 요소 간격 |
| md | 16px | 섹션 내 간격 |
| lg | 24px | 섹션 외부 패딩 |
| xl | 32–40px | 섹션 상하 패딩 |
| 2xl | 64–80px | 히어로 상하 패딩 |

**비일관 사례**:
- `Btn` sm: `padding: "5px 14px"` → 5는 4 또는 6 권장
- `Btn` md: `padding: "9px 20px"` → 9는 8 또는 10 권장
- `gap: 7` 다수 — 8px로 통일 권장

---

## Component Patterns

### Btn
```
variant: primary | ghost | dark | white | kakao | naver | toss | naverpay | tossspay | stripe
size:    sm | md | lg
```
- `disabled`: primary만 `#8ab4f8` 처리, ghost/danger는 disabled 스타일 없음
- `danger` variant 부재 → `style={{ background: C.ruby }}` 오버라이드로 임시 처리
- `type="button"` 속성 없음 → form 컨텍스트에서 submit 오동작 가능

### Badge
```
variant: neutral | purple | ai | success | negative | warning | dark
```
- `ai`: purple+magenta gradient — AI 관련 요소에 적합
- `dark`: 인터뷰 화면 전용

### Input
- focus 시 파란 테두리 + `0 0 0 3px rgba(26,115,232,0.08)` glow
- `label` → `htmlFor` 연결 없음 (접근성 미흡)
- `id` prop 없음

### NavTab
- 하단 2px 언더라인 indicator
- `aria-current` 없음

### PillGroup vs ChipGroup
- 동일 기능 컴포넌트 두 개 중복 존재
  - `PillGroup`: `AdvertiserLoginScreen` 내부 정의 (borderRadius: 20)
  - `ChipGroup`: `PanelEntryScreen` 내부 정의 (borderRadius: 6)
- 공용 컴포넌트로 통합 필요

---

## Screen Inventory

| 화면 | 진입 경로 | 배경 | 반응형 |
|---|---|---|---|
| landing | 기본 | white | O |
| advertiser_login | Nav 로그인 | white | 부분 |
| dashboard | 로그인 후 | white | 부분 |
| editor | 대시보드 프로젝트 | white + dark preview | O |
| panel_entry | Nav 패널 등록 | white | 부분 |
| consent | panel_entry 3단계 | white | 미확인 |
| interview | 패널 확정 후 | **dark** (#202124) | O |
| report | 대시보드 리포트 | white | 미흡 |
| recruiter_admin | 대시보드 패널 관리 | white | 미흡 |
| panel_board | Nav | white + dark hero | O |
| pricing | Nav | white | 부분 |
| support | Footer | white | O |
| faq | — | white | 미확인 |

---

## Known Issues & Debt

| # | 화면 | 문제 | 심각도 | 권장 수정 |
|---|---|---|---|---|
| 1 | 전체 | **접근성 — aria-label/role 전무**: 모든 `<button>`, `<input>`, `<nav>`에 aria 속성 없음 | 심각 | 핵심 인터랙티브 요소에 `aria-label`, `role`, `aria-current` 추가 |
| 2 | 전체 | **Input label-input 연결 없음**: `<label>`과 `<input>` htmlFor/id 미연결, 스크린리더 미지원 | 심각 | Input 컴포넌트에 `id` prop 추가, label에 `htmlFor` 연결 |
| 3 | 전체 | **focus 스타일 전무**: `outline: "none"` 적용, 키보드 사용자 포커스 표시 없음 | 심각 | `:focus-visible` CSS rule로 포커스 링 복원 |
| 4 | interview | **mic 버튼 aria-label 없음**: phase에 따라 역할이 바뀌는 버튼에 aria-label 없음 | 심각 | `aria-label={phase==="recording" ? "녹음 중지" : "녹음 시작"}` 추가 |
| 5 | interview | **waveform Math.random() 매 렌더**: 22개 막대 높이가 매 렌더링마다 재계산 → 깜빡임 | 높음 | `useMemo`로 고정값 유지 |
| 6 | interview | **다크→라이트 전환 하드컷**: `go("panel_board")` 시 #202124 → #ffffff 즉시 전환 | 중간 | opacity fade 래퍼 또는 CSS transition 추가 |
| 7 | dashboard | **Empty State 없음**: 프로젝트 0개일 때 빈 리스트만 렌더, 온보딩 유도 없음 | 높음 | "첫 프로젝트를 만들어 보세요" Empty State 카드 추가 |
| 8 | panel_board | **검색 결과 0건 Empty State 없음**: 필터/검색 결과 없을 때 아무것도 표시 안 됨 | 높음 | "조건에 맞는 인터뷰가 없습니다" 메시지 추가 |
| 9 | 전체 | **Tablet(768~1024px) 대응 없음**: `useIsMobile()` 768px 단일 기준, 태블릿에서 모바일 레이아웃 강제 | 중간 | `useBreakpoint()` 훅 도입 (sm/md/lg 분기) |
| 10 | 전체 | **`danger` Btn variant 없음**: 삭제/거절 액션에 `style={{ background: C.ruby }}` 오버라이드, 비일관 | 중간 | `Btn`에 `danger` variant 추가 |
| 11 | report | **사이드바 모바일 대응 없음**: `width: 250, flexShrink: 0` 고정 — 좁은 화면에서 레이아웃 깨짐 | 높음 | isMobile 기준 세로 스택 레이아웃 전환 |
| 12 | recruiter_admin | **테이블 모바일 불가**: `minWidth: 820` 고정 grid, 모바일 카드형 대응 없음 | 높음 | 모바일에서 카드형 레이아웃 전환 |
| 13 | editor | **textarea controlled 아님**: `defaultValue` 사용 → 편집 내용이 state에 미반영 | 높음 | `value` + `onChange` controlled 방식으로 교체 |
| 14 | landing | **Hero CTA 카드 border 초기값 없음**: mouseEnter에서 `borderColor` 변경 시 레이아웃 시프트 발생 | 중간 | 초기 style에 `border: "1px solid transparent"` 추가 |
| 15 | landing | **모바일 메뉴 `☰` aria-label 없음** | 중간 | `aria-label="메뉴 열기"`, `aria-expanded={menuOpen}` 추가 |
| 16 | pricing | **billing 토글 `type` 없음**: `<button>` without `type="button"` | 낮음 | `type="button"` 명시 |
| 17 | 전체 | **PillGroup/ChipGroup 중복**: 동일 기능 컴포넌트 두 개 존재 | 낮음 | 공용 `ChipGroup` 컴포넌트로 통합 |
| 18 | 전체 | **Btn md padding 비일관**: `"9px 20px"` (9는 8px 배수 아님) | 낮음 | `"8px 20px"` 또는 `"10px 20px"` 통일 |
| 19 | interview | **phase 전환 애니메이션 없음**: ai_speaking→ready→recording 즉시 변경 | 중간 | opacity transition 추가 |
| 20 | landing | **Stats grid 하드코딩**: `gridTemplateColumns: "1fr 1fr"` 고정 — 항목 수 변경 시 깨짐 | 낮음 | `repeat(auto-fit, minmax(120px, 1fr))` 권장 |

---

## Design Principles

1. **신뢰 우선**: 진행률, AI 검토 피드백, 데이터 시각화로 "AI가 정확히 작동 중"임을 시각화
2. **두 사용자 경로 분리**: 광고주(Blue) ↔ 패널(Orange) — 색상으로 경로 구분
3. **컨텍스트 전환**: 라이트(일반) ↔ 다크(인터뷰) — 집중감 강화 의도
4. **진행 상태 명시**: 스텝바, 프로그레스 바, phase 텍스트로 항상 현재 위치 표시
5. **최소 마찰**: 소셜 로그인 우선, 패널 등록 3단계 분리, 단계별 유효성 검사
