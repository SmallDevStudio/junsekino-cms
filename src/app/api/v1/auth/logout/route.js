import { NextResponse } from "next/server";

import { AUTH_SESSION } from "@/constants/auth";

import { isTrustedOrigin } from "@/lib/auth/origin";

export async function POST(request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request origin.",
      },
      {
        status: 403,
      },
    );
  }

  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set({
    name: AUTH_SESSION.COOKIE_NAME,

    value: "",

    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/",

    maxAge: 0,
  });

  return response;
}
