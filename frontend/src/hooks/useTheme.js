import { useEffect, useState, useCallback } from "react";

const THEME_KEY = "research-theme";

export function useTheme() {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  const setThemeClass = useCallback((next) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (_) {
      // ignore storage errors
    }
    if (next === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    let next = "dark";
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") {
        next = stored;
      } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        next = "light";
      }
    } catch (_) {
      // ignore
    }
    setThemeClass(next);
  }, [setThemeClass]);

  const toggle = useCallback(() => {
    setThemeClass(theme === "dark" ? "light" : "dark");
  }, [theme, setThemeClass]);

  return { theme, toggle, mounted };
}