# AI 인터뷰 코칭 기능 스펙

> **목적**: 인터뷰 편집기에서 AI가 실시간으로 문항 품질을 진단하고, 연구자가 더 나은 인터뷰를 설계하도록 돕는 코칭 기능 정의

---

## 1. 리서치 관점 — 코칭 신호 정의

### 문항 수
| 상태 | 기준 | 코칭 메시지 |
|---|---|---|
| 너무 적음 | 1~2개 | "인터뷰가 너무 짧아요. 최소 5개 이상 권장해요." |
| 적정 | 5~10개 | (코칭 없음) |
| 많음 | 11~14개 | "완료율이 떨어질 수 있어요. 10개 이하로 줄이는 걸 추천해요." |
| 너무 많음 | 15개 이상 | "응답자 이탈률이 높아질 수 있어요. 핵심 질문만 남겨보세요." |

### 문항 유형 균형
- 음성 질문이 전체의 80% 이상: "객관식이나 평가 척도를 섞으면 분석이 쉬워져요."
- 객관식만 있을 경우: "음성 질문을 1~2개 추가하면 깊이 있는 인사이트를 얻을 수 있어요."
- 권장 비율: 음성 40~60% · 객관식 20~30% · 평가척도 20~30%

### 문항 품질 체크
| 유형 | 기준 | 피드백 |
|---|---|---|
| 너무 짧은 질문 | 10자 미만 | "질문이 너무 짧아요. 맥락을 추가해보세요." |
| 너무 긴 질문 | 120자 초과 | "질문이 길면 응답자가 혼란스러울 수 있어요. 핵심만 남겨보세요." |
| 복수 질문 | "그리고", "또한" 포함 | "한 질문에 두 가지를 묻고 있어요. 분리하는 게 좋아요." |
| 유도 질문 | "좋았나요?", "불편하셨나요?" | "중립적인 표현으로 바꾸면 더 정확한 답변을 얻어요." |
| 빈 질문 | 내용 없음 | "질문 내용을 입력해주세요." |

### 객관식 보기 품질
- 보기 1개: "보기가 1개뿐이에요. 최소 2개 이상 추가해주세요."
- 보기 6개 이상: "보기가 많으면 응답자가 피로해요. 5개 이하를 권장해요."
- 빈 보기 포함: "빈 보기가 있어요. 내용을 입력하거나 삭제해주세요."

---

## 2. UX 관점 — 코칭 패널 설계

### 위치: 에디터 우측 패널 하단 (Question Settings 아래)

```
┌─────────────────────────────┐
│  Question Settings          │
│  · 유형 선택                 │
│  · 질문 텍스트               │
│  · 보기 설정                 │
├─────────────────────────────┤  ← 구분선
│  ✦ AI 코치                  │  ← 항상 표시, 접기 가능
│  "질문이 너무 길어요..."      │
│  "객관식 보기를 추가해보세요"  │
└─────────────────────────────┘
```

### 코칭 패널 UI 원칙

1. **Non-blocking**: 코칭이 편집을 막지 않는다. 경고창 대신 인라인 힌트.
2. **Progressive**: 문제 심각도에 따라 아이콘과 색상 차별화
   - 🔴 오류 (빈 질문, 너무 짧은 보기): `C.ruby`
   - 🟡 경고 (질문 수 많음, 유도질문): amber
   - 🟢 팁 (유형 균형 제안): `C.success`
   - ✦ 인사이트 (잘 작성된 질문): `C.purple`
3. **Actionable**: 각 피드백에 원클릭 해결 버튼 제공
   - "질문 분리하기 →", "보기 추가 →", "질문 단축하기 →"
4. **Dismissible**: X 버튼으로 개별 팁 닫기, 전체 패널 접기

### 전체 인터뷰 상태 표시 (상단 헤더)

```
Questions (5)  [●●●○○ 60점]  ⚠ 2개 개선 제안
```

- 점수는 0~100, 60점 이상 "준비 완료" 표시
- 점수 클릭 시 전체 코칭 요약 슬라이드다운

### 코칭 발동 타이밍

| 트리거 | 지연 |
|---|---|
| 질문 내용 타이핑 후 | 1.5초 debounce |
| 보기 추가/삭제 | 즉시 |
| 질문 유형 변경 | 즉시 |
| 새 질문 추가 | 즉시 (전체 문항 수 체크) |
| "Create Link" 버튼 클릭 전 | 미해결 오류가 있으면 블로킹 경고 |

---

## 3. 프로덕트 스펙 — 메시지 & 우선순위

### 코칭 메시지 우선순위 (높을수록 먼저 표시)

