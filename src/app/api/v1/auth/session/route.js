import { NextResponse } from "next/server";

import { AUTH_SESSION } from "@/constants/auth";

import { sessionSchema } from "@/modules/auth/auth.schema";

import { createPlatformSession } from "@/modules/auth/auth.service";

import { isTrustedOrigin } from "@/lib/auth/origin";

export async function POST(request) {
  try {
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

    const body = await request.json();

    const validation = sessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid authentication request.",
        },
        {
          status: 400,
        },
      );
    }

    const { idToken } = validation.data;

    const { sessionCookie, user } = await createPlatformSession(idToken);

    const response = NextResponse.json({
      success: true,

      user: {
        id: user.id,

        email: user.email,

        displayName: user.displayName || null,

        isSuperAdmin: user.isSuperAdmin === true,

        mustChangePassword: user.mustChangePassword === true,

        defaultCompanyId: user.defaultCompanyId || null,
      },
    });

    response.cookies.set({
      name: AUTH_SESSION.COOKIE_NAME,

      value: sessionCookie,

      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      path: "/",

      maxAge: AUTH_SESSION.EXPIRES_IN,

      priority: "high",
    });

    return response;
  } catch (error) {
    console.error("Create session error:", error);

    let message = "Unable to sign in.";

    if (error.message === "USER_NOT_FOUND") {
      message = "Your account does not have access to Junsekino CMS.";
    }

    if (error.message === "USER_INACTIVE") {
      message = "Your account is inactive.";
    }

    if (error.message === "RECENT_LOGIN_REQUIRED") {
      message = "Please sign in again.";
    }

    return NextResponse.json(
      {
        success: false,

        message,
      },
      {
        status: 401,
      },
    );
  }
}
