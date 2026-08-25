import "server-only";

import crypto from "node:crypto";

import {
  CONSENT_COOKIE_NAME,
  VISITOR_COOKIE_MAX_AGE,
  VISITOR_COOKIE_NAME,
} from "@/constants/engagement";

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

export function hashVisitorId(visitorId) {
  const secret = process.env.VISITOR_HASH_SECRET;

  if (!secret) {
    throw new Error("VISITOR_HASH_SECRET is not configured.");
  }

  return crypto.createHmac("sha256", secret).update(visitorId).digest("hex");
}

export function attachVisitorCookie({ response, visitorId }) {
  response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/",

    maxAge: VISITOR_COOKIE_MAX_AGE,
  });

  return response;
}

export function getConsent(request) {
  const raw = request.cookies.get(CONSENT_COOKIE_NAME)?.value;

  if (!raw) {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
    };
  }

  try {
    const decoded = decodeURIComponent(raw);

    const value = JSON.parse(decoded);

    return {
      necessary: true,

      analytics: value.analytics === true,

      marketing: value.marketing === true,
    };
  } catch {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
    };
  }
}
