import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, F, Ic } from "../lib/constants.jsx";
import { Btn } from "./shared.jsx";

const STEPS = [
  {
    icon: (c) => Ic.Pencil({ s: 28, c }),
    title: "인터뷰 만들기",
    desc: "AI가 질문을 자동 생성해줘요. 주제만 입력하면 준비 끝!",
    action: "인터뷰 만들러 가기",
  },
  {
    icon: (c) => Ic.Users({ s: 28, c }),
    title: "패널 초대하기",
    desc: "링크를 공유하면 패널이 바로 음성으로 답변해요.",
    action: "다음",
  },
  {
    icon: (c) => Ic.Check({ s: 28, c }),
    title: "AI 리포트 확인",
    desc: "응답이 쌓이면 AI가 인사이트를 자동으로 분석해줘요.",
    action: "시작하기",
  },
];

export default function OnboardingModal({ user, onComplete, go }) {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);
  const current = STEPS[step];

  const finish = async () => {
    setClosing(true);
    await supabase
      .from("profiles")
      .upsert({ id: user.id, onboarding_completed_at: new Date().toISOString() }, { onConflict: "id" });
    onComplete();
  };

  const handleAction = async () => {
    if (step === 0) {
      await finish();
      go("editor");
    } else if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await finish();
    }
  };

  return (
    <div role="presentation" style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
      opacity: closing ? 0 : 1, transition: "opacity 0.3s",
    }}>
      <div role="dialog" aria-modal="true" aria-label={current.title} style={{
        background: C.white, borderRadius: 20, padding: "40px 36px",
        maxWidth: 420, width: "100%", textAlign: "center",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? C.purple : C.border,
              transition: "all 0.25s",
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(110,75,255,0.1)", border: "2px solid rgba(110,75,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          {current.icon(C.purple)}
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 10, fontFamily: F }}>
          {current.title}
        </div>
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 32, fontFamily: F }}>
          {current.desc}
        </div>

        <Btn full onClick={handleAction}>{current.action}</Btn>

        <button
          onClick={finish}
          style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: C.body, fontFamily: F, textDecoration: "underline" }}>
          건너뛰기
        </button>
      </div>
    </div>
  );
}
