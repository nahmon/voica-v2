# Dream Bible — 성경 기반 꿈해몽 AI MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 꿈을 텍스트로 입력하면 AI가 성경 구절과 신학적 원리에 기반해 해석을 제공하는 한국어 웹 서비스 (월 무료 3회, 유료 무제한)

**Architecture:** voica-v2와 동일한 스택 — React 18 + Vite + Supabase + OpenAI + Vercel Serverless. `/api/interpret.js` 단일 엔드포인트가 OpenAI를 호출하고 Supabase에 저장. 프론트엔드는 `useState` 기반 스크린 라우팅 (`go()` 패턴).

**Tech Stack:** React 18 (JSX, no TypeScript), Vite 6, Supabase JS v2, OpenAI SDK v6, Vercel Functions, inline styles, Pretendard 폰트, 의존성 없음 (voica-v2와 동일)

**New project root:** `/Users/mh/dream-bible/`

---

## File Map

```
/Users/mh/dream-bible/
├── package.json
├── vite.config.js
├── vercel.json
├── index.html
├── public/
│   └── favicon.svg
├── api/
│   └── interpret.js          # POST: 꿈 텍스트 → OpenAI → DB 저장 → 해석 반환
├── supabase/
│   └── migrations/
│       └── 20260415000000_initial.sql  # dreams + dream_usage 테이블
└── src/
    ├── main.jsx
    ├── App.jsx                # 스크린 라우터 + auth 상태
    ├── supabase.js            # Supabase 클라이언트
    ├── lib/
    │   └── constants.jsx      # 성경적 색상 테마 + 아이콘
    ├── components/
    │   └── shared.jsx         # Toast, Btn, Input, Skeleton (voica-v2에서 적용)
    └── screens/
        ├── LandingScreen.jsx  # 서비스 소개 + CTA
        ├── AuthScreen.jsx     # 이메일 로그인/회원가입
        ├── DreamScreen.jsx    # 꿈 입력 폼 (핵심 기능)
        ├── ResultScreen.jsx   # AI 해석 결과 + 성경 구절
        └── HistoryScreen.jsx  # 내 꿈 기록 목록
```

---

## Milestone 1: 기반 구축 (Day 1–2)

### Task 1: Project Scaffold

**Files:**
- Create: `/Users/mh/dream-bible/` (전체 디렉토리 구조)

- [ ] **Step 1: 디렉토리 생성 및 package.json 작성**

```bash
mkdir -p /Users/mh/dream-bible/{api,public,src/{lib,components,screens},supabase/migrations}
```

`/Users/mh/dream-bible/package.json`:
```json
{
  "name": "dream-bible",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.103.0",
    "openai": "^6.34.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.3.1"
  }
}
```

- [ ] **Step 2: vite.config.js 작성**

`/Users/mh/dream-bible/vite.config.js`:
```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 3: vercel.json 작성**

`/Users/mh/dream-bible/vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 4: index.html 작성**

`/Users/mh/dream-bible/index.html`:
```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>꿈묵상 — 성경으로 꿈 돌아보기</title>
    <meta name="description" content="꿈을 기록하면 성경 말씀으로 묵상 가이드를 드립니다" />
    <link rel="preconnect" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/" crossorigin />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #FDF6E3; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: favicon.svg 작성**

`/Users/mh/dream-bible/public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#1B2A4A"/>
  <text x="16" y="22" text-anchor="middle" font-size="18">✦</text>
</svg>
```

- [ ] **Step 6: 의존성 설치**

```bash
cd /Users/mh/dream-bible && npm install
```

Expected: `node_modules/` 생성, `package-lock.json` 생성

- [ ] **Step 7: .env.local 파일 생성 확인**

`.env.local` 파일이 없으면 개발자에게 아래 내용으로 직접 생성하도록 안내:
```
VITE_SUPABASE_URL=<Supabase 프로젝트 URL>
VITE_SUPABASE_ANON_KEY=<Supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase service role key>
OPENAI_API_KEY=<OpenAI API 키>
```
→ `.env.local`은 gitignore되어야 하므로 직접 작성하지 말 것

- [ ] **Step 8: 커밋**

```bash
cd /Users/mh/dream-bible && git init && git add package.json vite.config.js vercel.json index.html public/
git commit -m "feat: project scaffold — dream-bible"
```

---

### Task 2: Supabase 스키마

**Files:**
- Create: `supabase/migrations/20260415000000_initial.sql`

- [ ] **Step 1: SQL 마이그레이션 작성**

`/Users/mh/dream-bible/supabase/migrations/20260415000000_initial.sql`:
```sql
-- 꿈 기록 테이블
create table dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  dream_text text not null,
  interpretation text not null,
  created_at timestamptz default now()
);

alter table dreams enable row level security;

create policy "Users can read own dreams"
  on dreams for select
  using (auth.uid() = user_id);

create policy "Users can insert own dreams"
  on dreams for insert
  with check (auth.uid() = user_id);

-- 월별 사용량 추적 (무료 플랜 3회 제한)
create table dream_usage (
  user_id uuid references auth.users(id) on delete cascade not null,
  month text not null,  -- 'YYYY-MM' 형식
  count integer default 0 not null,
  primary key (user_id, month)
);

