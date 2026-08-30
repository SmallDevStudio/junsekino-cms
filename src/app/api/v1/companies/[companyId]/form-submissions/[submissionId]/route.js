import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  formSubmissionIdSchema,
  updateFormSubmissionSchema,
} from "@/modules/form/form-submission.schema";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import {
  getFormSubmission,
  markFormSubmissionRead,
  permanentlyDeleteFormSubmission,
  restoreFormSubmission,
  trashFormSubmission,
  updateFormSubmissionStatus,
} from "@/modules/form/form-submission.service";

/*
 * =========================================================
 * PARAMS
 * =========================================================
 */

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const submission = formSubmissionIdSchema.safeParse(params.submissionId);

  if (!company.success || !submission.success) {
    return null;
  }

  return {
    companyId: company.data,

    submissionId: submission.data,
  };
}

/*
 * =========================================================
 * ACCESS
 * =========================================================
 */

async function resolveAccess(params) {
  return getCompanyPermission({
    companyId: params.companyId,

    permission: PERMISSIONS.COMPANY_UPDATE,
  });
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

          message: "Invalid request.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await resolveAccess(params);

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

    const { searchParams } = new URL(request.url);

    const includeDeleted = searchParams.get("includeDeleted") === "1";

    const data = await getFormSubmission({
      companyId: params.companyId,

      submissionId: params.submissionId,

      includeDeleted,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    if (error.message === "FORM_SUBMISSION_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Submission not found.",
        },
        {
          status: 404,
        },
      );
    }

    console.error("Get form submission error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve submission.",
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

          message: "Invalid request.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await resolveAccess(params);

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

    const validation = updateFormSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid submission update.",
        },
        {
          status: 400,
        },
      );
    }

    let data;

    /*
     * Existing workflow status update.
     */

    if (validation.data.status) {
      data = await updateFormSubmissionStatus({
        companyId: params.companyId,

        submissionId: params.submissionId,

        status: validation.data.status,

        currentUser: access.user,
      });
    } else {
      switch (validation.data.action) {
        case "mark_read":
          data = await markFormSubmissionRead({
            companyId: params.companyId,

            submissionId: params.submissionId,

            currentUser: access.user,
          });

          break;

        case "trash":
          data = await trashFormSubmission({
            companyId: params.companyId,

            submissionId: params.submissionId,

            currentUser: access.user,
          });

          break;

        case "restore":
          data = await restoreFormSubmission({
            companyId: params.companyId,

            submissionId: params.submissionId,

            currentUser: access.user,
          });

          break;

        default:
          return NextResponse.json(
            {
              success: false,

              message: "Unsupported submission action.",
            },
            {
              status: 400,
            },
          );
      }
    }

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("Update form submission error:", error);

    if (error.message === "FORM_SUBMISSION_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Submission not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update submission.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * =========================================================
 * DELETE PERMANENTLY
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

          message: "Invalid request.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await resolveAccess(params);

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

    const data = await permanentlyDeleteFormSubmission({
      companyId: params.companyId,

      submissionId: params.submissionId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("Permanent delete form submission error:", error);

    if (error.message === "FORM_SUBMISSION_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Submission not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "FORM_SUBMISSION_NOT_IN_TRASH") {
      return NextResponse.json(
        {
          success: false,

          message: "Move the message to Trash before deleting it permanently.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to permanently delete submission.",
      },
      {
        status: 500,
      },
    );
  }
}
