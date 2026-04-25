# AI Insights, Clip Highlights, Comment Tags, Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4개 독립 기능 추가 — AI 키워드 인사이트, 음성 클립 하이라이트, 코멘트 태그, 참여율 리마인더

**Architecture:** 각 기능은 완전히 독립적이라 병렬 구현 가능. DB migration → API → 프론트 순서로 진행. 기존 Supabase + Vercel serverless 패턴 그대로 사용.

**Tech Stack:** React 18, Vite, Supabase (PostgreSQL + RLS), Vercel serverless (ESM), OpenAI gpt-4o

---

## File Map

| 기능 | 생성 | 수정 |
|------|------|------|
| Feature 1: AI 키워드 | — | `api/report/[id].js`, `src/screens/ReportScreen.jsx` |
| Feature 2: 클립 하이라이트 | `supabase/migrations/020_response_clips.sql`, `api/clips/[responseId].js` | `src/screens/ReportScreen.jsx` |
| Feature 3: 코멘트 태그 | `supabase/migrations/021_comment_tags.sql` | `api/comments/[reportId].js`, `src/screens/ReportScreen.jsx` |
| Feature 4: 리마인더 | — | `src/screens/PanelEntryScreen.jsx`, `src/screens/DashboardScreen.jsx`, `src/screens/ReportScreen.jsx` |

---

## Feature 1: AI 키워드 인사이트

기존 GPT 프롬프트에 `keywords` 배열 추가. ReportScreen 상단에 키워드 칩으로 표시.

### Task 1: GPT 프롬프트에 keywords 추가

**Files:**
- Modify: `api/report/[id].js:141-201`

- [ ] **Step 1: `userPrompt` JSON 스키마에 keywords 필드 추가**

`api/report/[id].js`의 `userPrompt` 변수 안, `"stats"` 블록 바로 위에 다음 필드를 삽입:

```js
  "keywords": ["인터뷰 전체에서 반복 등장한 핵심 단어나 개념 5-8개. 명사 또는 짧은 구로 작성. 예: ['가격', '사용 편의성', '배송 속도']"],
```

변경 후 스키마 순서:
```
summary → keywords → themes → stats → recommendations → demographicInsights → questionInsights
```

- [ ] **Step 2: 프롬프트 끝 지침에 keywords 규칙 추가**

`api/report/[id].js` 200번째 줄 근처 "중요 지침" 블록 끝에 한 줄 추가:
```
- keywords는 5-8개 명사/구로 구성하고, 응답에 실제로 등장한 단어를 사용하세요.
```

- [ ] **Step 3: 배포 전 로컬 검증 — 기존 리포트 있는 인터뷰로 POST 재호출**

```bash
# Vercel dev 서버가 실행 중이라면:
curl -X POST http://localhost:3000/api/report/<interview_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" | jq '.content.keywords'
```

Expected: `["키워드1", "키워드2", ...]` 배열 반환

- [ ] **Step 4: 커밋**

```bash
git add api/report/[id].js
git commit -m "feat: add keywords extraction to report GPT prompt"
```

---

### Task 2: ReportScreen 키워드 칩 UI

**Files:**
- Modify: `src/screens/ReportScreen.jsx`

- [ ] **Step 1: 키워드 섹션 위치 파악**

ReportScreen.jsx에서 `report.content.summary`를 렌더링하는 JSX 블록을 찾는다. 그 바로 아래에 키워드 섹션을 삽입.

```bash
grep -n "summary" src/screens/ReportScreen.jsx | head -20
```

- [ ] **Step 2: 키워드 칩 JSX 삽입**

`report.content.summary` 렌더링 블록 바로 아래 (~summary div 닫는 태그 다음):

