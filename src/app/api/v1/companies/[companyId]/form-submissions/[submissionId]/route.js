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
  updateFormSubmissionStatus,
} from "@/modules/form/form-submission.service";

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

    const access = await getCompanyPermission({
      companyId: params.companyId,

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

    const data = await getFormSubmission({
      companyId: params.companyId,

      submissionId: params.submissionId,
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

    const access = await getCompanyPermission({
      companyId: params.companyId,

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

    const validation = updateFormSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid submission status.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await updateFormSubmissionStatus({
      companyId: params.companyId,

      submissionId: params.submissionId,

      status: validation.data.status,

      currentUser: access.user,
    });

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
