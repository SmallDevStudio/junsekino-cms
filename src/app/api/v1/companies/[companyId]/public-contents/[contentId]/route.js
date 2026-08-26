import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";
import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  publicContentIdSchema,
  updatePublicContentSchema,
} from "@/modules/public-content/public-content.schema";

import {
  deletePublicContent,
  getPublicContent,
  updatePublicContent,
} from "@/modules/public-content/public-content.service";

import { findAvailableSlug } from "@/modules/shared/slug-suggestion.service";

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const content = publicContentIdSchema.safeParse(params.contentId);

  if (!company.success || !content.success) {
    return null;
  }

  return {
    companyId: company.data,
    contentId: content.data,
  };
}

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

    const data = await getPublicContent({
      companyId: params.companyId,

      contentId: params.contentId,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get public content error:", error);

    if (error.message === "PUBLIC_CONTENT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Public content not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve public content.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request, context) {
  let params = null;

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

    params = await resolveParams(context);

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

      permission: PERMISSIONS.PUBLIC_UPDATE,
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

    const validation = updatePublicContentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid public content data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await updatePublicContent({
      companyId: params.companyId,

      contentId: params.contentId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update public content error:", error);

    if (error.message === "PUBLIC_SLUG_EXISTS") {
      let suggestedSlug = null;

      try {
        if (params?.companyId && error.slug) {
          suggestedSlug = await findAvailableSlug({
            companyId: params.companyId,

            contentType: "publicContent",

            slug: error.slug,

            excludeContentId: params.contentId,
          });
        }
      } catch (suggestionError) {
        console.error("Public content slug suggestion error:", suggestionError);
      }

      return NextResponse.json(
        {
          success: false,

          code: "PUBLIC_SLUG_EXISTS",

          message: "Public content slug is already in use.",

          suggestedSlug,
        },
        {
          status: 409,
        },
      );
    }

    const messages = {
      PUBLIC_CONTENT_NOT_FOUND: [404, "Public content not found."],

      PUBLIC_TITLE_REQUIRED: [400, "Title is required."],

      PUBLIC_ARTICLE_CONTENT_REQUIRED: [400, "Article content is required."],

      PUBLIC_SOURCE_REQUIRED: [400, "Video or embed source is required."],
    };

    if (messages[error.message]) {
      const [status, message] = messages[error.message];

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
        message: "Unable to update public content.",
      },
      {
        status: 500,
      },
    );
  }
}

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

      permission: PERMISSIONS.PUBLIC_DELETE,
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

    const data = await deletePublicContent({
      companyId: params.companyId,

      contentId: params.contentId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Delete public content error:", error);

    if (
      error.message === "PUBLIC_CONTENT_NOT_FOUND" ||
      error.message === "PUBLIC_CONTENT_ALREADY_DELETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Public content not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete public content.",
      },
      {
        status: 500,
      },
    );
  }
}
