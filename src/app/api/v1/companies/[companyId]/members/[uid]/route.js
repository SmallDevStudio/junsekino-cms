import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  uidSchema,
  updateMemberSchema,
} from "@/modules/user/membership.schema";

import {
  editCompanyMember,
  getCompanyMember,
  removeCompanyMember,
} from "@/modules/user/membership.service";

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

export async function GET(request, context) {
  try {
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

      permission: PERMISSIONS.USER_VIEW,
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

    const member = await getCompanyMember({
      companyId: params.companyId,

      uid: params.uid,
    });

    return NextResponse.json({
      success: true,

      data: member,
    });
  } catch (error) {
    console.error("Get member error:", error);

    if (error.message === "MEMBERSHIP_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Company member not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve company member.",
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

    const body = await request.json();

    const validation = updateMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid member data.",

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

          message: "No member data supplied.",
        },
        {
          status: 400,
        },
      );
    }

    const member = await editCompanyMember({
      companyId: params.companyId,

      uid: params.uid,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: member,
    });
  } catch (error) {
    console.error("Update member error:", error);

    if (error.message === "MEMBERSHIP_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Company member not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "INVALID_CUSTOM_PERMISSION") {
      return NextResponse.json(
        {
          success: false,

          message: "One or more custom permissions are invalid for this role.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update company member.",
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

      permission: PERMISSIONS.USER_DELETE,
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

    const result = await removeCompanyMember({
      companyId: params.companyId,

      uid: params.uid,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error("Delete member error:", error);

    if (error.message === "MEMBERSHIP_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Company member not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "CANNOT_REMOVE_SELF") {
      return NextResponse.json(
        {
          success: false,

          message: "You cannot remove your own company membership.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to remove company member.",
      },
      {
        status: 500,
      },
    );
  }
}
