import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { FORM_SUBMISSION_STATUSES } from "@/constants/form";

import { companyIdSchema } from "@/modules/company/company.schema";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { listFormSubmissions } from "@/modules/form/form-submission.service";

export async function GET(request, context) {
  try {
    const params = await context.params;

    const company = companyIdSchema.safeParse(params.companyId);

    if (!company.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid company.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: company.data,

      /*
       * Temporary until central
       * permission consistency pass.
       */
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

    const { searchParams } = new URL(request.url);

    const formId = searchParams.get("formId");

    const status = searchParams.get("status");

    if (status && !FORM_SUBMISSION_STATUSES.includes(status)) {
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

    const data = await listFormSubmissions({
      companyId: company.data,

      formId,
      status,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("List form submissions error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve submissions.",
      },
      {
        status: 500,
      },
    );
  }
}
