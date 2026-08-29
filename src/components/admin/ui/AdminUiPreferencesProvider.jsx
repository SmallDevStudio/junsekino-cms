"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ADMIN_ACTION_DISPLAY,
  ADMIN_DENSITY,
  ADMIN_FONT_SIZE,
  ADMIN_LOCALE,
  ADMIN_UI_DEFAULTS,
} from "@/constants/admin-ui";

const AdminUiPreferencesContext = createContext(null);

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getUserId(user) {
  return user?.uid || user?.id || user?.userId || "anonymous";
}

function getStorageKey(user) {
  return `junsekino.admin.preferences.${getUserId(user)}`;
}

function isActionDisplay(value) {
  return Object.values(ADMIN_ACTION_DISPLAY).includes(value);
}

function isDensity(value) {
  return Object.values(ADMIN_DENSITY).includes(value);
}

function isFontSize(value) {
  return Object.values(ADMIN_FONT_SIZE).includes(value);
}

function isLocale(value) {
  return Object.values(ADMIN_LOCALE).includes(value);
}

function normalizePreferences(value = {}) {
  return {
    actionDisplay: isActionDisplay(value.actionDisplay)
      ? value.actionDisplay
      : ADMIN_UI_DEFAULTS.actionDisplay,

    tooltipEnabled:
      typeof value.tooltipEnabled === "boolean"
        ? value.tooltipEnabled
        : ADMIN_UI_DEFAULTS.tooltipEnabled,

    tooltipDelay:
      Number.isFinite(Number(value.tooltipDelay)) &&
      Number(value.tooltipDelay) >= 0
        ? Number(value.tooltipDelay)
        : ADMIN_UI_DEFAULTS.tooltipDelay,

    density: isDensity(value.density)
      ? value.density
      : ADMIN_UI_DEFAULTS.density,

    fontSize: isFontSize(value.fontSize)
      ? value.fontSize
      : ADMIN_UI_DEFAULTS.fontSize,

    locale: isLocale(value.locale) ? value.locale : ADMIN_UI_DEFAULTS.locale,

    sidebarCollapsed:
      typeof value.sidebarCollapsed === "boolean"
        ? value.sidebarCollapsed
        : ADMIN_UI_DEFAULTS.sidebarCollapsed,
  };
}

function getInitialPreferences(user) {
  return normalizePreferences(
    user?.preferences?.admin || user?.preferences?.adminUi || {},
  );
}

function readLocalPreferences(user) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(user));

    if (!raw) {
      return null;
    }

    return normalizePreferences(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalPreferences(user, preferences) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getStorageKey(user),

      JSON.stringify(preferences),
    );
  } catch {
    // Ignore local cache failure.
  }
}

/*
 * =========================================================
 * PROVIDER
 * =========================================================
 */

