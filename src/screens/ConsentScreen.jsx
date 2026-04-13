import { useState } from "react";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const STEPS = ["안내", "동의", "시작"];

function StepIndicator({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 28 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? C.success : active ? C.purple : C.border,
                transition: "background 0.2s",
              }}>
                {done
                  ? Ic.Check({ s: 13, c: "#fff" })
                  : <span style={{ fontSize: 12, fontWeight: 700, color: active ? "#fff" : C.body }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: 10, color: active ? C.purple : done ? C.success : C.body, fontWeight: active ? 600 : 400 }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 48, height: 2, background: done ? C.success : C.border, margin: "0 4px", marginBottom: 18, transition: "background 0.2s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Friendly illustration placeholder
function WelcomeIllustration({ isMobile }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(83,58,253,0.07) 0%, rgba(83,58,253,0.03) 100%)",
      border: `1px solid rgba(83,58,253,0.12)`,
      borderRadius: 16,
      padding: isMobile ? "24px 20px" : "28px 32px",
      marginBottom: 24,
      textAlign: "center",
    }}>
      {/* Simple SVG mic illustration */}
      <div style={{ marginBottom: 14 }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="28" fill="rgba(83,58,253,0.08)" />
          <rect x="22" y="12" width="12" height="20" rx="6" fill={C.purple} opacity="0.9" />
          <path d="M16 28c0 6.627 5.373 12 12 12s12-5.373 12-12" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <line x1="28" y1="40" x2="28" y2="46" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="46" x2="34" y2="46" stroke={C.purple} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: isMobile ? 17 : 19, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
        인터뷰 참여를 환영해요!
      </div>
      <div style={{ fontSize: 13, color: C.body, lineHeight: 1.7 }}>
        AI 인터뷰어가 편안하게 안내해 드릴게요.<br />
        잠깐의 시간으로 소중한 의견을 들려주세요.
      </div>
      {/* Interview info pills */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "6px 14px", border: `1px solid ${C.border}` }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={C.purple} strokeWidth="1.4" strokeLinecap="round">
            <circle cx="6" cy="6" r="5" /><path d="M6 3.5v2.5l1.5 1.5" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>약 10분 소요</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "6px 14px", border: `1px solid ${C.border}` }}>
          {Ic.Coin({ s: 12, c: "#15803d" })}
          <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>3,000원 리워드</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "6px 14px", border: `1px solid ${C.border}` }}>
          {Ic.Mic({ s: 12, c: C.body })}
          <span style={{ fontSize: 12, color: C.body }}>음성 인터뷰</span>
        </div>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  { q: "제 음성 데이터는 어떻게 사용되나요?", a: "음성은 텍스트(STT)로 변환되어 리서치 분석에만 활용됩니다. 인터뷰 완료일로부터 1년 후 자동 파기되며, 제3자에게 판매되지 않습니다." },
  { q: "개인정보는 누구에게 제공되나요?", a: "리서처에게는 음성·텍스트 분석 결과만 제공되며, 이름·연락처 등 식별 정보는 공유되지 않습니다." },
  { q: "리워드는 언제 지급되나요?", a: "인터뷰 완료 후 24시간 이내에 등록하신 계좌 또는 모바일 상품권으로 지급됩니다." },
  { q: "중간에 그만둬도 되나요?", a: "인터뷰는 언제든지 중단할 수 있지만, 완료한 경우에만 리워드가 지급됩니다. 정당한 사유 없이 3회 이상 중단 시 패널 자격에 영향을 줄 수 있습니다." },
  { q: "음성 인식이 잘 안 될 때는 어떻게 하나요?", a: "조용한 환경에서 마이크에 가까이 대고 말씀해 주세요. 음성 인식이 어렵다면 텍스트로 입력하는 옵션도 제공됩니다." },
];

