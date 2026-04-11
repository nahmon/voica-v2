// ─── Design Tokens ───
export const C = {
  purple: "#533afd", purpleHover: "#4434d4", purpleDeep: "#2e2b8c",
  purpleLight: "#b9b9f9", purpleBg: "rgba(83,58,253,0.05)",
  navy: "#061b31", label: "#273951", body: "#64748d",
  white: "#ffffff", brandDark: "#1c1e54", border: "#e5edf5",
  success: "#15be53", successText: "#108c3d",
  successBg: "rgba(21,190,83,0.18)", successBorder: "rgba(21,190,83,0.4)",
  ruby: "#ea2261", magenta: "#f96bee", bg: "#f8fafc",
  interviewBg: "#07081a",
};
export const S = {
  elevated: "rgba(50,50,93,0.25) 0px 30px 45px -30px,rgba(0,0,0,0.1) 0px 18px 36px -18px",
  standard: "rgba(23,23,23,0.08) 0px 15px 35px 0px",
  ambient: "rgba(23,23,23,0.06) 0px 3px 6px",
  deep: "rgba(3,3,39,0.25) 0px 14px 21px -14px,rgba(0,0,0,0.1) 0px 8px 17px -8px",
  card: "rgba(23,23,23,0.08) 0px 15px 35px 0px",
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
};
