# Onboarding, Comments, Team Invite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3개 독립 기능 추가 — 첫 로그인 온보딩 모달, 리포트 코멘트, 인터뷰 팀원 초대

**Architecture:** 각 기능은 Supabase 마이그레이션 → Vercel API(필요 시) → React UI 순서로 구현. profiles 테이블은 이미 존재하므로 ALTER로 확장. 팀초대는 email 기반으로 interview_members 테이블에 저장하고 로그인 시 user_id 매핑.

**Tech Stack:** React/Vite SPA, Supabase (auth + RLS + service role), Vercel serverless API (ESM), inline styles + design tokens (C, S, F, Ic from src/lib/constants.jsx)

**Key patterns:**
- API auth: `req.headers.authorization?.replace("Bearer ", "")` → `supabase.auth.getUser(token)`
- API import: `import { supabase } from "../_supabase.js"` (service role)
- Frontend auth: `supabase.auth.getSession()` then `session.access_token` for fetch headers
- Frontend DB: `import { supabase } from "../supabase.js"` (anon key, RLS applies)
- Components: `Btn`, `GlobalNav`, `Footer`, `useToast` from `../components/shared.jsx`
- Design tokens: `C.navy`, `C.purple`, `C.body`, `C.border`, `C.bg`, `C.white`, `F`, `S.card`

---

## Subsystem A: 온보딩 모달 (Onboarding Modal)

**Files:**
- Create: `supabase/migrations/015_onboarding.sql`
- Create: `src/components/OnboardingModal.jsx`
- Modify: `src/App.jsx` (or wherever user state + routing lives — check App.jsx)

### Task A1: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/015_onboarding.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- Add onboarding_completed_at to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

https://supabase.com/dashboard/project/_/sql/new 에 붙여넣기 후 Run.

Expected: `ALTER TABLE` 성공 메시지

---

### Task A2: OnboardingModal 컴포넌트

**Files:**
- Create: `src/components/OnboardingModal.jsx`

- [ ] **Step 1: 컴포넌트 파일 생성**

```jsx
import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn } from "./shared.jsx";

const STEPS_KO = [
  {
    icon: (c) => Ic.Edit({ s: 28, c }),
    title: "인터뷰 만들기",
    desc: "AI가 질문을 자동 생성해줘요. 주제만 입력하면 준비 끝!",
    action: "인터뷰 만들러 가기",
  },
  {
    icon: (c) => Ic.Users({ s: 28, c }),
    title: "패널 초대하기",
    desc: "링크를 공유하면 패널이 바로 음성으로 답변해요.",
    action: "다음",
  },
  {
    icon: (c) => Ic.Check({ s: 28, c }),
    title: "AI 리포트 확인",
    desc: "응답이 쌓이면 AI가 인사이트를 자동으로 분석해줘요.",
    action: "시작하기",
  },
];

export default function OnboardingModal({ user, onComplete, go }) {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);
  const current = STEPS_KO[step];

  const handleNext = async () => {
    if (step < STEPS_KO.length - 1) {
      setStep(step + 1);
    } else {
      await finish();
    }
  };

  const handleAction = async () => {
    if (step === 0) {
      await finish();
      go("editor");
    } else {
      await handleNext();
    }
  };

  const finish = async () => {
    setClosing(true);
    await supabase
      .from("profiles")
      .upsert({ id: user.id, onboarding_completed_at: new Date().toISOString() }, { onConflict: "id" });
    onComplete();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
      opacity: closing ? 0 : 1, transition: "opacity 0.3s",
    }}>
      <div style={{
        background: C.white, borderRadius: 20, padding: "40px 36px",
        maxWidth: 420, width: "100%", textAlign: "center",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32 }}>
          {STEPS_KO.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? C.purple : C.border,
              transition: "all 0.25s",
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(110,75,255,0.1)", border: "2px solid rgba(110,75,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          {current.icon(C.purple)}
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 10, fontFamily: F }}>
          {current.title}
        </div>
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 32, fontFamily: F }}>
          {current.desc}
        </div>

        <Btn full onClick={handleAction}>{current.action}</Btn>

        <button
          onClick={finish}
          style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: C.body, fontFamily: F, textDecoration: "underline" }}>
          건너뛰기
        </button>
      </div>
    </div>
  );
}
```

---

### Task A3: App.jsx에 온보딩 모달 연결

**Files:**
- Modify: `src/App.jsx` (온보딩 상태 체크 + 모달 렌더링)

- [ ] **Step 1: App.jsx 읽기**

`src/App.jsx` 상단 imports, user state, screen 렌더링 부분 확인.

- [ ] **Step 2: onboarding 상태 추가**

user가 로드된 뒤 profiles.onboarding_completed_at 체크:

