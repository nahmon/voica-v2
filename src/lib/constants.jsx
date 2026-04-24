// ─── Design Tokens ───
export const C = {
  purple: "#6E4BFF", purpleHover: "#5B36F0", purpleDeep: "#3d2ab0",
  purpleLight: "#c4b5fd", purpleBg: "rgba(110,75,255,0.07)",
  navy: "#1B1140", label: "#3d3560", body: "#5B5478",
  white: "#ffffff", brandDark: "#1c1e54", border: "#e5edf5",
  success: "#15be53", successText: "#108c3d",
  successBg: "rgba(21,190,83,0.18)", successBorder: "rgba(21,190,83,0.4)",
  ruby: "#ea2261", magenta: "#f96bee", bg: "#f8fafc",
  interviewBg: "#07081a",
};
export const S = {
  // Static cards — border only, no shadow (set to none)
  elevated: "none",
  standard: "none",
  ambient:  "none",
  deep:     "none",
  // Hover / lift state — apply on mouseEnter
  card:     "0 4px 16px rgba(6,27,49,0.1)",
  // Floating UI (modals, tooltips, dropdowns)
  float:    "0 8px 24px rgba(6,27,49,0.12), 0 2px 8px rgba(6,27,49,0.05)",
  // Semantic aliases
  lift:     "0 4px 16px rgba(6,27,49,0.1)",
};
export const F = `'Pretendard',-apple-system,BlinkMacSystemFont,sans-serif`;

