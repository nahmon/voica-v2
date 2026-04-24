import { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "./supabase.js";
import { C, F } from "./lib/constants.jsx";
import { ToastProvider, useToast } from "./components/shared.jsx";

const LandingScreen        = lazy(() => import("./screens/LandingScreen.jsx"));
const RoleSelectScreen     = lazy(() => import("./screens/RoleSelectScreen.jsx"));
const AuthScreen           = lazy(() => import("./screens/AuthScreen.jsx"));
const DashboardScreen      = lazy(() => import("./screens/DashboardScreen.jsx"));
const EditorScreen         = lazy(() => import("./screens/EditorScreen.jsx"));
const PanelEntryScreen     = lazy(() => import("./screens/PanelEntryScreen.jsx"));
const PanelMyPageScreen    = lazy(() => import("./screens/PanelMyPageScreen.jsx"));
const ConsentScreen        = lazy(() => import("./screens/ConsentScreen.jsx"));
const InterviewScreen      = lazy(() => import("./screens/InterviewScreen.jsx"));
const ReportScreen         = lazy(() => import("./screens/ReportScreen.jsx"));
const ResponsesScreen      = lazy(() => import("./screens/ResponsesScreen.jsx"));
const RecruiterAdminScreen = lazy(() => import("./screens/RecruiterAdminScreen.jsx"));
const PanelBoardScreen     = lazy(() => import("./screens/PanelBoardScreen.jsx"));
const PricingScreen        = lazy(() => import("./screens/PricingScreen.jsx"));
const SupportScreen        = lazy(() => import("./screens/SupportScreen.jsx"));
const FAQScreen            = lazy(() => import("./screens/FAQScreen.jsx"));
const TermsScreen          = lazy(() => import("./screens/TermsScreen.jsx"));
const PrivacyScreen        = lazy(() => import("./screens/PrivacyScreen.jsx"));
const AboutScreen          = lazy(() => import("./screens/AboutScreen.jsx"));
const BillingSuccessScreen = lazy(() => import("./screens/BillingSuccessScreen.jsx"));
const ExpertVerifyScreen   = lazy(() => import("./screens/ExpertVerifyScreen.jsx"));

function OAuthErrorHandler() {
  const { showToast } = useToast();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (!err) return;
    const code = params.get("error_code") ?? "";
    let msg = "로그인 중 오류가 발생했어요. 다시 시도해 주세요.";
    if (code === "bad_oauth_state") msg = "로그인 세션이 만료됐어요. 다시 시도해 주세요.";
    showToast(msg, "error");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);
  return null;
}

// Route wrappers that extract URL params and pass as props
function EditorRoute(props) {
  const { id } = useParams();
  return <EditorScreen {...props} interviewId={id} />;
}
function InterviewRoute({ go }) {
  const { code } = useParams();
  return <InterviewScreen go={go} shareCode={code} />;
}
function ConsentRoute(props) {
  const { code } = useParams();
  const { state } = useLocation();
  return <ConsentScreen {...props} shareCode={code ?? state?.shareCode} />;
}
function ReportRoute(props) {
  const { id } = useParams();
  return <ReportScreen {...props} interviewId={id} />;
}
function ResponsesRoute(props) {
  const { id } = useParams();
  return <ResponsesScreen {...props} interviewId={id} />;
}

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shareCode, setShareCode] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem("voica_lang") ?? "ko");
  const navigate = useNavigate();

  const handleLangChange = (code) => { setLang(code); localStorage.setItem("voica_lang", code); };

  const go = (screen, id, code) => {
    window.scrollTo(0, 0);
    if (code !== undefined) setShareCode(code);
    if (screen === "editor")           { navigate(id ? `/editor/${id}` : "/editor"); return; }
    if (screen === "interview")        { navigate(`/i/${code ?? id}`); return; }
    if (screen === "consent")          { navigate("/consent", { state: { shareCode: code ?? shareCode } }); return; }
    if (screen === "report")           { navigate(`/report/${id}`); return; }
    if (screen === "responses")        { navigate(`/responses/${id}`); return; }
    const paths = {
      landing: "/", dashboard: "/dashboard", role_select: "/role-select",
      advertiser_login: "/auth", panel_board: "/panel", panel_entry: "/panel/entry",
      panel_mypage: "/panel/mypage", recruiter_admin: "/admin",
      pricing: "/pricing", support: "/support", faq: "/faq",
      terms: "/terms", privacy: "/privacy", about: "/about",
      expert_verify: "/panel/expert-verify",
    };
    navigate(paths[screen] ?? "/");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      const _exempt = /^\/(i|report|responses|editor)\//;
      if (session?.user && !_exempt.test(window.location.pathname)) {
        const role = session.user.user_metadata?.role;
        if (!role) navigate("/role-select");
        else if (role === "panel") navigate("/panel");
        else navigate("/dashboard");
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event !== "SIGNED_IN") return;
      const _exempt2 = /^\/(i|report|responses|editor)\//;
      if (session?.user && !_exempt2.test(window.location.pathname)) {
        const role = session.user.user_metadata?.role;
        if (!role) navigate("/role-select");
        else if (role === "panel") navigate("/panel");
        else navigate("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); setUser(null); navigate("/"); };
  const common = { go, user, logout, lang, onLangChange: handleLangChange };

  if (authLoading) return null;

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/"              element={<LandingScreen {...common} />} />
        <Route path="/role-select"   element={<RoleSelectScreen go={go} user={user} />} />
        <Route path="/auth"          element={<AuthScreen go={go} lang={lang} />} />
        <Route path="/dashboard"     element={<DashboardScreen {...common} />} />
        <Route path="/editor"        element={<EditorRoute go={go} user={user} logout={logout} />} />
        <Route path="/editor/:id"    element={<EditorRoute go={go} user={user} logout={logout} />} />
        <Route path="/panel/entry"   element={<PanelEntryScreen go={go} lang={lang} onLangChange={handleLangChange} />} />
        <Route path="/panel/mypage"  element={<PanelMyPageScreen {...common} />} />
        <Route path="/consent"       element={<ConsentRoute {...common} />} />
        <Route path="/consent/:code" element={<ConsentRoute {...common} />} />
        <Route path="/i/:code"       element={<InterviewRoute go={go} />} />
        <Route path="/report/:id"    element={<ReportRoute {...common} />} />
        <Route path="/responses/:id" element={<ResponsesRoute {...common} />} />
        <Route path="/admin"         element={<RecruiterAdminScreen {...common} />} />
        <Route path="/panel"         element={<PanelBoardScreen {...common} />} />
        <Route path="/pricing"       element={<PricingScreen {...common} />} />
        <Route path="/support"       element={<SupportScreen {...common} />} />
        <Route path="/faq"           element={<FAQScreen {...common} />} />
        <Route path="/terms"         element={<TermsScreen {...common} />} />
        <Route path="/privacy"       element={<PrivacyScreen {...common} />} />
        <Route path="/about"          element={<AboutScreen {...common} />} />
        <Route path="/billing/success" element={<BillingSuccessScreen {...common} />} />
        <Route path="/panel/expert-verify" element={<ExpertVerifyScreen {...common} />} />
        <Route path="*"              element={<LandingScreen {...common} />} />
      </Routes>
    </Suspense>
  );
}

export default function Voica() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <OAuthErrorHandler />
        <div style={{ fontFamily: F, fontFeatureSettings: '"ss01"', color: C.navy }}>
          <AppRoutes />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
