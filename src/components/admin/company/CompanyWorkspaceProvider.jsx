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

export function CompanyWorkspaceProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      const companyList = normalizeCompanies(payload);

      setCompanies(companyList);

      setActiveCompanyId((currentId) => {
        if (
          currentId &&
          companyList.some((company) => company.id === currentId)
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
          companyList.some((company) => company.id === storedId)
        ) {
          return storedId;
        }

        return companyList[0]?.id || null;
      });
    } catch (loadError) {
      console.error("Load companies error:", loadError);

      setCompanies([]);
      setActiveCompanyId(null);

      setError(loadError?.message || "Unable to load companies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadCompanies();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadCompanies]);

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, activeCompanyId);
    } catch {
      // localStorage can be unavailable
      // in restricted browser environments.
    }
  }, [activeCompanyId]);

  const activeCompany = useMemo(() => {
    if (!activeCompanyId) {
      return null;
    }

    return companies.find((company) => company.id === activeCompanyId) || null;
  }, [companies, activeCompanyId]);

  const selectCompany = useCallback(
    (companyId) => {
      const exists = companies.some((company) => company.id === companyId);

      if (!exists) {
        return;
      }

      setActiveCompanyId(companyId);
    },
    [companies],
  );

  const value = useMemo(
    () => ({
      companies,
      activeCompany,
      activeCompanyId,

      loading,
      error,

      selectCompany,
      refreshCompanies: loadCompanies,
    }),
    [
      companies,
      activeCompany,
      activeCompanyId,
      loading,
      error,
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
