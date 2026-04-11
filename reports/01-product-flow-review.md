# 프로덕트 플로우 리뷰 — Voica

> 작성일: 2026-04-10  
> 검토자: AI 시니어 프로덕트 기획자  
> 소스: `/Users/mh/voica-v2/src/App.jsx`

---

## 현재 플로우 맵

### 리서처/기업 플로우
```
landing
  └─[로그인 버튼]─→ advertiser_login
                        └─[로그인/회원가입 완료]─→ dashboard
                                                      ├─[+ 새 프로젝트]─→ editor ─→ dashboard
                                                      ├─[프로젝트 카드(완료)]─→ report ─→ dashboard
                                                      ├─[패널 리쿠르팅]─→ recruiter_admin
                                                      └─[패널 모집 보드]─→ panel_board
```

### 패널(참여자) 플로우
```
landing
  └─[패널 등록하기]─→ panel_entry (3 step)
                          └─[등록 완료]─→ (완료 확인 화면) ─→ panel_board
                                                                    └─[참여 확정 카드]─→ consent
                                                                                          └─[동의 완료]─→ interview
                                                                                                            └─[완료]─→ (완료 화면) ─→ panel_board
landing
  └─[패널 모집 보드]─→ panel_board
                          └─[참여 확정 카드 "지금 인터뷰 시작하기"]─→ consent ─→ interview
```

### 공통 접근 가능 화면
```
landing footer / nav ─→ pricing, support, faq, panel_board
dashboard nav ─→ editor, recruiter_admin, panel_board
```

---

## 발견된 갭 & 문제점

| # | 화면 | 문제 | 심각도 | 비고 |
|---|------|------|--------|------|
| 1 | PanelEntryScreen (Step 2) | 패널 등록 완료 후 `go("panel_board")`로 직행 — 등록 완료 확인 화면 없이 바로 보드로 이동. 사용자가 "등록이 된 건지" 인지 불가 | 높음 | 플로우 dead-end는 아니지만 온보딩 완결성 결여 |
| 2 | InterviewScreen | 인터뷰 도중 "나가기" 버튼이 확인 없이 즉시 `go("panel_board")` — 리워드 미지급, 이탈 패널티 경고 없음 | 높음 | 패널 신뢰도 훼손 위험 |
| 3 | DashboardScreen | `user`, `logout` prop을 시그니처에서 받지 않아 실제로 전달돼도 무시됨. 로그아웃 버튼 없음 | 높음 | 로그인 상태에서 탈출 불가 |
| 4 | ConsentScreen | 뒤로 버튼이 `panel_entry`로 연결 — 실제 진입 경로는 `panel_board`("지금 인터뷰 시작하기")이므로 불일치 | 높음 | 뒤로가면 패널 등록 폼이 다시 열림 |
| 5 | Voica() 라우터 | 새로고침 시 Supabase 세션 복원 후에도 `screen`이 항상 "landing"으로 리셋 — 로그인 사용자가 매번 랜딩으로 떨어짐 | 높음 | UX 단절, 북마크/공유 링크 무효 |
| 6 | DashboardScreen | PROJECTS 목록이 비어있을 때(신규 가입자) Empty State UI 없음 — "전체 보기" 버튼과 빈 화면만 노출 | 중간 | 신규 리서처 온보딩 dead-end |
| 7 | InterviewScreen 완료 | 인터뷰 완료 후 "← 모집 보드"와 "다시 체험" 버튼만 있어 추가 인터뷰 참여 유도 CTA 약함 | 중간 | 패널 리텐션 기회 손실 |
| 8 | AdvertiserLoginScreen | "비밀번호 찾기" 링크가 `href="#"` — 클릭해도 아무 동작 없음 | 중간 | 로그인 불가 사용자 막힘 |
| 9 | FAQ/Support | Landing footer와 모바일 드로어에서만 접근 가능 — Dashboard, ReportScreen 등 내부 화면에서 직접 진입 불가 | 낮음 | 고객 지원 진입점 부족 |
| 10 | EditorScreenInner | "▶ 패널 입장 체험" 버튼이 `go("panel_entry")`로 연결 — 패널 등록 폼을 열어 혼동 유발. 체험용이므로 바로 `consent` 또는 `interview`로 연결해야 함 | 낮음 | 리서처가 패널 입장 체험 시 등록 폼 노출 |

---

## 구현한 개선 사항

