import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { newsIdSchema, publishNewsSchema } from "@/modules/news/news.schema";

import { publishNews } from "@/modules/news/news.service";

async function resolveParams(context) {
  const params = await context.params;

  const companyValidation = companyIdSchema.safeParse(params.companyId);

  const newsValidation = newsIdSchema.safeParse(params.newsId);

  if (!companyValidation.success || !newsValidation.success) {
    return null;
  }

  return {
    companyId: companyValidation.data,

    newsId: newsValidation.data,
  };
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

          message: "Invalid request parameters.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.NEWS_PUBLISH,
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

    const validation = publishNewsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid publish data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const news = await publishNews({
      companyId: params.companyId,

      newsId: params.newsId,

      scheduledAt: validation.data.scheduledAt || null,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: news,
    });
  } catch (error) {
    console.error("Publish news error:", error);

    if (error.message === "NEWS_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "News not found.",
        },
        {
          status: 404,
        },
      );
    }

    const badRequestErrors = [
      "NEWS_TITLE_REQUIRED",
      "NEWS_CONTENT_REQUIRED",
      "INVALID_SCHEDULE_DATE",
      "SCHEDULE_MUST_BE_FUTURE",
    ];

    if (badRequestErrors.includes(error.message)) {
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

    return NextResponse.json(
      {
        success: false,

        message: "Unable to publish news.",
      },
      {
        status: 500,
      },
    );
  }
}
