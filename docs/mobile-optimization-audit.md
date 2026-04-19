# Mobile Optimization Audit Report

> **Date**: 2026-04-19
> **Scope**: 19 screen files + shared components
> **Breakpoint**: `useIsMobile()` hook at 768px

---

## Executive Summary

19개 화면 중 **8개 화면이 `useIsMobile` 미사용** — 모바일 대응이 전혀 없음.
나머지 11개 화면도 부분적 대응만 되어 있어 소형 디바이스(< 375px)에서 레이아웃 깨짐, 터치 타겟 부족, 가독성 저하 문제가 광범위하게 존재.

### useIsMobile 사용 현황

| 상태 | 화면 |
|------|------|
| **미사용 (Critical)** | FAQScreen, AuthScreen, RoleSelectScreen, EditorScreen* |
| **사용 (부분 대응)** | LandingScreen, AboutScreen, PricingScreen, ConsentScreen, DashboardScreen, InterviewScreen, ResponsesScreen, ReportScreen, RecruiterAdminScreen, PanelBoardScreen, PanelEntryScreen, PanelMyPageScreen, TermsScreen, PrivacyScreen, SupportScreen |

> *EditorScreen은 useIsMobile을 import하지만 데스크톱 레이아웃 고정값이 많음

---

## 화면별 상세 이슈

---

### 1. FAQScreen.jsx — `useIsMobile` 미사용

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 전체 | **useIsMobile 미사용** — 모바일 대응 전무 | Critical |
| 2 | 18 | padding `32px 24px 48px` — 소형 폰에서 과도한 패딩 | Medium |
| 3 | 36 | 아코디언 항목 간 gap 1px — 모바일에서 시각적 구분 부족 | Low |
| 4 | 44 | 아코디언 버튼 터치 피드백(active/pressed state) 없음 | Medium |
| 5 | 63 | CTA 박스 padding `24px` — 소형 화면에서 콘텐츠 좁아짐 | Low |

**개선 프롬프트:**
```
FAQScreen.jsx에 useIsMobile 훅을 추가하고:
1. 컨테이너 padding을 isMobile ? "24px 16px 32px" : "32px 24px 48px"로 변경
2. 아코디언 항목 gap을 isMobile ? 8 : 1로 변경하여 시각적 구분 강화
3. 아코디언 버튼에 active 스타일 추가 (배경색 변경)
4. CTA 박스 padding을 isMobile ? "20px 16px" : "24px 24px"로 조정
```

---

### 2. AuthScreen.jsx — `useIsMobile` 미사용

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 전체 | **useIsMobile 미사용** — 모바일 대응 전무 | Critical |
| 2 | 92 | padding `60px 24px` — 모바일에서 상단 여백 과도 | High |
| 3 | 95 | 제목 fontSize 28px — 모바일에서 과대 | Medium |
| 4 | 103 | 역할 선택 2열 레이아웃 — 375px 미만에서 압축됨 | High |
| 5 | 113 | 카드 padding `28px` — 모바일에서 과도 | Medium |
| 6 | 176 | 도움말 텍스트 fontSize 11px — 모바일 가독성 저하 | Medium |

**개선 프롬프트:**
```
AuthScreen.jsx에 useIsMobile 훅을 추가하고:
1. 상단 padding을 isMobile ? "32px 16px" : "60px 24px"로 변경
2. 제목 fontSize를 isMobile ? 22 : 28로 조정
3. 역할 선택 레이아웃을 isMobile ? flexDirection: "column" : "row"로 변경
4. 카드 padding을 isMobile ? "20px 16px" : "28px 28px"로 조정
5. 도움말/면책 텍스트 fontSize를 최소 12px로 상향
```

---

### 3. RoleSelectScreen.jsx — `useIsMobile` 미사용

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 전체 | **useIsMobile 미사용** — 모바일 대응 전무 | Critical |
| 2 | 31 | 버튼 minWidth 220px — 440px 미만 화면에서 오버플로 | High |
| 3 | 36 | 버튼 padding `36px 28px` — 모바일에서 과도 | Medium |
| 4 | 40 | 아이콘 컨테이너 52x52px — 소형 화면에서 과대 | Low |
| 5 | 43-44 | 제목/설명 fontSize 비반응형 | Medium |