alter table dream_usage enable row level security;

create policy "Users can read own usage"
  on dream_usage for select
  using (auth.uid() = user_id);

-- Service role이 usage를 upsert할 수 있도록 (api/interpret.js에서 사용)
-- Service role bypasses RLS by default
```

- [ ] **Step 2: Supabase 대시보드에서 마이그레이션 실행 확인 안내**

Supabase 대시보드 → SQL Editor → 위 SQL 붙여넣기 → Run  
또는: `supabase db push` (Supabase CLI 사용 시)

Expected: `dreams`, `dream_usage` 테이블 생성 확인

- [ ] **Step 3: 커밋**

```bash
cd /Users/mh/dream-bible && git add supabase/
git commit -m "feat: supabase schema — dreams + dream_usage tables"
```

---

### Task 3: API 엔드포인트 — `/api/interpret.js`

**Files:**
- Create: `api/interpret.js`

이 파일이 서비스의 핵심. OpenAI를 호출해 성경 기반 꿈 해석을 생성하고, Supabase에 저장한 뒤 결과 반환. 무료 사용자는 월 3회 제한.

- [ ] **Step 1: interpret.js 작성**

`/Users/mh/dream-bible/api/interpret.js`:
```js
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FREE_LIMIT = 3;
const CURRENT_MONTH = () => new Date().toISOString().slice(0, 7); // 'YYYY-MM'

const SYSTEM_PROMPT = `당신은 성경에 기반한 꿈 묵상 가이드입니다.
사용자가 꿈 내용을 공유하면, 다음 원칙에 따라 응답하세요:

1. 성경에서 꿈과 관련된 실제 구절을 2~3개 인용하세요 (요엘 2:28, 창세기 37장, 다니엘서 등)
2. 꿈의 주요 상징 요소를 성경적 관점에서 설명하세요
3. 예언이나 점술이 아닌, 하나님의 말씀 위에서의 묵상 관점으로 접근하세요
4. "이 꿈이 반드시 ~를 의미한다"는 단정적 표현을 피하고, "성경은 ~라고 말합니다", "묵상해볼 수 있습니다"처럼 열린 표현을 사용하세요
5. 마지막에 적용 가능한 기도 제목이나 말씀 묵상 방향을 제안하세요
6. 전체 응답은 한국어로, 300~500자 내외로 작성하세요

응답 형식:
**꿈의 묵상**
(꿈의 의미와 상징에 대한 성경적 성찰)

**관련 말씀**
- 구절 1 (책 장:절)
- 구절 2 (책 장:절)
- 구절 3 (책 장:절, 선택사항)

**오늘의 기도 방향**
(짧은 기도 제목 또는 묵상 방향)`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { dream_text, user_id } = req.body ?? {};

  if (!dream_text?.trim()) {
    return res.status(400).json({ error: "dream_text is required" });
  }

  if (dream_text.trim().length < 10) {
    return res.status(400).json({ error: "꿈 내용을 좀 더 자세히 입력해 주세요 (10자 이상)" });
  }

  // 로그인 사용자만 허용
  if (!user_id) {
    return res.status(401).json({ error: "로그인이 필요합니다" });
  }

  // 월별 사용량 확인 (무료 3회 제한)
  const month = CURRENT_MONTH();
  const { data: usage } = await supabase
    .from("dream_usage")
    .select("count")
    .eq("user_id", user_id)
    .eq("month", month)
    .single();

  const currentCount = usage?.count ?? 0;
  if (currentCount >= FREE_LIMIT) {
    return res.status(403).json({
      error: "이번 달 무료 해석 횟수(3회)를 모두 사용하셨습니다",
      code: "LIMIT_REACHED",
    });
  }

  // OpenAI 호출
  let interpretation;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `꿈 내용:\n${dream_text.trim()}` },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });
    interpretation = completion.choices[0].message.content;
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "AI 해석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }

  // DB에 꿈 저장
  const { data: dream, error: dreamErr } = await supabase
    .from("dreams")
    .insert({ user_id, dream_text: dream_text.trim(), interpretation })
    .select("id")
    .single();

  if (dreamErr) {
    console.error("DB insert error:", dreamErr);
    return res.status(500).json({ error: "저장 중 오류가 발생했습니다" });
  }

  // 사용량 upsert
  await supabase.from("dream_usage").upsert(
    { user_id, month, count: currentCount + 1 },
    { onConflict: "user_id,month" }
  );

  return res.status(200).json({
    interpretation,
    dream_id: dream.id,
    usage_remaining: FREE_LIMIT - (currentCount + 1),
  });
}
```

- [ ] **Step 2: 로컬에서 API 동작 수동 검증 (curl)**

```bash
# dev 서버 실행 후 (vercel dev 필요)
curl -X POST http://localhost:3000/api/interpret \
  -H "Content-Type: application/json" \
  -d '{"dream_text": "하늘을 나는 꿈을 꿨는데 흰 새가 나타났습니다", "user_id": "test-user-id"}'
