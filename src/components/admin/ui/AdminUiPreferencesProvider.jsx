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

  const initializedRef = useRef(false);

  const saveTimerRef = useRef(null);

  /*
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    let active = true;

    const timeoutId = window.setTimeout(async () => {
      /*
       * Start from server-rendered
       * session preference.
       */

      let resolved = initialPreferences;

      /*
       * Local cache gives immediate
       * fallback if network is slow.
       */

      try {
        const raw = window.localStorage.getItem(getStorageKey(user));

        if (raw) {
          resolved = normalizePreferences({
            ...resolved,
            ...JSON.parse(raw),
          });
        }
      } catch {
        // Ignore cache failure.
      }

      /*
       * Server profile remains
       * source of truth.
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
      } catch {
        // Use local cache/server session.
      }

      if (!active) {
        return;
      }

      setPreferences(resolved);

      try {
        window.localStorage.setItem(
          getStorageKey(user),

          JSON.stringify(resolved),
        );
      } catch {
        // Ignore cache failure.
      }

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
       * Cache immediately.
       */

      try {
        window.localStorage.setItem(
          getStorageKey(user),

          JSON.stringify(nextPreferences),
        );
      } catch {
        // Ignore cache failure.
      }

      /*
       * Debounce Firestore writes.
       *
       * Multiple quick UI changes
       * become one PATCH.
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

          if (!response.ok) {
            throw new Error("PREFERENCE_SAVE_FAILED");
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
    const next = {
      ...ADMIN_UI_DEFAULTS,
    };

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

      locale: preferences.locale,

      sidebarCollapsed: preferences.sidebarCollapsed,

      updatePreferences,

      setActionDisplay,

      setTooltipEnabled,

      setTooltipDelay,

      setDensity,

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
