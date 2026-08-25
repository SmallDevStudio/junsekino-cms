"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ConsentContext = createContext(null);

const DEFAULT_CONSENT = {
  necessary: true,
  analytics: false,
  functional: false,
  marketing: false,
};

export function ConsentProvider({ companySlug, children }) {
  const [loading, setLoading] = useState(true);

  const [consent, setConsent] = useState(DEFAULT_CONSENT);

  const [showBanner, setShowBanner] = useState(false);

  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const [privacySettings, setPrivacySettings] = useState(null);

  const [legal, setLegal] = useState(null);

  useEffect(() => {
    if (!companySlug) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [companyResponse, consentResponse, legalResponse] =
          await Promise.all([
            fetch(`/api/public/v1/companies/${companySlug}`, {
              cache: "no-store",
            }),

            fetch(`/api/public/v1/companies/${companySlug}/consent`, {
              cache: "no-store",
            }),

            fetch(`/api/public/v1/companies/${companySlug}/legal`, {
              cache: "no-store",
            }),
          ]);

        const [companyData, consentData, legalData] = await Promise.all([
          companyResponse.json(),
          consentResponse.json(),
          legalResponse.json(),
        ]);

        if (cancelled) {
          return;
        }

        const settings = companyData?.data?.settings?.privacy || null;

        setPrivacySettings(settings);

        setLegal(legalData?.data || null);

        if (consentData.success) {
          setConsent(consentData.data.consent || DEFAULT_CONSENT);

          setShowBanner(
            consentData.data.requireConsent === true &&
              settings?.showCookieBanner !== false,
          );
        }
      } catch (error) {
        console.error("Consent initialization failed:", error);

        /*
         * Privacy-safe fallback.
         */
        setConsent(DEFAULT_CONSENT);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [companySlug]);

  const saveConsent = useCallback(
    async (nextConsent, source = "cookie_preferences") => {
      const normalized = {
        necessary: true,

        analytics: nextConsent.analytics === true,

        functional: nextConsent.functional === true,

        marketing: nextConsent.marketing === true,
      };

      const response = await fetch(
        `/api/public/v1/companies/${companySlug}/consent`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            consent: normalized,

            source,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save consent.");
      }

      setConsent(normalized);

      setShowBanner(false);

      setPreferencesOpen(false);

      window.dispatchEvent(
        new CustomEvent("jsk:consent-change", {
          detail: normalized,
        }),
      );

      return normalized;
    },
    [companySlug],
  );

  const acceptAll = useCallback(
    () =>
      saveConsent(
        {
          necessary: true,
          analytics: true,
          functional: true,
          marketing: true,
        },
        "cookie_banner",
      ),
    [saveConsent],
  );

  const necessaryOnly = useCallback(
    () => saveConsent(DEFAULT_CONSENT, "cookie_banner"),
    [saveConsent],
  );

  const value = useMemo(
    () => ({
      loading,
      consent,

      showBanner,
      setShowBanner,

      preferencesOpen,
      setPreferencesOpen,

      privacySettings,
      legal,

      saveConsent,
      acceptAll,
      necessaryOnly,

      openPreferences: () => setPreferencesOpen(true),
    }),
    [
      loading,
      consent,
      showBanner,
      preferencesOpen,
      privacySettings,
      legal,
      saveConsent,
      acceptAll,
      necessaryOnly,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error("useConsent must be used inside ConsentProvider.");
  }

  return context;
}