**개선 프롬프트:**
```
RoleSelectScreen.jsx에 useIsMobile 훅을 추가하고:
1. 역할 카드 레이아웃을 isMobile ? flexDirection: "column", width: "100%" : flex: 1, minWidth: 220으로 변경
2. 카드 padding을 isMobile ? "24px 20px" : "36px 28px"로 조정
3. 아이콘 크기를 isMobile ? 40 : 52로 조정
4. 제목 fontSize를 isMobile ? 16 : 18로 조정
```

---

### 4. LandingScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 245 | AnimatedChatMockup width 460px 고정 — 480px 미만에서 오버플로 | High |
| 2 | 494-495 | 장식 blob 560px/400px — 수평 오버플로 유발 가능 | Medium |
| 3 | 506 | 모바일 제목 height 160px 고정 — 텍스트 오버플로 위험 | Medium |
| 4 | 314 | 버튼 padding `8px 18px` — 터치 타겟 44px 미달 | Medium |
| 5 | 526 | CTA 버튼 padding `13px 24px` — 높이 ~39px, 44px 미달 | Medium |

**개선 프롬프트:**
```
LandingScreen.jsx 모바일 개선:
1. AnimatedChatMockup에 isMobile 분기 추가: width를 isMobile ? "100%" : 460으로, maxWidth: 460 설정
2. 장식 blob에 overflow: "hidden" 래퍼 추가 또는 모바일에서 크기 축소
3. 히어로 제목 height를 isMobile ? "auto" : 260으로 변경, minHeight 사용
4. 모든 CTA 버튼 padding을 최소 "12px 24px"으로 상향 (터치 타겟 44px 확보)
```

---

### 5. AboutScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 22, 25 | 하드코딩된 `<br />` — 화면 크기와 무관한 줄바꿈 | Medium |
| 2 | 56 | 링크 버튼 fontSize 12, padding 0 — 터치 타겟 44px 미달 | High |
| 3 | 64 | onMouseEnter/onMouseLeave만 사용 — 터치 디바이스 미고려 | Medium |

**개선 프롬프트:**
```
AboutScreen.jsx 모바일 개선:
1. <br /> 태그를 모바일에서 제거하거나 CSS word-break로 대체
2. 링크 버튼에 최소 padding "8px 16px" 추가하여 터치 타겟 확보
3. hover 이벤트에 @media (hover: hover) 가드 추가 또는 터치 이벤트 병행
```

---

### 6. PricingScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 82 | 결제 토글 padding `6px 20px` — 높이 ~18px, 터치 타겟 심각하게 미달 | High |
| 2 | 100 | 가격 fontSize 36px — 모바일 축소 없음 | Medium |
| 3 | 95, 116 | 카드 padding `32px 28px` — 375px에서 콘텐츠 영역 264px만 남음 | Medium |

**개선 프롬프트:**
```
PricingScreen.jsx 모바일 개선:
1. 결제 토글 padding을 isMobile ? "10px 20px" : "6px 20px"로 변경 (최소 44px 높이)
2. 가격 fontSize를 isMobile ? 28 : 36으로 조정
3. 카드 padding을 isMobile ? "24px 16px" : "32px 28px"로 축소
```

---

### 7. ConsentScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 146 | 테이블 minWidth 420px — 모바일에서 수평 스크롤 필요 | High |
| 2 | 150 | 테이블 헤더 padding `6px 10px` — 모바일에서 협소 | Low |
| 3 | 335 | 제목만 반응형, 나머지 텍스트 비례 조정 없음 | Medium |
| 4 | 350 | 필 padding `7px 16px` — 소형 화면에서 과대 | Low |

**개선 프롬프트:**
```
ConsentScreen.jsx 모바일 개선:
1. 데스크톱 테이블을 모바일에서 카드 레이아웃으로 변환 (기존 모바일 분기 확장)
2. 본문/부제목 텍스트에도 isMobile 분기 추가하여 fontSize 비례 조정
3. 필 padding을 isMobile ? "6px 12px" : "7px 16px"로 축소
```

---

### 8. DashboardScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 174 | 통계 값 fontSize 36px — 모바일 축소 없음 | Medium |
| 2 | 180 | 빠른 작업 카드 minWidth 200px — 375px에서 협소 | Medium |
| 3 | 203 | 검색 입력 minWidth 160px — 폰에서 오버플로 가능 | Medium |
| 4 | 288 | 프로그레스 바 height 4px — 모바일에서 너무 얇음 | Low |
| 5 | 160 | 통계 그리드 2열 + gap 10px — 320px에서 오버플로 | Medium |

