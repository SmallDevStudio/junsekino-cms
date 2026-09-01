"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CompanyWorkspaceContext = createContext(null);

const STORAGE_KEY = "junsekino.admin.activeCompanyId";

function normalizeCompanies(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.companies)) {
    return payload.companies;
  }

  if (Array.isArray(payload.data?.companies)) {
    return payload.data.companies;
  }

  return [];
}

function resolveSuperAdmin(user) {
  return Boolean(
    user?.isSuperAdmin ||
    user?.userType === "SUPERADMIN" ||
    user?.role === "SUPERADMIN",
  );
}

function resolvePreferredCompany({ companies, user }) {
  if (!companies.length) {
    return null;
  }

  const preferredCompanyId = user?.defaultCompanyId || user?.companyId || null;

  if (preferredCompanyId) {
    const preferredCompany = companies.find(
      (company) => company.id === preferredCompanyId,
    );

    if (preferredCompany) {
      return preferredCompany;
    }
  }

  return companies[0] || null;
}

function getStoredCompanyId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredCompanyId(companyId) {
  try {
    if (companyId) {
      window.localStorage.setItem(STORAGE_KEY, companyId);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage may be unavailable.
  }
}

export function CompanyWorkspaceProvider({ user, children }) {
  const [companies, setCompanies] = useState([]);

  const [activeCompanyId, setActiveCompanyId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const isSuperAdmin = resolveSuperAdmin(user);

  const currentUserId = user?.uid || user?.id || null;

  const loadCompanies = useCallback(
    async ({ selectCompanyId = null, silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setError(null);

        const response = await fetch("/api/v1/companies", {
          method: "GET",

          cache: "no-store",

          credentials: "include",
        });

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Unable to load companies.");
        }

        const loadedCompanies = normalizeCompanies(payload);

        const preferredCompany = resolvePreferredCompany({
          companies: loadedCompanies,

          user,
        });

        const scopedCompanies = isSuperAdmin
          ? loadedCompanies
          : preferredCompany
            ? [preferredCompany]
            : [];

        setCompanies(scopedCompanies);

        setActiveCompanyId((currentId) => {
          /*
           * Non-superadmin always remains inside
           * their assigned company workspace.
           */
          if (!isSuperAdmin) {
            return preferredCompany?.id || null;
          }

          /*
           * Explicitly select a newly created company.
           */
          if (
            selectCompanyId &&
            scopedCompanies.some((company) => company.id === selectCompanyId)
          ) {
            setStoredCompanyId(selectCompanyId);

            return selectCompanyId;
          }

          /*
           * Keep the currently selected company
           * when it still exists.
           */
          if (
            currentId &&
            scopedCompanies.some((company) => company.id === currentId)
          ) {
            return currentId;
          }

          const storedId = getStoredCompanyId();

          if (
            storedId &&
            scopedCompanies.some((company) => company.id === storedId)
          ) {
            return storedId;
          }

          const fallbackId =
            preferredCompany?.id || scopedCompanies[0]?.id || null;

          setStoredCompanyId(fallbackId);

          return fallbackId;
        });

        return scopedCompanies;
      } catch (loadError) {
        console.error("Load companies error:", loadError);

        setCompanies([]);
        setActiveCompanyId(null);

        setError(loadError?.message || "Unable to load companies.");

        return [];
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [isSuperAdmin, user],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadCompanies();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadCompanies]);

  useEffect(() => {
    if (!activeCompanyId || !isSuperAdmin) {
      return;
    }

    setStoredCompanyId(activeCompanyId);
  }, [activeCompanyId, isSuperAdmin]);

  const activeCompany = useMemo(() => {
    if (!activeCompanyId) {
      return null;
    }

    return companies.find((company) => company.id === activeCompanyId) || null;
  }, [companies, activeCompanyId]);

  const selectCompany = useCallback(
    (companyId) => {
      if (!isSuperAdmin) {
        return false;
      }

      const exists = companies.some((company) => company.id === companyId);

      if (!exists) {
        return false;
      }

      setActiveCompanyId(companyId);

      setStoredCompanyId(companyId);

      return true;
    },
    [companies, isSuperAdmin],
  );

  const refreshCompanies = useCallback(
    async (options = {}) => {
      return loadCompanies({
        ...options,

        silent: options.silent ?? true,
      });
    },
    [loadCompanies],
  );

  const value = useMemo(
    () => ({
      companies,

      activeCompany,
      activeCompanyId,

      loading,
      error,

      currentUser: user,
      currentUserId,

      isSuperAdmin,

      canSwitchCompany: isSuperAdmin && companies.length > 1,

      selectCompany,

      refreshCompanies,
    }),
    [
      companies,

      activeCompany,
      activeCompanyId,

      loading,
      error,

      user,
      currentUserId,

      isSuperAdmin,

      selectCompany,
      refreshCompanies,
    ],
  );

  return (
    <CompanyWorkspaceContext.Provider value={value}>
      {children}
    </CompanyWorkspaceContext.Provider>
  );
}

export function useCompanyWorkspace() {
  const context = useContext(CompanyWorkspaceContext);

  if (!context) {
    throw new Error(
      "useCompanyWorkspace must be used inside CompanyWorkspaceProvider.",
    );
  }

  return context;
}
