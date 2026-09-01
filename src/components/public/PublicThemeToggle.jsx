"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { usePublicTheme } from "@/components/public/PublicThemeProvider";

const THEME_OPTIONS = {
  light: {
    icon: Sun,

    label: "Light theme",

    next: "dark",
  },

  dark: {
    icon: Moon,

    label: "Dark theme",

    next: "system",
  },

  system: {
    icon: Monitor,

    label: "System theme",

    next: "light",
  },
};

export default function PublicThemeToggle({ size = "default" }) {
  const {
    selectedMode,

    resolvedTheme,

    allowVisitorPreference,

    setThemePreference,
  } = usePublicTheme();

  if (!allowVisitorPreference) {
    return null;
  }

  const option = THEME_OPTIONS[selectedMode] || THEME_OPTIONS.system;

  const Icon = option.icon;

  const large = size === "large";

  function changeTheme() {
    setThemePreference(option.next);
  }

  return (
    <button
      type="button"
      onClick={changeTheme}
      aria-label={`${option.label}. Change theme.`}
      title={option.label}
      data-theme-mode={selectedMode}
      data-resolved-theme={resolvedTheme}
      className={`
        inline-flex
        shrink-0
        items-center
        justify-center
        rounded-full
        border
        border-[var(--public-border)]
        bg-[var(--public-surface)]
        text-[var(--public-foreground)]
        transition
        duration-200
        hover:border-[var(--public-primary)]
        hover:text-[var(--public-primary)]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[var(--public-primary)]
        focus-visible:ring-offset-2
        focus-visible:ring-offset-[var(--public-background)]

        ${large ? "h-12 w-12" : "h-9 w-9"}
      `}
    >
      <Icon size={large ? 21 : 17} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