```jsx
{/* Keywords */}
{Array.isArray(report.content?.keywords) && report.content.keywords.length > 0 && (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
    {report.content.keywords.map((kw, i) => (
      <span key={i} style={{
        display: "inline-flex", alignItems: "center",
        padding: "4px 10px", borderRadius: 20,
        background: C.purple + "18", color: C.purple,
        fontSize: 12, fontWeight: 600, fontFamily: F,
      }}>
        # {kw}
      </span>
    ))}
  </div>
)}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

- [ ] **Step 4: 커밋**

```bash
git add src/screens/ReportScreen.jsx
git commit -m "feat: display report keywords as chips in ReportScreen"
```

---

## Feature 2: 클립 하이라이트

음성 응답 재생 중 특정 구간을 마킹해 저장하고, 팀에 공유하는 기능.

### Task 3: DB 마이그레이션 — response_clips 테이블

**Files:**
- Create: `supabase/migrations/020_response_clips.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 020_response_clips.sql
CREATE TABLE IF NOT EXISTS response_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_sec float NOT NULL CHECK (start_sec >= 0),
  end_sec float NOT NULL CHECK (end_sec > start_sec),
  label text CHECK (char_length(label) <= 200),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE response_clips ENABLE ROW LEVEL SECURITY;

-- Interview owner can read/write clips on their interviews
CREATE POLICY "owner_all" ON response_clips FOR ALL
  USING (
    interview_id IN (SELECT id FROM interviews WHERE user_id = auth.uid())
  )
  WITH CHECK (
    interview_id IN (SELECT id FROM interviews WHERE user_id = auth.uid())
  );

CREATE INDEX idx_response_clips_response ON response_clips(response_id, created_at);
```

- [ ] **Step 2: Supabase Dashboard에서 SQL 실행**

Supabase Dashboard → SQL Editor → 위 SQL 붙여넣고 실행.

Expected: "Success. No rows returned."

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/020_response_clips.sql
git commit -m "feat: add response_clips table for audio highlight clips"
```

---

### Task 4: API — clips/[responseId].js

**Files:**
- Create: `api/clips/[responseId].js`

- [ ] **Step 1: API 파일 생성**

```js
// GET  /api/clips/[responseId] — list clips for a response
// POST /api/clips/[responseId] — create clip
// DELETE /api/clips/[responseId]?clipId=xxx — delete clip
import { supabase } from "../_supabase.js";

export default async function handler(req, res) {
  const { responseId } = req.query;
  if (!responseId) return res.status(400).json({ error: "responseId required" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

  // Resolve response → interview for ownership check
  const { data: resp } = await supabase
    .from("responses")
    .select("id, session_id, sessions(interview_id)")
    .eq("id", responseId)
    .maybeSingle();
  if (!resp) return res.status(404).json({ error: "Response not found" });

  const interviewId = resp.sessions?.interview_id;
  const { data: iv } = await supabase
    .from("interviews").select("id").eq("id", interviewId).eq("user_id", user.id).maybeSingle();
  if (!iv) return res.status(403).json({ error: "Access denied" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("response_clips")
      .select("id, start_sec, end_sec, label, created_at")
      .eq("response_id", responseId)
      .order("start_sec");
    if (error) return res.status(500).json({ error: "Failed to load clips" });
    return res.status(200).json(data ?? []);
  }

  if (req.method === "POST") {
    const { start_sec, end_sec, label } = req.body ?? {};
    if (typeof start_sec !== "number" || typeof end_sec !== "number" || end_sec <= start_sec) {
      return res.status(400).json({ error: "start_sec and end_sec required, end_sec must be > start_sec" });
    }
    const safeLabel = label ? String(label).slice(0, 200) : null;
    const { data, error } = await supabase
      .from("response_clips")
      .insert({ response_id: responseId, interview_id: interviewId, created_by: user.id, start_sec, end_sec, label: safeLabel })
      .select()
      .single();
    if (error) return res.status(500).json({ error: "Failed to save clip" });
    return res.status(201).json(data);
  }

  if (req.method === "DELETE") {
    const { clipId } = req.query;
    if (!clipId) return res.status(400).json({ error: "clipId required" });
    const { error } = await supabase
      .from("response_clips").delete().eq("id", clipId).eq("created_by", user.id);
    if (error) return res.status(500).json({ error: "Failed to delete clip" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

- [ ] **Step 3: 커밋**

```bash
git add api/clips/[responseId].js
git commit -m "feat: add clips API for audio highlight management"
```

---

### Task 5: ReportScreen 클립 마킹 UI

음성 재생 중 [▶ 클립 시작] / [■ 클립 저장] 버튼, 저장된 클립 목록 표시.

**Files:**
- Modify: `src/screens/ReportScreen.jsx`

- [ ] **Step 1: clips 상태 추가**

ReportScreen.jsx 상단 useState 블록에 추가:
```jsx
const [clips, setClips] = useState({}); // { [responseId]: Clip[] }
const [clipStart, setClipStart] = useState(null); // seconds | null
const [clipLabel, setClipLabel] = useState("");
const [clipSaving, setClipSaving] = useState(false);
```

- [ ] **Step 2: 클립 로드 함수 추가**

`loadComments` 함수 바로 아래에:
```jsx
const loadClips = async (responseId) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`/api/clips/${responseId}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.ok) {
    const data = await res.json();
    setClips(prev => ({ ...prev, [responseId]: data }));
  }
};
```

