"use client";

import { useEffect } from "react";

import { useCompanyWorkspace } from "./CompanyWorkspaceProvider";

const DEFAULT_PRIMARY = "#18181b";

function normalizeHexColor(value) {
  if (typeof value !== "string") {
    return null;
  }

  const color = value.trim();

  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    return null;
  }

  if (color.length === 4) {
    return `#${color
      .slice(1)
      .split("")
      .map((character) => character + character)
      .join("")}`;
  }

  return color.toLowerCase();
}

function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex);

  if (!normalized) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (value) =>
    Math.round(Math.max(0, Math.min(255, value)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColors(color, target, amount) {
  const sourceRgb = hexToRgb(color);
  const targetRgb = hexToRgb(target);

  if (!sourceRgb || !targetRgb) {
    return color;
  }

  return rgbToHex({
    r: sourceRgb.r + (targetRgb.r - sourceRgb.r) * amount,
    g: sourceRgb.g + (targetRgb.g - sourceRgb.g) * amount,
    b: sourceRgb.b + (targetRgb.b - sourceRgb.b) * amount,
  });
}

function getRelativeLuminance(hex) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return 0;
  }

  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const channel = value / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function getContrastRatio(first, second) {
  const firstLuminance = getRelativeLuminance(first);
  const secondLuminance = getRelativeLuminance(second);

  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getForegroundColor(background) {
  const black = "#111111";
  const white = "#ffffff";

  const blackContrast = getContrastRatio(background, black);
  const whiteContrast = getContrastRatio(background, white);

  return blackContrast >= whiteContrast ? black : white;
}

function createSoftColor(hex) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return "#f4f4f5";
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
}

function createSoftStrongColor(hex) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return "#e4e4e7";
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.17)`;
}

function createBorderColor(hex) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return "#d4d4d8";
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
}

function getPrimaryColor(company) {
  const candidates = [
    // Current Firestore structure — use this first
    company?.colors?.primary,

    // Possible nested branding structure
    company?.branding?.colors?.primary,

    // Legacy compatibility
    company?.primaryColor,
    company?.color,

    company?.theme?.primary,
    company?.theme?.primaryColor,

    company?.branding?.primaryColor,
    company?.branding?.primary,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeHexColor(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return DEFAULT_PRIMARY;
}

function createCompanyTheme(company) {
  const primary = getPrimaryColor(company);

  /*
   * Bright company colors need a darker hover state.
   * Dark colors receive a slightly lighter hover state
   * so the interaction remains visually noticeable.
   */
  const luminance = getRelativeLuminance(primary);

  const primaryHover =
    luminance > 0.35
      ? mixColors(primary, "#000000", 0.14)
      : mixColors(primary, "#ffffff", 0.12);

  const foreground = getForegroundColor(primary);
  const hoverForeground = getForegroundColor(primaryHover);

  return {
    primary,
    primaryHover,

    primaryForeground: foreground,
    primaryHoverForeground: hoverForeground,

    primarySoft: createSoftColor(primary),
    primarySoftStrong: createSoftStrongColor(primary),
    primaryBorder: createBorderColor(primary),
  };
}

function applyTheme(root, theme) {
  root.style.setProperty("--company-primary", theme.primary);

  root.style.setProperty("--company-primary-hover", theme.primaryHover);

  root.style.setProperty(
    "--company-primary-foreground",
    theme.primaryForeground,
  );

  root.style.setProperty(
    "--company-primary-hover-foreground",
    theme.primaryHoverForeground,
  );

  root.style.setProperty("--company-primary-soft", theme.primarySoft);

  root.style.setProperty(
    "--company-primary-soft-strong",
    theme.primarySoftStrong,
  );

  root.style.setProperty("--company-primary-border", theme.primaryBorder);

  /*
   * Public website brand aliases.
   *
   * Both Admin and Public now consume the same
   * company brand source.
   */
  root.style.setProperty("--brand-primary", theme.primary);

  root.style.setProperty("--brand-primary-foreground", theme.primaryForeground);

  root.style.setProperty("--brand-primary-hover", theme.primaryHover);

  root.style.setProperty("--brand-primary-soft", theme.primarySoft);
}

function removeTheme(root) {
  const properties = [
    "--company-primary",
    "--company-primary-hover",
    "--company-primary-foreground",
    "--company-primary-hover-foreground",
    "--company-primary-soft",
    "--company-primary-soft-strong",
    "--company-primary-border",

    "--brand-primary",
    "--brand-primary-foreground",
    "--brand-primary-hover",
    "--brand-primary-soft",
  ];

  properties.forEach((property) => {
    root.style.removeProperty(property);
  });
}

export default function CompanyTheme() {
  const { activeCompany } = useCompanyWorkspace();

  useEffect(() => {
    const root = document.documentElement;

    const theme = createCompanyTheme(activeCompany);

    applyTheme(root, theme);

    return () => {
      removeTheme(root);
    };
  }, [activeCompany]);

  return null;
}