**개선 프롬프트:**
```
DashboardScreen.jsx 모바일 개선:
1. 통계 값 fontSize를 isMobile ? 28 : 36으로 조정
2. 빠른 작업 그리드를 isMobile ? "1fr" : "repeat(auto-fit,minmax(200px,1fr))"로 변경
3. 검색 입력 minWidth를 isMobile ? "auto" : 160으로 변경, width: "100%" 추가
4. 프로그레스 바 height를 isMobile ? 6 : 4로 상향
5. 통계 그리드를 320px 이하에서 1열로 변경
```

---

### 9. EditorScreen.jsx — 부분 대응 (데스크톱 고정값 다수)

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 223 | 템플릿 카드 width 160px 고정 — 소형 화면 대응 없음 | Medium |
| 2 | 337-402 | 공유 오버레이 maxWidth 440px — 375px 미만에서 오버플로 | High |
| 3 | 410-416 | QR 코드 180x180px 고정 — 소형 화면에서 과대 | Medium |
| 4 | 699 | 프리뷰 카드 padding `32px 40px` — 모바일 축소 없음 | Medium |
| 5 | 804-806 | 리커트 버튼 min-width 미지정 — 옵션 많을 때 36px 미만 | Medium |
| 6 | 878-886 | 리커트 입력 width 48px 고정 — 모바일 미대응 | Low |

**개선 프롬프트:**
```
EditorScreen.jsx 모바일 개선:
1. 공유 오버레이 maxWidth를 isMobile ? "calc(100vw - 32px)" : 440으로 변경
2. QR 코드 크기를 isMobile ? 140 : 180으로 조정
3. 프리뷰 카드 padding을 isMobile ? "24px 16px" : "32px 40px"로 조정
4. 리커트 버튼에 minWidth: 40 추가
5. 템플릿 카드 width를 isMobile ? 140 : 160으로 조정
```

---

### 10. InterviewScreen.jsx — 양호하나 개선 필요

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 546-568 | 재개 모달 maxWidth 400px — 350px 미만 오버플로 | High |
| 2 | 584, 593 | 마이크 버튼 128x128px 고정 — 280px 미만 오버플로 | Medium |
| 3 | 847-870 | 프로그레스 바 height 3px — 모바일에서 인지 어려움 | Low |
| 4 | 1028-1037 | 리커트 버튼 minWidth 36px — 5점 척도 시 280px 폰에서 압축 | Medium |
| 5 | 1040-1043 | 리커트 라벨 maxWidth 300px — 348px 미만 오버플로 | Medium |
| 6 | 731 | 완료 화면 padding 40px 고정 — 모바일 축소 없음 | Low |

**개선 프롬프트:**
```
InterviewScreen.jsx 모바일 개선:
1. 재개 모달 maxWidth를 isMobile ? "calc(100vw - 32px)" : 400으로 변경
2. 마이크 버튼 크기를 isMobile ? 96 : 128로 조정
3. 프로그레스 바 height를 isMobile ? 4 : 3으로 상향
4. 리커트 라벨 maxWidth를 isMobile ? "calc(100vw - 48px)" : 300으로 변경
5. 완료 화면 padding을 isMobile ? 24 : 40으로 축소
```

---

### 11. ResponsesScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 175 | window.innerWidth >= 768 하드코딩 — useIsMobile과 불일치 | Medium |
| 2 | 440 | 우측 패널 padding `24px 32px` — 총 64px 수평 패딩 과도 | High |
| 3 | 594 | MCAnswer flex 레이아웃 — flexWrap 없어 320px 미만 오버플로 | Medium |

**개선 프롬프트:**
```
ResponsesScreen.jsx 모바일 개선:
1. window.innerWidth 직접 비교를 useIsMobile 훅 사용으로 통일
2. 우측 패널 padding을 isMobile ? "16px" : "24px 32px"로 축소
3. MCAnswer 옵션 레이아웃에 flexWrap: "wrap" 추가
```

---

### 12. ReportScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 218 | 메트릭 카드 minWidth 220px — 소형 화면 오버플로 | Medium |
| 2 | 445 | 테마 그리드 minWidth 200px — 320~400px에서 오버플로 | Medium |
| 3 | 415 | 레이팅 바 height 60px 고정 — 모바일 미조정 | Low |
| 4 | 520 | MetricCard minWidth 120px — 초소형 화면 미고려 | Low |

