import { NextResponse } from "next/server";

import { AUTH_SESSION } from "@/constants/auth";

import { getCurrentUser } from "@/lib/auth/current-user";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { completePasswordChangeSchema } from "@/modules/user/password.schema";

import { completeOwnPasswordChange } from "@/modules/user/password.service";

function setSessionCookie(response, sessionCookie) {
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
}

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

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,

          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const validation = completePasswordChangeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid authentication data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const result = await completeOwnPasswordChange({
      idToken: validation.data.idToken,

      currentUser,
    });

    const response = NextResponse.json({
      success: true,

      data: {
        changed: true,

        mustChangePassword: false,
      },
    });

    setSessionCookie(response, result.sessionCookie);

    return response;
  } catch (error) {
    console.error("Complete password change error:", error);

    const errors = {
      USER_NOT_FOUND: [404, "User account not found."],

      USER_INACTIVE: [403, "Your account is inactive."],

      PASSWORD_USER_MISMATCH: [
        403,
        "The authenticated Firebase user does not match the current session.",
      ],

      RECENT_LOGIN_REQUIRED: [401, "Please enter your current password again."],
    };

    const mapped = errors[error.message];

    if (mapped) {
      return NextResponse.json(
        {
          success: false,

          message: mapped[1],
        },
        {
          status: mapped[0],
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to complete password change.",
      },
      {
        status: 500,
      },
    );
  }
}
