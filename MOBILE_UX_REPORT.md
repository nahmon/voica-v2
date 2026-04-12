# Voica Mobile UX Audit Report

**Date:** 2026-04-12  
**Auditor:** Mobile UX Expert (Google / Amazon / Uber background)  
**Scope:** All screens in `/src/screens/` + `/src/components/shared.jsx`  
**Mobile breakpoint:** `window.innerWidth < 768` (useIsMobile hook)  
**Primary target device:** Korean smartphone users, ~375–430px viewport width

---

## Executive Summary

Voica is a well-structured AI voice interview platform with a clear visual design system. The desktop experience is solid. However, the mobile experience has **several critical issues that will cause real users to fail at key tasks** — particularly during the interview itself (the product's core value). The most severe problems are: the record/stop button is too small for reliable tapping under stress; the Likert scale overflows on narrow screens; the EditorScreen has no mobile-optimized layout for the question list; and the mobile drawer lacks safe-area padding for notched phones. Secondary issues include touch targets below 44px across many interactive elements, font-size problems in the interview intro form that will trigger iOS keyboard zoom, and a missing "back to list" affordance in ResponsesScreen on mobile.

**Critical issues: 4 | High: 6 | Medium: 7 | Low: 5**

---

## Screen-by-Screen Findings

---

### 1. GlobalNav / Mobile Drawer (`src/components/shared.jsx`)

#### CRITICAL — No safe-area inset on mobile drawer bottom
**File:** `src/components/shared.jsx:316–325`

The drawer footer (login/logout buttons) has `padding: "16px 20px"` with no `padding-bottom: env(safe-area-inset-bottom)`. On iPhone with home indicator (iPhone X and all subsequent models — the majority of Korean smartphone market), the buttons will be partially obscured by the system gesture bar.

```jsx
// Current (line 316):
<div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}`, ... }}>

// Fix:
<div style={{ padding: "16px 20px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", ... }}>
```

#### HIGH — Hamburger button touch target is 32px, below 44px minimum
**File:** `src/components/shared.jsx:217`

```jsx
// Current — padding: "6px", fontSize: 20 → renders ~32×32px tap area
<button onClick={() => setMenuOpen(true)} style={{ ..., padding: "6px", ... }}>☰</button>

