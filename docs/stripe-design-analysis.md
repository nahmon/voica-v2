# Stripe Design System Analysis
> Voica 적용 관점 리포트 — 2026-04-19

---

## 1. 전체 인상

Stripe는 "금융 인프라"라는 딱딱한 카테고리에서 가장 아름다운 프로덕트 디자인을 만들어냈다. 포인트는 하나다: **신뢰를 구축하기 위해 기술적 정교함을 시각화한다.** 색상이 고급스럽고, 타이포그래피가 날카롭고, 인터랙션이 유려하다. 그 결과 "개발자 도구"가 아니라 "럭셔리 금융 제품"처럼 느껴진다.

---

## 2. 타이포그래피

### 폰트 스택
| 역할 | 폰트 | 특징 |
|------|------|------|
| 헤드라인 | **Stripe Sans** (커스텀) / 공개 대체: Söhne, Graphik | 기하학적 그로테스크, 날카로운 획 |
| 본문 | **Stripe Sans Text** / 대체: Instrument Sans, DM Sans | 가독성 최적화, 중간 weight |
| 코드/모노 | **Roboto Mono** → 현재 **Söhne Mono** | 코드 스니펫, API 키 |
| 마케팅 강조 | 서체에 gradient 적용 | 보라-파랑 그라디언트 텍스트 |

### 타입 스케일 (추정)
```
Hero:    72–96px / weight 600–700 / tracking -0.03em
H1:      48–56px / weight 600 / tracking -0.02em
H2:      32–40px / weight 600 / tracking -0.01em
H3:      24px    / weight 600
Body:    16–18px / weight 400 / line-height 1.6
Small:   13–14px / weight 400 / color: muted
```

### 핵심 패턴
- 헤딩에 **tight letter-spacing** (-0.02 ~ -0.04em) — 고급스러운 압축감
- 마케팅 페이지에서 특정 단어만 **gradient clip text** 처리 (보라-파랑)
- 숫자는 항상 **tabular-nums** feature 적용 (대시보드, 가격표)
- 모바일에서 헤딩 사이즈를 과감하게 줄이지 않음 — 큰 텍스트 유지

---

## 3. 컬러 시스템

### 브랜드 팔레트
```
Primary Blue:    #635BFF (인디고/보라)
Hover Blue:      #4F46E5
Dark:            #0A2540 (딥 네이비 — 배경, 텍스트)
Light BG:        #F6F9FC (아주 연한 청회색)
White:           #FFFFFF
```

### 그라디언트 (핵심 시그니처)
```css
/* 메인 브랜드 그라디언트 */
background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);

/* 히어로 섹션 배경 */
background: linear-gradient(180deg, #0A2540 0%, #1a3a5c 100%);

/* 텍스트 그라디언트 */
background: linear-gradient(90deg, #635BFF, #80D0FF);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### 의미론적 색상
```
Success:  #09825D (진한 녹색 — 결제 성공)
Error:    #C0143C
Warning:  #D97706
Info:     #1570EF
```

### 다크 섹션 처리
- 전체 어둡게 하지 않음. **특정 섹션만** 다크 배경 처리 (히어로, 코드 섹션)
- 다크 섹션에서 accent color는 더 밝고 채도 높게 조정

---

## 4. 레이아웃 & 그리드

### 구조
```
Max-width:      1200px (마케팅) / 1440px (대시보드)
Column grid:    12컬럼
Column gap:     32px
Padding:        0 48px (데스크탑) / 0 24px (모바일)
```

### 특징적 레이아웃 패턴
1. **비대칭 히어로** — 왼쪽 텍스트 + 오른쪽 인터랙티브 UI 데모 (45:55 split)
2. **오버랩 카드** — 배경 그라디언트 위로 카드/UI가 float되어 올라오는 depth 표현
3. **Zigzag 섹션** — 기능 설명: 좌우 교대로 텍스트/이미지 배치
4. **가득 찬 코드 블록** — 배경색과 대비되는 코드 예시, 실시간 타이핑 애니메이션

### 여백 원칙
```
Section gap:    120–160px (매우 넉넉)
Card padding:   32–48px
Element gap:    16–24px
Tight gap:      8–12px
```

---

## 5. 컴포넌트

### Button
```css
/* Primary */
background: #635BFF;
border-radius: 6px;  /* 적당히 rounded — 너무 pill도, 너무 각도 아님 */
padding: 10px 20px;
font-weight: 600;
font-size: 15px;
box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
transition: all 0.15s ease;

/* Hover: 약간 올라오는 느낌 */
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(99,91,255,0.4);
```

### Card
```css
background: white;
border: 1px solid rgba(0,0,0,0.08);
border-radius: 12px;
box-shadow: 0 4px 24px rgba(0,0,0,0.06);

/* 호버 시 */
box-shadow: 0 8px 40px rgba(0,0,0,0.12);
transform: translateY(-2px);
```

### Badge / Tag
```css
/* 기능 레이블 */
background: rgba(99,91,255,0.1);
color: #635BFF;
border: 1px solid rgba(99,91,255,0.2);
border-radius: 4px;
padding: 2px 8px;
font-size: 12px;
font-weight: 600;
letter-spacing: 0.05em;
text-transform: uppercase;
```

### Input
```css
border: 1px solid #D1D5DB;
border-radius: 6px;
padding: 10px 14px;
font-size: 15px;