// ─── Icon System — Stripe-style line icons ───
export const Ic = {
  Mic:       (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="1" width="6" height="11" rx="3"/><path d="M3.5 10a6.5 6.5 0 0013 0"/><line x1="10" y1="16.5" x2="10" y2="19"/><line x1="7" y1="19" x2="13" y2="19"/></svg>,
  Stop:      (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill={p.c||"currentColor"}><rect x="4" y="4" width="12" height="12" rx="2.5"/></svg>,
  Target:    (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r="1.5" fill={p.c||"currentColor"} stroke="none"/></svg>,
  Pencil:    (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 3.5l2 2L7 15H5v-2L14.5 3.5z"/></svg>,
  Users:     (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="3"/><path d="M1 17a6 6 0 0112 0"/><path d="M13.5 4.5a3 3 0 010 6"/><path d="M17 17a5 5 0 00-3.5-4.75"/></svg>,
  Sparkle:   (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill={p.c||"currentColor"}><path d="M10 2l1.6 5.4L17 9l-5.4 1.6L10 16l-1.6-5.4L3 9l5.4-1.6z"/></svg>,
  BarChart:  (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="12" width="4" height="6" rx="1"/><rect x="8" y="7" width="4" height="11" rx="1"/><rect x="14" y="3" width="4" height="15" rx="1"/></svg>,
  Search:    (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round"><circle cx="9" cy="9" r="6"/><line x1="13.5" y1="13.5" x2="17.5" y2="17.5"/></svg>,
  Check:     (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4L16 6"/></svg>,
  Gift:      (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="9" width="16" height="9" rx="1.5"/><line x1="2" y1="13" x2="18" y2="13"/><line x1="10" y1="9" x2="10" y2="18"/><path d="M7 9c-1.5 0-2.5-1-2.5-2.5S5.5 4 7 4c1.5 0 2.5 2 3 5-0.5 0-2.5 0-3 0z"/><path d="M13 9c1.5 0 2.5-1 2.5-2.5S14.5 4 13 4c-1.5 0-2.5 2-3 5 .5 0 2.5 0 3 0z"/></svg>,
  Clip:      (p={}) => <svg width={p.s||14} height={p.s||14} viewBox="0 0 14 14" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.4" strokeLinecap="round"><path d="M11.5 6L6 11.5a3.5 3.5 0 01-5-5L7 1A2 2 0 0110 4L4 10a.5.5 0 01-.7-.7L8.5 4"/></svg>,
  Warning:   (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2.5L18 17H2L10 2.5z"/><line x1="10" y1="9" x2="10" y2="12.5"/><circle cx="10" cy="15" r="0.75" fill={p.c||"currentColor"} stroke="none"/></svg>,
  CheckCircle:(p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><path d="M6.5 10.5l2.5 2.5 4.5-5"/></svg>,
  RecDot:    (p={}) => <svg width={p.s||8} height={p.s||8} viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={p.c||"currentColor"}/></svg>,
  Chat:      (p={}) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 16 16" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 7.5A6 6 0 012 7.5c0-3.3 2.7-6 6-6s6 2.7 6 6z"/><path d="M2 7.5L1 13l5-2"/></svg>,
  Coin:      (p={}) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 16 16" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M6 10.5h3a1.5 1.5 0 000-3H7a1.5 1.5 0 010-3h3"/><line x1="8" y1="4" x2="8" y2="5.5"/><line x1="8" y1="10.5" x2="8" y2="12"/></svg>,
  ArrowUp:   (p={}) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 16 16" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="13" x2="8" y2="3"/><path d="M4 7l4-4 4 4"/></svg>,
  Star:      (p={}) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 16 16" fill={p.c||"currentColor"}><path d="M8 1.5l1.6 4.2H14L10.2 8.5l1.4 4.3L8 10.2 4.4 12.8l1.4-4.3L2 5.7h4.4z"/></svg>,
  ChevronDown:(p={}) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 16 16" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4"/></svg>,
  ShoppingCart:(p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1h3l2.5 9h9l1.8-7H5.5"/><circle cx="8.5" cy="17" r="1.5" fill={p.c||"currentColor"} stroke="none"/><circle cx="14.5" cy="17" r="1.5" fill={p.c||"currentColor"} stroke="none"/></svg>,
  Phone:     (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="1" width="10" height="18" rx="2.5"/><circle cx="10" cy="15.5" r="0.75" fill={p.c||"currentColor"} stroke="none"/></svg>,
  Globe:     (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><line x1="2" y1="10" x2="18" y2="10"/><path d="M10 2c-2.5 3-3.5 5-3.5 8s1 5 3.5 8"/><path d="M10 2c2.5 3 3.5 5 3.5 8s-1 5-3.5 8"/></svg>,
  Map:       (p={}) => <svg width={p.s||20} height={p.s||20} viewBox="0 0 20 20" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5l5.5-2 5 2 5.5-2v13l-5.5 2-5-2-5.5 2V5z"/><line x1="7.5" y1="3" x2="7.5" y2="16"/><line x1="12.5" y1="5" x2="12.5" y2="18"/></svg>,
  X:         (p={}) => <svg width={p.s||16} height={p.s||16} viewBox="0 0 16 16" fill="none" stroke={p.c||"currentColor"} strokeWidth="1.65" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>,

  // ── Stripe-style illustrated use-case icons (2-color filled) ──
  Package:      (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><path d="M4 8.5v7.5L12 21V13.5L4 8.5z" fill={p.c2||"#a5b4fc"}/><path d="M20 8.5v7.5L12 21V13.5L20 8.5z" fill={p.c2||"#a5b4fc"} opacity="0.65"/><path d="M12 3 4 8.5l8 5 8-5L12 3z" fill={p.c||"#4f46e5"}/><line x1="8.5" y1="5.5" x2="16.5" y2="10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Palette:      (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3.5 4.5 5.5 4.5.8 0 1.5.7 1.5 1.5 0 2.5 1.5 4 3 4 5.5 0 10-4.5 10-10S17.5 2 12 2z" fill={p.c2||"#a5b4fc"}/><circle cx="8" cy="10" r="2" fill={p.c||"#4f46e5"}/><circle cx="12" cy="6.5" r="2" fill={p.c||"#4f46e5"}/><circle cx="16" cy="10" r="2" fill={p.c||"#4f46e5"}/><circle cx="16" cy="14.5" r="2" fill={p.c||"#4f46e5"}/></svg>,
  MessageSquare:(p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="15" rx="3" fill={p.c2||"#a5b4fc"}/><path d="M5 18L2 22.5V18H5z" fill={p.c2||"#a5b4fc"}/><rect x="6" y="8.5" width="12" height="2.5" rx="1.25" fill={p.c||"#4f46e5"}/><rect x="6" y="13" width="7" height="2" rx="1" fill={p.c||"#4f46e5"}/></svg>,
  Layers:       (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><path d="M3 15.5L12 20 21 15.5v-2L12 18 3 13.5v2z" fill={p.c2||"#a5b4fc"} opacity="0.5"/><path d="M3 11.5L12 16 21 11.5v-2L12 14 3 9.5v2z" fill={p.c2||"#a5b4fc"}/><path d="M12 4L3 8.5 12 13 21 8.5 12 4z" fill={p.c||"#4f46e5"}/></svg>,
  Monitor:      (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2.5" fill={p.c2||"#a5b4fc"}/><rect x="2" y="3" width="20" height="6" rx="2.5" fill={p.c||"#4f46e5"}/><circle cx="5.5" cy="6" r="1.1" fill="white"/><circle cx="8.5" cy="6" r="1.1" fill="white"/><rect x="10.5" y="5.25" width="8" height="1.5" rx="0.75" fill="white" opacity="0.45"/><line x1="12" y1="17" x2="12" y2="20" stroke={p.c2||"#a5b4fc"} strokeWidth="2" strokeLinecap="round"/><rect x="8" y="20" width="8" height="2" rx="1" fill={p.c||"#4f46e5"}/></svg>,
  Smartphone:   (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><rect x="6" y="2" width="12" height="20" rx="3.5" fill={p.c2||"#a5b4fc"}/><rect x="6" y="2" width="12" height="6.5" rx="3.5" fill={p.c||"#4f46e5"}/><rect x="6" y="8" width="12" height="0.5" fill={p.c||"#4f46e5"}/><rect x="9" y="4.5" width="6" height="1.5" rx="0.75" fill="white" opacity="0.5"/><circle cx="12" cy="19.5" r="1.75" fill={p.c||"#4f46e5"}/></svg>,
  Bot:          (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="13" rx="3" fill={p.c2||"#a5b4fc"}/><circle cx="9" cy="13.5" r="2.5" fill={p.c||"#6E4BFF"}/><circle cx="15" cy="13.5" r="2.5" fill={p.c||"#6E4BFF"}/><rect x="9.5" y="17.5" width="5" height="2" rx="1" fill={p.c||"#6E4BFF"}/><rect x="10.5" y="5.5" width="3" height="2.5" rx="1" fill={p.c2||"#c4b5fd"}/><circle cx="12" cy="4.5" r="2" fill={p.c||"#6E4BFF"}/><rect x="0.5" y="12" width="2.5" height="5" rx="1.25" fill={p.c2||"#c4b5fd"}/><rect x="21" y="12" width="2.5" height="5" rx="1.25" fill={p.c2||"#c4b5fd"}/></svg>,
  Sliders:      (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><rect x="2" y="5.5" width="20" height="2.5" rx="1.25" fill={p.c2||"#a5b4fc"}/><rect x="2" y="11" width="20" height="2.5" rx="1.25" fill={p.c2||"#a5b4fc"}/><rect x="2" y="16.5" width="20" height="2.5" rx="1.25" fill={p.c2||"#a5b4fc"}/><circle cx="8.5" cy="6.75" r="3.5" fill={p.c||"#4f46e5"}/><circle cx="15.5" cy="12.25" r="3.5" fill={p.c||"#4f46e5"}/><circle cx="10" cy="17.75" r="3.5" fill={p.c||"#4f46e5"}/></svg>,
  Award:        (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="7.5" fill={p.c2||"#a5b4fc"}/><path d="M8 16L6.5 22l5.5-2.5L17.5 22 16 16" fill={p.c2||"#a5b4fc"}/><circle cx="12" cy="9" r="4.5" fill={p.c||"#4f46e5"}/><path d="M12 6.5l1 2.5 2.5.5-1.8 1.8.5 2.7L12 12.7 9.8 14l.5-2.7L8.5 9.5l2.5-.5z" fill="white"/></svg>,
  Route:        (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><path d="M4 19C4 14 8 6 12 6S20 14 20 19" stroke={p.c2||"#a5b4fc"} strokeWidth="3.5" strokeLinecap="round"/><circle cx="4" cy="19" r="3" fill={p.c||"#4f46e5"}/><circle cx="12" cy="6" r="3" fill={p.c||"#4f46e5"}/><circle cx="20" cy="19" r="3" fill={p.c||"#4f46e5"}/></svg>,
  PieChart:     (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" fill={p.c2||"#a5b4fc"}/><path d="M12 2.5v9.5h9.5A9.5 9.5 0 0012 2.5z" fill={p.c||"#4f46e5"}/><path d="M12 12v9.5a9.5 9.5 0 01-6.7-2.8L12 12z" fill={p.c||"#4f46e5"} opacity="0.65"/></svg>,
  Heart:        (p={}) => <svg width={p.s||24} height={p.s||24} viewBox="0 0 24 24" fill="none"><path d="M12 21C7 17.5 3 13.5 3 9A5.5 5.5 0 0112 6a5.5 5.5 0 019 3c0 4.5-4 8.5-9 12z" fill={p.c2||"#a5b4fc"}/><path d="M12 18C9.5 16 8 14 8 11.5A4 4 0 0112 9a4 4 0 014 2.5C16 14 14.5 16 12 18z" fill={p.c||"#4f46e5"}/></svg>,
};