| 순위 | 조건 | 레벨 | 메시지 |
|---|---|---|---|
| 1 | 빈 질문 존재 | 오류 | "Q{N} 질문 내용이 비어 있어요" |
| 2 | 빈 보기 존재 | 오류 | "Q{N} 빈 보기를 채워주세요" |
| 3 | 보기 1개 이하 | 경고 | "Q{N} 보기를 1개 더 추가해주세요" |
| 4 | 문항 수 15개 이상 | 경고 | "문항이 너무 많아요 (현재 {N}개)" |
| 5 | 복수 질문 감지 | 경고 | "Q{N}에 질문이 2개 섞여 있는 것 같아요" |
| 6 | 유도 질문 감지 | 경고 | "Q{N}이 특정 방향을 유도하고 있어요" |
| 7 | 문항 수 11~14개 | 팁 | "문항 수를 10개 이하로 줄이면 완료율이 높아져요" |
| 8 | 유형 불균형 | 팁 | "다양한 질문 유형을 섞어보세요" |
| 9 | 문항 수 5개 이하 | 팁 | "질문을 더 추가하면 풍부한 데이터를 얻어요" |
| 10 | 모든 체크 통과 | 인사이트 | "잘 설계된 인터뷰예요! 링크를 만들어 공유해보세요" |

### AI Draft 연동
- "AI Draft" 버튼으로 생성된 질문은 코칭 초기 점수 80점으로 시작
- 수동 편집 후 실시간 재평가

---

## 4. 구현 아키텍트 — 기술 방안

### 컴포넌트 구조

```jsx
// EditorScreen.jsx 내 추가
function CoachingPanel({ questions, selectedIdx }) {
  const issues = useCoachingAnalysis(questions, selectedIdx);
  // issues: [{ level, message, questionIdx, action }]
  ...
}

function useCoachingAnalysis(questions, selectedIdx) {
  // 순수 클라이언트사이드 분석 (AI API 호출 없이)
  // 룰 기반으로 즉시 피드백
  return useMemo(() => analyzeInterview(questions, selectedIdx), [questions, selectedIdx]);
}
```

### 분석 로직 (클라이언트 룰 기반)

```js
function analyzeInterview(questions, selectedIdx) {
  const issues = [];
  
  // 전체 문항 수
  if (questions.length >= 15) issues.push({ level: "warning", message: `문항이 너무 많아요 (현재 ${questions.length}개)`, questionIdx: null });
  
  // 개별 문항 체크
  questions.forEach((q, i) => {
    if (!q.content?.trim()) issues.push({ level: "error", message: `Q${i+1} 질문 내용이 비어 있어요`, questionIdx: i });
    if (q.content?.length > 120) issues.push({ level: "warning", message: `Q${i+1} 질문이 너무 길어요`, questionIdx: i });
    if (q.type === "multiple_choice") {
      const empties = (q.options ?? []).filter(o => !o.trim()).length;
      if (empties > 0) issues.push({ level: "error", message: `Q${i+1} 빈 보기가 있어요`, questionIdx: i });
      if ((q.options ?? []).length < 2) issues.push({ level: "warning", message: `Q${i+1} 보기를 1개 더 추가해주세요`, questionIdx: i });
    }
    // 복수 질문 감지
    if (/그리고|또한|아울러|and/.test(q.content ?? "")) issues.push({ level: "tip", message: `Q${i+1}에 질문이 두 개 섞인 것 같아요`, questionIdx: i });
  });
  
  return issues.sort((a, b) => ["error","warning","tip","insight"].indexOf(a.level) - ["error","warning","tip","insight"].indexOf(b.level));
}
```

### AI 심층 분석 (선택적, 서버 호출)
- 유도 질문 감지, 편향 분석은 클라이언트 룰로 커버 어려움
- "AI 분석 받기" 버튼 클릭 시에만 Supabase Edge Function 호출
- 프롬프트: 전체 질문 목록 → GPT-4o → JSON 형식 피드백 반환
- 캐시: 질문이 변경되지 않으면 재호출 없음 (content hash 기반)

### 상태 관리
```jsx
// EditorScreen 기존 useState에 추가
const [coachingOpen, setCoachingOpen] = useState(true);
const [dismissedTips, setDismissedTips] = useState(new Set());
```

### 인터뷰 점수 계산
```js
function calcScore(questions) {
  const issues = analyzeInterview(questions, null);
  const errors = issues.filter(i => i.level === "error").length;
  const warnings = issues.filter(i => i.level === "warning").length;
  const base = 100;
  return Math.max(0, base - errors * 20 - warnings * 10);
}
```

---

## 5. 단계별 구현 로드맵

| 단계 | 내용 | 난이도 | 예상 시간 |
|---|---|---|---|
| Phase 1 | 클라이언트 룰 기반 코칭 패널 (오류·경고) | 낮음 | 1일 |
| Phase 2 | 인터뷰 점수 표시 + 헤더 상태 | 낮음 | 반나절 |
| Phase 3 | AI 심층 분석 (Edge Function) | 중간 | 2일 |
| Phase 4 | 원클릭 액션 버튼 (자동 수정) | 중간 | 1일 |

Phase 1부터 시작하면 AI 호출 없이 즉시 가치를 제공할 수 있음.

---

## 6. 레퍼런스

- **Maze**: 질문 유형 균형 체크, 예상 완료 시간 표시
- **Typeform**: 인라인 힌트, 질문 수 경고
- **UserTesting**: 연구 목표 → 질문 매핑 코칭
- **Dovetail**: AI 편향 감지, 오픈엔드/클로즈드 균형 제안