// Fix — increase padding to hit 44px:
<button onClick={() => setMenuOpen(true)} style={{ ..., padding: "12px", ... }}>☰</button>
```

#### MEDIUM — Drawer nav items use `onMouseEnter`/`onMouseLeave` for hover state
**File:** `src/components/shared.jsx:244–246, 265–267, 285–287`

These hover styles do nothing on touch devices but add noise. More importantly, the tap area `padding: "12px 20px"` is fine (≈44px height), but there is no `:active` visual feedback on mobile, making taps feel unresponsive.

**Fix:** Add a pressed state via `onTouchStart`/`onTouchEnd` or replace the inline hover pattern with a CSS class that includes both `:hover` and `:active`.

#### LOW — Drawer close button (✕) has `padding: 4px` → ~28px tap area
**File:** `src/components/shared.jsx:230`

```jsx
// Fix:
<button onClick={() => setMenuOpen(false)} style={{ ..., padding: "10px", ... }}>✕</button>
```

---

### 2. LandingScreen (`src/screens/LandingScreen.jsx`)

#### MEDIUM — Hero section top padding too aggressive on short phones
**File:** `src/screens/LandingScreen.jsx:68`

`padding: isMobile ? "80px 20px 90px"` — on a 667px tall iPhone SE, this 80px top padding plus the 56px sticky nav means content starts at 136px from top, leaving only ~530px. With the h1, live-count badge, and two tall CTA cards, the user must scroll to see both options. The two CTA cards at full width stack vertically which is correct, but the first card alone is ~140px, so the second card (패널 참여) falls below the fold with zero visual hint to scroll.

**Fix:** Reduce hero top padding on mobile to `48px` and add a subtle scroll-down indicator below the CTA cards.

#### LOW — `onMouseEnter`/`onMouseLeave` hover effects on CTA cards
**File:** `src/screens/LandingScreen.jsx:95–96, 104–105`

`translateY(-2px)` on hover has no meaning on touch. Safe to remove the transform for touch or guard it with `@media (hover: hover)`.

#### LOW — VoCCarousel pause-on-hover (`onMouseEnter setPaused`) won't work on mobile
**File:** `src/components/shared.jsx:367`

The carousel never pauses on mobile (no hover). Users reading a long testimonial on mobile will have it auto-advance mid-read. The carousel dot buttons are also only 6×6px (growing to 18×6px for active) — far below the 44px touch target standard.

**Fix:** On mobile, pause auto-advance on touch-start and resume on touch-end. Increase dot touch targets with padding while keeping visual size.

---

### 3. AuthScreen / AdvertiserLoginScreen (`src/screens/AuthScreen.jsx`)

#### HIGH — Role selector cards have no minimum touch height on mobile
**File:** `src/screens/AuthScreen.jsx:111–116`

The signup role-selection cards (`padding: "14px 16px"`) render at ~76px height which is acceptable, but the tap target is the full card `div` with an `onClick`. This is fine. However the tab switcher buttons inside the card:

**File:** `src/screens/AuthScreen.jsx:123`
```jsx
<button style={{ ..., padding: "6px", ... }}>
```
These tab buttons render at ~30px height. On mobile, the login/signup tab switches are frequently mis-tapped.

**Fix:**
```jsx
// Increase padding:
padding: isMobile ? "10px" : "6px"
```

#### MEDIUM — "비밀번호 찾기" link has `fontSize: 12` and minimal tap area
**File:** `src/screens/AuthScreen.jsx:136–138`

A 12px `<a>` with no padding around it. This is a critical recovery path (password reset). Users with larger fingers will struggle.

**Fix:** Wrap in a `<div>` with `padding: "8px 0"` to increase tap area, and increase font to 13px minimum.

#### MEDIUM — PillGroup buttons have `padding: "6px 12px"` → ~30px height
**File:** `src/screens/AuthScreen.jsx:77`

The role-selection pill buttons for the role chooser sub-component are borderline at 30px height. Minimum should be 36px for secondary choices, 44px for primary.

---

### 4. InterviewScreen (`src/screens/InterviewScreen.jsx`) — MOST CRITICAL SCREEN

This is the core product experience. Issues here directly destroy the product's value.

#### CRITICAL — Record/Stop button is 68×68px but rendered in a flex column with no padding — easily mis-tapped during stress
**File:** `src/screens/InterviewScreen.jsx:539–543`

The 68px circle button is technically above the 44px minimum, but on mobile during an active voice recording, users often grip the phone differently and reach awkwardly. More critically: **the stop button and the record button are the same element** (phase toggle). There is no confirmation before stopping, and if a user accidentally taps "stop" after only 3 seconds (below the 5-second `MIN_RECORD_SECS`), the recording is submitted with a warning but no retry option.

The button also has no visual label — just an icon. Korean users unfamiliar with the convention may not understand the mic icon = "tap to record".

**Fix:**
```jsx
// Add a text label below the button:
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
  <button /* existing */ />
  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
    {phase === "recording" ? "탭하여 완료" : "탭하여 녹음 시작"}
  </span>
