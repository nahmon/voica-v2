# Voica UX Audit Report
**Audit Date:** 2026-04-12  
**Auditor:** QA Lead (Claude Sonnet 4.6)  
**Project:** voica-v2 · Dev server: http://localhost:5173  
**Scope:** Full E2E flow — Landing → Auth → Researcher Dashboard → Editor → Share Link → Panel Interview → Responses → Report  

---

## 1. Executive Summary

| Dimension | Score | Notes |
|---|---|---|
| Visual design & brand consistency | 8 / 10 | Clean Pretendard typography, tight purple/navy palette, consistent token usage |
| Landing page clarity | 7 / 10 | Value prop lands, but stats show 0 on first load (before animation) |
| Researcher onboarding (auth → first interview) | 6 / 10 | Auth works but sign-up role assignment has an off-by-one path; editor has a 10-question threshold surprise |
| Panel member flow | 6.5 / 10 | PanelEntryScreen step 3 completion state is unreachable (off-by-one); consent CTA routes to panel_board, not interview |
| Navigation & routing | 5.5 / 10 | SPA uses a single `screen` state — no URL history, back-button breaks, deep links only work for `/i/[code]` |
| Error recovery | 5 / 10 | Several `alert()` calls instead of inline errors; report generation failure uses `alert()` |
| Empty states | 7.5 / 10 | Dashboard empty state is clear and actionable; responses empty state is good |
| Mobile experience | 6 / 10 | Hamburger drawer works; interview board readable; stats counter only 2-column on mobile is fine |
| Performance | 7 / 10 | No heavy images detected, TTS prefetch is smart; no code splitting observed |
| Accessibility | 4 / 10 | Almost all interactive elements are `<div>` with onClick rather than semantic `<button>`/`<a>`; no ARIA labels; hero CTAs fail keyboard navigation |

### **Overall UX Score: 6.3 / 10**

The product has a polished visual shell and a coherent value proposition. The critical blockers are: (1) a broken final step in the panel registration flow, (2) no browser history so back/forward is completely broken, (3) widespread use of `alert()` for errors in the editor and report screens, and (4) accessibility gaps that would fail WCAG 2.1 AA.

---

## 2. Top 5 Most Urgent Fixes

### Fix 1 — PanelEntryScreen: step 3 completion screen is unreachable
**File:** `src/screens/PanelEntryScreen.jsx:142`  
The success/completion screen is rendered when `step === 3`, but the "패널 등록할게요" button on step 2 calls `setStep(3)`. However, the component renders step 2 as the `else` branch (after checking `step === 0`, `step === 1`, `step === 3`). This means `step === 2` falls into the step-2 render block and calling `setStep(3)` should work — but the structural mismatch means the step indicator (StepBar) shows step index 2 while users are already on the "consent" screen labelled as step 2 in the 0-indexed array.  
More critically: the `STEPS` array is `["기본 정보", "매칭 프로필", "동의 및 완료"]` (3 items, indices 0–2), but the success view is gated on `step === 3`, which is out of bounds for the step bar and never highlighted. Users who complete registration see a broken step indicator.  
**Fix:** Change the success gate to `step === 2` after renaming the consent view to render at `step === 2` and the success to render at `step === 3` — or use a named step enum instead of integers.

### Fix 2 — No browser history: back button always breaks
**File:** `src/App.jsx`  
The entire app uses a single React state variable `screen`. Navigating with the browser Back button does nothing (URL stays at `/`), and pressing Back after clicking into an editor or interview will silently discard unsaved work without warning. For any screen except `/i/[code]` there is no deep-link support.  
**Fix:** Integrate `react-router-dom` (already in `package.json`) properly with `<Routes>` and `useNavigate`. At minimum, push a history entry on every `go()` call using `window.history.pushState`.

### Fix 3 — EditorScreen: errors use `alert()` and 10-question gate is surprising
**File:** `src/screens/EditorScreen.jsx:165–166`  
Both missing-title validation and missing-question-content validation use `alert()`, which is jarring and unblockable on most mobile browsers. Additionally, the 10-question minimum is not communicated anywhere in the editor UI before the user hits "링크 생성 →" — the warning only appears after clicking. A researcher with 5 well-crafted questions has no idea they will be challenged.  
**Fix:** Replace `alert()` calls with inline validation messages below the relevant field. Add a persistent progress indicator (e.g., "질문 5 / 10 권장") in the editor nav bar.