**개선 프롬프트:**
```
ReportScreen.jsx 모바일 개선:
1. 메트릭 카드 minWidth를 isMobile ? 140 : 220으로 조정
2. 테마 그리드를 isMobile ? "1fr" : "repeat(auto-fill,minmax(200px,1fr))"로 변경
3. 레이팅 바 height를 isMobile ? 48 : 60으로 조정
```

---

### 13. RecruiterAdminScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 144-145 | 데스크톱 테이블 minWidth 980px — 태블릿에서 강제 수평 스크롤 | High |
| 2 | 69 | 메트릭 그리드 minWidth 160px — 5개 카드 시 800px 필요 | High |
| 3 | 79 | 메트릭 값 fontSize 28px — 모바일 축소 없음 | Medium |
| 4 | 25 | InfoTooltip position fixed, width 240px — 모바일에서 화면 밖 | Medium |
| 5 | 129-130 | 모바일 액션 버튼 텍스트 — 340px 미만에서 잘림 가능 | Low |

**개선 프롬프트:**
```
RecruiterAdminScreen.jsx 모바일 개선:
1. 메트릭 그리드를 isMobile ? "1fr 1fr" : "repeat(auto-fit,minmax(160px,1fr))"로 변경
2. 메트릭 값 fontSize를 isMobile ? 22 : 28로 조정
3. InfoTooltip 위치를 모바일에서 뷰포트 안으로 제한 (left/right 클램핑)
4. 데스크톱 테이블에 수평 스크롤 인디케이터 추가
5. 모바일 액션 버튼에 minWidth 추가 또는 아이콘으로 대체
```

---

### 14. PanelBoardScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 378-388 | "Looking for" 섹션 minWidth 140px — 320px 미만 압축 | Medium |
| 2 | 87 | 라이브 뱃지 fontSize 12px — 모바일 접근성 부족 | Low |
| 3 | 178 | 카테고리 필 스크롤바 숨김 — 구형 브라우저 미지원 | Low |

**개선 프롬프트:**
```
PanelBoardScreen.jsx 모바일 개선:
1. "Looking for" 섹션을 isMobile에서 flexDirection: "column"로 스택
2. 라이브 뱃지 fontSize를 최소 13px로 상향
3. 스크롤바 숨김에 -webkit-scrollbar 폴백 추가
```

---

### 15. PanelEntryScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 198 | 프로필 요약 그리드 2열 고정 — 350px 미만 오버플로 | High |
| 2 | 80 | 컨테이너 padding `40px 24px` — isMobile 분기 없음 | Medium |
| 3 | 232 | 체크박스 20x20px — 터치 타겟 44px 미달 | Medium |

**개선 프롬프트:**
```
PanelEntryScreen.jsx 모바일 개선:
1. 프로필 요약 그리드를 isMobile ? "1fr" : "1fr 1fr"로 변경
2. 컨테이너 padding을 isMobile ? "24px 16px" : "40px 24px"로 조정
3. 체크박스에 padding 12px 추가하여 터치 영역 확장 (시각적 크기 유지)
```

---

### 16. PanelMyPageScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 376 | 토글 버튼 42x24px — 터치 타겟 44px 미달 | High |
| 2 | 114 | 출금 금액 fontSize 36px — 모바일 축소 없음 | Medium |
| 3 | 285 | 도넛 차트 size 80px — 300px 미만에서 오버플로 가능 | Low |
| 4 | 323-328 | 타임라인 — 긴 회사명 수평 오버플로 | Medium |

**개선 프롬프트:**
```
PanelMyPageScreen.jsx 모바일 개선:
1. 토글 버튼 주변에 padding 추가하여 터치 영역 44x44px 확보
2. 출금 금액 fontSize를 isMobile ? 28 : 36으로 조정
3. 타임라인 텍스트에 overflow: "hidden", textOverflow: "ellipsis" 추가
4. 리워드 카드 padding을 isMobile ? "16px" : "24px"로 조정
```

---

### 17. TermsScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 191 | h2 fontSize 15px — 모바일 최소 권장 16px 미달 | Medium |
| 2 | 192 | lineHeight 2 — 모바일에서 수직 공간 낭비 | Low |
| 3 | 13 | padding `48px 24px` — 모바일에서 과도 | Low |

