"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
export type ThemePreference = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: Theme; // the resolved theme currently applied
  preference: ThemePreference; // the user's choice (system = follow the OS)
  setPreference: (p: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Keep in sync with the no-flash script in layout.tsx.
export const THEME_STORAGE_KEY = "9h-theme";

function systemTheme(): Theme {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function resolve(pref: ThemePreference): Theme {
  return pref === "system" ? systemTheme() : pref;
}

function readStoredPreference(): ThemePreference {
  // Dark is the brand default when nothing is stored (UIUX_FLOW §Theme Default).
  const stored = typeof window !== "undefined" ? localStorage.getItem(THEME_STORAGE_KEY) : null;
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>("dark");
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const pref = readStoredPreference();
    setPref(pref);
    setThemeState(resolve(pref));

    // Track OS changes while the preference is "system".
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (readStoredPreference() === "system") {
        const next = systemTheme();
        document.documentElement.setAttribute("data-theme", next);
        setThemeState(next);
      }
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // private mode / storage disabled — theme still applies for this session
    }
    const applied = resolve(next);
    document.documentElement.setAttribute("data-theme", applied);
    setPref(next);
    setThemeState(applied);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [theme, setPreference]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
