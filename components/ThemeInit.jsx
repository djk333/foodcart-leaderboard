"use client";

import { useEffect } from "react";

export default function ThemeInit() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("drexel_theme");
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      const theme =
        saved === "dark" || saved === "light"
          ? saved
          : systemPrefersDark
          ? "dark"
          : "light";

      document.documentElement.setAttribute("data-theme", theme);
    } catch {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  return null;
}