```

Expected: `{ "interpretation": "...", "dream_id": "...", "usage_remaining": 2 }`  
(user_id가 실제 UUID가 아니라 DB 오류가 나도 괜찮음 — API 로직 확인용)

- [ ] **Step 3: 커밋**

```bash
cd /Users/mh/dream-bible && git add api/
git commit -m "feat: /api/interpret — OpenAI 성경 꿈 해석 엔드포인트"
```

---

## Milestone 2: 프론트엔드 기반 (Day 2–3)

### Task 4: 상수 + 공유 컴포넌트

**Files:**
- Create: `src/supabase.js`
- Create: `src/lib/constants.jsx`
- Create: `src/components/shared.jsx`
- Create: `src/main.jsx`

- [ ] **Step 1: supabase.js 작성**

`/Users/mh/dream-bible/src/supabase.js`:
```js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

- [ ] **Step 2: constants.jsx 작성 (성경적 색상 테마)**

`/Users/mh/dream-bible/src/lib/constants.jsx`:
```jsx
// ─── Design Tokens — 성경적 색상 테마 ───
export const C = {
  // Primary palette
  navy: "#1B2A4A",        // 깊은 남색 — 지혜, 깊이
  navyLight: "#2D4270",   // 라이트 네이비
  gold: "#C9A84C",        // 성경 금색 — 거룩함
  goldLight: "#F5E6C8",   // 연한 금색
  goldBg: "rgba(201,168,76,0.08)",

  // Neutral
  cream: "#FDF6E3",       // 양피지 느낌 배경
  white: "#FFFFFF",
  border: "#E8DFC8",      // 따뜻한 테두리
  body: "#6B7B8F",        // 본문 텍스트
  label: "#3A4A5C",       // 레이블 텍스트

  // Semantic
  success: "#15be53",
  successBg: "rgba(21,190,83,0.12)",
  error: "#d93025",
  errorBg: "rgba(217,48,37,0.08)",
  bg: "#FDF6E3",
};

export const S = {
  card: "0 4px 16px rgba(27,42,74,0.10)",
  float: "0 8px 24px rgba(27,42,74,0.12), 0 2px 8px rgba(27,42,74,0.05)",
};

export const F = `'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif`;

