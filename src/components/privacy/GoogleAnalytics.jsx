"use client";

import { useEffect } from "react";

import Script from "next/script";

import { useConsent } from "./ConsentProvider";

function ensureGoogleTag() {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };
}

function updateGoogleConsent(consent) {
  if (typeof window === "undefined") {
    return;
  }

  ensureGoogleTag();

  window.gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",

    functionality_storage: consent.functional ? "granted" : "denied",

    personalization_storage: consent.functional ? "granted" : "denied",

    ad_storage: consent.marketing ? "granted" : "denied",

    ad_user_data: consent.marketing ? "granted" : "denied",

    ad_personalization: consent.marketing ? "granted" : "denied",

    security_storage: "granted",
  });
}

function removeGoogleAnalyticsCookies() {
  if (typeof document === "undefined") {
    return;
  }

  const names = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));

  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;

    /*
     * เผื่อ cookie ถูกสร้างบน parent domain
     * เราจะเพิ่ม domain-specific cleanup
     * ตอนมี production domain จริง
     */
  }
}

export default function GoogleAnalytics({ measurementId }) {
  const { consent, loading } = useConsent();

  /*
   * ไม่ต้องมี scriptEnabled state
   *
   * script rendering derive โดยตรงจาก:
   *
   * consent.analytics === true
   */
  const enabled = Boolean(measurementId && !loading && consent.analytics);

  useEffect(() => {
    if (loading) {
      return;
    }

    updateGoogleConsent(consent);

    if (!consent.analytics) {
      removeGoogleAnalyticsCookies();
    }
  }, [consent, loading]);

  useEffect(() => {
    function handleConsentChange(event) {
      const nextConsent = event.detail;

      updateGoogleConsent(nextConsent);

      if (!nextConsent.analytics) {
        removeGoogleAnalyticsCookies();
      }
    }

    window.addEventListener("jsk:consent-change", handleConsentChange);

    return () => {
      window.removeEventListener("jsk:consent-change", handleConsentChange);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <Script
        id={`google-analytics-${measurementId}`}
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />

      <Script
        id={`google-analytics-init-${measurementId}`}
        strategy="afterInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];

          window.gtag = window.gtag || function(){
            window.dataLayer.push(arguments);
          };

          window.gtag(
            'consent',
            'default',
            {
              analytics_storage: 'denied',
              functionality_storage: 'denied',
              personalization_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              security_storage: 'granted'
            }
          );

          window.gtag(
            'consent',
            'update',
            {
              analytics_storage: 'granted',
              functionality_storage: ${
                consent.functional ? "'granted'" : "'denied'"
              },
              personalization_storage: ${
                consent.functional ? "'granted'" : "'denied'"
              },
              ad_storage: ${consent.marketing ? "'granted'" : "'denied'"},
              ad_user_data: ${consent.marketing ? "'granted'" : "'denied'"},
              ad_personalization: ${
                consent.marketing ? "'granted'" : "'denied'"
              },
              security_storage: 'granted'
            }
          );

          window.gtag(
            'js',
            new Date()
          );

          window.gtag(
            'config',
            '${measurementId}',
            {
              send_page_view: true
            }
          );
        `}
      </Script>
    </>
  );
}
