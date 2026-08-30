import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { pageIdSchema, publishPageSchema } from "@/modules/page/page.schema";

import { publishPage } from "@/modules/page/page.service";

/*
 * =========================================================
 * PARAMS
 * =========================================================
 */

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const page = pageIdSchema.safeParse(params.pageId);

  if (!company.success || !page.success) {
    return null;
  }

  return {
    companyId: company.data,

    pageId: page.data,
  };
}

/*
 * =========================================================
 * REQUEST BODY
 * =========================================================
 *
 * Immediate publishing does not require a body.
 *
 * Examples:
 *
 * POST {}
 *
 * or:
 *
 * POST {
 *   scheduledAt: "2026-08-31T10:00:00.000Z"
 * }
 *
 * ContactManager currently sends an empty POST request,
 * so this function must safely normalize an empty body
 * to an empty object.
 * =========================================================
 */

async function readPublishBody(request) {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {
      success: true,

      data: {},
    };
  }

  try {
    const parsed = JSON.parse(rawBody);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        success: false,

        data: null,
      };
    }

    return {
      success: true,

      data: parsed,
    };
  } catch {
    return {
      success: false,

      data: null,
    };
  }
}

/*
 * =========================================================
 * KNOWN ERRORS
 * =========================================================
 */

function getPublishError(error) {
  const code = error?.message || "PAGE_PUBLISH_FAILED";

  const errors = {
    PAGE_NOT_FOUND: {
      status: 404,

      code: "PAGE_NOT_FOUND",

      message: "Page not found.",
    },

    PAGE_TITLE_REQUIRED: {
      status: 400,

      code: "PAGE_TITLE_REQUIRED",

      message: "An English page title is required before publishing.",
    },

    PAGE_CONTENT_REQUIRED: {
      status: 400,

      code: "PAGE_CONTENT_REQUIRED",

      message:
        "Add Contact information, an address, telephone, email or cover image before publishing.",
    },

    INVALID_SCHEDULE_DATE: {
      status: 400,

      code: "INVALID_SCHEDULE_DATE",

      message: "The scheduled publish date is invalid.",
    },

    SCHEDULE_MUST_BE_FUTURE: {
      status: 400,

      code: "SCHEDULE_MUST_BE_FUTURE",

      message: "The scheduled publish date must be in the future.",
    },
  };

  return (
    errors[code] || {
      status: 500,

      code: "PAGE_PUBLISH_FAILED",

      message: "Unable to publish page.",
    }
  );
}

/*
 * =========================================================
 * POST
 * =========================================================
 */

export async function POST(request, context) {
  try {
    /*
     * -----------------------------------------------------
     * ORIGIN
     * -----------------------------------------------------
     */

    if (!isTrustedOrigin(request)) {
      return NextResponse.json(
        {
          success: false,

          code: "INVALID_REQUEST_ORIGIN",

          message: "Invalid request origin.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * -----------------------------------------------------
     * PARAMS
     * -----------------------------------------------------
     */

    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,

          code: "INVALID_REQUEST_PARAMETERS",

          message: "Invalid request parameters.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * -----------------------------------------------------
     * PERMISSION
     * -----------------------------------------------------
     */

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.PAGE_PUBLISH,
    });

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,

          code: access.reason || "PERMISSION_DENIED",

          message: access.reason || "Permission denied.",
        },
        {
          status: access.user ? 403 : 401,
        },
      );
    }

    /*
     * -----------------------------------------------------
     * BODY
     * -----------------------------------------------------
     */

    const bodyResult = await readPublishBody(request);

    if (!bodyResult.success) {
      return NextResponse.json(
        {
          success: false,

          code: "INVALID_PUBLISH_BODY",

          message: "Invalid publish request body.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * -----------------------------------------------------
     * VALIDATION
     * -----------------------------------------------------
     */

    const validation = publishPageSchema.safeParse(bodyResult.data);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          code: "INVALID_PUBLISH_DATA",

          message: "Invalid publish data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * -----------------------------------------------------
     * PUBLISH
     * -----------------------------------------------------
     */

    const page = await publishPage({
      companyId: params.companyId,

      pageId: params.pageId,

      scheduledAt: validation.data.scheduledAt || null,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: page,
    });
  } catch (error) {
    console.error("Publish page error:", error);

    const resolvedError = getPublishError(error);

    return NextResponse.json(
      {
        success: false,

        code: resolvedError.code,

        message: resolvedError.message,
      },
      {
        status: resolvedError.status,
      },
    );
  }
}
