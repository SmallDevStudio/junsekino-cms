import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";
import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { resolveExternalMedia } from "@/modules/public-content/external-media.service";

async function resolveCompanyId(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  return validation.success ? validation.data : null;
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

      permission: PERMISSIONS.PUBLIC_VIEW,
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

    const sourceUrl = String(body?.sourceUrl || "").trim();

    if (!sourceUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Source URL is required.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await resolveExternalMedia({
      sourceUrl,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Resolve external media error:", error);

    const errors = {
      INVALID_EXTERNAL_MEDIA_URL: [400, "Enter a valid external media URL."],

      INVALID_YOUTUBE_URL: [
        400,
        "Unable to find a YouTube video ID in this URL.",
      ],

      EXTERNAL_MEDIA_NOT_FOUND: [
        404,
        "The external video could not be found or is not publicly available.",
      ],

      EXTERNAL_MEDIA_PROVIDER_NOT_SUPPORTED: [
        400,
        "Automatic metadata is not supported for this provider yet.",
      ],

      EXTERNAL_MEDIA_FETCH_FAILED: [
        502,
        "Unable to retrieve external media information.",
      ],
    };

    const mapped = errors[error.message];

    if (mapped) {
      const [status, message] = mapped;

      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve external media information.",
      },
      {
        status: 500,
      },
    );
  }
}