// ─── Icon System ───
export const Ic = {
  Book:    (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2h10a2 2 0 012 2v13l-6-3-6 3V4a2 2 0 012-2z"/></svg>,
  Star:    (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill={p.c||"currentColor"}><path d="M10 2l1.8 5.4H18l-4.9 3.6 1.8 5.4L10 13l-4.9 3.4 1.8-5.4L2 7.4h6.2z"/></svg>,
  Moon:    (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round"><path d="M17 11A7 7 0 019 3a7 7 0 100 14 7 7 0 008-6z"/></svg>,
  Cross:   (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round"><line x1="10" y1="3" x2="10" y2="17"/><line x1="4" y1="8" x2="16" y2="8"/></svg>,
  History: (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><polyline points="10 6 10 10 13 12"/></svg>,
  ChevronRight: (p={}) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 16 16" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l4 4-4 4"/></svg>,
  Check:   (p={}) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 16 16" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>,
  Sparkle: (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill={p.c||"currentColor"}><path d="M10 2l1.6 5.4L17 9l-5.4 1.6L10 16l-1.6-5.4L3 9l5.4-1.6z"/></svg>,
  Lock:    (p={}) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 16 16" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>,
};
```

- [ ] **Step 3: shared.jsx 작성**

`/Users/mh/dream-bible/src/components/shared.jsx`:
```jsx
import { useState, useCallback, createContext, useContext } from "react";
import { C, F, S } from "../lib/constants.jsx";

// ─── Toast ───────────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, variant = "info") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, variant }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  const bg = { success: "#1e8e3e", error: C.error, info: C.navy, warning: C.gold };
  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", bottom: "calc(28px + env(safe-area-inset-bottom,0px))", left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
        <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {toasts.map(t => (
          <div key={t.id} style={{ background: bg[t.variant] ?? C.navy, color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontFamily: F, fontWeight: 500, boxShadow: S.float, whiteSpace: "nowrap", animation: "toast-in 0.22s ease" }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { showToast: () => {} };
  return ctx;
}

// ─── Button ──────────────────────────────────────────────────────────────────
export function Btn({ children, variant = "primary", size = "md", onClick, disabled, full, style: sx = {} }) {
  const [hov, setHov] = useState(false);
  const sz = {
    sm: { padding: "6px 14px", fontSize: 13 },
    md: { padding: "10px 22px", fontSize: 15 },
    lg: { padding: "14px 36px", fontSize: 17 },
  };
  const vr = {
    primary: { background: disabled ? "#8E9BB3" : hov ? C.navyLight : C.navy, color: "#fff", border: "none" },
    gold:    { background: disabled ? "#DDD0A8" : hov ? "#B8973B" : C.gold, color: "#fff", border: "none" },
    ghost:   { background: hov ? C.goldBg : "transparent", color: C.navy, border: `1px solid ${C.border}` },
    text:    { background: "transparent", color: hov ? C.gold : C.navy, border: "none" },
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 9999, cursor: disabled ? "not-allowed" : "pointer", fontFamily: F, fontWeight: 500, transition: "all 0.18s", width: full ? "100%" : "auto", ...sz[size], ...vr[variant], ...sx }}
    >
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, type = "text", placeholder, value, onChange, helper }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.label, marginBottom: 6, fontFamily: F }}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: `1px solid ${focused ? C.gold : C.border}`, fontSize: 16, fontFamily: F, color: C.navy, outline: focused ? `2px solid ${C.goldLight}` : "none", outlineOffset: 2, boxSizing: "border-box", background: C.white, transition: "border-color 0.15s" }}
      />
      {helper && <div style={{ fontSize: 12, color: C.body, marginTop: 4, fontFamily: F }}>{helper}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ width = "100%", height = 16, borderRadius = 6, style: sx = {} }) {
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
      <div style={{ width, height, borderRadius, background: "linear-gradient(90deg,#e8dfc8 25%,#f5edd8 50%,#e8dfc8 75%)", backgroundSize: "800px 100%", animation: "shimmer 1.4s infinite linear", ...sx }} />
    </>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style: sx = {}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px 24px", boxShadow: hov && onClick ? S.card : "none", transition: "box-shadow 0.2s", cursor: onClick ? "pointer" : "default", ...sx }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: main.jsx 작성**

`/Users/mh/dream-bible/src/main.jsx`:
```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 5: 빌드 오류 없음 확인**

```bash
cd /Users/mh/dream-bible && npm run build
```

Expected: `dist/` 생성, 오류 없음 (App.jsx가 없어서 실패하면 Task 10 이후 재확인)

- [ ] **Step 6: 커밋**

```bash
cd /Users/mh/dream-bible && git add src/
git commit -m "feat: frontend foundation — constants, shared components, supabase client"
```

---

## Milestone 3: 핵심 화면 구현 (Day 3–5)

### Task 5: LandingScreen

**Files:**
- Create: `src/screens/LandingScreen.jsx`

서비스 소개 + 로그인/시작 CTA. 모바일 우선 레이아웃.

- [ ] **Step 1: LandingScreen.jsx 작성**

`/Users/mh/dream-bible/src/screens/LandingScreen.jsx`:
```jsx
import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn } from "../components/shared.jsx";

const FEATURES = [
  { icon: <Ic.Book s={22} c={C.gold} />, title: "성경 말씀 기반", desc: "요셉, 다니엘 등 성경의 꿈 사례와 구절로 해석합니다" },
  { icon: <Ic.Moon s={22} c={C.gold} />, title: "AI 묵상 가이드", desc: "꿈을 분석하고 기도 방향과 말씀 묵상을 제안합니다" },
  { icon: <Ic.History s={22} c={C.gold} />, title: "꿈 일기 보관", desc: "내 꿈과 해석을 기록하고 언제든 돌아볼 수 있습니다" },
];

export default function LandingScreen({ go, user }) {
  const [hov, setHov] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: F }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: C.white }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ic.Star s={20} c={C.gold} />
          <span style={{ fontSize: 17, fontWeight: 700, color: C.navy, letterSpacing: "-0.3px" }}>꿈묵상</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {user
            ? <Btn size="sm" variant="gold" onClick={() => go("dream")}>꿈 기록하기</Btn>
            : <Btn size="sm" variant="ghost" onClick={() => go("auth")}>로그인</Btn>
          }
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.goldBg, border: `1px solid ${C.goldLight}`, borderRadius: 9999, padding: "5px 14px", fontSize: 13, color: C.gold, fontWeight: 500, marginBottom: 24 }}>
          <Ic.Sparkle s={14} c={C.gold} />
          성경 기반 꿈 묵상 AI
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 800, color: C.navy, lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.8px" }}>
          꿈을 기록하면<br />
          <span style={{ color: C.gold }}>성경 말씀</span>으로<br />
          묵상 가이드를 드립니다
        </h1>

        <p style={{ fontSize: 17, color: C.body, lineHeight: 1.65, marginBottom: 36 }}>
          예언이 아닌 묵상입니다.<br />
          하나님의 말씀 위에서 꿈을 함께 돌아봅니다.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <Btn size="lg" variant="gold" onClick={() => go(user ? "dream" : "auth")}
            style={{ minWidth: 220 }}>
            <Ic.Moon s={18} c="#fff" />
            {user ? "오늘 꿈 기록하기" : "무료로 시작하기"}
          </Btn>
          <span style={{ fontSize: 13, color: C.body }}>매달 3회 무료 · 신용카드 불필요</span>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
              <div style={{ flexShrink: 0, width: 40, height: 40, background: C.goldBg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: C.body, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "24px", borderTop: `1px solid ${C.border}`, background: C.white }}>
        <span style={{ fontSize: 13, color: C.body }}>
          © 2026 꿈묵상 · 이 서비스는 점술이나 예언이 아닌 성경적 묵상 가이드입니다
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 브라우저에서 확인**

```bash
cd /Users/mh/dream-bible && npm run dev
```

브라우저에서 `http://localhost:5173` 열어 랜딩 페이지 확인.

Expected: 네이비/골드 색상, 히어로 텍스트, 3가지 피처 카드, 무료 시작 버튼

- [ ] **Step 3: 커밋**

