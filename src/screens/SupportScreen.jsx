import { useState } from "react";
import { C, S, F, Ic } from "../lib/constants.jsx";
import { Btn, Input, GlobalNav } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function SupportScreen({ go, user, logout }) {
  const isMobile = useIsMobile();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const categories = ["서비스 이용 문의", "결제 / 환불", "패널 리워드", "계정 / 로그인", "기술 오류 신고", "제휴 / 파트너십", "기타"];

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
        <GlobalNav go={go} activeTab="support" variant={user ? "app" : "public"} user={user} logout={logout} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.successBg, border: `1px solid ${C.successBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              {Ic.Check({s:24,c:C.success})}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, letterSpacing: "0.16px", marginBottom: 10 }}>문의가 접수되었습니다</div>
            <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 28 }}>
              입력하신 이메일로 영업일 1~2일 내에 답변 드리겠습니다.<br />
              빠른 답변이 필요하시면 <span style={{ color: C.purple }}>voica.support@gmail.com</span>로 직접 연락해 주세요.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Btn onClick={() => go(user ? "dashboard" : "landing")}>{user ? "대시보드로 돌아가기" : "홈으로 돌아가기"}</Btn>
              {!user && <Btn variant="ghost" onClick={() => go("panel_board")}>인터뷰 참여하기</Btn>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      <GlobalNav go={go} activeTab="support" variant={user ? "app" : "public"} user={user} logout={logout} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>고객센터</div>
            <div style={{ fontSize: 14, color: C.body }}>문의 사항을 남겨주시면 영업일 1~2일 내 이메일로 답변 드립니다.</div>
          </div>

          {/* FAQ 빠른 링크 */}
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.navy, marginBottom: 2 }}>자주 묻는 질문</div>
              <div style={{ fontSize: 12, color: C.body }}>빠른 답변이 필요하신가요?</div>
            </div>
            <Btn size="sm" onClick={() => go("faq")}>FAQ 보기</Btn>
          </div>

          {/* Form */}
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: isMobile ? "20px 20px" : "28px 28px", boxShadow: S.ambient }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* 카테고리 */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.label, marginBottom: 8 }}>문의 유형 <span style={{ color: C.ruby }}>*</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {categories.map(c => {
                    const active = category === c;
                    return (
                      <button key={c} onClick={() => setCategory(c)}
                        style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? C.purple : C.border}`, background: active ? C.purpleBg : C.white, color: active ? C.purple : C.body, fontSize: 12, fontFamily: F, cursor: "pointer", transition: "all 0.15s", fontWeight: active ? 500 : 400 }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 이메일 */}
              <Input label={<>답변받을 이메일 <span style={{ color: C.ruby }}>*</span></>} type="email" placeholder="hello@example.com" value={email} onChange={e => setEmail(e.target.value)} />

              {/* 제목 */}
              <Input label={<>제목 <span style={{ color: C.ruby }}>*</span></>} placeholder="문의 제목을 입력해주세요" value={subject} onChange={e => setSubject(e.target.value)} />

              {/* 내용 */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.label, display: "block", marginBottom: 6 }}>
                  문의 내용 <span style={{ color: C.ruby }}>*</span>
                </label>
                <textarea
                  placeholder="문의 내용을 자세히 적어주세요. 스크린샷이나 오류 메시지가 있다면 함께 설명해 주시면 빠른 답변에 도움이 됩니다."
                  value={body} onChange={e => setBody(e.target.value)}
                  rows={7}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: F, color: C.navy, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6, transition: "border-color 0.15s" }}
                  onFocus={e => e.target.style.borderColor = C.purple}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                <div style={{ fontSize: 11, color: C.body, marginTop: 4, textAlign: "right" }}>{body.length} 자</div>
              </div>
            </div>

            <Btn full size="lg" style={{ marginTop: 24 }}
              disabled={!category || !email || !subject || !body}
              onClick={() => setSent(true)}>
              문의 보내기
            </Btn>

            <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
              또는 직접 이메일: <a href="mailto:voica.support@gmail.com" style={{ color: C.purple }}>voica.support@gmail.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