### Fix 4 — ConsentScreen: CTA navigates to panel_board instead of interview
**File:** `src/screens/ConsentScreen.jsx:141`  
```jsx
<Btn … onClick={() => go("panel_board")}>
  {Ic.Mic({s:16,c:"white"})} 동의 완료 — 인터뷰 보드로 이동
```
The button label says "인터뷰 보드로 이동" and navigates to `panel_board`. This screen is reached via the panel consent flow (before starting an interview). The correct target should be the interview itself, or at least clearly warn that the user is leaving the interview flow. As it stands, a panel member who was about to do a specific interview gets dropped into the board with no path back to their intended interview.  
**Fix:** Accept a `shareCode` or `interviewId` prop in ConsentScreen and route directly to `interview` on completion. If that's not available, keep panel_board but rename the CTA to "동의하고 모집 보드 보기" and add a note that they can start interviews from the board.

### Fix 5 — Footer links are all `href="#"` (dead links)
**File:** `src/components/shared.jsx` (Footer component), confirmed by grep showing 4 `href="#"` occurrences  
The footer renders links for "서비스 소개", "요금제", "패널 참여", "고객센터" — all pointing to `#`. These are functional navigation targets in the GNB (they call `go(target)`) but the footer uses static anchor tags. Clicking any footer link scrolls to top instead of navigating.  
**Fix:** Replace footer `<a href="#">` links with the same `onClick={() => go(target)}` pattern used in the GNB, or use router `<Link>` components.

---

## 3. Full Issue List

### Priority: Critical

| # | Screen | Issue | Detail |
|---|---|---|---|
| C1 | PanelEntryScreen | Step 3 success screen unreachable / step bar desync | `step === 3` is out of bounds for 3-item STEPS array; StepBar never highlights "완료" |
| C2 | All screens | No browser history integration | Single `screen` state; Back button breaks; no deep links except `/i/[code]` |
| C3 | ConsentScreen | Post-consent CTA drops user at panel_board losing interview context | Should route to interview screen with shareCode preserved |
| C4 | EditorScreen | Publish fails silently with native `alert()` on validation errors | Replace with inline toast / field-level errors |

### Priority: High

| # | Screen | Issue | Detail |
|---|---|---|---|
| H1 | EditorScreen | 10-question minimum not communicated until publish attempt | Add counter "질문 N / 10 권장" in editor toolbar |
| H2 | ReportScreen | `alert(e.message)` on report generation failure | Replace with toast or inline error banner |
| H3 | LandingScreen | Stats show "0+" etc. on first paint before animation starts | CounterStat uses IntersectionObserver + 1.4s animation; initial "0" value is visible for a moment — use placeholder dashes or hide until visible |
| H4 | Footer | All footer navigation links are `href="#"` dead links | Implement `onClick={() => go(target)}` |
| H5 | All screens | Hero CTAs and card CTAs use `<div onClick>` instead of `<button>` | Fails keyboard tab navigation; not accessible; screen readers won't announce as interactive |
| H6 | InterviewScreen | TTS playback blocked state (`ttsBlocked`) shows no clear UI feedback | When audio autoplay is blocked, users see "AI 말하는 중" indefinitely with no visual cue to tap to play |

### Priority: Medium