```jsx
// App.jsx 상단 state에 추가
const [showOnboarding, setShowOnboarding] = useState(false);

// user가 세팅될 때 실행되는 useEffect에 추가 (기존 auth listener 안):
if (session?.user) {
  // 온보딩 체크
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!profile?.onboarding_completed_at) {
    setShowOnboarding(true);
  }
}
```

- [ ] **Step 3: OnboardingModal import + 렌더링**

```jsx
import OnboardingModal from "./components/OnboardingModal.jsx";

// JSX return 최상단(GlobalNav 위):
{showOnboarding && user && (
  <OnboardingModal
    user={user}
    go={go}
    onComplete={() => setShowOnboarding(false)}
  />
)}
```

- [ ] **Step 4: 동작 확인**

새 계정으로 로그인 → 온보딩 모달 표시 확인. "시작하기" 클릭 후 재로그인 시 모달 미표시 확인.

---

## Subsystem B: 리포트 코멘트 (Report Comments)

**Files:**
- Create: `supabase/migrations/016_report_comments.sql`
- Create: `api/comments/[reportId].js`
- Modify: `src/screens/ReportScreen.jsx` (코멘트 섹션 추가)

### Task B1: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/016_report_comments.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
CREATE TABLE IF NOT EXISTS report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;

-- Interview owner can read all comments on their interviews
CREATE POLICY "owner_read" ON report_comments FOR SELECT
  USING (
    interview_id IN (
      SELECT id FROM interviews WHERE user_id = auth.uid()
    )
  );

-- Authenticated user can insert their own comment
CREATE POLICY "insert_own" ON report_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User can delete their own comment
CREATE POLICY "delete_own" ON report_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_report_comments_report_id ON report_comments(report_id, created_at DESC);
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

Expected: `CREATE TABLE`, `CREATE POLICY` (×3), `CREATE INDEX` 성공

---

### Task B2: 코멘트 API

**Files:**
- Create: `api/comments/[reportId].js`

- [ ] **Step 1: API 파일 생성**

```js
// GET  /api/comments/[reportId] — list comments
// POST /api/comments/[reportId] — add comment
// DELETE /api/comments/[reportId]?commentId=xxx — delete own comment
import { supabase } from "../_supabase.js";
import { rateLimit, getIp } from "../_rateLimit.js";

export default async function handler(req, res) {
  const { reportId } = req.query;
  if (!reportId) return res.status(400).json({ error: "reportId required" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

  // Verify report exists and user owns its interview
  const { data: report } = await supabase
    .from("reports")
    .select("id, interview_id, interviews!inner(user_id)")
    .eq("id", reportId)
    .eq("interviews.user_id", user.id)
    .maybeSingle();
  if (!report) return res.status(404).json({ error: "Report not found" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("report_comments")
      .select("id, content, created_at, user_id")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: "Failed to load comments" });
    return res.status(200).json(data ?? []);
  }

  if (req.method === "POST") {
    if (!rateLimit(`comment:${user.id}`, 20)) {
      return res.status(429).json({ error: "Too many requests" });
    }
    const { content } = req.body ?? {};
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "content required" });
    }
    const safe = content.trim().slice(0, 2000);
    const { data, error } = await supabase
      .from("report_comments")
      .insert({ report_id: reportId, interview_id: report.interview_id, user_id: user.id, content: safe })
      .select()
      .single();
    if (error) return res.status(500).json({ error: "Failed to save comment" });
    return res.status(201).json(data);
  }

  if (req.method === "DELETE") {
    const { commentId } = req.query;
    if (!commentId) return res.status(400).json({ error: "commentId required" });
    const { error } = await supabase
      .from("report_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);
    if (error) return res.status(500).json({ error: "Failed to delete comment" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
```

---

### Task B3: ReportScreen에 코멘트 섹션 추가

**Files:**
- Modify: `src/screens/ReportScreen.jsx`

- [ ] **Step 1: 코멘트 state 추가 (기존 useState 블록 근처)**

```jsx
const [comments, setComments] = useState([]);
const [commentText, setCommentText] = useState("");
const [commentLoading, setCommentLoading] = useState(false);
```

- [ ] **Step 2: 코멘트 로드 함수 + useEffect**

보고서 로드 이후 실행:

```jsx
const loadComments = async (reportId) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`/api/comments/${reportId}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.ok) setComments(await res.json());
};
// 기존 report 로드 useEffect 안에서 reportData가 세팅된 후:
// loadComments(reportData.id);
```

- [ ] **Step 3: 코멘트 작성/삭제 핸들러**

```jsx
const handleAddComment = async () => {
  if (!commentText.trim() || commentLoading) return;
  setCommentLoading(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/comments/${report?.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ content: commentText.trim() }),
    });
    if (!res.ok) throw new Error("Failed");
    const newComment = await res.json();
    setComments(prev => [...prev, newComment]);
    setCommentText("");
  } catch {
    showToast(isKo ? "코멘트 저장에 실패했어요" : "Failed to save comment", "error");
  } finally {
    setCommentLoading(false);
  }
};

