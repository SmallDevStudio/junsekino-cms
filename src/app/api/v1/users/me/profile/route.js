import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { updateOwnProfileSchema } from "@/modules/user/profile.schema";

import {
  getOwnProfile,
  updateOwnProfile,
} from "@/modules/user/profile.service";

function unauthorizedResponse() {
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

function profileErrorResponse(error) {
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

      message: "Unable to process user profile.",
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

    const profile = await getOwnProfile({
      currentUser,
    });

    return NextResponse.json({
      success: true,

      data: profile,
    });
  } catch (error) {
    console.error("Get own profile error:", error);

    return profileErrorResponse(error);
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

    const body = await request.json();

    const validation = updateOwnProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid profile data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    if (Object.keys(validation.data).length === 0) {
      return NextResponse.json(
        {
          success: false,

          message: "No profile data supplied.",
        },
        {
          status: 400,
        },
      );
    }

    const profile = await updateOwnProfile({
      input: validation.data,

      currentUser,
    });

    return NextResponse.json({
      success: true,

      data: profile,
    });
  } catch (error) {
    console.error("Update own profile error:", error);

    return profileErrorResponse(error);
  }
}
