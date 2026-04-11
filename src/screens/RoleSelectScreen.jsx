import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";

export default function RoleSelectScreen({ go, user }) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (role) => {
    setLoading(true);
    await supabase.auth.updateUser({ data: { role } });
    setLoading(false);
    if (role === "researcher") go("dashboard");
    else go("panel_entry");
  };

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: F, padding: 24 }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
          <span style={{ color: C.purple }}>Vo</span>ica
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
          {name ? `${name}님, 어떻게 이용하실 건가요?` : "어떻게 이용하실 건가요?"}
        </div>
        <div style={{ fontSize: 14, color: C.body }}>역할에 맞는 화면으로 이동해요</div>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 560 }}>
        {/* Researcher */}
        <button
          onClick={() => !loading && handleSelect("researcher")}
          disabled={loading}
          style={{ flex: 1, minWidth: 220, maxWidth: 260, background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: "36px 28px", cursor: "pointer", textAlign: "left", transition: "all 0.18s", fontFamily: F }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.boxShadow = "0 8px 32px rgba(83,58,253,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            {Ic.BarChart({ s: 24, c: C.purple })}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>리서처 / 기업</div>
          <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6, marginBottom: 20 }}>
            인터뷰를 설계하고 AI가 진행한 결과를 리포트로 받아요.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["인터뷰 질문 설계", "공유 링크 생성", "AI 리포트 자동 생성"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.success, fontSize: 11 }}>✓</span>
                <span style={{ fontSize: 12, color: C.body }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, fontSize: 14, fontWeight: 600, color: C.purple }}>
            {loading ? "이동 중..." : "리서처로 시작할게요 →"}
          </div>
        </button>

        {/* Panel */}
        <button
          onClick={() => !loading && handleSelect("panel")}
          disabled={loading}
          style={{ flex: 1, minWidth: 220, maxWidth: 260, background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: "36px 28px", cursor: "pointer", textAlign: "left", transition: "all 0.18s", fontFamily: F }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.success; e.currentTarget.style.boxShadow = "0 8px 32px rgba(21,190,83,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(21,190,83,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            {Ic.Mic({ s: 24, c: C.success })}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Voica 패널</div>
          <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6, marginBottom: 20 }}>
            보이스 인터뷰에 참여하고 리워드를 받아요. 8분 참여로 수입을 만들 수 있어요.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["인터뷰 참여 · 리워드 수령", "시간 · 장소 자유", "투잡 · 부업 가능"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.success, fontSize: 11 }}>✓</span>
                <span style={{ fontSize: 12, color: C.body }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, fontSize: 14, fontWeight: 600, color: C.success }}>
            {loading ? "이동 중..." : "패널로 참여할게요 →"}
          </div>
        </button>
      </div>

      <div style={{ marginTop: 32, fontSize: 12, color: C.body }}>
        역할은 나중에 고객센터에서 변경할 수 있어요
      </div>
    </div>
  );
}
