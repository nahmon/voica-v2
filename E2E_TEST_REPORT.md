# Voica E2E Test Report

**Date:** 2026-04-12  
**Environment:** Production — https://voica-v2.vercel.app  
**Tester:** Playwright MCP (autonomous)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Landing page | ✅ PASS | No console errors |
| Interview page (/i/shareCode) | ✅ PASS | Loads, form renders correctly |
| Auth / Google OAuth | ✅ PASS | Login redirects correctly to dashboard |
| Dashboard (researcher) | ✅ PASS | Stats, project list, quick actions all render |
| Panel board | ✅ PASS | Accessible, interview listings visible |
| Share overlay bug (editor) | ✅ FIXED | Now only shows on first publish |
| Mobile UX critical fixes | ✅ FIXED | All 4 CRITICAL + 4/6 HIGH items deployed |

---

## Detailed Flow Results

### 1. Landing Page
- URL: `https://voica-v2.vercel.app`
- Console errors: **0**
- Nav renders correctly with all links
- Hero CTA buttons ("리서처 / 기업", "Voica 패널") visible and clickable
- Live counter badge (247명) renders
- Stats counters (IntersectionObserver-driven animation) — render at 0 before scroll; animation is correct behavior

### 2. Panel Interview Flow
- URL: `https://voica-v2.vercel.app/i/ah6jlgj4`
- Console errors: **0**
- Info screen (이름/나이/성별 form) renders correctly
- "인터뷰 시작하기 →" button visible
- Sound notice banner renders
- "답변은 암호화 저장됩니다" footer visible
- **NEW (from mobile fix):** Form container now uses `alignItems: flex-start` so keyboard doesn't hide the start button on mobile

### 3. Authentication
- Google OAuth login: **PASS** — redirects correctly back to `/` with researcher role → dashboard
- URL hash token cleanup: works (token in hash fragment is Supabase standard behavior)
- Logged-in state persists across page navigations

### 4. Dashboard (Researcher)
- Stats render: 10 total, 6 active, 25 cumulative responses, 0 completed
- Project list renders with correct status badges (진행 중 / 초안)
- Quick-action cards (패널 리쿠르팅, 패널 모집 보드) visible
- "+ 새 프로젝트" button visible
- No console errors

### 5. Fixes Verified in This Session

#### Share overlay bug (FIXED)
- **Before:** Share overlay appeared on every save, even when editing existing interviews
- **After:** 
  - New interview → share overlay shows once after first publish ✓
  - Existing interview → toast "저장됐습니다 ✓" instead of overlay ✓
  - Button text: "링크 생성 →" for new, "저장" for existing ✓

#### Mobile UX CRITICAL fixes (FIXED)
1. **Likert scale overflow** — fluid `calc()` widths + `flexWrap: wrap`, works on 360px screens
2. **Keyboard hiding form** — `alignItems: flex-start` + `overflowY: auto` on intro container
3. **Record button label** — "탭하여 녹음 시작" / "탭하여 완료" text below mic button
4. **Exit confirm button order** — "계속 진행" is now solid primary, "나가기" is ghost

#### Mobile UX HIGH fixes (FIXED)
5. **Hamburger touch target** — 32px → 44px (padding 6 → 12)
6. **Drawer close button** — 28px → 44px (padding 4 → 10)
7. **Drawer safe-area** — `env(safe-area-inset-bottom)` on footer
8. **TTS blocked button** — full-width, 14px 24px padding, fontSize 15

---

## Remaining Issues (Not Fixed Yet)

### HIGH Priority
- **ConsentScreen privacy table** — `minWidth: 420` on 375px viewport forces horizontal scroll on critical consent content. Users must scroll horizontally to read legal consent. (`src/screens/ConsentScreen.jsx:23`)
- **VoC carousel dots** — Touch targets still small; padding applied but visual click area may be insufficient on some browsers

### MEDIUM Priority  
- **AuthScreen tab buttons** — `padding: 6px` → ~30px height (should be 44px) (`AuthScreen.jsx:123`)
- **PanelEntryScreen chips** — `padding: 7px 13px` → ~34px height (should be 40px+) (`PanelEntryScreen.jsx:41`)
- **PanelBoardScreen search** — placeholder color may be below 3:1 contrast on dark background
- **PanelBoardScreen filters** — horizontal scroll has no right-edge fade indicator
- **Recording waveform** — `Math.random()` called on every render (every second), causes layout thrash on low-end Android

### LOW Priority
- `alert()` calls remain in `EditorScreen.handleSave` (lines 165-166) — should be `showToast`
- Landing hero CTA buttons: `translateY` hover transform not guarded by `@media (hover: hover)` — causes flicker on touch
- StepBar labels in PanelEntryScreen at `fontSize: 10` (barely readable Korean)

---

## Console Error Status

| Page | Errors |
|------|--------|
| Landing | 0 |
| Interview (/i/ah6jlgj4) | 0 |
| Dashboard | 0 |

---

## Deployment Status
Latest commit: `4a6ec90` — all fixes pushed to `main` branch.  
Vercel auto-deploy on push — all changes should be live within 1-2 minutes of push.

---

## Next Recommended Actions

1. Fix ConsentScreen privacy table for mobile (HIGH — legal compliance concern)
2. Fix `alert()` in EditorScreen.handleSave → `showToast`
3. Fix AuthScreen tab button height
4. Fix recording waveform `Math.random()` → `useRef` pre-computed heights
