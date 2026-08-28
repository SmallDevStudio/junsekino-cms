"use client";

import { createContext, useContext, useMemo } from "react";

import { COMPANY_LOCALES } from "@/constants/company";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import {
  getAdminContentLocales,
  getCompanyDefaultLocale,
  isCompanyLocaleEnabled,
  isCompanyMultilingual,
} from "@/utils/company-localization";

const CompanyLocalizationContext = createContext(null);

export function CompanyLocalizationProvider({ children }) {
  const { activeCompany, activeCompanyId } = useCompanyWorkspace();

  const value = useMemo(() => {
    const contentLocales = getAdminContentLocales(activeCompany);

    const defaultLocale = getCompanyDefaultLocale(activeCompany);

    const thaiEnabled = isCompanyLocaleEnabled(
      activeCompany,
      COMPANY_LOCALES.TH,
    );

    return {
      companyId: activeCompanyId,

      company: activeCompany,

      /*
       * Public content languages.
       */
      contentLocales,

      defaultLocale,

      englishEnabled: true,

      thaiEnabled,

      multilingual: isCompanyMultilingual(activeCompany),

      /*
       * Convenience helpers.
       */
      isLocaleEnabled: (locale) => contentLocales.includes(locale),
    };
  }, [activeCompany, activeCompanyId]);

  return (
    <CompanyLocalizationContext.Provider value={value}>
      {children}
    </CompanyLocalizationContext.Provider>
  );
}

export function useCompanyLocalization() {
  const context = useContext(CompanyLocalizationContext);

  if (!context) {
    throw new Error(
      "useCompanyLocalization must be used inside CompanyLocalizationProvider.",
    );
  }

  return context;
}
