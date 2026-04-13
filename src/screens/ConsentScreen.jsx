import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function ConsentScreen({ go, user, logout, shareCode }) {
  const isMobile = useIsMobile();
  const [agreed1, setAgreed1] = useState(false); // 필수 동의
  const [agreed2, setAgreed2] = useState(false); // 음성 녹음 동의
  const [agreed3, setAgreed3] = useState(false); // 선택 마케팅
  const [open, setOpen] = useState(null); // 펼쳐진 세부 항목

  const allRequired = agreed1 && agreed2;

  const toggle = (k) => setOpen(p => p === k ? null : k);

  const REQUIRED = [
    {
      id: "privacy",
      label: "개인정보 수집·이용 동의",
      required: true,
      checked: agreed1,
      setChecked: setAgreed1,
      detail: isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "수집 항목", value: "성명, 이메일, 음성 녹음 데이터, 발화 텍스트(STT)" },
            { label: "수집·이용 목적", value: "음성 인터뷰 진행 및 리서치 분석" },
            { label: "보유·이용 기간", value: "인터뷰 완료일로부터 1년, 이후 파기" },
          ].map(row => (
            <div key={row.label} style={{ background: "rgba(26,115,232,0.03)", borderRadius: 6, padding: "8px 10px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 3 }}>{row.label}</div>
              <div style={{ fontSize: 12, color: C.body, lineHeight: 1.6 }}>{row.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 420, fontSize: 12, borderCollapse: "collapse", lineHeight: 1.7 }}>
          <thead>
            <tr style={{ background: "rgba(26,115,232,0.05)" }}>
              {["수집 항목", "수집·이용 목적", "보유·이용 기간"].map(h => (
                <th key={h} style={{ padding: "6px 10px", fontWeight: 600, color: C.label, borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.body, verticalAlign: "top" }}>성명, 이메일, 음성 녹음 데이터, 발화 텍스트(STT)</td>
              <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.body, verticalAlign: "top" }}>음성 인터뷰 진행 및 리서치 분석</td>
              <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.body, verticalAlign: "top" }}>인터뷰 완료일로부터 1년, 이후 파기</td>
            </tr>
          </tbody>
        </table></div>
      ),
    },
    {
      id: "voice",
      label: "음성 녹음 및 AI 처리 동의",
      required: true,
      checked: agreed2,
      setChecked: setAgreed2,
      detail: (
        <div style={{ fontSize: 12, color: C.body, lineHeight: 1.8 }}>
          <p style={{ margin: "0 0 8px" }}>본 인터뷰는 <strong>음성으로 녹음</strong>됩니다. 수집된 음성은 다음과 같이 처리됩니다.</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>음성 데이터는 텍스트(STT)로 변환되어 AI 분석에 활용됩니다.</li>
            <li>음성-텍스트 변환은 OpenAI Whisper (OpenAI, LLC, 미국)를 통해 처리됩니다. API 이용약관에 따라 AI 학습에 사용되지 않습니다.</li>
            <li>전사(STT) 처리를 위해 음성 데이터가 미국 OpenAI 서버로 전송됩니다 (국외 이전).</li>
            <li>원본 음성 파일은 인터뷰 완료일로부터 1년 보관 후 파기됩니다.</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      <GlobalNav go={go} variant="panel" user={user} logout={logout} />

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 540 }}>
          {/* Title */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>인터뷰 참여 전 동의</div>
            <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7 }}>아래 내용을 확인하시고 동의 후 인터뷰를 시작해 주세요. 필수 항목에 동의하지 않으면 인터뷰 참여가 제한됩니다.</div>
          </div>

          {/* 녹음 안내 배너 */}
          <div style={{ background: "rgba(26,115,232,0.05)", border: `1px solid rgba(26,115,232,0.15)`, borderRadius: 8, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
            {Ic.Mic({s:18, c:C.purple})}
            <div style={{ fontSize: 13, color: C.purple, lineHeight: 1.6 }}>
              <strong>녹음 안내:</strong> 본 인터뷰는 음성으로 녹음됩니다. 조용한 환경에서 진행해 주세요.
            </div>
          </div>

          {/* 전체 동의 */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
            onClick={() => { const next = !(agreed1 && agreed2 && agreed3); setAgreed1(next); setAgreed2(next); setAgreed3(next); }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${agreed1 && agreed2 && agreed3 ? C.purple : C.border}`, background: agreed1 && agreed2 && agreed3 ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
              {agreed1 && agreed2 && agreed3 && Ic.Check({s:12,c:"white"})}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>전체 동의</span>
          </div>

          {/* 구분선 */}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0 12px" }} />

          {/* 필수 항목들 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            {REQUIRED.map(item => (
              <div key={item.id} style={{ background: C.white, border: `1px solid ${open === item.id ? "rgba(26,115,232,0.25)" : C.border}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.15s" }}>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${item.checked ? C.purple : C.border}`, background: item.checked ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}
                    onClick={() => item.setChecked(p => !p)}>
                    {item.checked && Ic.Check({s:12,c:"white"})}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: C.navy, cursor: "pointer" }} onClick={() => item.setChecked(p => !p)}>
                    {item.label}
                    <span style={{ fontSize: 11, color: C.ruby, marginLeft: 5 }}>필수</span>
                  </span>
                  <button onClick={() => toggle(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: C.body, transform: open === item.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    {Ic.ChevronDown({s:16,c:C.body})}
                  </button>
                </div>
                {open === item.id && (
                  <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    {item.detail}
                  </div>
                )}
              </div>
            ))}

            {/* 선택 마케팅 */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${agreed3 ? C.purple : C.border}`, background: agreed3 ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}
                onClick={() => setAgreed3(p => !p)}>
                {agreed3 && Ic.Check({s:12,c:"white"})}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: C.navy, cursor: "pointer" }} onClick={() => setAgreed3(p => !p)}>
                마케팅 정보 수신 동의 (신규 인터뷰 공고, 프로모션)
                <span style={{ fontSize: 11, color: C.body, marginLeft: 5 }}>선택</span>
              </span>
            </div>
          </div>

          {/* 주의사항 */}
          <div style={{ background: "rgba(217,48,37,0.04)", border: `1px solid rgba(217,48,37,0.15)`, borderRadius: 8, padding: "12px 16px", marginBottom: 24, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ruby, marginBottom: 6 }}>인터뷰 참여 시 주의사항</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#c5221f", lineHeight: 1.8 }}>
              <li>성의 없는 응답(단답·장난)이 반복되면 리워드 미지급 및 경고가 부여됩니다.</li>
              <li>정당한 사유 없이 3회 이상 중도 이탈 시 블랙리스트에 등록될 수 있습니다.</li>
              <li>허위 자격으로 참여한 경우 지급된 리워드가 환수될 수 있습니다.</li>
            </ul>
          </div>

          <Btn full size="lg" disabled={!allRequired} onClick={() => go(shareCode ? "interview" : "panel_board")}>
            {Ic.Mic({s:16,c:"white"})} 동의 완료 — {shareCode ? "인터뷰 시작하기" : "모집 보드로 이동"}
          </Btn>
          <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 10 }}>
            {shareCode ? "동의 후 AI 인터뷰가 바로 시작됩니다" : "모집 보드에서 원하는 인터뷰를 시작할 수 있어요"}
          </div>
        </div>
      </div>
      <Footer go={go} />
    </div>
  );
}
