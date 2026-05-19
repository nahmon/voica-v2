# Voica v2 — Key File Inventory

> Auto-generated: 2026-05-19
> Total: ~100 source files, ~18,000+ lines of code

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.3.1 + React Router 7.14.0 |
| Build | Vite 6.3.1 |
| Testing | Vitest 4.1.4 + Testing Library |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Supabase (PostgreSQL) |
| Payments | Toss Payments SDK |
| AI | OpenAI GPT-4o |
| Deployment | Vercel (Seoul/icn1, 60s function timeout) |

---

## 1. Infrastructure & Config (7 files)

| File | Purpose | Lines |
|------|---------|-------|
| `package.json` | Project metadata & dependencies | 31 |
| `vite.config.js` | Build config, vendor chunk splitting, API proxy | 25 |
| `vercel.json` | Vercel deployment: Seoul region, CORS, CSP, cron | 39 |
| `vitest.config.ts` | Test runner: JSDOM, globals | 11 |
| `index.html` | HTML entry: SEO, JSON-LD, OG tags, Pretendard font | 100 |
| `src/main.jsx` | React app bootstrap (StrictMode) | 10 |
| `src/App.jsx` | Main router: 21 lazy-loaded screens, auth, error boundary | 237 |

## 2. Screens (24 files, 10,651 lines)

### Auth & Legal

| File | Purpose | Lines |
|------|---------|-------|
| `src/screens/AuthScreen.jsx` | Login/signup with email, password, social login | 232 |
| `src/screens/RoleSelectScreen.jsx` | Post-signup role selection (researcher/panel) | 96 |
| `src/screens/TermsScreen.jsx` | Terms of Service (Ko/En) | 198 |
| `src/screens/PrivacyScreen.jsx` | Privacy Policy (Ko/En) | 319 |

### Public Landing

| File | Purpose | Lines |
|------|---------|-------|
| `src/screens/LandingScreen.jsx` | Landing page: features, live stats, CTAs | 657 |
| `src/screens/PricingScreen.jsx` | Subscription plans (Starter/Pro/Enterprise) | 197 |
| `src/screens/AboutScreen.jsx` | Platform info page | 74 |
| `src/screens/FAQScreen.jsx` | Accordion Q&A | 78 |
| `src/screens/SupportScreen.jsx` | Support contact form | 134 |

### Researcher Tools

| File | Purpose | Lines |
|------|---------|-------|
| `src/screens/DashboardScreen.jsx` | Interview list, filtering, sorting | 479 |
| `src/screens/EditorScreen.jsx` | Interview builder: questions, stimuli, recruitment | 1,278 |
| `src/screens/InterviewPublishScreen.jsx` | Multi-step publish workflow | 619 |
| `src/screens/ResponsesScreen.jsx` | Response collection & participant data | 666 |
| `src/screens/ReportScreen.jsx` | AI analysis, funnel viz, response playback, sharing | 1,203 |

### Panelist Experience

| File | Purpose | Lines |
|------|---------|-------|
| `src/screens/InterviewScreen.jsx` | Live interview: voice/video/text responses | 1,172 |
| `src/screens/ConsentScreen.jsx` | Pre-interview consent flow | 529 |
| `src/screens/ExpertVerifyScreen.jsx` | Expert credential verification | 663 |
| `src/screens/PanelEntryScreen.jsx` | Panel registration form | 353 |
| `src/screens/PanelBoardScreen.jsx` | Available interviews board | 468 |
| `src/screens/PanelMyPageScreen.jsx` | Panelist profile & rewards | 504 |

### Admin & Payments

| File | Purpose | Lines |
|------|---------|-------|
| `src/screens/RecruiterAdminScreen.jsx` | Admin: applicant management, approval | 450 |
| `src/screens/PaymentScreen.jsx` | Toss Payments initiation | 76 |
| `src/screens/PaymentSuccessScreen.jsx` | Payment confirmation | 111 |
| `src/screens/BillingSuccessScreen.jsx` | Billing validation & subscription update | 95 |