| # | 변경 내용 | 위치(줄, 수정 후 기준) | 이유 |
|---|-----------|----------------------|------|
| 1 | PanelEntryScreen에 **Step 3 (등록 완료 화면)** 추가 — 완료 아이콘, 환영 메시지, 4단계 다음 진행 안내, "홈으로"/"인터뷰 찾아보기" CTA | PanelEntryScreen, step===3 분기 추가 | 등록 완료 후 확인 화면 없이 바로 보드로 이동하면 사용자가 등록 성공 여부를 인지하지 못함. 온보딩 완결성 확보 |
| 2 | InterviewScreen에 **이탈 확인 다이얼로그** 추가 — `showExitConfirm` state, `handleExitClick()` 핸들러, "나가기" 클릭 시 리워드 미지급·패널 자격 제한 경고 모달 표시 | InterviewScreen, ~1808 | 인터뷰 도중 실수로 나가면 리워드 미지급 및 3회 이탈 시 블랙리스트 패널티가 있으므로 반드시 확인 단계 필요 |
| 3 | DashboardScreen **함수 시그니처 수정** (`user`, `logout` prop 수신) + **로그아웃 버튼** nav에 추가 | DashboardScreen, ~736~757 | props가 전달되어도 사용 안 해 로그아웃 불가 상태였음. 세션 종료 동선 확보 |
| 4 | DashboardScreen **Empty State UI** 추가 — PROJECTS 배열이 비어있을 때 안내 문구 + "첫 프로젝트 만들기" CTA 카드 표시 | DashboardScreen, 프로젝트 목록 상단 | 신규 가입 리서처가 빈 대시보드에서 다음 행동을 찾지 못하는 dead-end 방지 |
| 5 | ConsentScreen **뒤로가기 대상 수정** — `panel_entry` → `panel_board` + 레이블 "뒤로" → "모집 보드" | ConsentScreen, ~2440 | consent의 실제 진입 경로는 panel_board의 "지금 인터뷰 시작하기" 버튼이므로 panel_entry로 되돌아가면 플로우 불일치 |
| 6 | **새로고침 시 화면 복원** — `getSession()` 콜백에서 세션 있으면 `setScreen("dashboard")` | Voica(), ~2207 | 로그인 사용자가 새로고침 시 항상 landing으로 떨어지는 UX 단절 해소 |
| 7 | InterviewScreen 완료 화면에 **다음 인터뷰 찾기 CTA 카드** 추가 — 모집 중 건수·평균 리워드 표시 + "다음 인터뷰 찾기" 버튼 강조 | InterviewScreen completed 블록, ~1877 | 완료 후 이탈이 아닌 추가 참여로 유도해 패널 리텐션 개선 |
| 8 | AdvertiserLoginScreen **비밀번호 찾기 실제 연동** — `handleResetPassword()` 추가 (Supabase `resetPasswordForEmail`), 발송 완료 피드백 메시지 표시 | AdvertiserLoginScreen, ~558~571 | "비밀번호 찾기" 링크가 href="#"로 아무 동작 없어 비밀번호 분실 사용자가 로그인 불가한 dead-end 해소 |

---

## 미구현 권장사항 (향후 작업)

### 높음
- **FAQ/Support 인앱 접근점 강화**: Dashboard nav, ReportScreen, PanelBoardScreen에 "도움말" 버튼 또는 플로팅 버튼 추가. 현재 landing footer·모바일 드로어에서만 접근 가능.
- **EditorScreenInner "패널 입장 체험" 링크 수정**: `go("panel_entry")` → `go("consent")` 또는 `go("interview")`로 변경. 리서처가 체험 목적으로 누르면 패널 등록 폼이 뜨는 혼동 유발.

### 중간
- **알림/피드백 루프 구현**: 패널이 인터뷰를 완료했을 때 리서처 대시보드에 실시간 카운트 업데이트 또는 이메일 알림 발송 (현재 완전 없음).
- **리서처→패널 역할 전환 동선**: 동일 계정으로 두 역할 수행 불가 — 대시보드 내 "패널로 참여하기" 링크 또는 계정 유형 전환 UI 필요.
- **인터뷰 도중 이탈 횟수 추적 UI**: ConsentScreen 주의사항에 "3회 이탈 시 블랙리스트" 언급이 있으나 패널이 본인의 이탈 횟수를 확인할 수 없음.

### 낮음
- **소셜 로그인 후 리디렉션 처리**: `handleSocialLogin`의 `redirectTo: window.location.origin`은 OAuth 완료 후 landing으로 돌아와 screen이 "landing"으로 노출됨. `onAuthStateChange`에서 screen 복원 처리 필요.
- **RecruiterAdminScreen → 리포트 연결**: 패널 리스트에서 완료된 패널의 응답을 바로 볼 수 있는 "리포트 보기" 버튼 없음.
- **PricingScreen → 대시보드 연결**: 요금제 결제 완료(PaymentModal done) 후 `onDone`이 `go("dashboard")`를 호출하지만, pricing 진입 경로(landing)에 따라 대시보드 접근 권한(미로그인) 이슈 발생 가능.
- **URL 기반 라우팅 도입**: 현재 단순 state 라우팅으로 브라우저 뒤로가기/앞으로가기, 북마크, URL 공유가 모두 불가. React Router 또는 history API 도입 권장.
