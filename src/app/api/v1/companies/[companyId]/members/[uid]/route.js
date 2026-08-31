import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  setCompanyAccessSchema,
  uidSchema,
  updateMemberSchema,
} from "@/modules/user/membership.schema";

import {
  editCompanyMember,
  getCompanyMember,
  removeCompanyMember,
  setCompanyMemberAccess,
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

function invalidParamsResponse() {
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

function accessDeniedResponse(access) {
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

function errorResponse(error, fallbackMessage) {
  const errors = {
    MEMBERSHIP_NOT_FOUND: [404, "Company member not found."],

    USER_NOT_FOUND: [404, "User not found."],

    USER_DELETED: [409, "This user account has been deleted."],

    MEMBERSHIP_EXISTS: [409, "This user already has access to the company."],

    INVALID_CUSTOM_PERMISSION: [
      400,
      "One or more custom permissions are invalid for this role.",
    ],

    CANNOT_REMOVE_SELF: [409, "You cannot remove your own company membership."],

    CANNOT_MANAGE_SUPERADMIN: [
      403,
      "A company administrator cannot manage a Superadmin account.",
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

      message: fallbackMessage,
    },
    {
      status: 500,
    },
  );
}

export async function GET(request, context) {
  try {
    const params = await resolveParams(context);

    if (!params) {
      return invalidParamsResponse();
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.USER_VIEW,
    });

    if (!access.authorized) {
      return accessDeniedResponse(access);
    }

    const member = await getCompanyMember({
      companyId: params.companyId,

      uid: params.uid,

      currentUser: access.user,

      currentMembership: access.membership,
    });

    return NextResponse.json({
      success: true,

      data: member,
    });
  } catch (error) {
    console.error("Get member error:", error);

    return errorResponse(error, "Unable to retrieve company member.");
  }
}

export async function PUT(request, context) {
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
      return invalidParamsResponse();
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.USER_UPDATE,
    });

    if (!access.authorized) {
      return accessDeniedResponse(access);
    }

    const body = await request.json();

    const validation = setCompanyAccessSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid company access data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const member = await setCompanyMemberAccess({
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
    console.error("Set company member access error:", error);

    return errorResponse(error, "Unable to update company access.");
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
      return invalidParamsResponse();
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.USER_UPDATE,
    });

    if (!access.authorized) {
      return accessDeniedResponse(access);
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

    return errorResponse(error, "Unable to update company member.");
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
      return invalidParamsResponse();
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.USER_DELETE,
    });

    if (!access.authorized) {
      return accessDeniedResponse(access);
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

    return errorResponse(error, "Unable to remove company member.");
  }
}