## 3. Components, Hooks & Libraries (13 files, 1,936 lines)

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/shared.jsx` | Design system: buttons, forms, toasts, modals, layouts | 770 |
| `src/components/PanelJobCard.jsx` | Job opportunity card for panelists | 398 |
| `src/components/OnboardingModal.jsx` | Step-by-step onboarding flow | 103 |
| `src/components/MembersModal.jsx` | Team member invite/remove modal | 110 |
| `src/hooks/useIsMobile.js` | Mobile viewport detection (max-width: 767px) | 14 |
| `src/hooks/useGo.js` | Navigation helper (screen name → URL path) | 16 |
| `src/lib/constants.jsx` | Design tokens: colors, shadows, typography, icons | 69 |
| `src/lib/mockData.js` | Sample projects, questions, reports, profiles | 251 |
| `src/lib/clipboard.js` | Clipboard copy with fallback | 12 |
| `src/lib/analytics.js` | Funnel event tracker (fire-and-forget) | 27 |
| `src/lib/routes.js` | Screen → URL path mapping | 28 |
| `src/lib/templates.js` | Pre-built interview templates | 81 |
| `src/contexts/AuthContext.jsx` | Auth context provider (currently unused) | 57 |

## 4. API Endpoints (29 files, 2,544 lines)

### Core Infrastructure

| File | Purpose | Lines |
|------|---------|-------|
| `api/_rateLimit.js` | Supabase-backed rate limiter with in-memory fallback | 44 |
| `api/_supabase.js` | Supabase service-role client | 6 |
| `api/lib/nanoid.js` | 12-char ID generator | 7 |
| `api/lib/plans.js` | Plan definitions (Starter/Pro) with pricing | 40 |
| `api/lib/slack.js` | Slack webhook notifications | 10 |
| `api/lib/toss.js` | Toss Payments API helper | 36 |

### Interview & Session Management

| File | Purpose | Lines |
|------|---------|-------|
| `api/interview/index.js` | Create interview + TTS audio prewarm | 152 |
| `api/interview/[code].js` | Public interview fetch by share code | 36 |
| `api/interview-members/[id].js` | Team member management | 73 |
| `api/interview-sessions/[id].js` | Session & response data for researchers | 53 |

### AI Features

| File | Purpose | Lines |
|------|---------|-------|
| `api/generate-questions.js` | AI question generation (OpenAI GPT) | 76 |
| `api/followup.js` | AI follow-up question generation | 72 |
| `api/report/[id].js` | AI report generation & retrieval (GPT-4o) | 312 |
| `api/report/public/[token].js` | Public report access by token | 49 |
| `api/expert-verify.js` | Expert credential verification (OpenAI vision) | 290 |

### Data & Storage

| File | Purpose | Lines |
|------|---------|-------|
| `api/survey.js` | Survey response processing, quality scoring, fraud detection | 213 |
| `api/participant.js` | Participant record management | 81 |
| `api/comments/[reportId].js` | Report comments CRUD | 74 |
| `api/speech.js` | Audio upload/download (multipart) | 131 |
| `api/storage.js` | Signed URL generation | 94 |
| `api/export.js` | CSV export of responses | 91 |

### Payments & Subscriptions

| File | Purpose | Lines |
|------|---------|-------|
| `api/payments/prepare.js` | Credit purchase order creation | 37 |
| `api/payments/confirm.js` | Payment confirmation & credit settlement | 59 |
| `api/subscription/start.js` | Subscription initiation & first charge | 103 |
| `api/subscription/cancel.js` | Subscription cancellation (period-end) | 30 |
| `api/cron/charge-subscriptions.js` | Daily cron: charge active subscriptions | 130 |

### Admin & Integrations

| File | Purpose | Lines |
|------|---------|-------|
| `api/management.js` | Admin billing & user management | 180 |
| `api/support.js` | Support form → Slack webhook | 29 |
| `api/telegram-webhook.js` | Telegram bot → agent task queue | 36 |

## 5. Database Migrations (26 files, ~543 lines)

| Migration | Purpose |
|-----------|---------|
| `001_init.sql` | Core tables: interviews, questions, responses, sessions, participants |
| `002_funnel_events.sql` | Funnel event tracking |
| `003_agent_tasks.sql` | Agent task queue (Telegram bot) |
| `004_subscriptions.sql` | Subscription & payment history |
| `005_participant_rewards.sql` | Bank account & reward tracking |
| `006_reward_amount.sql` | Add reward_amount to interviews |
| `007_response_unique.sql` | Unique constraint (session_id, question_id) |
| `008_subscription_cancelled_status.sql` | Add 'cancelled' status |
| `009_participant_rewards_nullable_user.sql` | Nullable user_id for pre-auth rewards |
| `010_question_stimulus.sql` | JSONB stimulus column |
| `011_question_followup_enabled.sql` | Follow-up toggle |
| `012_expert_verification.sql` | Profiles + expert verification |
| `013_audio_bucket.sql` | Audio storage bucket |
| `014_public_report_token.sql` | Public report sharing token |
| `015_onboarding.sql` | Onboarding completion tracking |
| `016_report_comments.sql` | Report comments + RLS |
| `017_interview_members.sql` | Interview collaborators |
| `018_stimuli_bucket.sql` | Stimuli storage bucket |
| `019_creative_prototype_types.sql` | Creative/prototype question types |
| `020_payments.sql` | Orders & credits tables |
| `021_panel_profile.sql` | Panel-specific profile fields |
| `022_slack_webhook.sql` | Slack webhook URL per interview |
| `023_fix_sessions_rls.sql` | Fix sessions RLS policy |
| `024_quality_score.sql` | Session quality score |
| `025_rate_limits.sql` | Rate limits table + function |
| `026_interview_ends_at.sql` | Interview end date |

## 6. Harness — Agent Task Runner (5 files, 393 lines)

| File | Purpose | Lines |
|------|---------|-------|
| `harness/dispatcher.js` | Poll & dispatch agent tasks (max 3 concurrent) | 128 |
| `harness/runner.js` | Execute tasks: route to Notion/Gmail/Telegram | 133 |
| `harness/notify.js` | Telegram message sender | 42 |
| `harness/gmail.js` | Email via Gmail/nodemailer | 40 |
| `harness/notion.js` | Post to Notion database | 49 |

## 7. Test Suite (8 files, 2,260 lines)

| File | Purpose | Lines |
|------|---------|-------|
| `src/test/setup.ts` | JSDOM mocks (IntersectionObserver, matchMedia) | 23 |
| `src/test/App.test.tsx` | App integration tests | 230 |
| `src/test/lib.test.ts` | Routes & utility unit tests | 410 |
| `src/test/hooks.test.tsx` | Custom hooks tests | 336 |
| `src/test/components.test.tsx` | UI component tests | 693 |
| `src/test/DashboardScreen.test.tsx` | Dashboard integration tests | 425 |
| `src/test/LandingScreen.test.tsx` | Landing page tests | 34 |
| `src/test/survey.test.ts` | Survey API logic tests | 109 |
