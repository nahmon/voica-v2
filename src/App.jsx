import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import { C, F } from "./lib/constants.jsx";

import LandingScreen from "./screens/LandingScreen.jsx";
import RoleSelectScreen from "./screens/RoleSelectScreen.jsx";
import AuthScreen from "./screens/AuthScreen.jsx";
import DashboardScreen from "./screens/DashboardScreen.jsx";
import EditorScreen from "./screens/EditorScreen.jsx";
import PanelEntryScreen from "./screens/PanelEntryScreen.jsx";
import PanelMyPageScreen from "./screens/PanelMyPageScreen.jsx";
import ConsentScreen from "./screens/ConsentScreen.jsx";
import InterviewScreen from "./screens/InterviewScreen.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";
import ResponsesScreen from "./screens/ResponsesScreen.jsx";
import RecruiterAdminScreen from "./screens/RecruiterAdminScreen.jsx";
import PanelBoardScreen from "./screens/PanelBoardScreen.jsx";
import PricingScreen from "./screens/PricingScreen.jsx";
import SupportScreen from "./screens/SupportScreen.jsx";
import FAQScreen from "./screens/FAQScreen.jsx";
import TermsScreen from "./screens/TermsScreen.jsx";
import PrivacyScreen from "./screens/PrivacyScreen.jsx";
import AboutScreen from "./screens/AboutScreen.jsx";
import { ToastProvider } from "./components/shared.jsx";

export default function Voica() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shareCode, setShareCode] = useState(null);
  const [interviewId, setInterviewId] = useState(null);
  const go = (s, id, code) => { setInterviewId(id ?? null); if (code !== undefined) setShareCode(code); setScreen(s); };

  useEffect(() => {
    // Detect /i/[code] URL for panel interview
    const match = window.location.pathname.match(/^\/i\/([a-z0-9]+)$/i);
    if (match) { setShareCode(match[1]); setScreen("interview"); }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user && !match) {
        const role = session.user.user_metadata?.role;
        if (!role) setScreen("role_select");
        else if (role === "panel") setScreen("panel_board");
        else setScreen("dashboard");
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      const isInterviewUrl = window.location.pathname.match(/^\/i\/([a-z0-9]+)$/i);
      const publicScreens = ["landing", "advertiser_login", "pricing", "support", "faq", "panel_entry", "panel_board"];
      if (session?.user && publicScreens.includes(screen) && !isInterviewUrl) {
        const role = session.user.user_metadata?.role;
        if (!role) setScreen("role_select");
        else if (role === "panel") setScreen("panel_board");
        else setScreen("dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setScreen("landing");
  };

  return (
    <ToastProvider>
    <div style={{ fontFamily: F, fontFeatureSettings: '"ss01"', color: C.navy }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}.cursor-blink{display:inline-block;width:10px;height:2px;background:${C.purple};margin-left:4px;vertical-align:0.1em;border-radius:0;animation:blink 0.8s step-end infinite;}`}</style>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes wave-0 { from { height: 4px } to { height: 20px } }
        @keyframes wave-1 { from { height: 6px } to { height: 26px } }
        @keyframes wave-2 { from { height: 8px } to { height: 22px } }
      `}</style>
      {screen === "landing"          && <LandingScreen go={go} user={user} logout={logout} />}
      {screen === "role_select"      && <RoleSelectScreen go={go} user={user} />}
      {screen === "advertiser_login" && <AuthScreen go={go} />}
      {screen === "dashboard"        && <DashboardScreen go={go} user={user} logout={logout} />}
      {screen === "editor"           && <EditorScreen go={go} user={user} logout={logout} interviewId={interviewId} />}
      {screen === "panel_entry"      && <PanelEntryScreen go={go} />}
      {screen === "panel_mypage"     && <PanelMyPageScreen go={go} user={user} logout={logout} />}
      {screen === "consent"          && <ConsentScreen go={go} user={user} logout={logout} shareCode={shareCode} />}
      {screen === "interview"        && <InterviewScreen go={go} shareCode={shareCode} />}
      {screen === "report"           && <ReportScreen go={go} user={user} logout={logout} interviewId={interviewId} />}
      {screen === "responses"        && <ResponsesScreen go={go} user={user} logout={logout} interviewId={interviewId} />}
      {screen === "recruiter_admin"  && <RecruiterAdminScreen go={go} user={user} logout={logout} />}
      {screen === "panel_board"      && <PanelBoardScreen go={go} user={user} logout={logout} />}
      {screen === "pricing"          && <PricingScreen go={go} user={user} logout={logout} />}
      {screen === "support"          && <SupportScreen go={go} user={user} logout={logout} />}
      {screen === "faq"              && <FAQScreen go={go} user={user} logout={logout} />}
      {screen === "terms"            && <TermsScreen go={go} user={user} logout={logout} />}
      {screen === "privacy"          && <PrivacyScreen go={go} user={user} logout={logout} />}
      {screen === "about"            && <AboutScreen go={go} user={user} logout={logout} />}
    </div>
    </ToastProvider>
  );
}
