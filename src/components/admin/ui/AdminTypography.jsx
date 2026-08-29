"use client";

import { useEffect } from "react";

import { ADMIN_FONT_SIZE } from "@/constants/admin-ui";

import { useAdminUiPreferences } from "@/components/admin/ui/AdminUiPreferencesProvider";

const FONT_SCALE = {
  [ADMIN_FONT_SIZE.SMALL]: 1,

  [ADMIN_FONT_SIZE.MEDIUM]: 1.08,

  [ADMIN_FONT_SIZE.LARGE]: 1.16,
};

export default function AdminTypography() {
  const { fontSize } = useAdminUiPreferences();

  useEffect(() => {
    const root = document.documentElement;

    const scale = FONT_SCALE[fontSize] || 1;

    root.style.setProperty("--admin-font-scale", String(scale));

    root.dataset.adminFontSize = fontSize;

    return () => {
      root.style.removeProperty("--admin-font-scale");

      delete root.dataset.adminFontSize;
    };
  }, [fontSize]);

  return null;
}
