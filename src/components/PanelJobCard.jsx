import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";

const BRAND_COLOR = { accent: C.purple, bg: C.purpleBg, text: C.purple };

function getCategoryColor() {
  return BRAND_COLOR;
}

// ─── Company avatar ───
function CompanyAvatar({ company, category }) {
  const { accent, bg } = getCategoryColor(category);
  const initials = (company || "?")
    .replace(/[^가-힣A-Za-z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: bg, border: `1.5px solid ${accent}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: "-0.5px" }}>
        {initials}
      </span>
    </div>
  );
}

// ─── Method / location meta chip ───
function MetaChip({ label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 11, padding: "2px 8px", borderRadius: 6,
      background: "rgba(0,0,0,0.04)", color: C.body,
      border: "1px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─── MatchBadge ───
export function MatchBadge({ score, isKo }) {
  const pct = Math.min(100, Math.round((score / 8) * 100));
  let color, bg;
  if (pct >= 70) { color = C.successText; bg = C.successBg; }
  else if (pct >= 40) { color = "#92650a"; bg = "rgba(251,191,36,0.12)"; }
  else { color = C.body; bg = "rgba(0,0,0,0.05)"; }
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color, background: bg,
      padding: "2px 8px", borderRadius: 6, flexShrink: 0,
    }}>
      {isKo ? `${pct}% 일치` : `${pct}% match`}
    </span>
  );
}

// ─── PanelJobCard ───
function DetailSection({ job, isKo, catColor }) {
  const tp = job.targetProfile;
  const rows = tp ? [
    { label: isKo ? "연령" : "Age", value: tp.age },
    { label: isKo ? "성별" : "Gender", value: isKo ? (tp.gender === "Any" ? "무관" : tp.gender === "Female" ? "여성" : tp.gender === "Male" ? "남성" : tp.gender) : tp.gender },
    { label: isKo ? "지역" : "Region", value: tp.region },
    { label: isKo ? "해당하는 분" : "Who fits", value: tp.lifestyle },
    tp.exclude && { label: isKo ? "참여 불가" : "Excluded", value: tp.exclude, isExclude: true },
  ].filter(Boolean) : [];

  return (
    <div style={{
      borderTop: `1px solid ${C.border}`,
      marginTop: 14,
      paddingTop: 16,
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      {/* Full description */}
      {job.description && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: catColor.text, marginBottom: 7, letterSpacing: 0.3, textTransform: "uppercase" }}>
            {isKo ? "인터뷰 개요" : "About this interview"}
          </div>
          <p style={{ fontSize: 13, color: C.navy, lineHeight: 1.72, margin: 0 }}>
            {job.description}
          </p>
        </div>
      )}

      {/* Target profile */}
      {rows.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: catColor.text, marginBottom: 9, letterSpacing: 0.3, textTransform: "uppercase" }}>
            {isKo ? "모집 대상" : "Who we're looking for"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {rows.map(r => (
              <div key={r.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.body, marginBottom: 1 }}>{r.label}</div>
                  <div style={{ fontSize: 13, color: r.isExclude ? "#dc2626" : C.navy, lineHeight: 1.5 }}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PanelJobCard({ job, status, isRecommended, isMobile, isKo, onApply, onView, go }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const remaining = job.total - job.filled;
  const fillPct = Math.round((job.filled / job.total) * 100);
  const isConfirmed = status === "confirmed";
  const isApplied = status !== "none";
  const isUrgent = job.urgent || remaining <= 10;
  const catColor = getCategoryColor(job.category);

  // Method meta: voice/video/text
  const methodLabel = (() => {
    const m = job.method;
    if (!m) return isKo ? "AI 인터뷰" : "AI Interview";
    if (m === "voice" || m === "audio") return isKo ? "음성" : "Voice";
    if (m === "video") return isKo ? "영상" : "Video";
    if (m === "text") return isKo ? "텍스트" : "Text";
    return m;
  })();

  const locationLabel = (() => {
    const l = job.location;
    if (!l || l === "online") return isKo ? "온라인" : "Online";
    if (l === "offline") return isKo ? "오프라인" : "Offline";
    return l;
  })();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: isRecommended
          ? `1.5px solid ${catColor.accent}40`
          : `1px solid ${C.border}`,
        overflow: "hidden",
        transition: "transform 0.18s ease-out, box-shadow 0.18s ease-out",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 8px 24px rgba(6,27,49,0.1), 0 2px 8px rgba(6,27,49,0.06)`
          : "none",
      }}
    >
      <div style={{ padding: isMobile ? "14px 16px" : "18px 22px" }}>

        {/* Header row: avatar + company + badges / reward */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0, paddingRight: 10 }}>
            <CompanyAvatar company={job.company} category={job.category} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.body, whiteSpace: "nowrap" }}>{job.company}</span>
                {isUrgent && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.body, background: "rgba(0,0,0,0.06)", padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap" }}>
                    {isKo ? "마감 임박" : "Closing soon"}
                  </span>
                )}
                {isRecommended && !isUrgent && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: catColor.text, background: catColor.bg, padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap" }}>
                    {isKo ? "추천" : "Matched"}
                  </span>
                )}
              </div>
              {/* Category label */}
              {job.category && (
                <span style={{ fontSize: 11, color: catColor.text, fontWeight: 500 }}>{job.category}</span>
              )}
            </div>
          </div>

          {/* Reward */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
              <span style={{ fontSize: isMobile ? 17 : 19, fontWeight: 800, color: catColor.accent, lineHeight: 1 }}>
                {job.reward}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.body, marginTop: 3, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={C.body} strokeWidth="1.4" strokeLinecap="round">
                <circle cx="5" cy="5" r="4"/><path d="M5 3v2l1.5 1.5"/>
              </svg>
              {job.duration}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: C.navy, lineHeight: 1.4, marginBottom: 6, wordBreak: "keep-all", overflowWrap: "break-word" }}>
          {job.title}
        </div>

        {/* Description */}
        {job.description && (
          <p style={{
            fontSize: 13, color: C.body, lineHeight: 1.65, margin: "0 0 10px",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {job.description}
          </p>
        )}

        {/* Meta row: method + location + duration */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          <MetaChip label={methodLabel} />
          <MetaChip label={locationLabel} />
          {job.duration && <MetaChip label={job.duration} />}
        </div>

        {/* Conditions + deadline chips */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {(job.conditions ?? []).map(c => (
            <span key={c} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(0,0,0,0.04)", color: C.navy, fontWeight: 500, border: "1px solid rgba(0,0,0,0.06)" }}>{c}</span>
          ))}
          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(0,0,0,0.04)", color: C.body, border: "1px solid rgba(0,0,0,0.06)" }}>~{job.deadline}</span>
        </div>

        {/* Match + fill row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, minWidth: 0 }}>
          <MatchBadge score={job._matchScore} isKo={isKo} />
          <div style={{ flex: 1, minWidth: 0, height: 5, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2, width: `${fillPct}%`,
              background: catColor.accent,
              transition: "width 0.3s",
            }} />
          </div>
          <span style={{ fontSize: 11, color: C.body, fontWeight: 400, whiteSpace: "nowrap", flexShrink: 0 }}>
            {isKo ? `${remaining}자리 남음` : `${remaining} left`}
          </span>
        </div>

        {/* Expand / collapse toggle */}
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: catColor.text,
            fontFamily: F, padding: "10px 0", marginBottom: 2,
            minHeight: 44,
          }}
        >
          <span style={{
            display: "inline-block",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            fontSize: 10,
          }}>▼</span>
          {expanded
            ? (isKo ? "접기" : "Hide details")
            : (isKo ? "상세 모집 내용 보기" : "View details")}
        </button>

        {/* Expanded detail section */}
        {expanded && <DetailSection job={job} isKo={isKo} catColor={catColor} />}

        {/* CTA */}
        <div style={{ marginTop: expanded ? 16 : 0 }}>
        {isConfirmed ? (
          <ConfirmedCTA isKo={isKo} go={go} catColor={catColor} />
        ) : isApplied ? (
          <AppliedProgress status={status} isKo={isKo} catColor={catColor} />
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onApply(); }}
            style={{ width: "100%", padding: "11px 14px", minHeight: 44, borderRadius: 8, border: "none", background: catColor.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "opacity 0.12s" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {isKo ? "지원하기 " : "Apply Now "}<span>→</span>
          </button>
        )}
        </div>

      </div>
    </div>
  );
}