```bash
cd /Users/mh/dream-bible && git add src/screens/LandingScreen.jsx
git commit -m "feat: LandingScreen — 서비스 소개 + CTA"
```

---

### Task 6: AuthScreen

**Files:**
- Create: `src/screens/AuthScreen.jsx`

이메일 OTP 로그인 (Supabase magic link). voica-v2 패턴 동일.

- [ ] **Step 1: AuthScreen.jsx 작성**

`/Users/mh/dream-bible/src/screens/AuthScreen.jsx`:
```jsx
import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, Input, useToast } from "../components/shared.jsx";
import { supabase } from "../supabase.js";

export default function AuthScreen({ go }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      setSent(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: F, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ic.Star s={24} c={C.gold} />
            <span style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>꿈묵상</span>
          </div>
          <div style={{ fontSize: 15, color: C.body }}>성경으로 꿈을 돌아보는 공간</div>
        </div>

        {sent ? (
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✉️</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: C.navy, marginBottom: 8 }}>이메일을 확인해 주세요</div>
            <div style={{ fontSize: 14, color: C.body, lineHeight: 1.6, marginBottom: 24 }}>
              <strong style={{ color: C.navy }}>{email}</strong>로<br />
              로그인 링크를 보내드렸습니다.
            </div>
            <Btn variant="ghost" onClick={() => setSent(false)}>다시 보내기</Btn>
          </div>
        ) : (
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "32px 28px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 6 }}>시작하기</h2>
            <p style={{ fontSize: 14, color: C.body, marginBottom: 24 }}>이메일로 간편하게 로그인합니다</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input
                label="이메일"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Btn variant="gold" size="md" disabled={loading || !email.trim()} full>
                {loading ? "전송 중..." : "로그인 링크 받기"}
              </Btn>
            </form>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button onClick={() => go("landing")} style={{ fontSize: 13, color: C.body, background: "none", border: "none", cursor: "pointer", fontFamily: F, textDecoration: "underline" }}>
                처음으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Supabase 대시보드에서 이메일 OTP 활성화 확인**

Supabase 대시보드 → Authentication → Providers → Email → "Enable Email OTP" 확인

- [ ] **Step 3: 커밋**

```bash
cd /Users/mh/dream-bible && git add src/screens/AuthScreen.jsx
git commit -m "feat: AuthScreen — 이메일 OTP 로그인"
```

---

### Task 7: DreamScreen — 꿈 입력 폼

**Files:**
- Create: `src/screens/DreamScreen.jsx`

핵심 기능. 텍스트에리어 + 제출 → `/api/interpret` 호출 → ResultScreen으로 이동.

- [ ] **Step 1: DreamScreen.jsx 작성**

`/Users/mh/dream-bible/src/screens/DreamScreen.jsx`:
```jsx
import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, useToast } from "../components/shared.jsx";

const EXAMPLES = [
  "하늘을 날고 있었는데 구름 사이로 빛이 비쳤어요",
  "맑은 강물을 건너가는 꿈을 꿨습니다",
  "흰 양 떼가 초원에서 노는 꿈이었어요",
];

export default function DreamScreen({ go, user, usageRemaining }) {
  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const remaining = usageRemaining ?? 3;

  const handleSubmit = async () => {
    if (!dream.trim() || dream.trim().length < 10) {
      showToast("꿈 내용을 10자 이상 입력해 주세요", "error");
      return;
    }
    if (remaining <= 0) {
      go("pricing");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream_text: dream, user_id: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "LIMIT_REACHED") {
          showToast("이번 달 무료 해석을 모두 사용했습니다", "warning");
          go("pricing");
          return;
        }
        showToast(data.error || "오류가 발생했습니다", "error");
        return;
      }
      go("result", { interpretation: data.interpretation, dream_text: dream, dream_id: data.dream_id, usage_remaining: data.usage_remaining });
    } catch (err) {
      showToast("네트워크 오류가 발생했습니다", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: F }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ic.Star s={18} c={C.gold} />
          <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>꿈묵상</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.body }}>
            이번 달 남은 횟수: <strong style={{ color: remaining > 0 ? C.gold : C.error }}>{remaining}회</strong>
          </span>
          <Btn size="sm" variant="ghost" onClick={() => go("history")}>기록 보기</Btn>
        </div>
      </nav>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.navy, marginBottom: 8, letterSpacing: "-0.5px" }}>
          오늘 꿈을 기록해 보세요
        </h1>
        <p style={{ fontSize: 15, color: C.body, marginBottom: 28 }}>
          구체적으로 기억나는 장면, 인물, 감정을 자유롭게 적어주세요
        </p>

        {/* Textarea */}
        <div style={{ marginBottom: 20 }}>
          <textarea
            value={dream}
            onChange={e => setDream(e.target.value)}
            placeholder="예: 맑은 강가를 걷고 있는데 빛나는 새 한 마리가 내 앞에 날아와 앉았습니다..."
            rows={7}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1px solid ${dream.length > 0 ? C.gold : C.border}`, fontSize: 16, fontFamily: F, color: C.navy, resize: "vertical", outline: "none", background: C.white, lineHeight: 1.65, boxSizing: "border-box", transition: "border-color 0.15s" }}
            onFocus={e => e.target.style.border = `1.5px solid ${C.gold}`}
            onBlur={e => e.target.style.border = `1px solid ${dream.length > 0 ? C.gold : C.border}`}
          />
          <div style={{ fontSize: 12, color: C.body, marginTop: 4, textAlign: "right" }}>{dream.length}자</div>
        </div>

        {/* Examples */}
        {!dream && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: C.body, marginBottom: 10 }}>예시로 시작해 보세요</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => setDream(ex)}
                  style={{ textAlign: "left", background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, color: C.navy, fontFamily: F, cursor: "pointer", lineHeight: 1.4, transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.target.style.borderColor = C.gold}
                  onMouseLeave={e => e.target.style.borderColor = C.border}
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        )}

        <Btn
          variant="gold" size="lg" full
          disabled={loading || dream.trim().length < 10}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              성경으로 묵상 중...
            </>
          ) : (
            <>
              <Ic.Sparkle s={18} c="#fff" />
              꿈 해석 받기
            </>
          )}
        </Btn>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {remaining <= 0 && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(217,48,37,0.06)", border: `1px solid rgba(217,48,37,0.2)`, borderRadius: 8, fontSize: 14, color: C.error, textAlign: "center" }}>
            이번 달 무료 해석 횟수를 모두 사용했습니다.{" "}
            <button onClick={() => go("pricing")} style={{ color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 14, fontWeight: 600, textDecoration: "underline" }}>
              무제한 플랜 보기
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ marginTop: 24, padding: "12px 16px", background: C.goldBg, borderRadius: 8, fontSize: 13, color: C.body, lineHeight: 1.5 }}>
          <Ic.Cross s={13} c={C.gold} /> 이 서비스는 예언이나 점술이 아닌 성경적 묵상 가이드입니다. 해석은 영적 참고 자료로만 활용하세요.
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/mh/dream-bible && git add src/screens/DreamScreen.jsx
git commit -m "feat: DreamScreen — 꿈 입력 폼 + /api/interpret 호출"
```

