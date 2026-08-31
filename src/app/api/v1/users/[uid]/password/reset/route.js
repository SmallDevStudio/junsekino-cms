import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCurrentUser } from "@/lib/auth/current-user";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { resetUserPasswordSchema } from "@/modules/user/password.schema";

import { resetUserPassword } from "@/modules/user/password.service";

import { platformUserIdSchema } from "@/modules/user/platform-user.schema";

async function resolveUid(context) {
  const params = await context.params;

  const validation = platformUserIdSchema.safeParse(params.uid);

  return validation.success ? validation.data : null;
}

function errorResponse(error) {
  const errors = {
    USER_NOT_FOUND: [404, "User not found."],

    MEMBERSHIP_NOT_FOUND: [
      404,
      "The user is not an active member of this company.",
    ],

    COMPANY_ID_REQUIRED: [400, "Company ID is required."],

    CANNOT_RESET_OWN_PASSWORD: [
      409,
      "Use Change Password to update your own password.",
    ],

    CANNOT_MANAGE_SUPERADMIN: [
      403,
      "A company administrator cannot reset a Superadmin password.",
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

      message: "Unable to reset user password.",
    },
    {
      status: 500,
    },
  );
}

export async function POST(request, context) {
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

    const uid = await resolveUid(context);

    if (!uid) {
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

    const sessionUser = await getCurrentUser();

    if (!sessionUser) {
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

    const validation = resetUserPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid password data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    let currentUser = sessionUser;

    if (!sessionUser.isSuperAdmin) {
      if (!validation.data.companyId) {
        return NextResponse.json(
          {
            success: false,

            message: "Company ID is required.",
          },
          {
            status: 400,
          },
        );
      }

      const access = await getCompanyPermission({
        companyId: validation.data.companyId,

        permission: PERMISSIONS.USER_UPDATE,
      });

      if (!access.authorized) {
        return NextResponse.json(
          {
            success: false,

            message: access.reason,
          },
          {
            status: access.user ? 403 : 401,
          },
        );
      }

      currentUser = access.user;
    }

    const result = await resetUserPassword({
      uid,

      input: validation.data,

      currentUser,
    });

    return NextResponse.json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error("Reset user password error:", error);

    return errorResponse(error);
  }
}