// ─── Confirmed CTA ───
function ConfirmedCTA({ isKo, go, catColor }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <div style={{
        flex: 1, minWidth: 180, padding: "10px 14px",
        background: "rgba(22,163,74,0.07)", borderRadius: 8,
        border: "1px solid rgba(22,163,74,0.2)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(22,163,74,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {Ic.CheckCircle({ s: 16, c: "#16a34a" })}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d", lineHeight: 1.2 }}>
            {isKo ? "참여 확정됐어요!" : "You're confirmed!"}
          </div>
          <div style={{ fontSize: 11, color: "#16a34a", marginTop: 1 }}>
            {isKo ? "인터뷰를 시작해 보세요" : "Ready to start your interview"}
          </div>
        </div>
      </div>
      <button
        onClick={() => go("consent")}
        style={{
          padding: "10px 20px", minHeight: 44, background: catColor.accent, color: "#fff",
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: F, whiteSpace: "nowrap",
        }}
      >
        {isKo ? "시작하기 →" : "Start →"}
      </button>
    </div>
  );
}

// ─── Applied progress stepper ───
function AppliedProgress({ status, isKo, catColor }) {
  const steps = isKo
    ? ["지원 완료", "AI 심사중", "확정 대기"]
    : ["Applied", "AI Review", "Confirming"];
  const stepIdx = status === "applied" ? 1 : 2;

  return (
    <div style={{
      padding: "12px 14px",
      background: `${catColor.accent}08`,
      borderRadius: 8,
      border: `1px solid ${catColor.accent}18`,
    }}>
      <div style={{ fontSize: 11, color: catColor.text, fontWeight: 600, marginBottom: 10 }}>
        {isKo ? "지원 현황" : "Application status"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {steps.map((label, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  background: done
                    ? catColor.accent
                    : active
                      ? catColor.bg
                      : "rgba(0,0,0,0.06)",
                  border: active ? `2px solid ${catColor.accent}` : "2px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: done ? "#fff" : active ? catColor.accent : C.body,
                  fontWeight: 700, transition: "all 0.2s",
                }}>
                  {done ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? catColor.accent : done ? catColor.text : C.body,
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: 2,
                  background: done ? catColor.accent : "rgba(0,0,0,0.08)",
                  margin: "0 4px", marginBottom: 14, borderRadius: 1,
                  transition: "background 0.2s",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PanelJobCard;
