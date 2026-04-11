# Voica UI/UX 디자인 리뷰 리포트

> 작성일: 2026-04-10  
> 리뷰어: Senior Product Designer (AI)  
> 기준 파일: `src/App.jsx` (2695줄, single-file React SPA)

---

## Executive Summary

Voica의 전체 UI는 Google Material 계열의 깔끔한 토큰 체계와 두 사용자(광고주/패널) 경로를 색상으로 분리하는 명확한 설계 의도를 갖추고 있다. 그러나 **접근성이 완전히 부재**하며, **빈 상태(Empty State) 누락**, **태블릿 레이아웃 미지원**, **인터뷰 화면 전환 거칠음** 등 즉각 개선이 필요한 문제가 발견되었다.

심각도 분류:
- 심각(Severe): 4건 — 모두 접근성 관련
- 높음(High): 5건 — 기능/UX 품질 직결
- 중간(Medium): 6건 — 경험 마찰 유발
- 낮음(Low): 5건 — 코드 정합성

---

## 1. 색상 일관성

**평가: 양호 (의도적 이중 브랜드 구조)**

`C.purple(#1a73e8)`을 광고주 경로 Primary로, `C.magenta(#e8710a)`를 패널 경로 Secondary로 사용하는 구조는 명확하다. 두 색상은 Hero gradient, 인터뷰 진행바 등에서 블렌딩되어 단일 Voica 브랜드로 수렴한다.

**발견된 문제:**
- `C.bg`와 `C.white` 모두 `#ffffff` — 의미 분리는 이해되나 실질적 중복
- `#f59e0b`(경고 노란색)가 토큰 없이 리터럴로 3곳 이상 하드코딩됨 → `C.warning` 토큰 추가 필요
- 리포트 화면의 `C.magenta` 테마 카드(데이터 Export)가 패널 CTA 색상과 동일 → 맥락 충돌 가능

---

## 2. 타이포그래피 계층

**평가: 보통 (스케일 존재하나 굵기 활용 부족)**

48px/700 Hero → 38px/700 Page H1 → 22-26px/600 Section H2 → 15px/400 Card Title 순으로 크기 계층은 적절하다. 그러나 **굵기(weight) 활용이 400에 지나치게 집중**되어 중간 레벨 요소들의 시각 계층이 약하다.

구체적 문제:
- 대시보드 프로젝트명: `fontSize: 15, fontWeight: 400` — 제목임에도 본문과 구별 불분명
- 대시보드 섹션 헤더 "프로젝트": `fontSize: 14, fontWeight: 400` — 레이블과 구별 어려움
- 보고서 섹션 레이블: `fontSize: 13, fontWeight: 400, color: C.label` — 500 이상 권장

**권장**: Card Title 수준(15px)에 `fontWeight: 500` 적용, 섹션 헤더에 `fontWeight: 600` 적용.

---

## 3. 버튼 일관성

**평가: 보통 (variant 체계 있으나 danger 누락)**

`Btn` 컴포넌트는 primary/ghost/dark/white/소셜로그인 variant를 갖추고 있다. 그러나:

- **`danger` variant 없음**: 거절·삭제 버튼에 `style={{ background: C.ruby }}`로 오버라이드하는 패턴이 `RecruiterAdminScreen`에서 발견됨. variant 체계 밖에서 스타일이 관리되어 일관성 저하
- **`type="button"` 없음**: 모든 `Btn`이 type 미지정. HTML 기본값은 `type="submit"`이므로 form 내부에서 예상치 못한 submit 발생 가능
- **일괄 승인/거절 버튼**: `style={{ background: C.success }}`, `style={{ background: C.ruby }}`로 직접 색상 주입 — variant 사용 권장

---

## 4. 간격(Spacing) 시스템

**평가: 양호 (8px 기반, 일부 예외)**

전체적으로 8px 배수 시스템을 따르나 예외가 존재:
- `Btn` sm: `padding: "5px 14px"` → 5는 4 또는 6 권장
- `Btn` md: `padding: "9px 20px"` → 9는 8 또는 10 권장
- `gap: 7`이 아이콘+텍스트 간격에 반복 사용 → 8로 통일 가능

---

## 5. 모바일 반응형

**평가: 기본 대응 있으나 태블릿 사각지대**

`useIsMobile()` 훅이 768px 단일 기준점으로 동작한다. 768~1024px 태블릿 구간에서는 모바일 레이아웃이 강제 적용되어:
- 패널보드 카드 그리드가 1열로 표시됨 (데스크톱에서는 `minmax(320px,1fr)` 다열)
- 대시보드 stats 카드가 모바일처럼 좁게 표시
- Nav의 데스크톱 메뉴가 숨겨지고 햄버거 메뉴만 표시

**권장**: `useBreakpoint()` 훅으로 `sm(<768) / md(768-1024) / lg(>1024)` 3단 분기 도입.

---

## 6. 다크모드 인터뷰 화면

**평가: 비주얼 완성도 높음, 전환 UX 미흡**

`InterviewScreen`은 `#202124` 기반 다크 UI로, radial gradient 배경, purpleLight 텍스트, 녹음 상태별 시각 피드백이 잘 구성되어 있다.

