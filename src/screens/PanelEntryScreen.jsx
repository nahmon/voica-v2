import { useState } from "react";
import { C, S, F } from "../lib/constants.jsx";
import { Btn, Input, GlobalNav, Footer } from "../components/shared.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

export default function PanelEntryScreen({ go }) {
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

  const REGIONS = ["서울", "경기/인천", "부산/경남", "대구/경북", "광주/전라", "대전/충청", "강원", "제주", "해외 거주"];
  const GENDERS = ["남성", "여성", "응답 안 함"];
  const AGES = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
  const JOBS = ["직장인 (대기업/중견)", "직장인 (중소기업)", "프리랜서/자영업", "전문직 (의사·변호사·회계사 등)", "공무원/공기업", "학생", "주부", "구직 중", "기타"];
  const INCOMES = ["없음", "100만원 미만", "100~300만원", "300~500만원", "500~700만원", "700만원 이상", "응답 안 함"];
  const INTERESTS = ["테크/IT", "뷰티/패션", "식품/요식업", "금융/투자", "의료/헬스케어", "교육", "여행/레저", "미디어/엔터테인먼트", "부동산", "자동차/모빌리티", "쇼핑/유통", "스포츠/피트니스", "환경/지속가능성", "법률/세무"];

  const STEPS = ["기본 정보", "매칭 프로필", "동의 및 완료"];
  const step0Valid = form.name && form.phone && form.region && form.gender && form.age;
  const step1Valid = form.job && form.income && form.interests.length > 0;

  function FieldLabel({ children }) {
    return <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.label, marginBottom: 8, fontFamily: F }}>{children}</label>;
  }
  function ChipGroup({ options, value, onSelect, multi }) {
    return (
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
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

  const navBar = <GlobalNav go={go} variant="sub" />;

  if (step === 0) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>기본 정보를 알려주세요</div>
            <div style={{ fontSize: 13, color: C.body }}>리워드 지급과 인터뷰 매칭에 써요</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard, display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <Input label="이름 (실명)" placeholder="홍길동" value={form.name} onChange={e => upd("name", e.target.value)} />
              <Input label="연락처" type="tel" placeholder="010-0000-0000" value={form.phone} onChange={e => upd("phone", e.target.value)} />
            </div>
            <div>
              <FieldLabel>거주 지역</FieldLabel>
              <ChipGroup options={REGIONS} value={form.region} onSelect={v => upd("region", v)} />
            </div>
            <div>
              <FieldLabel>성별</FieldLabel>
              <ChipGroup options={GENDERS} value={form.gender} onSelect={v => upd("gender", v)} />
            </div>
            <div>
              <FieldLabel>연령대</FieldLabel>
              <ChipGroup options={AGES} value={form.age} onSelect={v => upd("age", v)} />
            </div>
            <Btn full size="lg" disabled={!step0Valid} onClick={() => setStep(1)}>다음으로</Btn>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 1) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>매칭 프로필을 설정해 주세요</div>
            <div style={{ fontSize: 13, color: C.body }}>리서처가 알맞은 패널을 찾을 때 봐요</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard, display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <FieldLabel>직업</FieldLabel>
              <ChipGroup options={JOBS} value={form.job} onSelect={v => upd("job", v)} />
            </div>
            <div>
              <FieldLabel>월 소득</FieldLabel>
              <ChipGroup options={INCOMES} value={form.income} onSelect={v => upd("income", v)} />
            </div>
            <div>
              <FieldLabel>전문분야 / 관심분야 <span style={{ fontWeight: 400, color: C.body }}>(복수 선택)</span></FieldLabel>
              <ChipGroup options={INTERESTS} value={form.interests} onSelect={toggleInterest} multi />
              {form.interests.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.purple }}>{form.interests.length}개 선택됨</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => setStep(0)}>이전으로</Btn>
              <Btn size="lg" style={{ flex: 2 }} disabled={!step1Valid} onClick={() => setStep(2)}>다음으로</Btn>
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
          <div style={{ fontSize: 26, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 10 }}>패널 등록 완료</div>
          <div style={{ fontSize: 14, color: C.body, lineHeight: 1.75, marginBottom: 32 }}>
            {form.name}님, 환영해요.<br />
            인터뷰 모집 보드에서 참여할 인터뷰를 찾아보세요.<br />
            리워드는 인터뷰 완료 후 AI 검토를 거쳐 자동으로 지급돼요.
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "18px 20px", marginBottom: 24, textAlign: "left", boxShadow: S.ambient }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 10 }}>다음 단계 안내</div>
            {[
              ["1", "인터뷰 모집 보드에서 원하는 인터뷰 선택"],
              ["2", "지원 → AI 적합성 검토 → 리서처 최종 확정"],
              ["3", "참여 확정 후 동의서 동의 → 보이스 인터뷰 진행"],
              ["4", "완료 후 AI 품질 검토 → 리워드 자동 지급"],
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
              인터뷰 찾아보기
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: 동의
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {navBar}
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          <StepBar />
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "0.16px", marginBottom: 6 }}>개인정보 수집 및 이용 동의</div>
            <div style={{ fontSize: 13, color: C.body }}>아래 내용을 확인하고 동의해 주세요</div>
          </div>
          <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: "28px", boxShadow: S.standard }}>
            <div style={{ background: C.purpleBg, border: `1px solid ${C.purpleLight}`, borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 8 }}>입력하신 프로필 요약</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                {[
                  ["이름", form.name], ["지역", form.region],
                  ["연령/성별", `${form.age} · ${form.gender}`], ["직업", form.job],
                  ["월 소득", form.income], ["관심분야", form.interests.slice(0, 3).join(", ") + (form.interests.length > 3 ? ` 외 ${form.interests.length - 3}개` : "")],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={{ fontSize: 11, color: C.body }}>{k} </span>
                    <span style={{ fontSize: 12, color: C.navy, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: C.label, marginBottom: 12 }}>수집 및 이용 안내</div>
            {[
              ["수집 항목", "성함, 연락처, 거주지역, 성별, 연령, 직업, 소득, 관심분야, 음성 답변"],
              ["이용 목적", "인터뷰 패널 매칭, 리서치 분석 및 리포트 작성"],
              ["보유 기간", "서비스 탈퇴 시 또는 마지막 인터뷰 완료 후 2년"],
              ["제3자 제공", "의뢰 기업에 익명화된 분석 데이터 제공 (개인 식별 불가)"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, color: C.body, minWidth: 72, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, color: C.navy, lineHeight: 1.5 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.body, lineHeight: 1.75 }}>
                ✦ 음성은 AI 전사 후 즉시 삭제돼요<br />
                ✦ 개인 식별 정보는 광고주에게 공유되지 않아요<br />
                ✦ 동의를 철회하면 언제든 탈퇴할 수 있어요
              </div>
            </div>

            <div onClick={() => setAgreed(a => !a)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${agreed ? C.purple : C.border}`, background: agreed ? C.purple : C.white, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
                {agreed && <span style={{ color: C.white, fontSize: 12, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: C.navy }}>위 내용을 모두 읽었고 동의해요</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn variant="ghost" size="lg" style={{ flex: 1 }} onClick={() => setStep(1)}>이전으로</Btn>
              <Btn size="lg" style={{ flex: 2 }} disabled={!agreed} onClick={() => setStep(3)}>
                패널 등록할게요
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
