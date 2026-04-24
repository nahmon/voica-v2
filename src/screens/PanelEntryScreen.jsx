import { useState } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { Btn, Input, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PanelEntryScreen({ go, lang = "ko", onLangChange }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "", region: "", gender: "", age: "",
    job: "", income: "", interests: [],
  });
  const [agreed, setAgreed] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleInterest = (v) => setForm(f => ({
    ...f,
    interests: f.interests.includes(v) ? f.interests.filter(i => i !== v) : [...f.interests, v],
  }));

  const REGIONS = ["서울", "경기/인천", "부산/경남", "대구/경북", "광주/전라", "대전/충청", "강원", "제주", "해외거주"];
  const GENDERS = ["남성", "여성", "기타"];
  const AGES = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
  const JOBS = ["대기업/중견기업", "중소기업", "프리랜서/자영업", "전문직 (의사, 변호사, 회계사 등)", "공공기관/공무원", "학생", "주부", "구직 중", "기타"];
  const INCOMES = ["없음", "월 100만원 미만", "월 100~300만원", "월 300~500만원", "월 500~700만원", "월 700만원 이상", "밝히고 싶지 않음"];
  const INTERESTS = ["테크/IT", "뷰티/패션", "식음료", "금융/투자", "헬스케어/의료", "교육", "여행/레저", "미디어/엔터테인먼트", "부동산", "자동차/모빌리티", "쇼핑/리테일", "스포츠/피트니스", "환경/지속가능성", "법률/세금"];

  const STEPS = ["기본 정보", "매칭 프로필", "동의 및 완료"];
  const step0Valid = form.name && form.phone && form.region && form.gender && form.age;
  const step1Valid = form.job && form.income && form.interests.length > 0;

  function FieldLabel({ children, required }) {
    return (
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.label, marginBottom: 8, fontFamily: F }}>
        {children}{required && <span style={{ color: C.ruby, marginLeft: 3 }}>*</span>}
      </label>
    );
  }
  function ChipGroup({ options, value, onSelect, multi }) {
    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {options.map(o => {
          const active = multi ? value.includes(o) : value === o;
          return (
            <button key={o} onClick={() => onSelect(o)}
              style={{ padding: "10px 16px", borderRadius: 6, fontSize: 13, fontFamily: F, cursor: "pointer", border: `1.5px solid ${active ? C.purple : C.border}`, background: active ? C.purple : C.white, color: active ? C.white : C.body, transition: "all 0.15s", fontWeight: active ? 500 : 400 }}>
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  function StepBar() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, background: i < step ? C.purple : i === step ? C.purple : C.border, color: i <= step ? C.white : C.body, transition: "all 0.3s" }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === step ? C.purple : C.body, whiteSpace: "nowrap", fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? C.purple : C.border, margin: "0 6px", marginBottom: 18, transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>
    );
  }

  const navBar = <GlobalNav go={go} variant="sub" lang={lang} />;

  if (step === 0) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: isMobile ? "24px 16px" : "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>지금 패널로 참여하고, 리워드를 받아보세요</div>
            <div style={{ fontSize: 13, color: C.body }}>참여자님에게 딱 맞는 추천 인터뷰 공고를 찾아왔습니다.</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard, display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <Input label="이름" placeholder="홍길동" value={form.name} onChange={e => upd("name", e.target.value)} required />
              <Input label="전화번호" type="tel" placeholder="010-0000-0000" value={form.phone} onChange={e => upd("phone", e.target.value)} required />
            </div>
            <div>
              <FieldLabel required>거주 지역</FieldLabel>
              <ChipGroup options={REGIONS} value={form.region} onSelect={v => upd("region", v)} />
            </div>
            <div>
              <FieldLabel required>성별</FieldLabel>
              <ChipGroup options={GENDERS} value={form.gender} onSelect={v => upd("gender", v)} />
            </div>
            <div>
              <FieldLabel required>연령대</FieldLabel>
              <ChipGroup options={AGES} value={form.age} onSelect={v => upd("age", v)} />
            </div>
            <Btn full size="lg" disabled={!step0Valid} onClick={() => setStep(1)}>다음</Btn>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 1) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: isMobile ? "24px 16px" : "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>매칭 프로필 설정</div>
            <div style={{ fontSize: 13, color: C.body }}>연구자가 적합한 인터뷰 패널을 찾는 데 사용됩니다</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard, display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <FieldLabel required>직업</FieldLabel>
              <ChipGroup options={JOBS} value={form.job} onSelect={v => upd("job", v)} />
            </div>
            <div>
              <FieldLabel required>월 소득</FieldLabel>
              <ChipGroup options={INCOMES} value={form.income} onSelect={v => upd("income", v)} />
            </div>
            <div>
              <FieldLabel required>전문 분야 / 관심 분야 <span style={{ fontWeight: 400, color: C.body }}>(해당하는 항목 모두 선택)</span></FieldLabel>
              <ChipGroup options={INTERESTS} value={form.interests} onSelect={toggleInterest} multi />
              {form.interests.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.purple }}>{form.interests.length}개 선택됨</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => setStep(0)}>이전</Btn>
              <Btn size="lg" style={{ flex: 2 }} disabled={!step1Valid} onClick={() => setStep(2)}>다음</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 3) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(30,142,62,0.12)", border: "1px solid rgba(30,142,62,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✓</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 10 }}>인터뷰 패널로 등록됐어요</div>
          <div style={{ fontSize: 14, color: C.body, lineHeight: 1.75, marginBottom: 32 }}>
            {form.name}님 환영합니다.<br />
            인터뷰 보드에서 참여할 인터뷰를 찾아보세요.<br />
            인터뷰 완료 후 AI 품질 검토를 거쳐 리워드가 자동 지급됩니다.
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "18px 20px", marginBottom: 24, textAlign: "left", boxShadow: S.ambient }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 10 }}>다음 단계</div>
            {[
              ["1", "인터뷰 보드에서 원하는 인터뷰를 선택해 주세요"],
              ["2", "지원 → AI 스크리닝 → 연구자 최종 확인"],
              ["3", "확정 후 동의서에 서명하고 음성 인터뷰를 완료해 주세요"],
              ["4", "인터뷰 완료 후 AI 품질 검토 → 리워드 자동 지급"],
            ].map(([n, txt]) => (
              <div key={n} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.purpleBg, border: `1px solid ${C.purpleLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: C.purple, flexShrink: 0 }}>{n}</div>
                <span style={{ fontSize: 13, color: C.navy, lineHeight: 1.5, paddingTop: 2 }}>{txt}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => go("landing")}>홈으로</Btn>
            <Btn size="lg" style={{ flex: 2 }} onClick={() => go("panel_board")}>
              인터뷰 보드 보기
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Consent
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: isMobile ? "24px 16px" : "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>데이터 수집 및 이용 동의</div>
            <div style={{ fontSize: 13, color: C.body }}>아래 내용을 검토하고 동의해 주세요</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard }}>
            <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleLight}`, borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 8 }}>프로필 요약</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "6px 16px" }}>
                {[
                  ["이름", form.name], ["지역", form.region],
                  ["나이/성별", `${form.age} · ${form.gender}`], ["직업", form.job],
                  ["월 소득", form.income], ["관심 분야", form.interests.slice(0, 3).join(", ") + (form.interests.length > 3 ? ` 외 ${form.interests.length - 3}개` : "")],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={{ fontSize: 11, color: C.body }}>{k} </span>
                    <span style={{ fontSize: 12, color: C.navy, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: C.label, marginBottom: 12 }}>데이터 수집 및 이용 내역</div>
            {[
              ["수집 항목", "이름, 전화번호, 지역, 성별, 나이, 직업, 소득, 관심 분야, 음성 응답"],
              ["이용 목적", "인터뷰 패널 매칭, 리서치 분석 및 리포트 생성"],
              ["보관 기간", "계정 삭제 시 또는 마지막 인터뷰 완료 후 2년까지"],
              ["제3자 제공", "익명화된 분석 데이터만 클라이언트에 제공 (개인식별정보 제외)"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.body, minWidth: 72, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, color: C.navy, lineHeight: 1.5 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.body, lineHeight: 1.75 }}>
                ✦ 음성은 AI가 텍스트로 변환 후 즉시 삭제됩니다<br />
                ✦ 개인식별정보는 광고주와 절대 공유되지 않습니다<br />
                ✦ 언제든지 동의를 철회하고 계정을 삭제할 수 있습니다
              </div>
            </div>

            <div onClick={() => setAgreed(a => !a)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, cursor: "pointer", minHeight: 44, padding: "4px 0" }}>
              <div style={{ width: 24, height: 24, borderRadius: 5, border: `1.5px solid ${agreed ? C.purple : C.border}`, background: agreed ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                {agreed && <span style={{ color: C.white, fontSize: 12, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: C.navy }}>위 내용을 모두 읽고 동의합니다</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => setStep(1)}>이전</Btn>
              <Btn size="lg" style={{ flex: 2 }} disabled={!agreed} onClick={() => setStep(3)}>
                인터뷰 패널 등록
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
