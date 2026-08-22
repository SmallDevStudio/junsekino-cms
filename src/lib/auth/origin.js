import "server-only";

export function isTrustedOrigin(request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const requestOrigin = request.nextUrl.origin;

  return origin === requestOrigin;
}
