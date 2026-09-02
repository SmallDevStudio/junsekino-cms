import "server-only";

import { CONSENT_COOKIE_MAX_AGE, CONSENT_COOKIE_NAME } from "@/constants/legal";

const DEFAULT_CONSENT = {
  necessary: true,

  analytics: false,

  functional: false,

  marketing: false,
};

function normalizeCompanyId(companyId) {
  const value = String(companyId || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 100);

  if (!value) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  return value;
}

function normalizeConsent(value = {}) {
  return {
    necessary: true,

    analytics: value.analytics === true,

    functional: value.functional === true,

    marketing: value.marketing === true,
  };
}

export function getConsentCookieName(companyId) {
  return `${CONSENT_COOKIE_NAME}_${normalizeCompanyId(companyId)}`;
}

export function encodeConsentCookie(value) {
  return encodeURIComponent(JSON.stringify(value));
}

export function decodeConsentCookie(raw, companyId = null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (companyId && String(parsed.companyId || "") !== String(companyId)) {
      return null;
    }

    return {
      version: Number.isInteger(parsed.version) ? parsed.version : 1,

      companyId: parsed.companyId || null,

      consentVersion: Number.isInteger(parsed.consentVersion)
        ? parsed.consentVersion
        : 1,

      consent: normalizeConsent(parsed.consent),

      legalVersions: {
        privacy: parsed.legalVersions?.privacy || null,

        cookies: parsed.legalVersions?.cookies || null,

        terms: parsed.legalVersions?.terms || null,
      },

      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    };
  } catch {
    return null;
  }
}

export function getConsentFromRequest({ request, companyId }) {
  const cookieName = getConsentCookieName(companyId);

  const raw = request.cookies.get(cookieName)?.value;

  const value = decodeConsentCookie(raw, companyId);

  if (!value) {
    return {
      ...DEFAULT_CONSENT,
    };
  }

  return value.consent;
}

export function setConsentCookie({
  response,
  companyId,
  data,
  maxAgeDays = null,
}) {
  const cookieName = getConsentCookieName(companyId);

  const requestedMaxAge = Number.isInteger(maxAgeDays)
    ? maxAgeDays * 24 * 60 * 60
    : CONSENT_COOKIE_MAX_AGE;

  const maxAge = Math.max(
    24 * 60 * 60,

    Math.min(
      365 * 24 * 60 * 60,

      requestedMaxAge,
    ),
  );

  response.cookies.set(
    cookieName,

    encodeConsentCookie({
      ...data,

      companyId,
    }),

    {
      /*
       * Consent is read through the server API.
       *
       * Client-side JavaScript does not need direct
       * access to the raw consent cookie.
       */
      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      path: "/",

      maxAge,

      priority: "high",
    },
  );

  return response;
}

export function getDefaultConsent() {
  return {
    ...DEFAULT_CONSENT,
  };
}