const handleDeleteComment = async (commentId) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`/api/comments/${report?.id}?commentId=${commentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
};
```

- [ ] **Step 4: 코멘트 UI를 리포트 하단에 추가**

리포트 섹션들 아래, 액션 버튼 위에 삽입:

```jsx
{hasReport && (
  <div style={{ marginTop: 32 }} className="no-print">
    <div style={{ fontSize: 13, fontWeight: 600, color: dk.muted, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {isKo ? "팀 메모" : "Team Notes"} {comments.length > 0 && `(${comments.length})`}
    </div>

    {/* Comment list */}
    {comments.map(c => (
      <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(110,75,255,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: C.purple }}>
          {user?.email?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 14px", border: `1px solid ${dk.border}` }}>
          <div style={{ fontSize: 13, color: dk.text, lineHeight: 1.6 }}>{c.content}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: dk.muted }}>{new Date(c.created_at).toLocaleDateString("ko-KR")}</span>
            {c.user_id === user?.id && (
              <button onClick={() => handleDeleteComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: dk.muted, fontFamily: F, padding: 0, textDecoration: "underline" }}>
                {isKo ? "삭제" : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>
    ))}

    {/* Input */}
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <input
        value={commentText}
        onChange={e => setCommentText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddComment()}
        placeholder={isKo ? "팀 메모 추가..." : "Add a note..."}
        style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${dk.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: dk.text, fontFamily: F, outline: "none" }}
      />
      <button
        onClick={handleAddComment}
        disabled={!commentText.trim() || commentLoading}
        style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: C.purple, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: F, opacity: commentLoading ? 0.6 : 1 }}>
        {isKo ? "추가" : "Add"}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 5: 동작 확인**

completed 리포트 화면 하단에 "팀 메모" 섹션 표시. 코멘트 입력 → 목록에 표시 → 삭제 버튼 동작.

---

## Subsystem C: 팀원 초대 (Interview Members)

**Files:**
- Create: `supabase/migrations/017_interview_members.sql`
- Create: `api/interview/[id]/members.js`
- Create: `src/components/MembersModal.jsx`
- Modify: `src/screens/DashboardScreen.jsx` (초대 버튼 + 공유 인터뷰 목록)

### Task C1: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/017_interview_members.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
CREATE TABLE IF NOT EXISTS interview_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (char_length(email) <= 320),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(interview_id, email)
);

ALTER TABLE interview_members ENABLE ROW LEVEL SECURITY;

-- Interview owner can manage members
CREATE POLICY "owner_manage" ON interview_members FOR ALL
  USING (
    interview_id IN (SELECT id FROM interviews WHERE user_id = auth.uid())
  );

-- Member can read their own membership (for joined interviews)
CREATE POLICY "member_read_own" ON interview_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_interview_members_interview ON interview_members(interview_id);
CREATE INDEX idx_interview_members_user ON interview_members(user_id) WHERE user_id IS NOT NULL;

-- Auto-link user_id when a matching auth user exists
CREATE OR REPLACE FUNCTION link_interview_member_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE interview_members
  SET user_id = (SELECT id FROM auth.users WHERE email = NEW.email LIMIT 1)
  WHERE id = NEW.id AND user_id IS NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER link_member_user
  AFTER INSERT ON interview_members
  FOR EACH ROW EXECUTE FUNCTION link_interview_member_user();
```

- [ ] **Step 2: Supabase SQL Editor에서 실행**

Expected: `CREATE TABLE`, `CREATE POLICY` (×2), `CREATE INDEX` (×2), `CREATE FUNCTION`, `CREATE TRIGGER` 성공

---

### Task C2: 멤버 API

**Files:**
- Create: `api/interview/[id]/members.js`

- [ ] **Step 1: API 파일 생성**

```js
// GET    /api/interview/[id]/members — list members
// POST   /api/interview/[id]/members — invite by email
// DELETE /api/interview/[id]/members?memberId=xxx — remove member
import { supabase } from "../../_supabase.js";
import { rateLimit, getIp } from "../../_rateLimit.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "interview id required" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Unauthorized" });

  // Only owner can manage members
  const { data: interview } = await supabase
    .from("interviews")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!interview) return res.status(404).json({ error: "Interview not found" });

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("interview_members")
      .select("id, email, user_id, role, created_at")
      .eq("interview_id", id)
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: "Failed to load members" });
    return res.status(200).json(data ?? []);
  }

  if (req.method === "POST") {
    if (!rateLimit(`invite:${user.id}`, 10)) {
      return res.status(429).json({ error: "Too many requests" });
    }
    const { email } = req.body ?? {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      return res.status(400).json({ error: "Cannot invite yourself" });
    }
    const { data, error } = await supabase
      .from("interview_members")
      .insert({ interview_id: id, invited_by: user.id, email: email.toLowerCase() })
      .select()
      .single();
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Already invited" });
    }
    if (error) return res.status(500).json({ error: "Failed to invite" });
    return res.status(201).json(data);
  }

  if (req.method === "DELETE") {
    const { memberId } = req.query;
    if (!memberId) return res.status(400).json({ error: "memberId required" });
    const { error } = await supabase
      .from("interview_members")
      .delete()
      .eq("id", memberId)
      .eq("interview_id", id);
    if (error) return res.status(500).json({ error: "Failed to remove member" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
```

