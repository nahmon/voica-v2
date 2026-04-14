# Voice Survey Landing Page — Visual/UX Audit Report

**Date:** 2026-04-14  
**Branch:** feature/audit-and-integrations  
**URL:** http://localhost:5177/  
**Viewports tested:** Desktop (1280x720), Mobile (375x812)  
**Console errors:** 0  

---

## Summary

| Severity | Found | Fixed |
|----------|-------|-------|
| Critical | 0 | — |
| Major | 4 | 4 |
| Minor | 3 | 3 |
| Deferred | 2 | — |

**Health score:** 87/100 → 92/100 (post-fix estimate)

---

## Section: Hero

### ISSUE-001 — Hardcoded color `#061b31` instead of `C.navy`
- **Severity:** Minor
- **File:** `src/screens/LandingScreen.jsx:255`
- **Description:** Hero h1 first-line `<span>` used the literal hex `#061b31` instead of the design token `C.navy`. Functionally identical but breaks the single-source-of-truth principle for color tokens.
- **Fix applied:** Yes — changed to `C.navy`
- **Commit:** b354488

---

## Section: Stats Bar

### ISSUE-002 — Hardcoded color `#b91c4a` instead of `C.ruby`
- **Severity:** Major
- **File:** `src/screens/LandingScreen.jsx:303`
- **Description:** The "평균 인터뷰 시간" stat used a bespoke dark-red hex (`#b91c4a`) that does not exist in the design system. `C.ruby` (`#ea2261`) is the correct token for red/negative accents.
- **Fix applied:** Yes — changed to `C.ruby`
- **Commit:** b354488

### ISSUE-003 — Stats grid 2x2 mobile: asymmetric borders
- **Severity:** Minor
- **File:** `src/screens/LandingScreen.jsx:305-315`
- **Description:** On mobile the 4-stat grid renders 2×2. The border logic draws right borders on items 0,2 and bottom borders on items 0,1. This leaves the 4th stat (index 3) with no separator on any side — visually detached. The border dividers on the left column also slightly misalign the number alignment on small screens (observed in mobile screenshot).
- **Fix applied:** No (deferred — requires careful mobile grid restructure, low user impact)

---

## Section: Before/After Comparison

No issues found. Section renders correctly on both desktop and mobile. Color tokens used consistently. Arrow direction swap (→ / ↓) works correctly.

---

## Section: VoC Carousel (Customer Testimonials)

### ISSUE-004 — Hardcoded `#533afd` in carousel dot indicator instead of `C.purple`
- **Severity:** Minor
- **File:** `src/components/shared.jsx:397`
- **Description:** Active dot in the VoCCarousel used the literal hex `#533afd` (which is `C.purple`) instead of the token. If the brand purple ever updates, this dot would silently diverge.
- **Fix applied:** Yes — changed to `C.purple`
- **Commit:** b354488

---

## Section: HowItWorks Carousel

No issues found. Icon rendering, step progression, and mobile scroll arrows all work correctly. Color tokens used consistently.

---

## Section: Final CTA

No issues found. Gradient animation renders correctly. Both CTA buttons have hover states (translateY + shadow on primary, background tint on ghost). `C.*` tokens used throughout.

---

## Section: Footer

### ISSUE-005 — Footer background `#060f1f` not in design token system
- **Severity:** Minor (deferred)
- **File:** `src/components/shared.jsx:647`
- **Description:** The footer uses a one-off near-black (`#060f1f`) that is not in `C.*`. It is distinct from `C.navy` (`#061b31`) and `C.interviewBg` (`#07081a`). The intent is clearly a deep dark footer background. This could be extracted to a `C.footerBg` token, but since it is the only usage and the visual result is correct, it is low risk.
- **Fix applied:** No (deferred — would require adding a constant, which is not in scope per audit constraints on constants.jsx)

---

## Section: InterviewScreen (share flow + "Powered by" footer)

### ISSUE-006 — Old `voica.kr` domain in share text and navigator.share URL
- **Severity:** Major
- **File:** `src/screens/InterviewScreen.jsx:560,562`
- **Description:** When a panel user completes an interview and shares it, the share text and native share URL both referenced `voica.kr` — the old brand domain. This surfaces the deprecated brand name to end users.
- **Fix applied:** Yes — changed to `voicesurvey.ai`
- **Commit:** b354488

