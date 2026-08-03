import { useEffect } from "react";

/** Hide bottom tab bar when a full-screen sticky footer is shown (cook / recipe detail). */
export function useHideMobileNav(active) {
  useEffect(() => {
    if (!active) return undefined;
    document.body.classList.add("hide-mobile-nav");
    return () => document.body.classList.remove("hide-mobile-nav");
  }, [active]);
}