---

### Task C3: MembersModal 컴포넌트

**Files:**
- Create: `src/components/MembersModal.jsx`

- [ ] **Step 1: 컴포넌트 파일 생성**

```jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, useToast } from "./shared.jsx";

export default function MembersModal({ interviewId, interviewTitle, onClose }) {
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` };
  };

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/interview/${interviewId}/members`, {
        headers: await authHeaders(),
      });
      if (res.ok) setMembers(await res.json());
    })();
  }, [interviewId]);

  const handleInvite = async () => {
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/interview/${interviewId}/members`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMembers(prev => [...prev, data]);
      setEmail("");
      showToast("초대했어요", "success");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId) => {
    const res = await fetch(`/api/interview/${interviewId}/members?memberId=${memberId}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== memberId));
    else showToast("삭제에 실패했어요", "error");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.white, borderRadius: 20, padding: "32px 28px", maxWidth: 460, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.16)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: F }}>팀원 초대</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            {Ic.X({ s: 18, c: C.body })}
          </button>
        </div>
        <div style={{ fontSize: 13, color: C.body, marginBottom: 24, fontFamily: F }}>{interviewTitle}</div>

        {/* Invite input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleInvite()}
            type="email"
            placeholder="이메일 주소 입력"
            style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: F, outline: "none", color: C.navy }}
          />
          <Btn onClick={handleInvite} disabled={loading}>
            {loading ? "초대 중..." : "초대"}
          </Btn>
        </div>

        {/* Member list */}
        {members.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: C.body, fontFamily: F }}>초대된 팀원이 없어요</div>
        ) : (
          members.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: C.purple, flexShrink: 0 }}>
                {m.email[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.navy, fontFamily: F }}>{m.email}</div>
                <div style={{ fontSize: 11, color: m.user_id ? C.success : C.body, fontFamily: F }}>
                  {m.user_id ? "가입됨" : "미가입 (초대 대기)"}
                </div>
              </div>
              <button onClick={() => handleRemove(m.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                {Ic.X({ s: 14, c: C.body })}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

### Task C4: DashboardScreen에 초대 버튼 연결

**Files:**
- Modify: `src/screens/DashboardScreen.jsx`

- [ ] **Step 1: MembersModal import + state 추가**

```jsx
import MembersModal from "../components/MembersModal.jsx";

// 기존 useState 블록 근처에 추가:
const [membersModal, setMembersModal] = useState(null); // { id, title }
```

- [ ] **Step 2: 인터뷰 카드에 "팀원" 버튼 추가**

각 interview 카드 안에 기존 복사 버튼 근처에 추가:

```jsx
<button
  onClick={e => { e.stopPropagation(); setMembersModal({ id: iv.id, title: iv.title }); }}
  title="팀원 초대"
  style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: "none", cursor: "pointer", fontSize: 12, color: C.body, fontFamily: F, display: "flex", alignItems: "center", gap: 4 }}>
  {Ic.Users({ s: 13, c: C.body })} 팀원
</button>
```

- [ ] **Step 3: MembersModal 렌더링**

DashboardScreen return 최상단:

```jsx
{membersModal && (
  <MembersModal
    interviewId={membersModal.id}
    interviewTitle={membersModal.title}
    onClose={() => setMembersModal(null)}
  />
)}
```

- [ ] **Step 4: 동작 확인**

대시보드 인터뷰 카드 → "팀원" 버튼 → 모달 오픈. 이메일 입력 → 초대 → 목록 표시. X 버튼 → 제거.

---

## 최종 배포

- [ ] **Step 1: 3개 SQL 마이그레이션 Supabase에서 순서대로 실행**
  - 015_onboarding.sql
  - 016_report_comments.sql
  - 017_interview_members.sql

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/mh/voica-v2 && ./node_modules/.bin/tsc --noEmit
```

Expected: 에러 없음 (JSX 프로젝트라 TS 에러는 해당 없음)

- [ ] **Step 3: Vercel 배포**

```bash
cd /Users/mh/voica-v2 && npx vercel --prod
```

Expected: `Aliased: https://voicesurvey.app` 출력
