const VISITOR_STORAGE_KEY = "junsekino-public-visitor-id";

function createVisitorId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID().replaceAll("-", "_");
  }

  return [
    Date.now().toString(36),

    Math.random().toString(36).slice(2),

    Math.random().toString(36).slice(2),
  ].join("_");
}

export function getPublicVisitorId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);

    if (existing && existing.length >= 16) {
      return existing;
    }

    const visitorId = createVisitorId();

    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);

    return visitorId;
  } catch {
    /*
     * Storage might be disabled.
     * Use an in-memory style temporary
     * visitor id so the page still works.
     */
    return createVisitorId();
  }
}