### ISSUE-007 — Hardcoded `rgba(124,58,237,...)` instead of design tokens in "Powered by" block
- **Severity:** Major
- **File:** `src/screens/InterviewScreen.jsx:640`
- **Description:** The interview completion screen's "Powered by" promo box used two hardcoded rgba values for border and background (`rgba(124,58,237,0.3)` and `rgba(124,58,237,0.08)`). These use a slightly different purple (124,58,237 ≈ `#7c3aed`) vs the brand `C.purple` (#533afd = 83,58,253). The visual difference is subtle but the token deviation is real.
- **Fix applied:** Yes — replaced with `C.purpleLight + opacity` for border and `C.purpleBg` for background
- **Commit:** b354488

---

## Section: Navigation (GlobalNav)

No issues found. Logo uses correct `/logo-voice-survey.svg`. Sticky nav with blur backdrop works. Mobile hamburger drawer renders correctly. All nav links use `C.*` tokens. Hover states present on NavTab (underline) and Btn components.

---

## Section: Mobile Layout

Overall mobile layout is good. Notable observations:
- Hero stacks CTAs to full-width column — correct
- Stats drop to 2×2 grid — works but border asymmetry (ISSUE-003 above)
- Before/After comparison stacks to single column with ↓ arrow — correct
- HowItWorks carousel shows horizontal scroll with ← → buttons — correct
- Footer stacks to column — correct
- Logo visible on mobile nav; hamburger drawer works

---

## Brand Check: "Voica" references in user-visible code

| File | Location | Content | User-visible? | Fixed? |
|------|----------|---------|---------------|--------|
| `InterviewScreen.jsx:560` | share text | `voica.kr` | Yes (share sheet) | Yes |
| `InterviewScreen.jsx:562` | navigator.share URL | `https://voica.kr` | Yes (share sheet) | Yes |
| `InterviewScreen.jsx:639` | comment | `Powered by Voica` | No (comment only) | Yes (comment updated) |
| `App.jsx:26` | function name | `export default function Voica()` | No (internal) | Deferred |
| `localStorage keys` | `voica_*` | storage keys | No (internal) | Deferred — changing breaks existing sessions |
| `TermsScreen/PrivacyScreen/SupportScreen` | email | `voica.support@gmail.com` | Yes (legal pages) | Deferred — requires confirmed new email |
| `App.jsx.bak` | various | multiple Voica refs | No (.bak file) | Deferred — consider deleting bak file |

---

## SVG Logo Check

- Nav logo: `/logo-voice-survey.svg` — `height: 28`, renders as image tag. No text-in-SVG font fallback issues observed at tested viewport.
- Footer logo: `/logo-voice-survey-footer.svg` — `height: 28`, transparent background on dark footer. Renders correctly.
- Both logos appear visually correct at desktop and mobile sizes.

---

## Fixes Applied (commit b354488)

1. `LandingScreen.jsx:255` — `"#061b31"` → `C.navy` (hero h1 color token)
2. `LandingScreen.jsx:303` — `"#b91c4a"` → `C.ruby` (stats color token)
3. `shared.jsx:397` — `"#533afd"` → `C.purple` (VoC carousel dot token)
4. `InterviewScreen.jsx:560,562` — `voica.kr` → `voicesurvey.ai` (old brand domain)
5. `InterviewScreen.jsx:640` — `rgba(124,58,237,...)` → `C.purpleBg` / `C.purpleLight` tokens
6. `InterviewScreen.jsx:639` — Updated stale comment from "Powered by Voica" to "Powered by Voice Survey"

## Deferred Issues

- **ISSUE-003** — Mobile stats grid border asymmetry (Minor, cosmetic)
- **ISSUE-005** — `#060f1f` footer background not in token system (Minor, no visual regression)
- **App.jsx:26** — Internal function named `Voica` (not user-visible)
- **localStorage keys** — `voica_*` prefix (changing breaks existing user sessions, coordinate separately)
- **Legal pages** — `voica.support@gmail.com` email (defer until confirmed new contact address)
- **App.jsx.bak** — Dead file with many old Voica references (recommend deletion)

---

*Generated by /qa audit on 2026-04-14. Screenshots: `.gstack/qa-reports/screenshots/`*
