"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setTheme = useAppStore((s) => s.setTheme);
  const setChatColor = useAppStore((s) => s.setChatColor);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("signal_theme") as "dark" | "light" | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        // default to dark
        document.documentElement.setAttribute("data-theme", "dark");
      }

      const savedColor = localStorage.getItem("signal_chat_color");
      if (savedColor) {
        setChatColor(savedColor);
        document.documentElement.style.setProperty("--bubble-out", savedColor);
      }
    } catch {
      /* ignore */
    }
  }, [setTheme, setChatColor]);

  return <>{children}</>;
}
