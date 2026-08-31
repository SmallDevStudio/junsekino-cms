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

function resolveUserId(user) {
  return user?.uid || user?.id || user?.userId || null;
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

export function CompanyWorkspaceProvider({ user, children }) {
  const [companies, setCompanies] = useState([]);

  const [activeCompanyId, setActiveCompanyId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const isSuperAdmin = resolveSuperAdmin(user);

  const currentUserId = resolveUserId(user);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/auth/companies", {
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
        if (!isSuperAdmin) {
          return preferredCompany?.id || null;
        }

        if (
          currentId &&
          scopedCompanies.some((company) => company.id === currentId)
        ) {
          return currentId;
        }

        let storedId = null;

        try {
          storedId = window.localStorage.getItem(STORAGE_KEY);
        } catch {
          storedId = null;
        }

        if (
          storedId &&
          scopedCompanies.some((company) => company.id === storedId)
        ) {
          return storedId;
        }

        return preferredCompany?.id || scopedCompanies[0]?.id || null;
      });
    } catch (loadError) {
      console.error("Load companies error:", loadError);

      setCompanies([]);
      setActiveCompanyId(null);

      setError(loadError?.message || "Unable to load companies.");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, user]);

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

    try {
      window.localStorage.setItem(
        STORAGE_KEY,

        activeCompanyId,
      );
    } catch {
      // localStorage may be unavailable.
    }
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

      return true;
    },
    [companies, isSuperAdmin],
  );

  const value = useMemo(
    () => ({
      companies,

      activeCompany,

      activeCompanyId,

      loading,

      error,

      isSuperAdmin,

      currentUser: user,

      currentUserId,

      canSwitchCompany: isSuperAdmin && companies.length > 1,

      selectCompany,

      refreshCompanies: loadCompanies,
    }),
    [
      companies,
      activeCompany,
      activeCompanyId,
      loading,
      error,
      isSuperAdmin,
      user,
      currentUserId,
      selectCompany,
      loadCompanies,
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
