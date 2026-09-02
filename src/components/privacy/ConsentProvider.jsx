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

/*
 * =========================================================
 * RESPONSE
 * =========================================================
 */

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/*
 * =========================================================
 * PROVIDER
 * =========================================================
 */

export function ConsentProvider({
  companySlug,

  privacySettings = null,

  children,
}) {
  const [loading, setLoading] = useState(true);

  const [consent, setConsent] = useState(DEFAULT_CONSENT);

  const [requireConsent, setRequireConsent] = useState(false);

  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const [legal, setLegal] = useState(null);

  const cookieBannerEnabled = privacySettings?.showCookieBanner !== false;

  /*
   * Derive banner visibility from the server result.
   *
   * This avoids maintaining two separate states:
   *
   * - requireConsent
   * - showBanner
   */
  const showBanner = !loading && requireConsent && cookieBannerEnabled;

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  useEffect(() => {
    if (!companySlug) {
      return undefined;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);

        const [consentResponse, legalResponse] = await Promise.all([
          fetch(
            `/api/public/v1/companies/${encodeURIComponent(
              companySlug,
            )}/consent`,
            {
              method: "GET",

              cache: "no-store",

              credentials: "same-origin",

              signal: controller.signal,
            },
          ),

          fetch(
            `/api/public/v1/companies/${encodeURIComponent(companySlug)}/legal`,
            {
              method: "GET",

              cache: "no-store",

              credentials: "same-origin",

              signal: controller.signal,
            },
          ),
        ]);

        const [consentData, legalData] = await Promise.all([
          readJsonResponse(consentResponse),

          readJsonResponse(legalResponse),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        if (!consentResponse.ok || consentData?.success === false) {
          throw new Error(
            consentData?.message || "Unable to load cookie consent.",
          );
        }

        const currentConsent = consentData?.data?.consent || DEFAULT_CONSENT;

        setConsent({
          necessary: true,

          analytics: currentConsent.analytics === true,

          functional: currentConsent.functional === true,

          marketing: currentConsent.marketing === true,
        });

        setRequireConsent(consentData?.data?.requireConsent === true);

        setLegal(
          legalResponse.ok && legalData?.success !== false
            ? legalData?.data || null
            : null,
        );
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Consent initialization failed:", error);

        /*
         * Privacy-safe fallback:
         *
         * Optional cookies remain disabled and
         * the visitor is asked for a decision.
         */
        setConsent(DEFAULT_CONSENT);

        setRequireConsent(true);

        setLegal(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);

      controller.abort();
    };
  }, [companySlug]);

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  const saveConsent = useCallback(
    async (
      nextConsent,

      source = "cookie_preferences",
    ) => {
      const normalized = {
        necessary: true,

        analytics: nextConsent.analytics === true,

        functional: nextConsent.functional === true,

        marketing: nextConsent.marketing === true,
      };

      const response = await fetch(
        `/api/public/v1/companies/${encodeURIComponent(companySlug)}/consent`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          cache: "no-store",

          credentials: "same-origin",

          body: JSON.stringify({
            consent: normalized,

            source,
          }),
        },
      );

      const data = await readJsonResponse(response);

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to save consent.");
      }

      setConsent(normalized);

      setRequireConsent(false);

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

  /*
   * =======================================================
   * ACTIONS
   * =======================================================
   */

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
    () =>
      saveConsent(
        DEFAULT_CONSENT,

        "cookie_banner",
      ),
    [saveConsent],
  );

  const openPreferences = useCallback(() => {
    setPreferencesOpen(true);
  }, []);

  const reopenBanner = useCallback(() => {
    setRequireConsent(true);
  }, []);

  /*
   * =======================================================
   * CONTEXT
   * =======================================================
   */

  const value = useMemo(
    () => ({
      loading,

      consent,

      requireConsent,

      showBanner,

      preferencesOpen,
      setPreferencesOpen,

      privacySettings,

      legal,

      saveConsent,

      acceptAll,

      necessaryOnly,

      openPreferences,

      reopenBanner,
    }),
    [
      loading,

      consent,

      requireConsent,

      showBanner,

      preferencesOpen,

      privacySettings,

      legal,

      saveConsent,

      acceptAll,

      necessaryOnly,

      openPreferences,

      reopenBanner,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

/*
 * =========================================================
 * HOOK
 * =========================================================
 */

export function useConsent() {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error("useConsent must be used inside ConsentProvider.");
  }

  return context;
}