- [ ] **Step 3: 음성 응답 렌더링 블록에 클립 UI 삽입**

ReportScreen.jsx에서 `playAudio` 버튼이 있는 JSX를 찾아 그 바로 아래에:

```jsx
{/* Clip controls — only shown while this response is playing */}
{playingId === r.id && (
  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
    {clipStart === null ? (
      <button
        onClick={() => {
          setClipStart(audioRef.current?.currentTime ?? 0);
          loadClips(r.id);
        }}
        style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12,
          border: `1px solid ${C.purple}`, color: C.purple,
          background: "transparent", cursor: "pointer", fontFamily: F }}
      >
        ✂ 클립 시작 마킹 ({Math.floor(audioRef.current?.currentTime ?? 0)}s)
      </button>
    ) : (
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={clipLabel}
          onChange={e => setClipLabel(e.target.value)}
          placeholder="클립 이름 (선택)"
          style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8,
            border: `1px solid ${C.border}`, fontFamily: F, width: 120 }}
        />
        <button
          disabled={clipSaving}
          onClick={async () => {
            setClipSaving(true);
            const { data: { session } } = await supabase.auth.getSession();
            const end_sec = audioRef.current?.currentTime ?? clipStart + 1;
            const res = await fetch(`/api/clips/${r.id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
              body: JSON.stringify({ start_sec: clipStart, end_sec, label: clipLabel || null }),
            });
            if (res.ok) {
              loadClips(r.id);
              setClipStart(null);
              setClipLabel("");
              showToast("클립 저장됨", "success");
            } else {
              showToast("클립 저장 실패", "error");
            }
            setClipSaving(false);
          }}
          style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12,
            background: C.purple, color: "#fff", border: "none",
            cursor: "pointer", fontFamily: F }}
        >
          {clipSaving ? "저장 중..." : `■ 저장 (${Math.floor(clipStart)}s → ${Math.floor(audioRef.current?.currentTime ?? clipStart)}s)`}
        </button>
        <button onClick={() => setClipStart(null)}
          style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12,
            border: `1px solid ${C.border}`, background: "transparent",
            cursor: "pointer", fontFamily: F }}>
          취소
        </button>
      </div>
    )}

    {/* Saved clips list */}
    {(clips[r.id] ?? []).length > 0 && (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
        {(clips[r.id] ?? []).map(clip => (
          <span key={clip.id} style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 10,
            background: C.bg2, border: `1px solid ${C.border}`,
            display: "inline-flex", gap: 4, alignItems: "center", fontFamily: F,
          }}>
            ✂ {clip.label || `${Math.floor(clip.start_sec)}s-${Math.floor(clip.end_sec)}s`}
            <button
              onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                await fetch(`/api/clips/${r.id}?clipId=${clip.id}`, {
                  method: "DELETE", headers: { Authorization: `Bearer ${session?.access_token}` },
                });
                loadClips(r.id);
              }}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: C.muted, fontSize: 10, padding: 0 }}>✕</button>
          </span>
        ))}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

