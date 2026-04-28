import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { FAQ_DATA, FAQ_DATA_KO } from "../lib/mockData.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function FAQScreen({ go, user, logout, lang = "ko", onLangChange }) {
  const [openIdx, setOpenIdx] = useState(null);
  const isMobile = useIsMobile();
  const isKo = lang === "ko";
  const data = isKo ? FAQ_DATA_KO : FAQ_DATA;

  const toggle = (key) => setOpenIdx(prev => prev === key ? null : key);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      <GlobalNav go={go} activeTab="faq" variant={user ? "app" : "public"} user={user} logout={logout} lang={lang} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: isMobile ? "20px 16px 32px" : "32px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 640 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>
              {isKo ? "자주 묻는 질문" : "Frequently Asked Questions"}
            </div>
            <div style={{ fontSize: 14, color: C.body }}>
              {isKo ? "찾는 내용이 없으세요? " : "Can't find what you're looking for? "}
              <button onClick={() => go("support")} style={{ color: C.purple, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 14, padding: 0, textDecoration: "underline" }}>
                {isKo ? "고객 지원 문의" : "Contact support"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {data.map((section, ci) => (
              <div key={ci}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.purple, letterSpacing: 0.2, marginBottom: 10, textTransform: "uppercase" }}>{section.category}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  {section.items.map((item, ii) => {
                    const key = `${ci}-${ii}`;
                    const open = openIdx === key;
                    return (
                      <div key={ii} style={{ background: C.white, borderBottom: ii < section.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <button
                          onClick={() => toggle(key)}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", fontFamily: F, textAlign: "left", gap: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: open ? C.purple : C.navy, lineHeight: 1.5, flex: 1 }}>Q. {item.q}</span>
                          <span style={{ color: open ? C.purple : C.body, fontSize: 18, lineHeight: 1, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                            {Ic.ChevronDown({s:18,c: open ? C.purple : C.body})}
                          </span>
                        </button>
                        {open && (
                          <div style={{ padding: "0 20px 18px 20px", fontSize: 13, color: C.body, lineHeight: 1.8, borderTop: `1px solid ${C.purpleBg}`, paddingTop: 14, background: C.purpleBg, whiteSpace: "pre-line" }}>
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
              {isKo ? "아직 궁금한 점이 있어요?" : "Still have questions?"}
            </div>
            <div style={{ fontSize: 13, color: C.body, marginBottom: 18 }}>
              {isKo ? "메시지를 보내주시면 1~2 영업일 내에 답변드려요." : "Send us a message and we'll get back to you within 1–2 business days."}
            </div>
            <Btn onClick={() => go("support")}>{isKo ? "고객 지원 문의" : "Contact support"}</Btn>
          </div>
        </div>
      </div>
      <Footer go={go} lang={lang} onLangChange={onLangChange} />
    </div>
  );
}
