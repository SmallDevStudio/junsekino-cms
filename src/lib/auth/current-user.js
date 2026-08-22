import "server-only";

import { cookies } from "next/headers";

import { AUTH_SESSION } from "@/constants/auth";

import { verifyPlatformSession } from "@/modules/auth/auth.service";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get(AUTH_SESSION.COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  return verifyPlatformSession(sessionCookie);
}
