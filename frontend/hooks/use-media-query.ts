"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe matchMedia hook. Returns false during SSR / first render,
 * then synchronises with the actual viewport on the client.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** True when viewport ≤ 768px (phones + small tablets portrait) */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}

/** True when viewport is 769px – 1024px (tablets) */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
}

/** True when viewport ≤ 1024px (mobile OR tablet) */
export function useIsMobileOrTablet(): boolean {
  return useMediaQuery("(max-width: 1024px)");
}
