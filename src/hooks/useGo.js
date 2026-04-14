import { useNavigate } from "react-router-dom";
import { ROUTES, ID_SCREENS, CODE_SCREEN } from "../lib/routes.js";

/**
 * Drop-in replacement for the old `go(screen, id?, code?)` prop.
 * Returns a function with the same signature that uses React Router navigation.
 */
export function useGo() {
  const navigate = useNavigate();
  return (screen, id, code) => {
    let path = ROUTES[screen] || "/";
    if (id && ID_SCREENS.has(screen)) path = `${path}/${id}`;
    if (screen === CODE_SCREEN && (code ?? id)) path = `${path}/${code ?? id}`;
    navigate(path);
  };
}