- [ ] **Step 5: 커밋**

```bash
git add src/screens/ReportScreen.jsx
git commit -m "feat: audio clip highlight marking in ReportScreen"
```

---

## Feature 3: 코멘트 태그

기존 코멘트 시스템에 태그 배열 추가. 필터링 가능.

### Task 6: DB 마이그레이션 — tags 컬럼 추가

**Files:**
- Create: `supabase/migrations/021_comment_tags.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 021_comment_tags.sql
ALTER TABLE report_comments
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_report_comments_tags ON report_comments USING GIN(tags);
```

- [ ] **Step 2: Supabase Dashboard SQL Editor에서 실행**

Expected: "Success. No rows returned."

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/021_comment_tags.sql
git commit -m "feat: add tags column to report_comments"
```

---

### Task 7: API — comments에 tags 지원 추가

**Files:**
- Modify: `api/comments/[reportId].js:43-58`

- [ ] **Step 1: POST 핸들러에 tags 파싱 추가**

`api/comments/[reportId].js`의 POST 블록 (47번째 줄 근처):

```js
// 기존:
const { content } = req.body ?? {};

// 변경:
const { content, tags } = req.body ?? {};
```

그리고 insert 부분 (54번째 줄 근처):
```js
// 기존:
.insert({ report_id: reportId, interview_id: rep.interview_id, user_id: user.id, content: safe })

// 변경:
const safeTags = Array.isArray(tags)
  ? tags.map(t => String(t).trim().toLowerCase().slice(0, 50)).filter(Boolean).slice(0, 10)
  : [];
.insert({ report_id: reportId, interview_id: rep.interview_id, user_id: user.id, content: safe, tags: safeTags })
```

- [ ] **Step 2: GET 응답에 tags 포함 확인**

GET 핸들러 select 쿼리 수정 (34번째 줄):
```js
// 기존:
.select("id, content, created_at, user_id")

// 변경:
.select("id, content, created_at, user_id, tags")
```

- [ ] **Step 3: 커밋**

```bash
git add api/comments/[reportId].js
git commit -m "feat: support tags in comments API"
```

---

### Task 8: ReportScreen 태그 UI

**Files:**
- Modify: `src/screens/ReportScreen.jsx`

- [ ] **Step 1: 태그 상태 추가**

useState 블록에:
```jsx
const [selectedTag, setSelectedTag] = useState(null); // 태그 필터
const [newCommentTags, setNewCommentTags] = useState([]); // 입력 중인 태그들
const [tagInput, setTagInput] = useState("");
```

- [ ] **Step 2: 코멘트 작성 폼에 태그 입력 추가**

코멘트 입력 textarea 바로 아래에:
```jsx
{/* Tag input */}
<div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6, alignItems: "center" }}>
  {newCommentTags.map((t, i) => (
    <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10,
      background: C.purple + "18", color: C.purple, fontFamily: F,
      display: "inline-flex", gap: 4, alignItems: "center" }}>
      #{t}
      <button onClick={() => setNewCommentTags(prev => prev.filter((_, j) => j !== i))}
        style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0, fontSize: 10 }}>✕</button>
    </span>
  ))}
  <input
    value={tagInput}
    onChange={e => setTagInput(e.target.value)}
    onKeyDown={e => {
      if ((e.key === "Enter" || e.key === " " || e.key === ",") && tagInput.trim()) {
        e.preventDefault();
        const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
        if (tag && !newCommentTags.includes(tag) && newCommentTags.length < 10) {
          setNewCommentTags(prev => [...prev, tag]);
        }
        setTagInput("");
      }
    }}
    placeholder="태그 입력 후 Enter (선택)"
    style={{ fontSize: 11, border: "none", outline: "none", background: "transparent",
      fontFamily: F, minWidth: 100 }}
  />