---

### Task 8: ResultScreen — AI 해석 결과

**Files:**
- Create: `src/screens/ResultScreen.jsx`

AI 응답을 마크다운 형식으로 파싱해 표시. 성경 구절을 강조.

- [ ] **Step 1: ResultScreen.jsx 작성**

`/Users/mh/dream-bible/src/screens/ResultScreen.jsx`:
```jsx
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, Card } from "../components/shared.jsx";

// **굵은 텍스트**와 - 목록 아이템을 간단히 파싱
function parseInterpretation(text) {
  if (!text) return [];
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return { type: "heading", text: line.slice(2, -2), key: i };
    }
    if (line.startsWith("- ")) {
      return { type: "bullet", text: line.slice(2), key: i };
    }
    if (!line.trim()) {
      return { type: "spacer", key: i };
    }
    return { type: "text", text: line, key: i };
  });
}

export default function ResultScreen({ go, result }) {
  const { interpretation, dream_text, dream_id, usage_remaining } = result ?? {};
  const parsed = parseInterpretation(interpretation);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: F }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ic.Star s={18} c={C.gold} />
          <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>꿈묵상</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn size="sm" variant="ghost" onClick={() => go("history")}>기록 보기</Btn>
          <Btn size="sm" variant="gold" onClick={() => go("dream")}>새 꿈 기록</Btn>
        </div>
      </nav>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 24px 60px" }}>
        {/* Dream text recap */}
        <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: C.body, marginBottom: 6, fontWeight: 500, letterSpacing: "0.3px" }}>꿈 내용</div>
          <p style={{ fontSize: 15, color: C.label, lineHeight: 1.6 }}>{dream_text}</p>
        </div>

        {/* Interpretation */}
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "24px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: C.goldBg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic.Sparkle s={16} c={C.gold} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>성경적 묵상</div>
          </div>

          <div style={{ lineHeight: 1.8 }}>
            {parsed.map(block => {
              if (block.type === "heading") return (
                <div key={block.key} style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginTop: 20, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                  {block.text}
                </div>
              );
              if (block.type === "bullet") return (
                <div key={block.key} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  <span style={{ color: C.gold, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✦</span>
                  <span style={{ fontSize: 15, color: C.label, lineHeight: 1.65 }}>{block.text}</span>
                </div>
              );
              if (block.type === "spacer") return <div key={block.key} style={{ height: 8 }} />;
              return (
                <p key={block.key} style={{ fontSize: 15, color: C.label, lineHeight: 1.75, marginBottom: 4 }}>
                  {block.text}
                </p>
              );
            })}
          </div>
        </div>

        {/* Usage remaining */}
        {usage_remaining !== undefined && (
          <div style={{ textAlign: "center", fontSize: 13, color: C.body, marginBottom: 20 }}>
            이번 달 남은 무료 해석:{" "}
            <strong style={{ color: usage_remaining > 0 ? C.gold : C.error }}>{usage_remaining}회</strong>
            {usage_remaining === 0 && (
              <>
                {" · "}
                <button onClick={() => go("pricing")} style={{ color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 600, textDecoration: "underline" }}>
                  무제한 플랜 보기
                </button>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <Btn variant="ghost" full onClick={() => go("dream")}>
            <Ic.Moon s={16} c={C.navy} />
            새 꿈 기록하기
          </Btn>
          <Btn variant="gold" full onClick={() => go("history")}>
            <Ic.History s={16} c="#fff" />
            기록 모아보기
          </Btn>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: 24, fontSize: 12, color: C.body, textAlign: "center", lineHeight: 1.5 }}>
          이 해석은 예언이 아닌 성경적 묵상 가이드입니다.<br />
          영적 결정은 담임 목사님 또는 신앙 공동체와 함께 하세요.
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/mh/dream-bible && git add src/screens/ResultScreen.jsx
git commit -m "feat: ResultScreen — 성경 꿈 해석 결과 표시"
```

