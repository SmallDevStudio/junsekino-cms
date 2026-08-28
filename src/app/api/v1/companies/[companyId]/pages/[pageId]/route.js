import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { pageIdSchema, updatePageSchema } from "@/modules/page/page.schema";

import { deletePage, getPage, updatePage } from "@/modules/page/page.service";

/*
 * =========================================================
 * PARAMS
 * =========================================================
 */

async function resolveParams(context) {
  const params = await context.params;

  const companyValidation = companyIdSchema.safeParse(params.companyId);

  const pageValidation = pageIdSchema.safeParse(params.pageId);

  if (!companyValidation.success || !pageValidation.success) {
    return null;
  }

  return {
    companyId: companyValidation.data,

    pageId: pageValidation.data,
  };
}

/*
 * =========================================================
 * ZOD ERROR FORMATTER
 * =========================================================
 *
 * flatten().fieldErrors is not enough
 * for nested CMS structures such as:
 *
 * content.en
 * featuredImage.presentation.aspectRatio
 * navigation.label.en
 * sections[0].data.content.en
 *
 * Return the complete path so Admin UI
 * can show the actual validation problem.
 * =========================================================
 */

function formatValidationIssues(error) {
  if (!Array.isArray(error?.issues)) {
    return [];
  }

  return error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),

    message: issue.message,

    code: issue.code,
  }));
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

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

      permission: PERMISSIONS.PAGE_VIEW,
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

    const page = await getPage({
      companyId: params.companyId,

      pageId: params.pageId,
    });

    return NextResponse.json({
      success: true,

      data: page,
    });
  } catch (error) {
    console.error("Get page error:", error);

    if (error.message === "PAGE_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Page not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve page.",
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

      permission: PERMISSIONS.PAGE_UPDATE,
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

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid JSON request body.",
        },
        {
          status: 400,
        },
      );
    }

    const validation = updatePageSchema.safeParse(body);

    /*
     * =====================================================
     * VALIDATION FAILED
     * =====================================================
     */

    if (!validation.success) {
      const issues = formatValidationIssues(validation.error);

      /*
       * Server log is intentionally detailed.
       *
       * This dramatically improves debugging
       * without exposing stack traces.
       */
      console.error("Update page validation failed:", {
        companyId: params.companyId,

        pageId: params.pageId,

        issues,
      });

      return NextResponse.json(
        {
          success: false,

          code: "PAGE_VALIDATION_FAILED",

          message: issues.length
            ? issues
                .map((issue) =>
                  issue.path
                    ? `${issue.path}: ${issue.message}`
                    : issue.message,
                )
                .join(" | ")
            : "Invalid page data.",

          issues,

          /*
           * Keep legacy shape for other
           * Admin modules already consuming
           * fieldErrors.
           */
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

          message: "No page data supplied.",
        },
        {
          status: 400,
        },
      );
    }

    const page = await updatePage({
      companyId: params.companyId,

      pageId: params.pageId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: page,
    });
  } catch (error) {
    console.error("Update page error:", error);

    if (error.message === "PAGE_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Page not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "PAGE_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,

          code: "PAGE_SLUG_EXISTS",

          message: "This page slug is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message === "PAGE_TITLE_REQUIRED") {
      return NextResponse.json(
        {
          success: false,

          code: "PAGE_TITLE_REQUIRED",

          message: "English page title is required.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update page.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * =========================================================
 * DELETE
 * =========================================================
 */

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

      permission: PERMISSIONS.PAGE_DELETE,
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

    const result = await deletePage({
      companyId: params.companyId,

      pageId: params.pageId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error("Delete page error:", error);

    if (error.message === "PAGE_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Page not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "PAGE_ALREADY_DELETED") {
      return NextResponse.json(
        {
          success: false,

          message: "Page has already been deleted.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to delete page.",
      },
      {
        status: 500,
      },
    );
  }
}
