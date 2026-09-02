import "server-only";

import crypto from "node:crypto";

import {
  VISITOR_COOKIE_MAX_AGE,
  VISITOR_COOKIE_NAME,
} from "@/constants/engagement";

import { getConsentFromRequest } from "@/lib/visitor/consent";

function isValidVisitorId(value) {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function resolveVisitor(request) {
  const existing = request.cookies.get(VISITOR_COOKIE_NAME)?.value;

  if (isValidVisitorId(existing)) {
    return {
      visitorId: existing,

      isNew: false,
    };
  }

  return {
    visitorId: crypto.randomUUID(),

    isNew: true,
  };
}

export function hashVisitorId(
  visitorId,

  scope = "platform",
) {
  const secret = process.env.VISITOR_HASH_SECRET;

  if (!secret) {
    throw new Error("VISITOR_HASH_SECRET is not configured.");
  }

  /*
   * Scope prevents the same visitor hash from
   * being correlated across different companies.
   */
  return crypto
    .createHmac("sha256", secret)
    .update(`${scope}:${visitorId}`)
    .digest("hex");
}

export function hashVisitorTechnicalValue(
  value,

  scope = "platform",
) {
  if (!value) {
    return null;
  }

  const secret = process.env.VISITOR_HASH_SECRET;

  if (!secret) {
    throw new Error("VISITOR_HASH_SECRET is not configured.");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${scope}:${String(value)}`)
    .digest("hex");
}

export function attachVisitorCookie({ response, visitorId }) {
  response.cookies.set(
    VISITOR_COOKIE_NAME,

    visitorId,

    {
      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      path: "/",

      maxAge: VISITOR_COOKIE_MAX_AGE,

      priority: "high",
    },
  );

  return response;
}

export function getConsent(request, companyId) {
  if (!companyId) {
    return {
      necessary: true,

      analytics: false,

      functional: false,

      marketing: false,
    };
  }

  return getConsentFromRequest({
    request,

    companyId,
  });
}