</div>
```

- [ ] **Step 3: 코멘트 제출 시 tags 포함**

코멘트 POST fetch body에 `tags: newCommentTags` 추가:
```js
body: JSON.stringify({ content: commentText.trim(), tags: newCommentTags }),
```
제출 성공 후 `setNewCommentTags([]); setTagInput("");` 추가.

- [ ] **Step 4: 코멘트 목록 위에 태그 필터 바 추가**

```jsx
{/* Tag filter */}
{(() => {
  const allTags = [...new Set(comments.flatMap(c => c.tags ?? []))];
  if (allTags.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
      <button onClick={() => setSelectedTag(null)}
        style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12,
          background: !selectedTag ? C.purple : "transparent",
          color: !selectedTag ? "#fff" : C.muted,
          border: `1px solid ${!selectedTag ? C.purple : C.border}`,
          cursor: "pointer", fontFamily: F }}>전체</button>
      {allTags.map(t => (
        <button key={t} onClick={() => setSelectedTag(t === selectedTag ? null : t)}
          style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12,
            background: selectedTag === t ? C.purple : "transparent",
            color: selectedTag === t ? "#fff" : C.body,
            border: `1px solid ${selectedTag === t ? C.purple : C.border}`,
            cursor: "pointer", fontFamily: F }}>#{t}</button>
      ))}
    </div>
  );
})()}
```

- [ ] **Step 5: 코멘트 렌더링에 태그 표시 + 필터 적용**

`comments.map(c => ...)` 부분에서 필터 적용:
```jsx
{comments
  .filter(c => !selectedTag || (c.tags ?? []).includes(selectedTag))
  .map(c => (
    // ... 기존 코멘트 렌더링
    // 코멘트 content 아래에 태그 추가:
    {(c.tags ?? []).length > 0 && (
      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
        {c.tags.map((t, i) => (
          <span key={i} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8,
            background: C.purple + "18", color: C.purple, fontFamily: F }}>#{t}</span>
        ))}
      </div>
    )}
  ))
}
```

- [ ] **Step 6: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

- [ ] **Step 7: 커밋**

```bash
git add src/screens/ReportScreen.jsx
git commit -m "feat: comment tags with filter in ReportScreen"
```

---

## Feature 4: 참여율 리마인더

미완료 세션(시작했지만 완료 안 한 패널)을 대시보드에서 확인하고 재공유.

### Task 9: DashboardScreen 미완료 세션 카운터

**Files:**
- Modify: `src/screens/DashboardScreen.jsx`

- [ ] **Step 1: Supabase 쿼리에 미완료 세션 카운트 추가**

DashboardScreen.jsx에서 인터뷰 목록을 fetch하는 supabase select에 추가:
```js
// 기존 select에 sessions(count) 가 있다면:
// started_sessions: sessions!inner(count).eq('status','started') 형태는 지원 안 됨
// 대신 별도 쿼리로 카운트 — 인터뷰 목록 로드 후 batch로 가져오기

// 인터뷰 목록 로드 후:
const ids = interviews.map(iv => iv.id);
const { data: incompleteCounts } = await supabase
  .from("sessions")
  .select("interview_id")
  .in("interview_id", ids)
  .eq("status", "started")
  .is("completed_at", null);