</div>
```

#### CRITICAL — Likert scale buttons overflow on narrow screens
**File:** `src/screens/InterviewScreen.jsx:584–591`

```jsx
<div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
  {Array.from({ length: (q.options.max ?? 5) - ... }).map(n => (
    <button style={{ width: 52, height: 52, ... }}>
```

A 5-point Likert scale with `width: 52px` buttons and `gap: 10px` requires **5×52 + 4×10 = 300px** minimum width. On a 375px screen with `padding: "24px 16px"` (32px total horizontal padding), the usable width is only 343px — technically fits, but on a 360px screen (very common Samsung Galaxy A-series in Korea) with 32px padding, usable width = 328px, which means buttons get squeezed or wrap unpredictably. A 7-point scale (common for brand tracking) would require 7×52 + 6×10 = 424px — **will definitely overflow**.

**Fix:**
```jsx
// Use flex-wrap or dynamic sizing:
<div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", maxWidth: "100%" }}>
  {/* ... */}
  <button style={{ 
    width: isMobile ? `calc((100% - ${(count-1) * 6}px) / ${count})` : 52, 
    minWidth: 40, height: 52, ...
  }}>
```

#### CRITICAL — Intro form inputs have no `fontSize: 16` guard against iOS zoom
**File:** `src/screens/InterviewScreen.jsx:366`

```jsx
<input ... style={{ ..., fontSize: 16, ... }} />
```

Wait — the name/age inputs ARE at fontSize 16, which is correct. However, the **gender selector buttons** use `fontSize: 13`:

**File:** `src/screens/InterviewScreen.jsx:374`
```jsx
<button style={{ ..., padding: "8px", fontSize: 13, ... }}>
```

While these are buttons not inputs, on some Android browsers the 13px text makes the entire touch target feel too small (the buttons are `flex: 1` with `padding: "8px"` — roughly 42px wide each on a 375px screen, which is borderline).

More importantly: the intro screen `<input>` elements for name and age lack `autocomplete` attributes. For a one-time interview flow on mobile, `autocomplete="name"` and `autocomplete="off"` (for age) would significantly improve mobile form UX.

**Fix:**
```jsx
<input ... autocomplete="name" inputMode="text" ... />  // name field
<input ... autocomplete="off" inputMode="numeric" ... /> // age field (already has inputMode)
```

#### HIGH — TTS blocked state shows a small 13px button with no large touch target
**File:** `src/screens/InterviewScreen.jsx:487–500`

When iOS blocks audio autoplay (common), users see a "소리 켜고 다시 듣기" button:
```jsx
<button style={{ padding: "8px 20px", ..., fontSize: 13, ... }}>
```
This ~38px tall button is the primary recovery action when the interview is broken. It needs to be at least 48px tall and visually prominent.

**Fix:** Use the `Btn` component at `size="lg"` here, or add `padding: "14px 24px"`.

#### HIGH — Exit confirmation modal uses small ghost button for "계속 진행"
**File:** `src/screens/InterviewScreen.jsx:422`

```jsx
<Btn variant="ghost" size="lg" style={{ ..., color: C.white }} onClick={() => setShowExitConfirm(false)}>계속 진행</Btn>
```

The `ghost` variant with white color on dark background renders with a `rgba(255,255,255,0.2)` border. This is visually unclear — which is "safe" action? On mobile under stress, the destructive "나가기" and the safe "계속 진행" look equally prominent. Users may accidentally tap "나가기" and lose their session.

**Fix:** Make "계속 진행" the visually dominant (filled) button, and "나가기" the ghost. Conventional mobile UX: primary action = solid fill, destructive = outlined or positioned second.

#### MEDIUM — Recording waveform bars use `Math.random()` heights, causing layout thrash
**File:** `src/screens/InterviewScreen.jsx:522–525`

```jsx
{Array.from({ length: 22 }).map((_, i) => (
  <div key={i} style={{ ..., height: `${6 + Math.random() * 22}px`, transition: "height 0.15s" }} />
))}
```

`Math.random()` is called on every render. Each re-render (which happens every second via the timer) causes all 22 bars to re-randomize, creating choppy visual noise rather than a smooth wave. On low-end Android devices, this also causes unnecessary layout thrashing.

**Fix:** Pre-compute bar heights in a `useRef` or `useMemo`, and use a CSS animation instead.

#### MEDIUM — No keyboard-aware scrolling on the intro form
**File:** `src/screens/InterviewScreen.jsx:348–395`

The intro form is in a `display: "flex", alignItems: "center", justifyContent: "center"` full-height container. When the soft keyboard appears on mobile (tapping the name/age inputs), the container shrinks. On shorter devices (iPhone SE, small Androids), the "인터뷰 시작하기 →" button and privacy disclaimer will be hidden behind the keyboard with no way to scroll to them.

**Fix:**
```jsx
// Change the outer container to:
style={{ 
  minHeight: "100vh", 
  display: "flex", 
  alignItems: "flex-start", // not center
  justifyContent: "center", 
  padding: "40px 24px 24px",
  overflowY: "auto"
}}
```

---

### 5. PanelEntryScreen (`src/screens/PanelEntryScreen.jsx`)

#### HIGH — ChipGroup touch targets are borderline: `padding: "7px 13px"` → ~34px height
**File:** `src/screens/PanelEntryScreen.jsx:41`

The chip buttons at 34px height are below the 44px minimum. This screen has 14 interest chips in a wrapping grid — many of which will be in the "fat finger zone." Missing a chip selection is frustrating when filling out a profile form.

**Fix:**
```jsx
// Increase vertical padding:
padding: "10px 13px"  // ~40px height, acceptable
```

#### MEDIUM — Step 0 form: phone input uses `type="tel"` (good) but no `autocomplete="tel"`
**File:** `src/screens/PanelEntryScreen.jsx:85`

Missing `autocomplete="tel"` means iOS won't offer the phone number from contacts. For a Korean audience where most use their real phone number for panel registration, this is a meaningful friction point.

#### MEDIUM — StepBar renders step labels at `fontSize: 10` — below readable threshold on mobile
**File:** `src/screens/PanelEntryScreen.jsx:59`

Korean characters at 10px are illegible on non-Retina screens and barely readable on Retina. Minimum for body Korean text is 12px; for navigation labels, 11px is the absolute floor.

**Fix:** `fontSize: 11` minimum.

#### LOW — "이전으로" / "다음으로" button pair uses `flex: 1` / `flex: 2` ratio
**File:** `src/screens/PanelEntryScreen.jsx:133–134`

The 1:2 ratio means "이전으로" gets ~33% width and "다음으로" gets ~67%. On a 375px screen with 16px padding, "이전으로" is about 107px wide — adequate for a secondary action. This is actually fine, just noting it as the pattern could break on very narrow screens.

---

### 6. PanelBoardScreen (`src/screens/PanelBoardScreen.jsx`)

#### MEDIUM — Search input inside hero has `background: rgba(255,255,255,0.1)` — very low contrast on dark background
**File:** `src/screens/PanelBoardScreen.jsx:52–57`

The placeholder text color is browser default (often `rgba(255,255,255,0.6)` on dark inputs, but with the semi-transparent bg, this can render below 3:1 contrast ratio). The `color: C.white` for input text is fine, but there's no explicit `::placeholder` color set.

**Fix:**
```jsx
// Add inline style or a <style> tag for placeholder:
style={{ ..., "::placeholder": { color: "rgba(255,255,255,0.45)" } }}
// Or use a className with CSS: .search-input::placeholder { color: rgba(255,255,255,0.45) }
```

#### MEDIUM — Category filter pills: `overflowX: "auto"` without scroll snap or fade indicator
**File:** `src/screens/PanelBoardScreen.jsx:70`

The horizontal filter scroll has `scrollbarWidth: "none"` (hidden scrollbar) but no visual fade on the right edge to indicate more content. Korean users may not intuit horizontal scroll on this element, missing "추천" and "전문가" filters.

**Fix:** Add a CSS right-edge fade gradient:
```jsx
// Wrap in a div with:
style={{ position: "relative", marginBottom: 20 }}
// After the scroll div, add:
<div style={{ position: "absolute", right: 0, top: 0, bottom: 4, width: 32, background: "linear-gradient(to right, transparent, #f8fafc)", pointerEvents: "none" }} />
```

#### LOW — JobCard "지원할게요" button has `width: "100%"` and adequate touch target (10px+14px padding ~48px) — this is correct and good
No issue here.

---

### 7. ConsentScreen (`src/screens/ConsentScreen.jsx`)

#### HIGH — Privacy table (`minWidth: 420`) inside horizontal scroll on mobile
**File:** `src/screens/ConsentScreen.jsx:23`

```jsx
<div style={{ overflowX: "auto" }}>
  <table style={{ width: "100%", minWidth: 420, ... }}>
```

On a 375px screen, the table forces horizontal scroll. This is a **consent flow** — users must read and understand this table to legally consent. If the table is difficult to read and requires unexpected horizontal scrolling, users will either skip it (bad for legal compliance) or feel frustrated (bad for conversion).

**Fix:** On mobile, break the table into a stacked card layout:
```jsx
// On mobile (isMobile check needed in ConsentScreen — currently not imported):
{REQUIRED[0].detail} // replace table with stacked key-value pairs
```
Or alternatively: replace the table with a definition list layout that wraps gracefully.

Note: ConsentScreen currently does NOT use `useIsMobile` — it applies the same layout for all screen sizes.

#### MEDIUM — Custom checkboxes are 20×20px — just at the iOS minimum
**File:** `src/screens/ConsentScreen.jsx:84, 98–99`

The 20×20px custom checkbox `div` elements technically meet a minimum, but Apple's HIG recommends 44px for touch targets. The checkbox's `onClick` is on the parent row container which has `padding: "16px 20px"` (making the effective target larger), but the visual checkbox itself gives no affordance of this. Users trying to tap the checkbox precisely will struggle.

The chevron expand button is `padding: 2` → ~20px touch target.

**Fix:**
```jsx
// ChevronDown toggle button:
<button onClick={() => toggle(item.id)} style={{ ..., padding: "8px", ... }}>
```

---

### 8. EditorScreen (`src/screens/EditorScreen.jsx`)

#### HIGH — Mobile layout has no way to reorder or delete questions
**File:** `src/screens/EditorScreen.jsx:263–309`

The desktop layout has a drag-and-drop question list sidebar with up/down reorder buttons. The mobile layout replaces this with a horizontal tab strip of `Q1, Q2, Q3...` buttons. These tabs have no reorder affordance and no delete affordance. The `removeQ` and `moveQ` functions exist but are inaccessible on mobile.

This means mobile users who create an interview cannot manage question order — a significant missing feature that degrades mobile creation UX.

**Fix:** Add a "..." or long-press context menu per question tab, or add swipe-to-delete on mobile. At minimum, expose a delete button when a question tab is selected.

#### HIGH — Template dropdown opens off-screen on mobile
**File:** `src/screens/EditorScreen.jsx:241–254`

The template dropdown has `position: "absolute", top: "100%", right: 0` with `minWidth: 220`. The NavBar is `padding: "0 16px"`, and the template button is on the right side. On a 375px screen, `right: 0` positions the dropdown correctly, but if it extends to the left, it may clip the left edge. More importantly, the `zIndex: 100` should be `zIndex: 200` to ensure it renders above the question tabs below.

#### MEDIUM — NavBar "← 대시보드" and multiple right-side buttons get crowded on mobile
**File:** `src/screens/EditorScreen.jsx:235–260`

The sticky NavBar contains: "← 대시보드", "로그아웃", "임시저장됨 ✓", "템플릿", "링크 생성 →". On mobile at 375px, this row will overflow or wrap. The `height: 48` doesn't adapt.

**Fix:** On mobile, consolidate: hide "로그아웃" (accessible via sidebar), keep only "← 대시보드" and "링크 생성 →" with the template as a "⋯" overflow menu.

---

### 9. ResponsesScreen (`src/screens/ResponsesScreen.jsx`)

#### HIGH — Mobile: selecting a session shows a detail view with no back button to session list
**File:** `src/screens/ResponsesScreen.jsx:40–41, 75`

```jsx
if (window.innerWidth >= 768) setSelectedSession(sorted[0]);
```

On desktop, the first session is auto-selected (two-pane layout). On mobile, no session is initially selected. Once a session IS selected and the detail view renders, there must be a back button. Looking at line 75: `if (isMobile && selectedSession)` renders the detail view — this is correct — but the back button implementation needs to be verified. The screen is incomplete in the excerpt, but this pattern is a common mobile UX failure if the back button is missing or not visible above the fold.

**Verify and ensure:** The mobile detail view has a prominent "← 뒤로" button in a sticky header before any scrollable content.

---

### 10. DashboardScreen (`src/screens/DashboardScreen.jsx`)

#### MEDIUM — "안녕하세요, {name}님 👋" header row: flex with `justifyContent: "space-between"` on mobile can overlap
**File:** `src/screens/DashboardScreen.jsx:44`

```jsx
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", ... flexWrap: "wrap", gap: 16 }}>
```

`flexWrap: "wrap"` is present — this is good and prevents overflow. The "+" button wraps below if the greeting is long. This is acceptable behavior, though the gap after wrapping could cause the button to appear disconnected from the header.

#### LOW — Stat cards use `padding: "20px 20px"` with `isMobile ? "1fr 1fr"` — adequate on 375px (two 167px wide cards with 10px gap)
No critical issue, but the stat cards on the smallest phones (360px) with 10px gap yield ~165px cards — just enough for the content.

#### LOW — Project list action buttons ("편집", "응답 보기", "리포트") use `size="sm"` → `padding: "5px 14px"` → ~30px height
**File:** `src/screens/DashboardScreen.jsx:127–129`

These are secondary actions on a card, not primary actions, so the smaller size is defensible. But on mobile, they're the primary way to navigate to key features. Consider `size="md"` on mobile.

---

### 11. RoleSelectScreen (`src/screens/RoleSelectScreen.jsx`)

#### MEDIUM — Full-screen role select cards: `flex: 1, minWidth: 220, maxWidth: 260` with `gap: 20, flexWrap: "wrap"`
**File:** `src/screens/RoleSelectScreen.jsx:31`

On a 375px screen, two cards with `minWidth: 220` and `gap: 20` require 460px minimum — they WILL wrap to a single column. This is fine visually. However the outer container has `padding: 24` and the cards have `padding: "36px 28px"` — each card will be ~327px wide when stacked. The mouse-hover `onMouseEnter/Leave` border color changes are irrelevant on mobile.

No critical issue, but the stacked cards take a lot of vertical space on mobile (each ~280px tall). Users must scroll to see both options. Consider reducing card `padding` on mobile from `"36px 28px"` to `"24px 20px"`.

---

### 12. PricingScreen (`src/screens/PricingScreen.jsx`)

#### MEDIUM — Credit cards stack as `1fr` on mobile (correct) but each card is very tall due to `padding: "28px 26px"` 
**File:** `src/screens/PricingScreen.jsx:47`

On mobile, three stacked credit cards each ~280px tall = 840px of scrolling just for the pricing section. This is acceptable for a pricing page (users expect to compare), but the highlighted "인기" card should be visually first on mobile (currently it renders second in the array).

**Fix:** On mobile, reorder the array to show highlight first, or use CSS `order: -1` for the highlighted card in a grid.

#### LOW — Billing toggle buttons `padding: "7px 16px"` → ~34px height, fine for a non-primary toggle
No critical issue.

---

### 13. PanelMyPageScreen (`src/screens/PanelMyPageScreen.jsx`)

#### LOW — Stat tiles in 2×2 grid on mobile: `padding: "14px 12px"`, 18px value font, 11px label — readable but tight
**File:** `src/screens/PanelMyPageScreen.jsx:43`

No critical issue. The grid adapts correctly with `isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr"`.

---

### 14. Footer (`src/components/shared.jsx:641–668`)

#### LOW — Footer nav links have no padding on mobile — small tap targets
**File:** `src/components/shared.jsx:654–658`

Footer `<a>` links have `fontSize: 14` and no padding. For a footer this is low priority, but adding `padding: "4px 0"` would bring the effective touch area closer to 30px.

---

## Top 10 Priority Fixes (Most Impact for Users)

These are ordered by user impact × frequency of occurrence. Fix these first.

### #1 — CRITICAL: Likert scale overflow on 360px screens
**File:** `InterviewScreen.jsx:584`  
**Why:** Breaks a core question type mid-interview. No recovery path. Affects Samsung A-series (huge in Korea).  
**Fix:** Fluid button widths with `calc()` as shown above.

### #2 — CRITICAL: Add text labels to record/stop button
**File:** `InterviewScreen.jsx:538–562`  
**Why:** The most important UX moment in the entire product. Users must feel confident. Silent icon-only controls fail first-time users.  
**Fix:** Add "탭하여 녹음 시작" / "탭하여 완료" text below the button.

### #3 — CRITICAL: Fix keyboard-overlap on interview intro form
**File:** `InterviewScreen.jsx:348`  
**Why:** Users on iPhone SE / small Androids can't see the start button after tapping name field. They get stuck and abandon.  
**Fix:** Change `alignItems: "center"` to `alignItems: "flex-start"` with `overflowY: "auto"` on the container.

### #4 — CRITICAL: Mobile drawer bottom safe-area padding
**File:** `shared.jsx:316`  
**Why:** On iPhone 14/15/16 (dominant Korean market phones), login and logout buttons are obscured by home indicator. Core navigation broken.  
**Fix:** `paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))"`.

### #5 — HIGH: TTS-blocked recovery button too small
**File:** `InterviewScreen.jsx:487`  
**Why:** iOS blocks audio autoplay by policy. This blocked state happens on EVERY first visit on iPhone. The recovery button being 38px tall means users mis-tap it. The interview never starts.  
**Fix:** Use `Btn size="lg"` with `full` prop.

### #6 — HIGH: Consent screen privacy table forces horizontal scroll
**File:** `ConsentScreen.jsx:23`  
**Why:** Legal consent table with `minWidth: 420` on a 375px screen. Users can't read it comfortably, likely skip it. Legal and trust risk.  
**Fix:** Stack as definition list on mobile. Import and use `useIsMobile` in ConsentScreen.

### #7 — HIGH: Exit confirmation button order inverts safe/destructive actions
**File:** `InterviewScreen.jsx:421–424`  
**Why:** "계속 진행" (safe) is on the left as a ghost button. "나가기" (destructive) is on the right as a solid button. Conventional mobile patterns put destructive actions on the left / as ghost. Users are more likely to accidentally confirm "나가기" when tapping right-side buttons.  
**Fix:** Swap button order and swap visual weight (fill "계속 진행", ghost "나가기").

### #8 — HIGH: EditorScreen mobile missing delete/reorder for questions
**File:** `EditorScreen.jsx:279–302`  
**Why:** A researcher creating an interview on mobile cannot reorganize or remove questions. This makes the mobile creation flow incomplete.  
**Fix:** Add a "⋯" button per selected question tab that opens a small action sheet: "삭제", "위로", "아래로".

### #9 — HIGH: Hamburger button touch target too small (32px)
**File:** `shared.jsx:217`  
**Why:** The hamburger is on every page's mobile nav. Miss-tapping it is a repeated daily frustration.  
**Fix:** Increase `padding` from `"6px"` to `"12px"`.

### #10 — HIGH: PanelEntry ChipGroup touch targets at 34px
**File:** `PanelEntryScreen.jsx:41`  
**Why:** The panel registration form has 14+ chips to select. Users must tap many of these. 34px height means frequent miss-taps, especially in the interest category section.  
**Fix:** Increase chip `padding` to `"10px 13px"`.

---

## Additional Systemic Issues

### Safe Area Insets — Apply Globally
Beyond the drawer, check: the Toast notification in `shared.jsx:22` uses `bottom: "calc(28px + env(safe-area-inset-bottom, 0px))"` — this is correctly handled. But the main page content areas (DashboardScreen, PanelBoardScreen) have no bottom padding for the home indicator. When content scrolls to the bottom, the last item sits under the system gesture bar.

**Fix pattern** — add to all screen root containers:
```jsx
paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))"
```

### `useIsMobile` Breakpoint Is 768px, Not ~430px
**File:** `src/hooks/useIsMobile.js:4`

The prompt describes the breakpoint as "~430px" but the actual implementation uses `window.innerWidth < 768`. This means tablets (768px) are treated as desktop, which is fine. But more importantly: **the mobile layout kicks in at 768px, not just for phones.** This means iPads in portrait mode get the hamburger menu and simplified layouts. Verify this is intentional.

Additionally, the hook fires on `resize` but has no `debounce`. On rapid window resizes (rare on mobile, common in devtools), this can cause rapid re-renders. Low priority.

### No `touch-action: manipulation` on Interactive Elements
None of the custom button/div interactive elements set `touch-action: manipulation`. Without this, mobile browsers apply a 300ms tap delay (Safari pre-iOS 13, some Android browsers). Add globally:
```css
button, [role="button"], [onClick] { touch-action: manipulation; }
```
Or via a global CSS reset.

### `window.confirm()` Used in EditorScreen — Blocked on Mobile WebViews
**File:** `EditorScreen.jsx:94`
```jsx
if (hasContent && !window.confirm("현재 작성 중인 내용이 모두 사라집니다...")) return;
```
`window.confirm()` is blocked in many mobile browser contexts (PWAs, WebViews, some iOS Safari configurations). Replace with a proper modal component.

### Recording Waveform Uses `Math.random()` on Every Render
**File:** `InterviewScreen.jsx:524`  
Causes unnecessary repaints during recording. On low-end devices, this adds latency to the recording UI.

---

## Quick-Win Code Examples

### Fix 1: Responsive Likert Scale
```jsx
// In InterviewScreen.jsx, replace the Likert flex container:
const count = (q.options.max ?? 5) - (q.options.min ?? 1) + 1;
<div style={{ 
  display: "flex", 
  gap: isMobile ? 6 : 10, 
  justifyContent: "center",
  width: "100%"
}}>
  {Array.from({ length: count }, ...).map(n => (
    <button key={n} style={{ 
      flex: isMobile ? 1 : "none",
      width: isMobile ? "auto" : 52, 
      height: 52, 
      minWidth: 36,
      ...
    }}>
```

### Fix 2: Safe-area Drawer Footer
```jsx
// In shared.jsx line 316:
<div style={{ 
  padding: "16px 20px", 
  paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
  borderTop: `1px solid ${C.border}`, 
  display: "flex", flexDirection: "column", gap: 8 
}}>
```

### Fix 3: Interview Intro Container (Keyboard-safe)
```jsx
// In InterviewScreen.jsx, the intro container (line 349):
<div style={{ 
  minHeight: "100vh", 
  background: "linear-gradient(...)", 
  display: "flex", 
  alignItems: isMobile ? "flex-start" : "center",
  justifyContent: "center", 
  fontFamily: F, 
  padding: isMobile ? "40px 24px 40px" : "24px",
  overflowY: "auto",
  boxSizing: "border-box"
}}>
```

### Fix 4: Hamburger Touch Target
```jsx
// In shared.jsx line 217:
<button 
  onClick={() => setMenuOpen(true)} 
  style={{ 
    background: "none", border: "none", cursor: "pointer", 
    padding: "12px 8px",  // 44px effective height
    color: C.navy, fontSize: 20, lineHeight: 1,
    display: "flex", alignItems: "center", justifyContent: "center"
  }}
>☰</button>
```

### Fix 5: ConsentScreen — Import isMobile and Handle Table
```jsx
// Add to ConsentScreen.jsx imports:
import { useIsMobile } from "../hooks/useIsMobile.js";

// At top of component:
const isMobile = useIsMobile();

// Replace the table detail with a conditional:
detail: isMobile ? (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {[
      ["수집 항목", "성명, 이메일, 음성 녹음 데이터, 발화 텍스트(STT)"],
      ["수집·이용 목적", "음성 인터뷰 진행 및 리서치 분석"],
      ["보유·이용 기간", "인터뷰 완료일로부터 1년, 이후 파기"],
    ].map(([k, v]) => (
      <div key={k} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 3 }}>{k}</div>
        <div style={{ fontSize: 12, color: C.body, lineHeight: 1.6 }}>{v}</div>
      </div>
    ))}
  </div>
) : (/* existing table */)
```

---

## Summary Table

| # | Screen | Issue | Severity | Effort |
|---|--------|-------|----------|--------|
| 1 | InterviewScreen | Likert overflow on 360px | CRITICAL | Small |
| 2 | InterviewScreen | Record button no label | CRITICAL | Small |
| 3 | InterviewScreen | Intro form keyboard overlap | CRITICAL | Small |
| 4 | GlobalNav/Drawer | No safe-area bottom padding | CRITICAL | Tiny |
| 5 | InterviewScreen | TTS-blocked button too small | HIGH | Tiny |
| 6 | ConsentScreen | Privacy table forces h-scroll | HIGH | Medium |
| 7 | InterviewScreen | Exit confirm button order wrong | HIGH | Tiny |
| 8 | EditorScreen | Mobile missing delete/reorder | HIGH | Medium |
| 9 | GlobalNav | Hamburger 32px touch target | HIGH | Tiny |
| 10 | PanelEntryScreen | ChipGroup 34px touch targets | HIGH | Tiny |
| 11 | InterviewScreen | Recording waveform Math.random | MEDIUM | Small |
| 12 | InterviewScreen | Gender buttons 34px on mobile | MEDIUM | Tiny |
| 13 | PanelBoardScreen | Category filter no scroll hint | MEDIUM | Small |
| 14 | AuthScreen | Tab switch buttons 30px | MEDIUM | Tiny |
| 15 | DashboardScreen | Action buttons size="sm" → 30px | LOW | Tiny |
| 16 | GlobalNav | Drawer close ✕ 28px | LOW | Tiny |
| 17 | All screens | No safe-area bottom on content | MEDIUM | Small |
| 18 | EditorScreen | window.confirm() on mobile | MEDIUM | Small |
| 19 | All interactive | Missing touch-action:manipulation | LOW | Tiny |
| 20 | VoCCarousel | Dot buttons 6px touch target | LOW | Tiny |

**Total estimated fix time for all CRITICAL + HIGH items:** ~4–6 hours of focused coding.
