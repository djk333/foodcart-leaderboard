"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("drexel_theme");
      const currentTheme = saved === "dark" ? "dark" : "light";

      setTheme(currentTheme);
      document.documentElement.setAttribute("data-theme", currentTheme);
    } catch {
      document.documentElement.setAttribute("data-theme", "light");
    }

    setReady(true);
  }, []);

  function toggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);

    try {
      localStorage.setItem("drexel_theme", nextTheme);
    } catch {}

    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  if (!ready) return null;

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      style={{
        position: "fixed",
        right: 16,
        top: 80,
        zIndex: 9999,
        width: 42,
        height: 42,
        borderRadius: "50%",
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: "var(--text)",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "var(--shadow)",
        display: "grid",
        placeItems: "center",
      }}
    >
      {theme === "dark" ? "☾" : "☀"}
    </button>
  );
}