export function AdminUiPreferencesProvider({ user, children }) {
  const initialPreferences = useMemo(() => getInitialPreferences(user), [user]);

  const [preferences, setPreferences] = useState(initialPreferences);

  const [ready, setReady] = useState(false);

  const [saving, setSaving] = useState(false);

  const initializedUserRef = useRef(null);

  const saveTimerRef = useRef(null);

  /*
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {
    const userId = getUserId(user);

    /*
     * Each authenticated user gets an
     * independent preference initialization.
     */
    if (initializedUserRef.current === userId) {
      return;
    }

    initializedUserRef.current = userId;

    let active = true;

    const timeoutId = window.setTimeout(async () => {
      /*
       * Start from session values.
       */
      let resolved = initialPreferences;

      /*
       * Apply cached user preference
       * immediately.
       */
      const cached = readLocalPreferences(user);

      if (cached) {
        resolved = normalizePreferences({
          ...resolved,
          ...cached,
        });
      }

      if (active) {
        setPreferences(resolved);
      }

      /*
       * Firestore-backed preference is
       * the final persistent source.
       */
      try {
        const response = await fetch("/api/v1/users/me/preferences", {
          method: "GET",

          cache: "no-store",

          credentials: "same-origin",
        });

        if (response.ok) {
          const payload = await response.json();

          if (payload?.success && payload?.data?.admin) {
            resolved = normalizePreferences(payload.data.admin);
          }
        }
      } catch (error) {
        console.error("Load admin preferences error:", error);
      }

      if (!active) {
        return;
      }

      setPreferences(resolved);

      writeLocalPreferences(user, resolved);

      setReady(true);
    }, 0);

    return () => {
      active = false;

      window.clearTimeout(timeoutId);
    };
  }, [user, initialPreferences]);

  /*
   * =======================================================
   * PERSIST
   * =======================================================
   */

  const persistPreferences = useCallback(
    (nextPreferences) => {
      /*
       * Immediate local persistence.
       */
      writeLocalPreferences(user, nextPreferences);

      /*
       * Debounce server writes.
       */
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(async () => {
        setSaving(true);

        try {
          const response = await fetch("/api/v1/users/me/preferences", {
            method: "PATCH",

            headers: {
              "Content-Type": "application/json",
            },

            credentials: "same-origin",

            body: JSON.stringify({
              admin: nextPreferences,
            }),
          });

          const payload = await response.json();

          if (!response.ok || payload?.success === false) {
            throw new Error(payload?.message || "PREFERENCE_SAVE_FAILED");
          }

          /*
           * Server-normalized preference
           * becomes the final value.
           */
          if (payload?.data?.admin) {
            const saved = normalizePreferences(payload.data.admin);

            setPreferences(saved);

            writeLocalPreferences(user, saved);
          }
        } catch (error) {
          console.error("Save admin preferences error:", error);
        } finally {
          setSaving(false);
        }
      }, 400);
    },
    [user],
  );

  /*
   * =======================================================
   * UPDATE
   * =======================================================
   */

  const updatePreferences = useCallback(
    (patch) => {
      setPreferences((current) => {
        /*
         * Merge with CURRENT state.
         *
         * Changing locale therefore
         * never resets fontSize, density,
         * sidebar or other preferences.
         */
        const next = normalizePreferences({
          ...current,

          ...patch,
        });

        persistPreferences(next);

        return next;
      });
    },
    [persistPreferences],
  );

  const setActionDisplay = useCallback(
    (actionDisplay) => {
      updatePreferences({
        actionDisplay,
      });
    },
    [updatePreferences],
  );

  const setTooltipEnabled = useCallback(
    (tooltipEnabled) => {
      updatePreferences({
        tooltipEnabled,
      });
    },
    [updatePreferences],
  );

  const setTooltipDelay = useCallback(
    (tooltipDelay) => {
      updatePreferences({
        tooltipDelay,
      });
    },
    [updatePreferences],
  );

  const setDensity = useCallback(
    (density) => {
      updatePreferences({
        density,
      });
    },
    [updatePreferences],
  );

  const setFontSize = useCallback(
    (fontSize) => {
      updatePreferences({
        fontSize,
      });
    },
    [updatePreferences],
  );

  const setLocale = useCallback(
    (locale) => {
      updatePreferences({
        locale,
      });
    },
    [updatePreferences],
  );

  const setSidebarCollapsed = useCallback(
    (sidebarCollapsed) => {
      updatePreferences({
        sidebarCollapsed: Boolean(sidebarCollapsed),
      });
    },
    [updatePreferences],
  );

  const toggleSidebar = useCallback(() => {
    setPreferences((current) => {
      const next = normalizePreferences({
        ...current,

        sidebarCollapsed: !current.sidebarCollapsed,
      });

      persistPreferences(next);

      return next;
    });
  }, [persistPreferences]);

  const resetPreferences = useCallback(() => {
    const next = normalizePreferences({
      ...ADMIN_UI_DEFAULTS,
    });

    setPreferences(next);

    persistPreferences(next);
  }, [persistPreferences]);

  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  /*
   * =======================================================
   * CONTEXT
   * =======================================================
   */

  const value = useMemo(
    () => ({
      preferences,

      ready,

      saving,

      actionDisplay: preferences.actionDisplay,

      tooltipEnabled: preferences.tooltipEnabled,

      tooltipDelay: preferences.tooltipDelay,

      density: preferences.density,

      fontSize: preferences.fontSize,

      locale: preferences.locale,

      sidebarCollapsed: preferences.sidebarCollapsed,

      updatePreferences,

      setActionDisplay,

      setTooltipEnabled,

      setTooltipDelay,

      setDensity,

      setFontSize,

      setLocale,

      setSidebarCollapsed,

      toggleSidebar,

      resetPreferences,
    }),
    [
      preferences,
      ready,
      saving,
      updatePreferences,
      setActionDisplay,
      setTooltipEnabled,
      setTooltipDelay,
      setDensity,
      setFontSize,
      setLocale,
      setSidebarCollapsed,
      toggleSidebar,
      resetPreferences,
    ],
  );

  return (
    <AdminUiPreferencesContext.Provider value={value}>
      {children}
    </AdminUiPreferencesContext.Provider>
  );
}

/*
 * =========================================================
 * HOOK
 * =========================================================
 */

export function useAdminUiPreferences() {
  const context = useContext(AdminUiPreferencesContext);

  if (!context) {
    throw new Error(
      "useAdminUiPreferences must be used inside AdminUiPreferencesProvider.",
    );
  }

  return context;
}
