# voicesurvey Design Guide

> Brand & UI 디자인 가이드 — React/Vite SPA 인라인 스타일 기준

---

## 1. 브랜드 아이덴티티

**포지셔닝:** AI 기반 음성 인터뷰 자동화 플랫폼. 리서처가 "빠르고 저렴하게" 사용자 인터뷰를 실행하고 분석할 수 있게 한다.

**톤 앤 매너:**
- 신뢰감 있는 보라색 브랜드 컬러 — 테크적이면서도 인간적
- 군더더기 없는 미니멀 레이아웃
- 한국어 중심, 영어 병행
- 둥근 모서리 (8–20px) + 섀도우 없는 border 기반 카드

---

## 2. 컬러 팔레트 (`src/lib/constants.jsx`)

| Token | Hex | 용도 |
|---|---|---|
| `C.purple` | `#6E4BFF` | Primary CTA, 선택 상태, 브랜드 |
| `C.purpleHover` | `#5B36F0` | hover 상태 |
| `C.purpleDeep` | `#3d2ab0` | active / pressed 상태 |
| `C.purpleLight` | `#c4b5fd` | 보조 강조 |
| `C.purpleBg` | `rgba(110,75,255,0.07)` | 선택된 카드/칩 배경 |
| `C.navy` | `#1B1140` | 주요 텍스트 (헤딩) |
| `C.label` | `#3d3560` | 라벨, 소제목 |
| `C.body` | `#5B5478` | 본문 텍스트 |
| `C.border` | `#e5edf5` | 구분선, 카드 테두리 |
| `C.bg` | `#f8fafc` | 페이지 배경 |
| `C.white` | `#ffffff` | 카드, 입력창 배경 |
| `C.success` | `#15be53` | 성공 상태 |
| `C.ruby` | `#ea2261` | 에러, 경고 |
| `C.magenta` | `#f96bee` | 보조 포인트 컬러 |
| `C.interviewBg` | `#07081a` | 인터뷰 진행 화면 다크 배경 |

**사용 원칙:**
- CTA 버튼은 항상 `C.purple` 배경 + `C.white` 텍스트
- 에러 메시지: `rgba(217,48,37,0.08)` 배경 + `C.ruby` 텍스트
- 성공 메시지: `rgba(21,190,83,0.08)` 배경 + `C.successText(#108c3d)` 텍스트

---

## 3. 타이포그래피

**폰트:** Pretendard Variable (dynamic subset CDN)

```
F = 'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif
```

로딩: `https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css`

**스케일:**

| 역할 | Size | Weight | Color |
|---|---|---|---|
| 대형 헤딩 (Hero) | 38–44px | 700 | `C.navy` |
| 페이지 헤딩 | 22–28px | 700 | `C.navy` |
| 섹션 헤딩 | 18–20px | 600 | `C.navy` |
| 카드 타이틀 | 15–16px | 600 | `C.navy` |
| 본문 | 13–14px | 400 | `C.body` |
| 라벨/캡션 | 11–12px | 500–600 | `C.label` |
| 마이크로 | 10–11px | 400 | `C.body` |

**한국어 특이사항:**
- `word-break: keep-all` — 단어 단위 줄바꿈
- `letter-spacing: 0.1–0.2px` — 한글 가독성

---

## 4. 버튼 시스템 (`Btn` 컴포넌트)

### 사이즈

| Size | Height | Padding | Font Size | 용도 |
|---|---|---|---|---|
| `sm` | 32px | `0 14px` | 13px | GNB, 인라인 액션 |
| `md` | 40px | `0 18px` | 14px | 일반 액션 |
| `lg` | 48px | `0 24px` | 15px | 주요 CTA |

### 변형

| Variant | 배경 | 텍스트 | 테두리 | 용도 |
|---|---|---|---|---|
| `primary` (default) | `C.purple` | `C.white` | none | 주요 액션 |
| `ghost` | transparent | `C.purple` | `C.purple` | 보조 액션 |
| `white` | `C.white` | `C.navy` | `C.border` | 서드파티 로그인, 중립 |
| `danger` | `C.ruby` | `C.white` | none | 삭제, 위험 액션 |

