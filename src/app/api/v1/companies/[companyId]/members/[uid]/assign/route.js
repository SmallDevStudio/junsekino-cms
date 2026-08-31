import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  assignExistingMemberSchema,
  uidSchema,
} from "@/modules/user/membership.schema";

import { assignExistingCompanyMember } from "@/modules/user/membership.service";

async function resolveParams(context) {
  const params = await context.params;

  const companyValidation = companyIdSchema.safeParse(params.companyId);

  const uidValidation = uidSchema.safeParse(params.uid);

  if (!companyValidation.success || !uidValidation.success) {
    return null;
  }

  return {
    companyId: companyValidation.data,

    uid: uidValidation.data,
  };
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

    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid request parameters.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.USER_CREATE,
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

    /*
     * Assigning an existing platform user
     * is restricted to SUPERADMIN.
     *
     * Company ADMIN can create a new member
     * through the normal Members endpoint.
     */
    if (!access.user.isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,

          message: "Superadmin access required.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    const validation = assignExistingMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid assignment data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const member = await assignExistingCompanyMember({
      companyId: params.companyId,

      uid: params.uid,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,

        data: member,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Assign existing member error:", error);

    if (error.message === "MEMBERSHIP_EXISTS") {
      return NextResponse.json(
        {
          success: false,

          message: "This user is already a member of the company.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Platform user not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "SUPERADMIN_REQUIRED") {
      return NextResponse.json(
        {
          success: false,

          message: "Superadmin access required.",
        },
        {
          status: 403,
        },
      );
    }

    if (error.message === "INVALID_CUSTOM_PERMISSION") {
      return NextResponse.json(
        {
          success: false,

          message: "One or more permissions are invalid.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to assign user to company.",
      },
      {
        status: 500,
      },
    );
  }
}
