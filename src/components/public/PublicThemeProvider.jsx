"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const PublicThemeContext = createContext(null);

const THEME_EVENT = "junsekino:public-theme-change";

const VALID_PREFERENCES = new Set(["light", "dark", "system"]);

function normalizeMode(value) {
  return VALID_PREFERENCES.has(value) ? value : "light";
}

function resolveSystemTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(mode) {
  return mode === "system" ? resolveSystemTheme() : mode;
}

function createStorageKey(companySlug) {
  return `junsekino.public.theme.${companySlug || "default"}`;
}

function normalizeColorSet(colors = {}, fallback = {}) {
  return {
    background: colors.background || fallback.background || "#ffffff",

    surface: colors.surface || fallback.surface || "#f7f7f7",

    text: colors.text || fallback.text || "#111111",

    mutedText: colors.mutedText || fallback.mutedText || "#737373",

    border: colors.border || fallback.border || "#e5e5e5",
  };
}

export default function PublicThemeProvider({
  companySlug,

  defaultMode = "light",

  allowVisitorPreference = false,

  primary = "#000000",

  secondary = "#ffffff",

  accent,

  light,

  dark,

  children,
}) {
  const normalizedDefaultMode = normalizeMode(defaultMode);

  const storageKey = createStorageKey(companySlug);

  const lightColors = useMemo(
    () =>
      normalizeColorSet(light, {
        background: "#ffffff",

        surface: "#f7f7f7",

        text: "#111111",

        mutedText: "#737373",

        border: "#e5e5e5",
      }),
    [light],
  );

  const darkColors = useMemo(
    () =>
      normalizeColorSet(dark, {
        background: "#111111",

        surface: "#1a1a1a",

        text: "#f5f5f5",

        mutedText: "#a3a3a3",

        border: "#333333",
      }),
    [dark],
  );

  const subscribe = useCallback((callback) => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange() {
      callback();
    }

    window.addEventListener("storage", handleChange);

    window.addEventListener(THEME_EVENT, handleChange);

    media.addEventListener("change", handleChange);

    return () => {
      window.removeEventListener("storage", handleChange);

      window.removeEventListener(THEME_EVENT, handleChange);

      media.removeEventListener("change", handleChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    let selectedMode = normalizedDefaultMode;

    if (allowVisitorPreference && typeof window !== "undefined") {
      try {
        const storedMode = window.localStorage.getItem(storageKey);

        if (VALID_PREFERENCES.has(storedMode)) {
          selectedMode = storedMode;
        }
      } catch {
        // localStorage may be unavailable.
      }
    }

    const resolvedTheme = resolveTheme(selectedMode);

    return `${selectedMode}:${resolvedTheme}`;
  }, [allowVisitorPreference, normalizedDefaultMode, storageKey]);

  const getServerSnapshot = useCallback(() => {
    const resolvedTheme = normalizedDefaultMode === "dark" ? "dark" : "light";

    return `${normalizedDefaultMode}:${resolvedTheme}`;
  }, [normalizedDefaultMode]);

  const snapshot = useSyncExternalStore(
    subscribe,

    getSnapshot,

    getServerSnapshot,
  );

  const [selectedMode, resolvedTheme] = snapshot.split(":");

  const colors = resolvedTheme === "dark" ? darkColors : lightColors;

  const setThemePreference = useCallback(
    (mode) => {
      if (!allowVisitorPreference || typeof window === "undefined") {
        return false;
      }

      const normalizedMode = normalizeMode(mode);

      try {
        window.localStorage.setItem(storageKey, normalizedMode);
      } catch {
        return false;
      }

      window.dispatchEvent(new Event(THEME_EVENT));

      return true;
    },
    [allowVisitorPreference, storageKey],
  );

  const resetThemePreference = useCallback(() => {
    if (!allowVisitorPreference || typeof window === "undefined") {
      return false;
    }

    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      return false;
    }

    window.dispatchEvent(new Event(THEME_EVENT));

    return true;
  }, [allowVisitorPreference, storageKey]);

  const contextValue = useMemo(
    () => ({
      selectedMode,

      resolvedTheme,

      allowVisitorPreference,

      setThemePreference,

      resetThemePreference,
    }),
    [
      selectedMode,

      resolvedTheme,

      allowVisitorPreference,

      setThemePreference,

      resetThemePreference,
    ],
  );

  return (
    <PublicThemeContext.Provider value={contextValue}>
      <div
        data-public-theme={resolvedTheme}
        data-public-theme-mode={selectedMode}
        className="flex min-h-svh flex-col"
        style={{
          colorScheme: resolvedTheme,

          "--public-primary": primary,

          "--public-secondary": secondary,

          "--public-accent": accent || primary,

          "--public-background": colors.background,

          "--public-surface": colors.surface,

          "--public-foreground": colors.text,

          "--public-muted-foreground": colors.mutedText,

          "--public-border": colors.border,

          backgroundColor: "var(--public-background)",

          color: "var(--public-foreground)",
        }}
      >
        {children}
      </div>
    </PublicThemeContext.Provider>
  );
}

export function usePublicTheme() {
  const context = useContext(PublicThemeContext);

  if (!context) {
    throw new Error("usePublicTheme must be used inside PublicThemeProvider.");
  }

  return context;
}
