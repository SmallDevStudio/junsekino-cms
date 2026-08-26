import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";
import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { importMediaUrlSchema } from "@/modules/media/media.schema";

import { importMediaFromUrl } from "@/modules/media/media.service";

async function resolveCompanyId(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  return validation.success ? validation.data : null;
}

function getImportErrorStatus(errorCode) {
  if (
    [
      "MEDIA_REMOTE_URL_INVALID",
      "MEDIA_REMOTE_URL_PROTOCOL_NOT_ALLOWED",
      "MEDIA_REMOTE_URL_CREDENTIALS_NOT_ALLOWED",
      "MEDIA_REMOTE_HOST_NOT_ALLOWED",
      "MEDIA_REMOTE_HOST_UNRESOLVED",
      "MEDIA_TYPE_NOT_ALLOWED",
      "MEDIA_INVALID_SIZE",
      "MEDIA_FILE_TOO_LARGE",
      "MEDIA_INVALID_IMAGE",
      "MEDIA_REMOTE_EMPTY_RESPONSE",
      "MEDIA_REMOTE_REDIRECT_INVALID",
      "MEDIA_REMOTE_TOO_MANY_REDIRECTS",
    ].includes(errorCode)
  ) {
    return 400;
  }

  if (
    ["MEDIA_REMOTE_TIMEOUT", "MEDIA_REMOTE_DOWNLOAD_FAILED"].includes(errorCode)
  ) {
    return 502;
  }

  if (errorCode?.startsWith("MEDIA_REMOTE_HTTP_ERROR:")) {
    return 502;
  }

  return 500;
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

    const body = await request.json();

    const validation = importMediaUrlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid media URL.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const media = await importMediaFromUrl({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,

        data: media,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Import media URL error:", error);

    const status = getImportErrorStatus(error.message);

    const messages = {
      MEDIA_REMOTE_URL_INVALID: "The image URL is invalid.",

      MEDIA_REMOTE_URL_PROTOCOL_NOT_ALLOWED:
        "Only HTTP and HTTPS image URLs are supported.",

      MEDIA_REMOTE_URL_CREDENTIALS_NOT_ALLOWED:
        "URLs containing embedded credentials are not allowed.",

      MEDIA_REMOTE_HOST_NOT_ALLOWED: "This image host is not allowed.",

      MEDIA_REMOTE_HOST_UNRESOLVED: "Unable to resolve the image host.",

      MEDIA_TYPE_NOT_ALLOWED: "The remote file is not a supported image type.",

      MEDIA_INVALID_SIZE: "The remote image has an invalid size.",

      MEDIA_FILE_TOO_LARGE: "The remote image exceeds the maximum file size.",

      MEDIA_INVALID_IMAGE: "The downloaded file is not a valid image.",

      MEDIA_REMOTE_EMPTY_RESPONSE: "The remote server returned an empty image.",

      MEDIA_REMOTE_TIMEOUT: "The remote image server took too long to respond.",

      MEDIA_REMOTE_DOWNLOAD_FAILED: "Unable to download the remote image.",

      MEDIA_REMOTE_REDIRECT_INVALID:
        "The remote image returned an invalid redirect.",

      MEDIA_REMOTE_TOO_MANY_REDIRECTS:
        "The remote image returned too many redirects.",
    };

    return NextResponse.json(
      {
        success: false,

        message:
          messages[error.message] ||
          (error.message?.startsWith("MEDIA_REMOTE_HTTP_ERROR:")
            ? "The remote image server returned an error."
            : "Unable to import image."),
      },
      {
        status,
      },
    );
  }
}
