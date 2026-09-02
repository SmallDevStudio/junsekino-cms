import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { updateCommunicationSettingsSchema } from "@/modules/settings/communication-settings.schema";

import {
  getCommunicationSettings,
  updateCommunicationSettings,
} from "@/modules/settings/communication-settings.service";

/*
 * =========================================================
 * ACCESS
 * =========================================================
 */

async function resolveAccess(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  if (!validation.success) {
    return {
      companyId: null,

      access: null,
    };
  }

  const companyId = validation.data;

  const access = await getCompanyPermission({
    companyId,

    permission: PERMISSIONS.COMPANY_UPDATE,
  });

  return {
    companyId,

    access,
  };
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function GET(request, context) {
  try {
    const { companyId, access } = await resolveAccess(context);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid company ID.",
        },
        {
          status: 400,
        },
      );
    }

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

    const data = await getCommunicationSettings({
      companyId,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("Get communication settings error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve communication settings.",
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

    const { companyId, access } = await resolveAccess(context);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid company ID.",
        },
        {
          status: 400,
        },
      );
    }

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

    const validation = updateCommunicationSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid communication settings.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await updateCommunicationSettings({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("Update communication settings error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update communication settings.",
      },
      {
        status: 500,
      },
    );
  }
}
