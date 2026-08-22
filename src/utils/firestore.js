export function serializeFirestoreValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        serializeFirestoreValue(item),
      ]),
    );
  }

  return value;
}

export function serializeFirestoreDocument(document) {
  if (!document) {
    return null;
  }

  return serializeFirestoreValue(document);
}