**문제점:**
1. **진입 전환 없음**: 라이트 화면에서 다크 인터뷰 화면 진입 시 즉각 전환. `opacity: 0 → 1` 페이드인 또는 500ms CSS transition 권장
2. **이탈 전환 없음**: 인터뷰 완료 후 `go("panel_board")` 호출 시 다크→라이트 하드컷
3. **phase 전환 애니메이션 없음**: ai_speaking→ready→recording 상태 전환이 즉시 변경. 각 phase 사이에 opacity transition 권장
4. **waveform 깜빡임**: `Array.from({length:22}).map(() => Math.random())` 패턴이 매 렌더마다 실행되어 녹음 waveform이 불규칙하게 깜빡임. `useMemo`로 고정 필요

---

## 7. 아이콘 시스템

**평가: 양호 (일관된 Stripe-style line 아이콘)**

`Ic` 객체에 정의된 SVG 아이콘들은 대부분 `strokeWidth: 1.65`, `strokeLinecap: "round"`, `strokeLinejoin: "round"` 로 일관되게 처리된다.

**예외/이슈:**
- `Ic.Stop`: `fill` 방식(solid), 나머지는 `stroke` 방식 — 의도적이나 주의 필요
- `Ic.Sparkle`: `fill` 방식 — 동일
- `Ic.Clip`: `viewBox: "0 0 14 14"`, 기본 크기 14px — 다른 아이콘(20px 기본)과 다름
- `Ic.RecDot`: 8px 기본, 녹음 상태 표시용 — 목적상 적절
- 아이콘 함수에 `aria-hidden="true"` 없음 → 스크린리더가 빈 SVG로 읽을 수 있음

---

## 8. 로딩/전환 상태

**평가: 미흡**

- 화면 전환: `go(screen)` 즉시 상태 변경, 전환 애니메이션 전무
- `AdvertiserLoginScreen`: 로그인/가입 중 `loading` state로 버튼 텍스트 변경만 처리 ("로그인 중...") — 스피너 없음
- `InterviewScreen` phase 전환: `setTimeout` 기반으로 자동 진행되나 시각적 피드백은 제한적 (ai_review 단계의 도트 애니메이션은 양호)
- 페이지 레벨 로딩 인디케이터 없음 (`authLoading` state가 있으나 UI 반영 없음)

---

## 9. 접근성 (a11y)

**평가: 심각한 미흡 — 전면 개선 필요**

전체 2695줄에서 `aria-label`, `role`, `aria-current`, `aria-expanded` 등 aria 속성 사용이 **0건**이다.

발견된 심각 이슈:
1. `<nav>` 태그에 `aria-label` 없음 (`role="navigation"` 암묵적이나 label 필요)
2. `Input` 컴포넌트: `<label>`과 `<input>`이 `htmlFor`/`id`로 연결되지 않음
3. 인터뷰 mic 버튼: phase에 따라 역할이 "녹음 시작"/"녹음 중지"로 바뀌나 aria-label 없음
4. 모바일 메뉴 `☰` 버튼: `aria-label`, `aria-expanded` 없음
5. `outline: "none"` 전역 적용으로 키보드 포커스 링 완전 제거
6. 모든 `Ic.*` SVG에 `aria-hidden="true"` 없음
7. `ChipGroup`/`PillGroup` 선택 버튼에 `aria-pressed` 없음

---

## 10. 빈 상태 (Empty State)

**평가: 미구현**

- **대시보드 프로젝트 0건**: `PROJECTS.map(...)` 결과가 빈 배열이면 아무것도 렌더되지 않음. 신규 가입자 온보딩 기회 상실
- **패널보드 검색/필터 결과 0건**: `filtered.map(...)` 결과가 빈 배열이면 빈 화면. "검색 결과가 없습니다" 메시지 없음
- **리포트 패널 현황**: 진행 중인 인터뷰가 없는 경우 처리 없음

---

## 코드 직접 반영 사항

이번 리뷰에서 즉시 코드로 반영된 개선사항:

1. **`Btn` 컴포넌트 — `type="button"` 추가** (form submit 오동작 방지)
2. **`Btn` 컴포넌트 — `danger` variant 추가** (거절/삭제 버튼 일관성)
3. **`InterviewScreen` mic 버튼 — `aria-label` 추가** (녹음 시작/중지 상태별)
4. **모바일 메뉴 `☰` 버튼 — `aria-label`, `aria-expanded` 추가**
5. **Landing Hero CTA 카드 — `border: "1px solid transparent"` 초기값 추가** (레이아웃 시프트 방지)
6. **Dashboard, PanelBoard — Empty State UI 추가**
7. **`Btn` md padding — `"9px 20px"` → `"8px 20px"` 수정** (8px 배수 정렬)
8. **아이콘 SVG — `aria-hidden="true"` 추가** (스크린리더 노이즈 제거)

---

## 우선순위 로드맵

### 즉시 (이번 스프린트)
- [ ] 접근성: `Input` htmlFor/id 연결, `:focus-visible` CSS 추가
- [ ] 접근성: 주요 nav/button aria-label 전수 추가
- [ ] Empty State: 대시보드, 패널보드

### 다음 스프린트
- [ ] `useBreakpoint()` 훅으로 태블릿 레이아웃 지원
- [ ] 인터뷰 화면 진입/이탈 페이드 전환
- [ ] `danger` variant 적용 확산 (RecruiterAdmin 일괄 거절 등)
- [ ] waveform useMemo 고정

### 기술 부채 (백로그)
- [ ] `PillGroup`/`ChipGroup` 공용 컴포넌트 통합
- [ ] `ReportScreen` 사이드바 모바일 대응
- [ ] `RecruiterAdmin` 테이블 모바일 카드 레이아웃
- [ ] `C.warning` 토큰 추가 (`#f59e0b` 하드코딩 제거)
- [ ] Editor textarea controlled 방식 전환