// 인터뷰별 미완료 수 맵 생성:
const incompleteMap = {};
(incompleteCounts ?? []).forEach(s => {
  incompleteMap[s.interview_id] = (incompleteMap[s.interview_id] ?? 0) + 1;
});
setIncompleteMap(incompleteMap);
```

- [ ] **Step 2: useState에 incompleteMap 추가**

```jsx
const [incompleteMap, setIncompleteMap] = useState({});
```

- [ ] **Step 3: 카드 메타 영역에 미완료 배지 표시**

DashboardScreen.jsx 카드 렌더링 부분, 기존 `memberCount` indicator 옆에:
```jsx
{(incompleteMap[p.id] ?? 0) > 0 && (
  <>
    <span style={{ color: C.border }}>·</span>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3,
      color: "#e67e22", fontWeight: 500, fontSize: 11 }}>
      ⏳ {isKo ? `미완료 ${incompleteMap[p.id]}명` : `${incompleteMap[p.id]} incomplete`}
    </span>
  </>
)}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

- [ ] **Step 5: 커밋**

```bash
git add src/screens/DashboardScreen.jsx
git commit -m "feat: show incomplete session count on dashboard cards"
```

---

### Task 10: ReportScreen 미완료 세션 리마인더 패널

**Files:**
- Modify: `src/screens/ReportScreen.jsx`

- [ ] **Step 1: 미완료 세션 필터링**

ReportScreen.jsx에서 이미 `sessions` 상태가 있음. `sessions` 로드 후:
```jsx
const incompleteSessions = sessions.filter(s => s.status === "started" && !s.completed_at);
```

- [ ] **Step 2: 리마인더 패널 UI 추가**

리포트 생성 버튼 섹션 근처에 (완료된 세션 통계 아래):
```jsx
{incompleteSessions.length > 0 && (
  <div style={{ marginTop: 24, padding: "16px 20px", borderRadius: 12,
    border: `1px solid #e67e2240`, background: "#e67e2208" }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: "#e67e22", marginBottom: 8, fontFamily: F }}>
      ⏳ {isKo
        ? `${incompleteSessions.length}명이 인터뷰를 시작했지만 완료하지 않았어요`
        : `${incompleteSessions.length} participants started but didn't finish`}
    </div>
    <div style={{ fontSize: 12, color: C.muted, fontFamily: F, marginBottom: 12 }}>
      {isKo
        ? "인터뷰 링크를 다시 공유해 참여를 독려하세요."
        : "Reshare the interview link to encourage completion."}
    </div>
    <button
      onClick={() => {
        const url = `${window.location.origin}/i/${interview?.share_code ?? ""}`;
        navigator.clipboard.writeText(url);
        showToast(isKo ? "링크 복사됨" : "Link copied", "success");
      }}
      style={{ fontSize: 12, padding: "6px 14px", borderRadius: 10,
        background: "#e67e22", color: "#fff", border: "none",
        cursor: "pointer", fontFamily: F, fontWeight: 600 }}
    >
      {isKo ? "인터뷰 링크 복사" : "Copy interview link"}
    </button>
  </div>
)}
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

- [ ] **Step 4: 커밋**

```bash
git add src/screens/ReportScreen.jsx
git commit -m "feat: incomplete session reminder panel in ReportScreen"
```

---

### Task 11: 최종 배포

- [ ] **Step 1: 전체 빌드 최종 확인**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ 111+ modules transformed`, `✓ built in ...`

- [ ] **Step 2: Vercel 배포**

```bash
vercel deploy --prod --yes 2>&1 | tail -5
```

Expected: `Aliased: https://voicesurvey.app`

---

## Self-Review

**Spec coverage:**
- ✅ Feature 1: GPT keywords 추출 + 칩 UI
- ✅ Feature 2: 클립 마킹 DB + API + UI (시작/저장/삭제)
- ✅ Feature 3: 태그 DB + API + 입력 UI + 필터
- ✅ Feature 4: 미완료 카운트 Dashboard + 리마인더 패널 ReportScreen

**독립성:** 4개 기능이 완전히 독립적. 각 Task 그룹을 순서에 무관하게 구현 가능.

**주의사항:**
- Task 3, 6: Supabase Dashboard에서 SQL 직접 실행 필요 (CLI 로그인 안 된 상태)
- Feature 2의 `responses` 테이블에 `sessions` join이 필요 — `responses` select 시 `sessions(interview_id)` 포함 확인 필요
