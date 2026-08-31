import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

import { isTrustedOrigin } from "@/lib/auth/origin";

import {
  getUserPreferences,
  updateUserPreferences,
} from "@/modules/user/user-preference.service";

import { updateUserPreferenceSchema } from "@/modules/user/user-preference.schema";

export const dynamic = "force-dynamic";

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,

      message: "Unauthorized.",
    },
    {
      status: 401,
    },
  );
}

function preferenceErrorResponse(error) {
  if (error.message === "USER_NOT_FOUND") {
    return NextResponse.json(
      {
        success: false,

        message: "User account not found.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(
    {
      success: false,

      message: "Unable to process user preferences.",
    },
    {
      status: 500,
    },
  );
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return unauthorizedResponse();
    }

    const preferences = await getUserPreferences({
      userId: currentUser.uid,
    });

    return NextResponse.json({
      success: true,

      data: preferences,
    });
  } catch (error) {
    console.error("Get user preferences error:", error);

    return preferenceErrorResponse(error);
  }
}

export async function PATCH(request) {
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
      return unauthorizedResponse();
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const parsed = updateUserPreferenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid preferences.",

          errors: parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const preferences = await updateUserPreferences({
      userId: currentUser.uid,

      input: parsed.data,
    });

    return NextResponse.json({
      success: true,

      data: preferences,
    });
  } catch (error) {
    console.error("Update user preferences error:", error);

    return preferenceErrorResponse(error);
  }
}
