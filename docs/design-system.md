# VoiceSurvey Design System

> Source of truth: `src/lib/constants.jsx` (colors, shadows, font) · `src/components/shared.jsx` (Badge, Btn, GlobalNav, Footer)

---

## Color Tokens (`C.*`)

### Brand Purple
| Token | Value | Usage |
|---|---|---|
| `C.purple` | `#6E4BFF` | Primary CTA, active states, key icons, borders |
| `C.purpleHover` | `#5B36F0` | Btn hover |
| `C.purpleDeep` | `#3d2ab0` | Deep accent (rarely used) |
| `C.purpleLight` | `#c4b5fd` | Ghost btn border |
| `C.purpleBg` | `rgba(110,75,255,0.07)` | Subtle purple tint on hover / badge bg |

### Text & Navy
| Token | Value | Usage |
|---|---|---|
| `C.navy` | `#1B1140` | Headings, primary text (light bg) |
| `C.label` | `#3d3560` | Section labels, strong body |
| `C.body` | `#5B5478` | Secondary body text |
| `C.brandDark` | `#1c1e54` | Dark nav / footer bg |
| `C.white` | `#ffffff` | Inverse text, card bg |

### Semantic
| Token | Value | Usage |
|---|---|---|
| `C.success` | `#15be53` | Completed badge icon, positive bars |
| `C.successText` | `#108c3d` | Text on success bg |
| `C.successBg` | `rgba(21,190,83,0.18)` | Success badge bg |
| `C.successBorder` | `rgba(21,190,83,0.4)` | Success badge border |
| `C.ruby` | `#ea2261` | Errors, negative sentiment, destructive |
| `C.magenta` | `#f96bee` | Gradient accent (logo, header bar) |

### Background & Border
| Token | Value | Usage |
|---|---|---|
| `C.bg` | `#f8fafc` | Page background |
| `C.border` | `#e5edf5` | Card borders, dividers |
| `C.interviewBg` | `#07081a` | Full-screen interview dark bg |

---

## Dark Theme (ReportScreen)

Used inline in `ReportScreen.jsx` via a local `dk` object — not a global token.

| Key | Value | Usage |
|---|---|---|
| `dk.bg` | `#111827` | Page bg |
| `dk.card` | `#1a2236` | Card surface |
| `dk.border` | `rgba(255,255,255,0.08)` | Dividers |
| `dk.text` | `#e2e8f0` | Primary text |
| `dk.label` | `rgba(255,255,255,0.55)` | Labels |
| `dk.muted` | `rgba(255,255,255,0.35)` | Muted / secondary |

Dark theme badge overrides (apply via `style` prop on `<Badge>`):
- **진행 중 (in-progress):** `background: rgba(251,191,36,0.15)`, `color: #fbbf24`, `border: 1px solid rgba(251,191,36,0.3)`

---

## Shadows (`S.*`)

All card borders are border-only (no shadow by default).

| Token | Value | Usage |
|---|---|---|
| `S.elevated` | `none` | Static cards |
| `S.standard` | `none` | Default card |
| `S.ambient` | `none` | Toggle active |
| `S.card` | `0 4px 16px rgba(6,27,49,0.1)` | Hover/lift state |
| `S.float` | `0 8px 24px rgba(6,27,49,0.12), 0 2px 8px rgba(6,27,49,0.05)` | Modals, dropdowns |
| `S.lift` | `0 4px 16px rgba(6,27,49,0.1)` | Lifted card alias |

Pricing card hover glow: `0 16px 48px rgba(83,58,253,0.28)` (one-off, not tokenized)

---

## Typography

| Token | Value |
|---|---|
| `F` | `'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif` |

Font feature: `fontFeatureSettings: '"ss01"'` on all buttons and page roots.

---

## Badge Variants

```jsx
<Badge variant="neutral" />   // bg: #f8fafc, text: #1B1140
<Badge variant="purple" />    // bg: rgba(0,113,227,0.08), text: #6E4BFF
<Badge variant="success" />   // bg: rgba(29,125,58,0.08), text: #108c3d
<Badge variant="negative" />  // bg: rgba(217,48,37,0.08), text: #ea2261
<Badge variant="warning" />   // bg: #fef3c7, text: #92400e  ← light bg only
<Badge variant="dark" />      // bg: rgba(255,255,255,0.12), text: rgba(255,255,255,0.7)  ← dark bg
```

> `warning` variant is for light backgrounds only. On dark backgrounds use the inline override above.

---

## Button Variants

```jsx
<Btn variant="primary" />   // bg: #6E4BFF → #5B36F0 hover, white text
<Btn variant="ghost" />     // transparent → purpleBg hover, purple text, purpleLight border
<Btn variant="dark" />      // bg: #1c1e54 → #2a2d6a hover, white text
<Btn variant="white" />     // bg: white, navy text
<Btn variant="kakao" />     // #FEE500, dark text
<Btn variant="naver" />     // #03C75A, white text
<Btn variant="toss" />      // #0064FF, white text
<Btn variant="stripe" />    // #635bff, white text
```

Sizes: `sm` (5/14px pad, 13px font) · `md` (9/20px pad, 15px font) · `lg` (13/32px pad, 16px font)

Disabled state: `background: #a09de8` (washed purple), `cursor: not-allowed`

---

## Key Color Rules

1. **Purple is the only brand action color.** No blue (`#1a73e8`) in UI — use `C.purple` instead.
2. **`C.navy` for headings on white.** Never use raw black (`#000`).
3. **`C.ruby` for errors/destructive only.** Not for warnings.
4. **Dark screens use `dk.*` local tokens**, not global `C.*` text colors.
5. **Borders: `C.border` (`#e5edf5`) on light, `rgba(255,255,255,0.08)` on dark.**
6. **No box shadows on static cards** — hover only via `S.card`.
7. **Gradient accent:** `linear-gradient(90deg, #6E4BFF, #f96bee)` — header bars, logo mark.
