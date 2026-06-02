"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { themes } from "./themes";
import { updateProfile } from "./api";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("default-light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app_theme");
    if (saved && themes[saved]) setThemeState(saved);
    setLoaded(true);

    const handler = (e) => {
      if (e.detail && themes[e.detail]) {
        setThemeState(e.detail);
      }
    };
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const setTheme = useCallback((name, persistToServer = true) => {
    setThemeState(name);
    localStorage.setItem("app_theme", name);
    if (persistToServer) {
      updateProfile({ theme: name }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const t = themes[theme];
    if (!t) return;
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
    if (theme === "default-dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themes, setTheme, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
