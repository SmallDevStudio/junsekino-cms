"use client";

import { useEffect } from "react";

import { useCompanyWorkspace } from "./CompanyWorkspaceProvider";

const DEFAULT_PRIMARY = "#18181b";

function isValidHexColor(value) {
  if (typeof value !== "string") {
    return false;
  }

  return /^#([0-9A-F]{3}){1,2}$/i.test(value.trim());
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "").trim();

  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16),
  };
}

function createSoftColor(hex) {
  const { r, g, b } = hexToRgb(hex);

  return `rgba(${r}, ${g}, ${b}, 0.09)`;
}

function getPrimaryColor(company) {
  const candidates = [
    company?.primaryColor,
    company?.color,
    company?.theme?.primary,
    company?.branding?.primaryColor,
    company?.branding?.primary,
  ];

  const color = candidates.find((value) => isValidHexColor(value));

  return color || DEFAULT_PRIMARY;
}

export default function CompanyTheme() {
  const { activeCompany } = useCompanyWorkspace();

  useEffect(() => {
    const primary = getPrimaryColor(activeCompany);

    const root = document.documentElement;

    root.style.setProperty("--company-primary", primary);

    root.style.setProperty("--company-primary-soft", createSoftColor(primary));

    root.style.setProperty("--company-primary-foreground", "#ffffff");

    return () => {
      root.style.removeProperty("--company-primary");

      root.style.removeProperty("--company-primary-soft");

      root.style.removeProperty("--company-primary-foreground");
    };
  }, [activeCompany]);

  return null;
}