---

### Task 9: HistoryScreen — 꿈 기록 목록

**Files:**
- Create: `src/screens/HistoryScreen.jsx`

Supabase에서 사용자의 꿈 기록을 불러와 시간순으로 표시.

- [ ] **Step 1: HistoryScreen.jsx 작성**

`/Users/mh/dream-bible/src/screens/HistoryScreen.jsx`:
```jsx
import { useState, useEffect } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, Skeleton, Card } from "../components/shared.jsx";
import { supabase } from "../supabase.js";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function truncate(text, len = 60) {
  return text.length > len ? text.slice(0, len) + "..." : text;
}

export default function HistoryScreen({ go, user }) {
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // 상세 보기 드림 ID

  useEffect(() => {
    if (!user) return;
    supabase
      .from("dreams")
      .select("id, dream_text, interpretation, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDreams(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const selectedDream = dreams.find(d => d.id === selected);

  if (selected && selectedDream) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, fontFamily: F }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", background: C.white, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 14, color: C.navy }}>
            ← 목록으로
          </button>
          <span style={{ fontSize: 14, color: C.body }}>{formatDate(selectedDream.created_at)}</span>
        </nav>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 6, fontWeight: 500 }}>꿈 내용</div>
            <p style={{ fontSize: 15, color: C.label, lineHeight: 1.6 }}>{selectedDream.dream_text}</p>
          </div>
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
            <div style={{ fontSize: 12, color: C.body, marginBottom: 12, fontWeight: 500 }}>성경적 묵상</div>
            <p style={{ fontSize: 15, color: C.label, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{selectedDream.interpretation}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: F }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Ic.Star s={18} c={C.gold} />
          <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>꿈묵상</span>
        </div>
        <Btn size="sm" variant="gold" onClick={() => go("dream")}>새 꿈 기록</Btn>
      </nav>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, marginBottom: 24, letterSpacing: "-0.4px" }}>
          내 꿈 기록
        </h1>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} height={80} borderRadius={12} />)}
          </div>
        ) : dreams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🌙</div>
            <div style={{ fontSize: 16, color: C.navy, fontWeight: 600, marginBottom: 8 }}>아직 기록된 꿈이 없습니다</div>
            <div style={{ fontSize: 14, color: C.body, marginBottom: 24 }}>오늘 꿈을 기록해 성경으로 돌아보세요</div>
            <Btn variant="gold" onClick={() => go("dream")}>첫 꿈 기록하기</Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dreams.map(d => (
              <div key={d.id} onClick={() => setSelected(d.id)}
                style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px", cursor: "pointer", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(27,42,74,0.10)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.body }}>{formatDate(d.created_at)}</span>
                  <Ic.ChevronRight s={14} c={C.body} />
                </div>
                <p style={{ fontSize: 15, color: C.navy, lineHeight: 1.5, marginBottom: 6 }}>
                  {truncate(d.dream_text, 70)}
                </p>
                <p style={{ fontSize: 13, color: C.body, lineHeight: 1.4 }}>
                  {truncate(d.interpretation.replace(/\*\*/g, "").replace(/^- /gm, ""), 80)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/mh/dream-bible && git add src/screens/HistoryScreen.jsx
git commit -m "feat: HistoryScreen — 꿈 기록 목록 + 상세 보기"
```

---

## Milestone 4: 통합 + 출시 (Day 6–7)

### Task 10: App.jsx — 라우터 + 인증 상태 + 사용량 추적

**Files:**
- Create: `src/App.jsx`

모든 스크린을 연결하고, Supabase 인증 상태를 구독. 월별 사용량을 상태로 관리.

- [ ] **Step 1: App.jsx 작성**

