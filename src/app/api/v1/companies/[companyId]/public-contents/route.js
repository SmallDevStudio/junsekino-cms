import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import {
  PUBLIC_CONTENT_STATUSES,
  PUBLIC_CONTENT_TYPES,
  PUBLIC_PROVIDERS,
} from "@/constants/public-content";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createPublicContentSchema } from "@/modules/public-content/public-content.schema";

import {
  createPublicContent,
  listPublicContents,
} from "@/modules/public-content/public-content.service";

async function resolveCompanyId(context) {
  const params = await context.params;

  const result = companyIdSchema.safeParse(params.companyId);

  return result.success ? result.data : null;
}

export async function GET(request, context) {
  try {
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

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");

    const contentType = searchParams.get("contentType");

    const provider = searchParams.get("provider");

    const search = searchParams.get("search");

    if (status && !PUBLIC_CONTENT_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status.",
        },
        {
          status: 400,
        },
      );
    }

    if (contentType && !PUBLIC_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid content type.",
        },
        {
          status: 400,
        },
      );
    }

    if (provider && !PUBLIC_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid provider.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await listPublicContents({
      companyId,
      status,
      contentType,
      provider,
      search,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("List public content error:", error);

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

      permission: PERMISSIONS.PUBLIC_CREATE,
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

    const validation = createPublicContentSchema.safeParse(body);

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

    const data = await createPublicContent({
      companyId,

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
    console.error("Create public content error:", error);

    const messages = {
      PUBLIC_SLUG_EXISTS: [409, "Public content slug is already in use."],

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
        message: "Unable to create public content.",
      },
      {
        status: 500,
      },
    );
  }
}
