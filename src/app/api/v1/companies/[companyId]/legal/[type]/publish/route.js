import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  legalTypeSchema,
  publishLegalVersionSchema,
} from "@/modules/legal/legal.schema";

import { publishLegalVersion } from "@/modules/legal/legal.service";

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

    const params = await context.params;

    const company = companyIdSchema.safeParse(params.companyId);

    const type = legalTypeSchema.safeParse(params.type);

    if (!company.success || !type.success) {
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
      companyId: company.data,

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

    const validation = publishLegalVersionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid legal version.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await publishLegalVersion({
      companyId: company.data,

      type: type.data,

      versionId: validation.data.versionId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Publish legal version error:", error);

    if (error.message === "LEGAL_VERSION_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Legal version not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "LEGAL_VERSION_TYPE_MISMATCH") {
      return NextResponse.json(
        {
          success: false,
          message: "Legal version does not belong to this document type.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to publish legal document.",
      },
      {
        status: 500,
      },
    );
  }
}