**개선 프롬프트:**
```
TermsScreen.jsx 모바일 개선:
1. h2 fontSize를 최소 16px로 상향
2. lineHeight를 isMobile ? 1.7 : 2로 조정
3. 외부 padding을 isMobile ? "32px 16px" : "48px 24px"로 축소
```

---

### 18. PrivacyScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 296 | 테이블 스크롤 가능하지만 스크롤 인디케이터 없음 | Medium |
| 2 | 192 | lineHeight 2 — 모바일에서 공간 낭비 | Low |
| 3 | 231-237 | 개인정보 보호 책임자 정보 fontSize 13px — 가독성 저하 | Low |

**개선 프롬프트:**
```
PrivacyScreen.jsx 모바일 개선:
1. 스크롤 가능 테이블에 시각적 스크롤 힌트 추가 (그라데이션 또는 화살표)
2. lineHeight를 isMobile ? 1.7 : 2로 조정
3. 보호 책임자 정보 fontSize를 최소 14px로 상향
```

---

### 19. SupportScreen.jsx — 부분 대응

| # | 라인 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | 97 | textarea rows 7 고정 — 소형 모바일에서 뷰포트 과점유 | Medium |
| 2 | 47 | 컨테이너 maxWidth 560, padding `32px 24px` — 320px 미만 협소 | Low |
| 3 | 75 | 카테고리 칩 fontSize 12, padding `6px 12px` — 터치 타겟 부족 | Medium |

**개선 프롬프트:**
```
SupportScreen.jsx 모바일 개선:
1. textarea rows를 isMobile ? 4 : 7로 조정
2. 컨테이너 padding을 isMobile ? "24px 16px" : "32px 24px"로 축소
3. 카테고리 칩 padding을 isMobile ? "8px 14px" : "6px 12px"로 상향 (터치 타겟 확보)
```

---

## 공통 패턴 이슈 및 권장 사항

### 1. 터치 타겟 부족 (전체 화면 공통)
- 최소 터치 타겟: **44x44px** (Apple HIG / WCAG 2.5.5)
- 영향 화면: PricingScreen(토글 18px), AboutScreen(링크 버튼), PanelMyPageScreen(토글 24px)
- **권장**: Btn 컴포넌트에 `minHeight: 44` 기본값 추가

### 2. 고정 폰트 크기 미조정
- 36px+ 숫자가 모바일에서 그대로 표시되는 화면 다수
- **권장**: 공통 `responsiveFontSize(mobile, desktop)` 유틸리티 도입

### 3. overflow 대응 부족
- maxWidth/minWidth 고정값이 375px 미만 화면에서 오버플로
- **권장**: `maxWidth: "calc(100vw - 32px)"` 패턴 적용 또는 `overflow: "hidden"` 가드

### 4. safe-area-inset 미적용
- InterviewScreen만 env(safe-area-inset-bottom) 사용
- **권장**: 하단 고정 요소가 있는 모든 화면에 safe-area-inset 적용

### 5. 가로 모드(landscape) 미고려
- 모든 화면이 세로 모드 기준으로만 설계
- **권장**: `100dvh` 사용 확대, landscape에서 사이드 패딩 조정

---

## 우선순위 정리

### P0 — 즉시 수정 (useIsMobile 미사용 화면)
1. **AuthScreen** — 로그인/가입 화면, 모바일 사용자 진입점
2. **RoleSelectScreen** — 온보딩 필수 경로
3. **FAQScreen** — 고객 지원 접점

### P1 — 높은 우선순위 (기능 핵심 화면)
4. **EditorScreen** — 공유 모달 오버플로
5. **InterviewScreen** — 재개 모달 오버플로
6. **RecruiterAdminScreen** — 데이터 테이블 980px 강제 스크롤
7. **PanelEntryScreen** — 프로필 그리드 오버플로

### P2 — 중간 우선순위 (UX 개선)
8. **DashboardScreen** — 통계/검색 레이아웃
9. **ResponsesScreen** — 패딩 과도
10. **PanelMyPageScreen** — 터치 타겟 / 폰트
11. **LandingScreen** — 히어로 섹션 고정값

### P3 — 낮은 우선순위 (미세 조정)
12. ConsentScreen, ReportScreen, PricingScreen, AboutScreen
13. PanelBoardScreen, TermsScreen, PrivacyScreen, SupportScreen
