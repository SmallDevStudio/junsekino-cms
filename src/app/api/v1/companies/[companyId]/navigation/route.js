import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { updateNavigationSchema } from "@/modules/navigation/navigation.schema";

import {
  getCompanyNavigation,
  resetCompanyNavigation,
  updateCompanyNavigation,
} from "@/modules/navigation/navigation.service";

export const dynamic = "force-dynamic";

async function resolveCompanyId(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  return validation.success ? validation.data : null;
}

function errorResponse(
  error,

  fallbackMessage,
) {
  const validationErrors = new Set([
    "INVALID_NAVIGATION_ITEMS",

    "INVALID_SYSTEM_NAVIGATION_ITEM",

    "NAVIGATION_KEY_RESERVED",

    "NAVIGATION_KEY_DUPLICATE",

    "NAVIGATION_ENGLISH_LABEL_REQUIRED",

    "INVALID_NAVIGATION_URL",

    "NAVIGATION_PATH_RESERVED",

    "NAVIGATION_PATH_DUPLICATE",

    "SYSTEM_NAVIGATION_ITEM_REQUIRED",

    "CUSTOM_PAGE_NAVIGATION_NOT_AVAILABLE",
  ]);

  if (validationErrors.has(error.message)) {
    return NextResponse.json(
      {
        success: false,

        message: error.message,
      },

      {
        status: 400,
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

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function GET(
  request,

  context,
) {
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

    const data = await getCompanyNavigation(companyId);

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error(
      "Get navigation error:",

      error,
    );

    return errorResponse(
      error,

      "Unable to retrieve navigation.",
    );
  }
}

/*
 * =========================================================
 * PATCH
 * =========================================================
 */

export async function PATCH(
  request,

  context,
) {
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

    const validation = updateNavigationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid navigation data.",

          errors: validation.error.flatten().fieldErrors,
        },

        {
          status: 400,
        },
      );
    }

    const data = await updateCompanyNavigation({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error(
      "Update navigation error:",

      error,
    );

    return errorResponse(
      error,

      "Unable to update navigation.",
    );
  }
}

/*
 * =========================================================
 * DELETE
 *
 * Reset navigation to company defaults.
 * =========================================================
 */

export async function DELETE(
  request,

  context,
) {
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

    const data = await resetCompanyNavigation({
      companyId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error(
      "Reset navigation error:",

      error,
    );

    return errorResponse(
      error,

      "Unable to reset navigation.",
    );
  }
}
