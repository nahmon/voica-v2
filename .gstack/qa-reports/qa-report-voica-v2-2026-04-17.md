# QA Report — voica-v2.vercel.app
**Date:** 2026-04-17
**Duration:** ~20 minutes
**Viewport tested:** Mobile (390×844 iPhone), Desktop (1280×800)
**Console errors:** 0
**Pages visited:** Landing, Interview intro, Interview (Q1-Q3), Panel entry, Footer

---

## Summary

| Category | Score | Issues |
|----------|-------|--------|
| Console | 100 | 0 errors |
| Functional | 95 | 1 medium |
| Visual | 92 | 1 low |
| UX | 90 | 1 medium |
| Performance | 100 | - |
| Content | 100 | - |
| Accessibility | 90 | - |

**Overall health: ~95/100**

---

## Issues Found

### ISSUE-001 [UX / Medium] — Premature validation error on interview intro screen

**What:** The red text "닉네임을 입력해 주세요" appears immediately when the interview URL loads, before the user has typed anything or attempted to submit.

**Why it's bad:** Error messages on load feel accusatory and broken. Standard UX: show validation errors only after a submit attempt.

**Repro:**
1. Navigate to any `/i/[code]` URL
2. Don't type anything — error shows immediately in red

**Screenshot:** `screenshots/interview-consent.png`

**Location:** `src/screens/InterviewScreen.jsx:676`
```jsx
// Current (broken)
{!respondent.name.trim() && <div ...>닉네임을 입력해 주세요</div>}
// Should be:
{submitted && !respondent.name.trim() && <div ...>닉네임을 입력해 주세요</div>}
```

---

### ISSUE-002 [Visual / Low] — AI avatar on intro screen uses wrong color

**What:** The intro screen's AI avatar circle uses a blue-orange gradient (`#1a73e8 → #e8710a`) instead of the brand purple.

**Why it's bad:** Inconsistent with the in-interview AI avatar which correctly uses `C.purple`. Feels off-brand on first impression.

**Screenshot:** `screenshots/interview-consent.png` (top-left circle)

**Location:** `src/screens/InterviewScreen.jsx:622`
```jsx
// Current
background: "linear-gradient(135deg,#1a73e8,#e8710a)"
// Should be:
background: C.purple
```

---

## What's Working Well ✅

| Feature | Status |
|---------|--------|
| Hero text "정확하고 빠르게" — no wrapping on mobile | ✅ |
| Hero message rotation (2 messages) | ✅ |
| "실제 사용자들의 리뷰" text correct | ✅ |
| TTS onerror → phase advances (no stuck ai_speaking) | ✅ |
| AI avatar inside interview = purple | ✅ |
| MC options = solid blocks, no borders | ✅ |
| Mic button = 72×72, centered, big | ✅ |
| Bottom panel = opaque #1c1d20, safe-area padding | ✅ |
| Chat scroll = conversation history visible | ✅ |
| Desktop landing page — all sections render | ✅ |
| Mobile landing page — all sections visible | ✅ |
| Gradient on desktop h1 + CTA section | ✅ |
| Panel entry form flow | ✅ |
| Footer complete | ✅ |
| Zero JS console errors | ✅ |

---

## Top 2 Fixes

1. **ISSUE-001**: Add `submitted` state to interview intro — show name error only after submit attempt
2. **ISSUE-002**: Change intro screen AI avatar from blue-orange gradient to `C.purple`

