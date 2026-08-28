import { NextResponse } from "next/server";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { updateCompanyLocalizationSchema } from "@/modules/company/company-localization.schema";

import {
  getCompanyLocalization,
  updateCompanyLocalization,
} from "@/modules/company/company-localization.service";

/*
 * =========================================================
 * COMPANY ID
 * =========================================================
 */

async function resolveCompanyId(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  if (!validation.success) {
    return null;
  }

  return validation.data;
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function GET(request, context) {
  try {
    const companyId = await resolveCompanyId(context);

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

    const access = await getCompanyPermission({
      companyId,

      permission: PERMISSIONS.COMPANY_VIEW,
    });

    if (!access.authorized) {
      const status = access.reason === "AUTHENTICATION_REQUIRED" ? 401 : 403;

      return NextResponse.json(
        {
          success: false,

          message:
            status === 401 ? "Authentication required." : "Permission denied.",
        },
        {
          status,
        },
      );
    }

    const data = await getCompanyLocalization({
      companyId,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("Get company localization error:", error);

    if (error.message === "COMPANY_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Company not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve localization settings.",
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

    const companyId = await resolveCompanyId(context);

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

    const access = await getCompanyPermission({
      companyId,

      permission: PERMISSIONS.COMPANY_UPDATE,
    });

    if (!access.authorized) {
      const status = access.reason === "AUTHENTICATION_REQUIRED" ? 401 : 403;

      return NextResponse.json(
        {
          success: false,

          message:
            status === 401
              ? "Authentication required."
              : "Company update permission required.",
        },
        {
          status,
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

    const validation = updateCompanyLocalizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid localization settings.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await updateCompanyLocalization({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("Update company localization error:", error);

    if (error.message === "COMPANY_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Company not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "DEFAULT_LOCALE_NOT_SUPPORTED") {
      return NextResponse.json(
        {
          success: false,

          message: "Default language must be enabled.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update localization settings.",
      },
      {
        status: 500,
      },
    );
  }
}