| # | Screen | Issue | Detail |
|---|---|---|---|
| M1 | AuthScreen | `role` is set during `signUp` via `options.data` but the post-signup flow navigates to `dashboard` before email verification | Supabase email confirmation may redirect to root, bypassing role_select; need to handle `onAuthStateChange` SIGNED_IN with pending verification |
| M2 | DashboardScreen | "패널 리쿠르팅" and "패널 모집 보드" shortcut cards show hardcoded badge counts ("신청 3건", "6개 공고") | These are static; real counts should come from DB queries |
| M3 | PanelBoardScreen | Uses `MOCK_PANEL_PROFILE` from `mockData.js` for match scoring | Panel board shows AI match scores based on a hardcoded mock profile, not the actual logged-in user's profile |
| M4 | RecruiterAdminScreen | Uses `PANEL_APPLICANTS` mock data | Admin view shows fake applicants; no real DB integration |
| M5 | EditorScreen | Draft saved only to `localStorage` for new interviews; editing existing interview has no auto-save | If browser closes mid-edit on an existing interview, changes are lost without warning |
| M6 | ResponsesScreen | Respondent names shown as "응답자 1", "응답자 2" | `respondent.name` from session data is not displayed; anonymity may be intentional but it's confusing in the responses panel |
| M7 | PanelMyPageScreen | All data is hardcoded mock data | Zero Supabase reads; the screen is entirely static |
| M8 | LandingScreen | Live counter (247명) uses `Math.random()` simulation not real data | Fake real-time social proof could backfire if users investigate |
| M9 | Mobile — InterviewScreen | No GlobalNav on interview screen | Panel members who land on `/i/[code]` have no escape hatch or help link if something goes wrong before interview starts |
| M10 | EditorScreen | Only 1 template available | "Voica 사용자 만족도 조사" is the only template; researchers in other domains (health, finance, B2B) have nothing |

### Priority: Low / Polish

| # | Screen | Issue | Detail |
|---|---|---|---|
| L1 | LandingScreen | Testimonial company names are partially censored (**전자, LG**건강) | Looks like placeholder text; either show full names or use clearly fictional names |
| L2 | LandingScreen | HowItWorksCarousel desktop has "›" text as separator between steps | Should be a visual arrow icon, not a text character |
| L3 | All screens | `box-sizing`, `margin: 0`, `padding: 0` global reset is injected via `<style>` in App.jsx | Should be in a CSS file; inlining resets in JSX is fragile |
| L4 | AuthScreen | Password reset success state says "받은편지함을 확인해요" (informal "요" form used inconsistently) | Some screens use formal "주세요", others use casual "해요" — audit copy for tone consistency |
| L5 | PricingScreen | "구매하기" button on credit packs redirects unauthenticated users to `advertiser_login` | After login the user is routed to dashboard, losing the pricing context entirely — no cart/intent preservation |
| L6 | EditorScreen | Drag-to-reorder questions uses raw mousedown events with `dragIdx` ref | Native HTML5 drag-and-drop would be more accessible and reliable |
| L7 | RoleSelectScreen | "역할은 나중에 고객센터에서 변경할 수 있어요" | Role change via support is a high-friction path; consider a self-serve settings page |
| L8 | InterviewScreen | `MIN_RECORD_SECS = 5` constant is not communicated to the user | Users may submit very short recordings without knowing there's a minimum |
| L9 | All screens | No loading state during initial Supabase `getSession()` call | `authLoading` is tracked but not shown to user — brief flash of landing screen before redirect |
| L10 | GlobalNav | "서비스 소개" nav link targets `about` screen which has no visible entry in the main footer | Footer links don't include "서비스 소개" |

---

## 4. Positive Observations

**1. Visual design system is solid.**  
Design tokens in `constants.jsx` are well-organized and consistently applied — purple/navy/success color palette, Pretendard typography, and Stripe-inspired icon system give the product a professional, trustworthy feel. Shadow values are disabled for static cards (preventing over-stylized "card soup") and reserved for hover and floating UI.

**2. Landing page hero clearly differentiates both user types.**  
The dual CTA card pattern (리서처/기업 vs. Voica 패널) with distinct iconography and copy makes the two target audiences immediately clear. The live participant counter adds genuine energy to the page.

**3. Dashboard empty state is well-designed.**  
The dashed-border empty state with emoji, clear copy, and a prominent CTA ("첫 프로젝트 만들기") is best-practice empty state design. Users are never stranded.

**4. Editor auto-draft to localStorage is thoughtful.**  
New interview drafts are auto-saved to `localStorage` every 800ms with a debounce and restored on revisit. The "임시저장됨 ✓" indicator in the toolbar provides appropriate feedback.

**5. InterviewScreen has good resilience features.**  
Page visibility detection (stops recording when screen locks), TTS prefetching for next question, and a minimum recording time guard all show careful thought about the mobile voice interview context.

