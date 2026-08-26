export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getNextSlug(slug) {
  const normalized = slugify(slug);

  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^(.*?)-(\d+)$/);

  if (!match) {
    return `${normalized}-1`;
  }

  const base = match[1];
  const number = Number(match[2]);

  return `${base}-${number + 1}`;
}

export function isSlugConflict({ status, message, code }) {
  if (status === 409) {
    return true;
  }

  const normalizedCode = String(code || "").toUpperCase();
  const normalizedMessage = String(message || "").toLowerCase();

  return (
    (normalizedCode.includes("SLUG") && normalizedCode.includes("EXIST")) ||
    (normalizedMessage.includes("slug") &&
      (normalizedMessage.includes("exist") ||
        normalizedMessage.includes("already") ||
        normalizedMessage.includes("use") ||
        normalizedMessage.includes("duplicate")))
  );
}
