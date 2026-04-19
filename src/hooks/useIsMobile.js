import { useState, useEffect } from "react";

const MQ = typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)") : null;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(MQ ? MQ.matches : false);
  useEffect(() => {
    if (!MQ) return;
    const fn = (e) => setIsMobile(e.matches);
    MQ.addEventListener("change", fn);
    return () => MQ.removeEventListener("change", fn);
  }, []);
  return isMobile;
}