**규칙:**
- 한 화면에 primary 버튼 최대 2개
- 모바일 primary CTA는 `full` width
- hover: `purpleHover`, active: `purpleDeep`

---

## 5. 카드 & 컨테이너

```jsx
// 표준 카드
{
  background: C.white,
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  padding: "20px 24px",
}

// 선택된 카드 (selected state)
{
  border: `2px solid ${C.purple}`,
  background: C.purpleBg,
}

// 섹션 배경 카드 (내부 정보 블록)
{
  background: C.bg,
  borderRadius: 10,
  padding: "12px 16px",
  border: `1px solid ${C.border}`,
}
```

**섀도우:** `S.elevated = "none"` (섀도우 없음, border 기반)
호버 시만: `S.card = "0 4px 16px rgba(6,27,49,0.1)"`

---

## 6. 폼 & 입력

```jsx
// 표준 Input
{
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 14,
  fontFamily: F,
  color: C.navy,
  background: C.white,
  outline: "none",
}

// Focus state
{ border: `1.5px solid ${C.purple}` }

// Error state  
{ border: `1.5px solid ${C.ruby}` }
```

---

## 7. 뱃지 & 칩

```jsx
// 상태 뱃지
{
  padding: "3px 8px",
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.3,
}

// 카테고리 필터 칩
{
  padding: "5px 10px",
  borderRadius: 20,
  border: `1px solid ${active ? C.purple : C.border}`,
  background: active ? C.purpleBg : C.white,
  color: active ? C.purple : C.body,
  fontSize: 12,
}
```

---

## 8. 스페이싱 시스템

| 용도 | Value |
|---|---|
| 컴포넌트 내부 패딩 (sm) | 12–16px |
| 컴포넌트 내부 패딩 (md) | 20–24px |
| 컴포넌트 내부 패딩 (lg) | 28–40px |
| 섹션 간격 | 40–60px |
| 아이템 간격 | 8–12px |
| 인라인 갭 | 6–10px |
| 모바일 사이드 패딩 | 16–20px |
| 데스크탑 사이드 패딩 | 24–32px |

---

## 9. 레이아웃

**최대 너비:**
- 콘텐츠 영역: `max-width: 1200px` (대시보드)
- 폼/카드: `max-width: 440–560px`
- 모달: `max-width: 480px`

**GNB (Global Navigation Bar):**
- 높이: 52px (데스크탑), 44px (모바일)
- 버튼 높이: 32px (`sm` 사이즈)
- 배경: `C.white`, 하단 border: `1px solid C.border`

**모바일 브레이크포인트:** `≤768px`

---

## 10. 모션 & 전환

```css
/* 표준 전환 */
transition: all 0.15s ease;

/* 페이드 인 업 애니메이션 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}

/* 로딩 스피너 */
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 11. 아이콘 시스템 (`Ic`)

`src/lib/constants.jsx`의 `Ic` 객체. Stripe 스타일 라인 아이콘.

**사용법:**
```jsx
{Ic.Mic({ s: 20, c: C.purple })}  // s=size, c=color
```

---

## 12. 접근성

- 모든 인터랙티브 요소에 `cursor: "pointer"`
- 에러/성공 메시지에 `role="alert"` 또는 `aria-live`
- 이미지에 `alt` 텍스트
- 키보드 네비게이션: `onKeyDown` 핸들러

---

## 13. 금지 패턴

- `box-shadow` 기본 카드에 적용 금지 (hover 상태만 허용)
- `minHeight: 44px` 인라인 버튼에 적용 금지 (모바일 탭바/GNB 제외)
- 보라색 그라디언트 남용 금지
- `Inter`, `CoinbaseSans` 직접 사용 금지 (Pretendard 사용)

---

## 14. 컴포넌트 라이브러리 위치

`src/components/shared.jsx`:
- `Btn` — 버튼 컴포넌트
- `Input` — 인풋 컴포넌트
- `GlobalNav` — GNB
- `Badge` — 뱃지
- `Divider` — 구분선
- `useToast` — 토스트 훅

`src/lib/constants.jsx`:
- `C` — 컬러 토큰
- `S` — 섀도우 토큰
- `F` — 폰트 스택
- `Ic` — 아이콘 시스템