`/Users/mh/dream-bible/src/App.jsx`:
```jsx
import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import { C, F } from "./lib/constants.jsx";
import { ToastProvider } from "./components/shared.jsx";

import LandingScreen from "./screens/LandingScreen.jsx";
import AuthScreen from "./screens/AuthScreen.jsx";
import DreamScreen from "./screens/DreamScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import HistoryScreen from "./screens/HistoryScreen.jsx";

const FREE_LIMIT = 3;
const CURRENT_MONTH = () => new Date().toISOString().slice(0, 7);

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [result, setResult] = useState(null);          // ResultScreen에 전달할 데이터
  const [usageRemaining, setUsageRemaining] = useState(FREE_LIMIT);

  const go = (s, data) => {
    if (s === "result" && data) setResult(data);
    setScreen(s);
  };

  // 사용량 로드
  const loadUsage = async (uid) => {
    const { data } = await supabase
      .from("dream_usage")
      .select("count")
      .eq("user_id", uid)
      .eq("month", CURRENT_MONTH())
      .single();
    setUsageRemaining(FREE_LIMIT - (data?.count ?? 0));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadUsage(u.id);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadUsage(u.id);
        if (["landing", "auth"].includes(screen)) setScreen("dream");
      } else {
        setScreen("landing");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScreen("landing");
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
        <div style={{ fontSize: 15, color: C.body }}>잠시만요...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div style={{ fontFamily: F, color: C.navy }}>
        {screen === "landing"  && <LandingScreen go={go} user={user} logout={logout} />}
        {screen === "auth"     && <AuthScreen go={go} />}
        {screen === "dream"    && (user
          ? <DreamScreen go={go} user={user} usageRemaining={usageRemaining} />
          : (go("auth"), null)
        )}
        {screen === "result"   && <ResultScreen go={go} result={result} />}
        {screen === "history"  && (user
          ? <HistoryScreen go={go} user={user} />
          : (go("auth"), null)
        )}
        {screen === "pricing"  && (
          <div style={{ minHeight: "100vh", background: C.cream, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ maxWidth: 400, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>✦</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, marginBottom: 12 }}>무제한 플랜</h1>
              <p style={{ fontSize: 15, color: C.body, lineHeight: 1.6, marginBottom: 24 }}>
                월 <strong style={{ color: C.navy, fontSize: 20 }}>₩4,900</strong>으로<br />
                꿈 해석을 무제한으로 받아보세요
              </p>
              <p style={{ fontSize: 13, color: C.body, marginBottom: 24 }}>결제 기능은 곧 추가될 예정입니다.<br />출시 알림을 받으시려면 이메일을 등록해 주세요.</p>
              <button onClick={() => go("dream")} style={{ background: "none", border: "none", color: C.gold, fontFamily: F, fontSize: 14, cursor: "pointer", textDecoration: "underline" }}>
                돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
```

- [ ] **Step 2: 전체 빌드 확인**

```bash
cd /Users/mh/dream-bible && npm run build
```

Expected: 오류 없이 `dist/` 생성

- [ ] **Step 3: 로컬 개발 서버에서 E2E 흐름 검증**

```bash
cd /Users/mh/dream-bible && npm run dev
```

검증 체크리스트:
- [ ] `localhost:5173` → 랜딩 페이지 표시
- [ ] "무료로 시작하기" → AuthScreen 이동
- [ ] 이메일 입력 → "로그인 링크 받기" 버튼 동작 (Supabase 연결 필요)
- [ ] 로그인 후 → DreamScreen 자동 이동
- [ ] 꿈 텍스트 입력 → "꿈 해석 받기" 클릭 → 로딩 스피너 표시
- [ ] 해석 완료 → ResultScreen에서 성경 구절 포함 결과 표시
- [ ] "기록 모아보기" → HistoryScreen에서 기록 목록 표시

- [ ] **Step 4: 최종 커밋**

```bash
cd /Users/mh/dream-bible && git add src/App.jsx
git commit -m "feat: App.jsx — 스크린 라우터 + 인증 상태 + 사용량 추적"
```

---

## Milestone 5: 배포 (Day 7)

### Task 11: Vercel 배포

**Files:**
- No file changes — Vercel 대시보드 설정

- [ ] **Step 1: GitHub 리포 생성 + push**

```bash
cd /Users/mh/dream-bible
# GitHub에서 'dream-bible' 리포 생성 후:
git remote add origin https://github.com/<username>/dream-bible.git
git push -u origin main
```

- [ ] **Step 2: Vercel에서 프로젝트 import**

Vercel 대시보드 → New Project → dream-bible 리포 선택

- [ ] **Step 3: 환경 변수 설정**

Vercel 대시보드 → Settings → Environment Variables에 아래 4개 추가:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

- [ ] **Step 4: Supabase Auth 리다이렉트 URL 추가**

Supabase 대시보드 → Authentication → URL Configuration →  
"Redirect URLs"에 `https://dream-bible.vercel.app/**` 추가

- [ ] **Step 5: 배포 확인**

```
https://dream-bible.vercel.app
```

Expected: 랜딩 페이지 표시, 이메일 로그인 → 꿈 입력 → 해석 결과 E2E 동작

---

## 완료 기준 (Definition of Done)

- [ ] `npm run build` 오류 없음
- [ ] 로컬에서 랜딩 → 로그인 → 꿈 입력 → 결과 → 기록 보기 E2E 동작
- [ ] `/api/interpret` 호출 시 성경 구절 포함 응답 반환
- [ ] 무료 3회 초과 시 `LIMIT_REACHED` 에러 처리
- [ ] Vercel 배포 후 실제 이메일 OTP 로그인 동작
- [ ] 모바일 (375px)에서 레이아웃 깨짐 없음

---

## 주요 환경 변수 참조

| 변수 | 위치 | 용도 |
|------|------|------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | 프론트엔드 익명 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | 서버 사이드 (RLS 우회) |
| `OPENAI_API_KEY` | platform.openai.com | gpt-4o 호출 |
