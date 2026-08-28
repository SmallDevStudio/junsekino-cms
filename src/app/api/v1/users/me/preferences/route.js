import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

import {
  getUserPreferences,
  updateUserPreferences,
} from "@/modules/user/user-preference.service";

import { updateUserPreferenceSchema } from "@/modules/user/user-preference.schema";

export const dynamic = "force-dynamic";

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
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

    const preferences = await getUserPreferences({
      userId: currentUser.uid,
    });

    return NextResponse.json({
      success: true,

      data: preferences,
    });
  } catch (error) {
    console.error("Get user preferences error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to load user preferences.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * =========================================================
 * PATCH
 * =========================================================
 */

export async function PATCH(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
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

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update user preferences.",
      },
      {
        status: 500,
      },
    );
  }
}
