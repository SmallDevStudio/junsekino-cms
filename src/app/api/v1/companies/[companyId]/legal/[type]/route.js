import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  createLegalVersionSchema,
  legalTypeSchema,
} from "@/modules/legal/legal.schema";

import {
  createLegalVersion,
  getLegalVersions,
} from "@/modules/legal/legal.service";

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const type = legalTypeSchema.safeParse(params.type);

  if (!company.success || !type.success) {
    return null;
  }

  return {
    companyId: company.data,

    type: type.data,
  };
}

export async function GET(request, context) {
  try {
    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid legal document request.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Using COMPANY_UPDATE for now
     * to avoid changing central
     * permissions during this step.
     */
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

    const data = await getLegalVersions({
      companyId: params.companyId,

      type: params.type,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("List legal versions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve legal documents.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request, context) {
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
          message: "Invalid legal document request.",
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

    const validation = createLegalVersionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid legal document data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await createLegalVersion({
      companyId: params.companyId,

      type: params.type,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create legal version error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error.message === "LEGAL_TITLE_REQUIRED"
            ? "Legal document title is required."
            : error.message === "LEGAL_CONTENT_REQUIRED"
              ? "Legal document content is required."
              : "Unable to create legal document.",
      },
      {
        status: ["LEGAL_TITLE_REQUIRED", "LEGAL_CONTENT_REQUIRED"].includes(
          error.message,
        )
          ? 400
          : 500,
      },
    );
  }
}
