import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { mediaIdSchema } from "@/modules/media/media.schema";

import { finalizeMedia } from "@/modules/media/media.service";

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

    const media = mediaIdSchema.safeParse(params.mediaId);

    if (!company.success || !media.success) {
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
      companyId: company.data,

      permission: PERMISSIONS.MEDIA_UPLOAD,
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

    const data = await finalizeMedia({
      companyId: company.data,

      mediaId: media.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Finalize media error:", error);

    const badRequests = [
      "MEDIA_FILE_NOT_UPLOADED",
      "MEDIA_TYPE_NOT_ALLOWED",
      "MEDIA_FILE_TOO_LARGE",
      "MEDIA_MIME_MISMATCH",
      "MEDIA_SIZE_MISMATCH",
      "MEDIA_INVALID_IMAGE",
      "MEDIA_INVALID_STATUS",
    ];

    if (badRequests.includes(error.message)) {
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

    if (error.message === "MEDIA_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Media not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to finalize media.",
      },
      {
        status: 500,
      },
    );
  }
}
