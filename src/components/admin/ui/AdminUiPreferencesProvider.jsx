"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ADMIN_ACTION_DISPLAY,
  ADMIN_DENSITY,
  ADMIN_UI_DEFAULTS,
} from "@/constants/admin-ui";

const AdminUiPreferencesContext = createContext(null);

function getUserId(user) {
  return user?.uid || user?.id || user?.userId || "anonymous";
}

function getStorageKey(user) {
  return `junsekino.admin.uiPreferences.${getUserId(user)}`;
}

function isActionDisplay(value) {
  return Object.values(ADMIN_ACTION_DISPLAY).includes(value);
}

function isDensity(value) {
  return Object.values(ADMIN_DENSITY).includes(value);
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
  };
}

function getInitialUserPreferences(user) {
  return normalizePreferences(
    user?.preferences?.adminUi || user?.adminUiPreferences || {},
  );
}

export function AdminUiPreferencesProvider({
  user,

  children,
}) {
  const initialPreferences = useMemo(
    () => getInitialUserPreferences(user),
    [user],
  );

  const [preferences, setPreferences] = useState(initialPreferences);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      let storedPreferences = null;

      try {
        const raw = window.localStorage.getItem(getStorageKey(user));

        storedPreferences = raw ? JSON.parse(raw) : null;
      } catch {
        storedPreferences = null;
      }

      if (storedPreferences) {
        setPreferences(
          normalizePreferences({
            ...initialPreferences,
            ...storedPreferences,
          }),
        );
      } else {
        setPreferences(initialPreferences);
      }

      setReady(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user, initialPreferences]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    try {
      window.localStorage.setItem(
        getStorageKey(user),

        JSON.stringify(preferences),
      );
    } catch {
      // localStorage can be unavailable.
    }
  }, [user, preferences, ready]);

  const updatePreferences = useCallback((patch) => {
    setPreferences((current) =>
      normalizePreferences({
        ...current,
        ...patch,
      }),
    );
  }, []);

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

  const resetPreferences = useCallback(() => {
    setPreferences({
      ...ADMIN_UI_DEFAULTS,
    });
  }, []);

  const value = useMemo(
    () => ({
      preferences,

      ready,

      actionDisplay: preferences.actionDisplay,

      tooltipEnabled: preferences.tooltipEnabled,

      tooltipDelay: preferences.tooltipDelay,

      density: preferences.density,

      updatePreferences,

      setActionDisplay,

      setTooltipEnabled,

      setTooltipDelay,

      setDensity,

      resetPreferences,
    }),
    [
      preferences,
      ready,
      updatePreferences,
      setActionDisplay,
      setTooltipEnabled,
      setTooltipDelay,
      setDensity,
      resetPreferences,
    ],
  );

  return (
    <AdminUiPreferencesContext.Provider value={value}>
      {children}
    </AdminUiPreferencesContext.Provider>
  );
}

export function useAdminUiPreferences() {
  const context = useContext(AdminUiPreferencesContext);

  if (!context) {
    throw new Error(
      "useAdminUiPreferences must be used inside AdminUiPreferencesProvider.",
    );
  }

  return context;
}