/* Focus */
border-color: #635BFF;
box-shadow: 0 0 0 3px rgba(99,91,255,0.15);
outline: none;
```

---

## 6. 그림자 시스템

Stripe는 그림자를 통해 "레이어"를 표현한다. 평면이 아니라 깊이가 있는 느낌.

```css
/* Level 1 — 카드, 기본 */
box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);

/* Level 2 — 드롭다운, 팝오버 */
box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06);

/* Level 3 — 모달, 중요 카드 */
box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);

/* Brand shadow — 보라 컬러드 섀도 */
box-shadow: 0 8px 32px rgba(99,91,255,0.35);
```

---

## 7. 모션 & 인터랙션

### 기본 원칙
- 모든 트랜지션: `ease-out` (빠르게 시작, 부드럽게 끝)
- Duration: 150–200ms (빠른 피드백), 300–400ms (페이지 레벨)
- 절대 `ease-in`을 UI 요소에 쓰지 않음 (느리게 시작하는 느낌은 답답함)

### 시그니처 애니메이션
1. **카드 hover lift** — `translateY(-2px)` + box-shadow 증가 (150ms ease-out)
2. **그라디언트 shift** — 배경 그라디언트가 마우스 포지션에 반응해 미세하게 이동
3. **코드 타이핑** — 히어로에서 API 코드가 실시간으로 타이핑되는 연출
4. **Number counter** — 대시보드 숫자가 0에서 카운트업되는 애니메이션
5. **Scroll reveal** — `opacity: 0 → 1` + `translateY(20px → 0)` (IntersectionObserver)

```css
/* 표준 Stripe transition */
transition: all 0.15s ease-out;

/* 중요 요소 */
transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, opacity 0.3s ease-out;
```

---

## 8. 마케팅 페이지 특징

### 히어로 섹션
- 배경: 딥 네이비 + 미세한 그라디언트
- 텍스트: 큰 흰색 헤드라인 (60–80px)
- 서브텍스트: 연한 회색 (#94A3B8 계열)
- CTA: 밝은 보라 버튼 + 흰색 ghost 버튼 병렬
- 우측: 실제 동작하는 UI 데모 (iframe or 애니메이션)

### 신뢰 시그널 배치
- 히어로 바로 아래: 로고 grid (Fortune 500 고객사)
- 숫자로 말하는 섹션: "$640B+ 결제 처리" 같은 임팩트 수치
- 보안 배지, 컴플라이언스 인증은 작게 하단에

---

## 9. Voica에 적용 가능한 요소

### 즉시 적용 가능 (High ROI)

| 요소 | Stripe 패턴 | Voica 적용 방법 |
|------|------------|----------------|
| Gradient text | 키워드에 보라-파랑 gradient clip | 히어로 헤드라인 일부 `C.purple → #4E9BFF` |
| Card hover lift | translateY(-2px) + shadow 증가 | DashboardScreen 인터뷰 카드 |
| Tight heading spacing | letter-spacing -0.02em | 모든 section 헤딩 |
| Brand shadow | rgba(110,75,255,0.3) colored shadow | CTA 버튼 hover state |
| Section rhythm | 120px section gap | LandingScreen 섹션 간격 |

### 중기 적용 (Design 시스템 업데이트 필요)

| 요소 | 설명 |
|------|------|
| 코드/API 블록 | InterviewScreen 공유 링크를 코드블록 스타일로 |
| Number counter | ReportScreen 통계 수치 카운트업 |
| Scroll reveal | LandingScreen 섹션 순차 등장 |
| 비대칭 히어로 | 모바일 인터뷰 미리보기를 우측에 배치 |

### 적용 안 할 것

| 요소 | 이유 |
|------|------|
| 딥 네이비 히어로 배경 | Voica는 화이트 기반. 어둡게 가면 UX리서치 도구 느낌 사라짐 |
| 3D 카드 일러스트 | Stripe 특유의 자산, 직접 차용하면 모방처럼 보임 |
| 복잡한 particle 배경 | 성능 코스트 대비 Voica 브랜드에 어울리지 않음 |

---

## 10. 즉시 코드로 옮길 수 있는 패턴

### 그라디언트 텍스트
```jsx
<span style={{
  background: "linear-gradient(90deg, #6E4BFF, #4E9BFF)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
}}>
  AI 인터뷰
</span>
```

### 카드 호버 리프트
```jsx
const [hovered, setHovered] = useState(false);
<div
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  style={{
    transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
    transform: hovered ? "translateY(-3px)" : "translateY(0)",
    boxShadow: hovered
      ? "0 12px 40px rgba(110,75,255,0.15)"
      : "0 2px 8px rgba(0,0,0,0.06)",
  }}
/>
```

### 브랜드 컬러드 섀도 버튼
```jsx
<button style={{
  background: C.purple,
  boxShadow: hovered
    ? "0 6px 20px rgba(110,75,255,0.4)"
    : "0 2px 8px rgba(110,75,255,0.2)",
  transition: "all 0.15s ease-out",
  transform: hovered ? "translateY(-1px)" : "translateY(0)",
}}>
```

---

**작성**: Claude Sonnet 4.6 / 2026-04-19
**출처**: Stripe.com 디자인 시스템 분석 (지식 기반 + 공개 CSS 패턴)