export default function ConsentScreen({ go, user, logout, shareCode }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0); // 0=안내, 1=동의, 2=시작
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [agreed3, setAgreed3] = useState(false);
  const [open, setOpen] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);

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

  // Step 0: 안내 (welcome + info)
  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
        <GlobalNav go={go} variant="panel" user={user} logout={logout} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
          <div style={{ width: "100%", maxWidth: 540 }}>
            <StepIndicator current={0} />
            <WelcomeIllustration isMobile={isMobile} />

            {/* 녹음 안내 배너 */}
            <div style={{ background: "rgba(26,115,232,0.05)", border: `1px solid rgba(26,115,232,0.15)`, borderRadius: 8, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
              {Ic.Mic({ s: 18, c: C.purple })}
              <div style={{ fontSize: 13, color: C.purple, lineHeight: 1.6 }}>
                <strong>녹음 안내:</strong> 본 인터뷰는 음성으로 녹음됩니다. 조용한 환경에서 진행해 주세요.
              </div>
            </div>

            {/* FAQ accordion */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 10 }}>자주 묻는 질문</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} style={{ background: C.white, border: `1px solid ${faqOpen === i ? "rgba(83,58,253,0.2)" : C.border}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.15s" }}>
                    <button
                      onClick={() => setFaqOpen(p => p === i ? null : i)}
                      style={{
                        width: "100%", padding: "13px 16px", background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontFamily: F,
                      }}
                    >
                      <span style={{ fontSize: 13, color: C.navy, fontWeight: 500, textAlign: "left" }}>{item.q}</span>
                      <span style={{ transform: faqOpen === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, display: "flex" }}>
                        {Ic.ChevronDown({ s: 15, c: C.body })}
                      </span>
                    </button>
                    {faqOpen === i && (
                      <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                        <div style={{ fontSize: 12, color: C.body, lineHeight: 1.75 }}>{item.a}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Btn full size="lg" onClick={() => setStep(1)}>
              다음 — 동의하기
            </Btn>
          </div>
        </div>
        <Footer go={go} />
      </div>
    );
  }

  // Step 1: 동의
  if (step === 1) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
        <GlobalNav go={go} variant="panel" user={user} logout={logout} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
          <div style={{ width: "100%", maxWidth: 540 }}>
            <StepIndicator current={1} />

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: C.navy, marginBottom: 6 }}>인터뷰 참여 전 동의</div>
              <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7 }}>아래 내용을 확인하시고 동의 후 인터뷰를 시작해 주세요. 필수 항목에 동의하지 않으면 인터뷰 참여가 제한됩니다.</div>
            </div>

            {/* 전체 동의 */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
              onClick={() => { const next = !(agreed1 && agreed2 && agreed3); setAgreed1(next); setAgreed2(next); setAgreed3(next); }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${agreed1 && agreed2 && agreed3 ? C.purple : C.border}`, background: agreed1 && agreed2 && agreed3 ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                {agreed1 && agreed2 && agreed3 && Ic.Check({ s: 12, c: "white" })}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>전체 동의</span>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0 12px" }} />

            {/* 필수 항목들 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {REQUIRED.map(item => (
                <div key={item.id} style={{ background: C.white, border: `1px solid ${open === item.id ? "rgba(26,115,232,0.25)" : C.border}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.15s" }}>
                  <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${item.checked ? C.purple : C.border}`, background: item.checked ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}
                      onClick={() => item.setChecked(p => !p)}>
                      {item.checked && Ic.Check({ s: 12, c: "white" })}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, color: C.navy, cursor: "pointer" }} onClick={() => item.setChecked(p => !p)}>
                      {item.label}
                      <span style={{ fontSize: 11, color: C.ruby, marginLeft: 5 }}>필수</span>
                    </span>
                    <button onClick={() => toggle(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: C.body, transform: open === item.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      {Ic.ChevronDown({ s: 16, c: C.body })}
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
                  {agreed3 && Ic.Check({ s: 12, c: "white" })}
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

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(0)} style={{ padding: "13px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, fontSize: 14, color: C.body, cursor: "pointer", fontFamily: F }}>이전</button>
              <Btn full size="lg" disabled={!allRequired} onClick={() => setStep(2)}>
                동의 완료
              </Btn>
            </div>
          </div>
        </div>
        <Footer go={go} />
      </div>
    );
  }

  // Step 2: 시작
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: F }}>
      <GlobalNav go={go} variant="panel" user={user} logout={logout} />
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "32px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 540 }}>
          <StepIndicator current={2} />

          <div style={{ textAlign: "center", padding: isMobile ? "24px 0 32px" : "32px 0 40px" }}>
            <div style={{ marginBottom: 20 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="rgba(21,190,83,0.1)" />
                <circle cx="32" cy="32" r="22" fill="rgba(21,190,83,0.15)" />
                <path d="M22 33l7 7 13-14" stroke={C.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: C.navy, marginBottom: 8 }}>모든 준비가 완료됐어요!</div>
            <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 28 }}>
              아래 버튼을 누르면 AI 인터뷰가 바로 시작됩니다.<br />
              조용한 환경에서 마이크를 준비해 주세요.
            </div>

            {/* Summary pills */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "7px 16px", border: `1px solid ${C.border}` }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={C.purple} strokeWidth="1.4" strokeLinecap="round">
                  <circle cx="6" cy="6" r="5" /><path d="M6 3.5v2.5l1.5 1.5" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>약 10분 소요</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.white, borderRadius: 20, padding: "7px 16px", border: `1px solid ${C.border}` }}>
                {Ic.Coin({ s: 12, c: "#15803d" })}
                <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>완료 후 3,000원 지급</span>
              </div>
            </div>

            <Btn full size="lg" onClick={() => go(shareCode ? "interview" : "panel_board")}>
              {Ic.Mic({ s: 16, c: "white" })} {shareCode ? "인터뷰 시작하기" : "모집 보드로 이동"}
            </Btn>
            <div style={{ fontSize: 11, color: C.body, textAlign: "center", marginTop: 10 }}>
              {shareCode ? "동의 후 AI 인터뷰가 바로 시작됩니다" : "모집 보드에서 원하는 인터뷰를 시작할 수 있어요"}
            </div>
          </div>
        </div>
      </div>
      <Footer go={go} />
    </div>
  );
}
