const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    DEFAULT_SITE_URL;

  const normalizedUrl = rawUrl.startsWith("http")
    ? rawUrl
    : `https://${rawUrl}`;

  return normalizedUrl.replace(/\/+$/, "");
}

export function isProductionWebsite() {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "production";
  }

  return process.env.NEXT_PUBLIC_APP_ENV === "production";
}