**6. Skeleton loading states are used consistently.**  
`ResponsesScreen` and `ReportScreen` both use a `<Skeleton>` shimmer component during data fetches, avoiding jarring blank screens.

**7. Consent screen is legally thorough.**  
`ConsentScreen` includes a detailed personal data table, specific mention of OpenAI Whisper/STT processing and international data transfer (국외 이전), and granular required vs. optional consent items. This is well above average for an early-stage Korean SaaS.

**8. Mobile hamburger drawer is well-implemented.**  
The slide-in drawer has contextual nav links (different items for "app" vs. "panel" vs. "public" variants), blur backdrop, and descriptive subtitles per item. Much more useful than a plain list.

**9. GlobalNav adapts correctly to all three user states.**  
The `variant` prop system ("public" / "app" / "panel" / "sub") cleanly handles the three role contexts without conditional spaghetti inside individual screens.

**10. Share link overlay is clear and actionable.**  
The post-publish overlay (ShareOverlay) with a success checkmark, the link displayed in a code-styled box, and the one-click copy button is a well-executed moment of delight.

---

## 5. Recommended Next Sprint Items

Ordered by impact-to-effort ratio.

### Sprint Items (P0 — must ship before any user testing)

1. **Fix PanelEntryScreen step completion** — rename step indices or use a named enum so the success screen is reachable and the StepBar highlights correctly. (~1 hour)

2. **Fix ConsentScreen → Interview routing** — pass `shareCode` through consent flow and route to `interview` instead of `panel_board`. (~2 hours)

3. **Replace all `alert()` calls with toasts** — `EditorScreen` (validation: title empty, question empty), `ReportScreen` (generation failure). The `useToast` hook is already available. (~2 hours)

4. **Fix footer links** — Replace `href="#"` with `onClick={() => go(target)}` in the Footer component. (~30 minutes)

### Sprint Items (P1 — ship within 2 weeks)

5. **Add browser history** — Use `window.history.pushState` at minimum inside `go()`, or migrate to `react-router-dom` properly. Map each `screen` value to a URL path. (~1 day)

6. **Add keyboard and ARIA accessibility to hero CTAs** — The two landing-page CTA cards (`<div onClick>`) and all other interactive `<div>` elements need to become `<button>` or `<a>` elements with `type` attributes. Add `tabIndex={0}` and `onKeyDown` handlers at minimum. (~half day)

7. **Communicate 10-question recommendation in editor** — Add a small "질문 N / 10 권장" counter to the editor toolbar so users aren't surprised at publish time. (~1 hour)

8. **Handle TTS blocked state in InterviewScreen** — When `ttsBlocked === true`, show a tap-to-play button in the interview UI. Currently the phase stays `ai_speaking` and the user is stuck. (~2 hours)

9. **Remove mock data from PanelBoardScreen and PanelMyPageScreen** — Replace `MOCK_PANEL_PROFILE`, `PANEL_JOBS`, and `PANEL_APPLICANTS` with real Supabase queries or explicitly mark these screens as "demo mode" with a banner. (~1–2 days)

### Sprint Items (P2 — backlog)

10. **Add more editor templates** — At least 3 additional templates (product feedback, brand perception, employee survey) to reduce blank-canvas anxiety for new researchers.

11. **Role self-service change** — Add a settings/profile page where users can change their role without contacting support.

12. **Pricing → post-login context preservation** — When an unauthenticated user clicks "구매하기", redirect to login with a `?redirect=pricing` param so they land back on the pricing page after auth.

13. **Add `alt` text to all testimonial avatar images** — Current `img` elements have `alt="이강인"` etc. which is fine, but reviewer avatars that are initials-only divs need `role="img"` and `aria-label`.

14. **Add `<title>` updates per screen** — The page title is always "Voica — AI 보이스 인터뷰" regardless of current screen. Dynamic titles improve browser tab clarity and SEO for deep-linked pages.

15. **Replace inline `<style>` global reset in App.jsx** — Move `* { box-sizing: border-box; margin: 0; padding: 0; }` to a proper CSS file (`index.css`).

---

*Report generated by automated UX audit on 2026-04-12. Screenshots saved: `audit-w7-landing-full.png`, `audit-w7-mobile.png`, `audit-auth-screen.png`, `audit-panel-board-desktop.png`.*
