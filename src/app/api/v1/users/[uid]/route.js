import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

import { isTrustedOrigin } from "@/lib/auth/origin";

import {
  platformUserIdSchema,
  updatePlatformUserSchema,
} from "@/modules/user/platform-user.schema";

import {
  deletePlatformUser,
  getPlatformUser,
  updatePlatformUser,
} from "@/modules/user/platform-user-management.service";

async function resolveUid(context) {
  const params = await context.params;

  const validation = platformUserIdSchema.safeParse(params.uid);

  return validation.success ? validation.data : null;
}

function unauthorized(user) {
  return NextResponse.json(
    {
      success: false,

      message: user
        ? "Superadmin permission required."
        : "Authentication required.",
    },
    {
      status: user ? 403 : 401,
    },
  );
}

function invalidUserIdResponse() {
  return NextResponse.json(
    {
      success: false,

      message: "Invalid user ID.",
    },
    {
      status: 400,
    },
  );
}

export async function GET(request, context) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !currentUser.isSuperAdmin) {
      return unauthorized(currentUser);
    }

    const uid = await resolveUid(context);

    if (!uid) {
      return invalidUserIdResponse();
    }

    const user = await getPlatformUser({
      uid,
    });

    return NextResponse.json({
      success: true,

      data: user,
    });
  } catch (error) {
    console.error("Get platform user error:", error);

    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve user.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request, context) {
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

    if (!currentUser || !currentUser.isSuperAdmin) {
      return unauthorized(currentUser);
    }

    const uid = await resolveUid(context);

    if (!uid) {
      return invalidUserIdResponse();
    }

    const body = await request.json();

    const validation = updatePlatformUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid user data.",

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

          message: "No user data supplied.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await updatePlatformUser({
      uid,

      input: validation.data,

      currentUser,
    });

    return NextResponse.json({
      success: true,

      data: user,
    });
  } catch (error) {
    console.error("Update platform user error:", error);

    const errors = {
      USER_NOT_FOUND: [404, "User not found."],

      CANNOT_CHANGE_OWN_STATUS: [
        409,
        "You cannot change your own account status.",
      ],

      CANNOT_REMOVE_OWN_SUPERADMIN: [
        409,
        "You cannot remove your own Superadmin permission.",
      ],
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

        message: "Unable to update user.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request, context) {
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

    if (!currentUser || !currentUser.isSuperAdmin) {
      return unauthorized(currentUser);
    }

    const uid = await resolveUid(context);

    if (!uid) {
      return invalidUserIdResponse();
    }

    const result = await deletePlatformUser({
      uid,

      currentUser,
    });

    return NextResponse.json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error("Delete platform user error:", error);

    const errors = {
      USER_NOT_FOUND: [404, "User not found."],

      CANNOT_DELETE_OWN_ACCOUNT: [409, "You cannot delete your own account."],
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

        message: "Unable to delete user.",
      },
      {
        status: 500,
      },
    );
  }
}
