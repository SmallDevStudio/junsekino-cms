import "server-only";

import { CONSENT_COOKIE_MAX_AGE, CONSENT_COOKIE_NAME } from "@/constants/legal";

export function encodeConsentCookie(value) {
  return encodeURIComponent(JSON.stringify(value));
}

export function decodeConsentCookie(raw) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function setConsentCookie({ response, data }) {
  response.cookies.set(CONSENT_COOKIE_NAME, encodeConsentCookie(data), {
    /*
     * Intentionally not HttpOnly.
     *
     * Client-side Consent Mode /
     * GA loader needs access to
     * consent categories.
     *
     * The cookie contains no raw
     * visitor identifier.
     */

    httpOnly: false,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/",

    maxAge: CONSENT_COOKIE_MAX_AGE,
  });

  return response;
}
