// NOTE: This file is not currently used — App.jsx manages auth state directly.
// Keeping for potential future use. If removing, also update any imports.
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase.js";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_PATHS = ["/", "/login", "/pricing", "/support", "/faq", "/panel/join", "/panel", "/terms", "/privacy", "/about"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user && !location.pathname.startsWith("/i/")) {
        const role = session.user.user_metadata?.role;
        if (!role) navigate("/role-select", { replace: true });
        else if (role === "panel") navigate("/panel", { replace: true });
        else navigate("/dashboard", { replace: true });
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && PUBLIC_PATHS.includes(location.pathname)) {
        const role = session.user.user_metadata?.role;
        if (!role) navigate("/role-select", { replace: true });
        else if (role === "panel") navigate("/panel", { replace: true });
        else navigate("/dashboard", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  if (authLoading) return null;

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
