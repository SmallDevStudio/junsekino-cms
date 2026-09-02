import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  createLegalVersionSchema,
  legalTypeSchema,
  legalVersionIdSchema,
} from "@/modules/legal/legal.schema";

import { updateLegalDraft } from "@/modules/legal/legal-draft.service";

/*
 * =========================================================
 * PARAMS
 * =========================================================
 */

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const type = legalTypeSchema.safeParse(params.type);

  const version = legalVersionIdSchema.safeParse(params.versionId);

  if (!company.success || !type.success || !version.success) {
    return null;
  }

  return {
    companyId: company.data,

    type: type.data,

    versionId: version.data,
  };
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

    const data = await updateLegalDraft({
      companyId: params.companyId,

      type: params.type,

      versionId: params.versionId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error(
      "Update legal draft error:",

      error,
    );

    const knownErrors = {
      LEGAL_VERSION_NOT_FOUND: {
        status: 404,

        message: "Legal version not found.",
      },

      LEGAL_VERSION_TYPE_MISMATCH: {
        status: 400,

        message: "Legal version does not belong to this document type.",
      },

      LEGAL_VERSION_NOT_DRAFT: {
        status: 409,

        message: "Only draft legal versions can be edited.",
      },

      LEGAL_TITLE_REQUIRED: {
        status: 400,

        message: "Legal document title is required.",
      },

      LEGAL_CONTENT_REQUIRED: {
        status: 400,

        message: "Legal document content is required.",
      },
    };

    const known = knownErrors[error.message];

    if (known) {
      return NextResponse.json(
        {
          success: false,

          message: known.message,
        },
        {
          status: known.status,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update legal draft.",
      },
      {
        status: 500,
      },
    );
  }
}
