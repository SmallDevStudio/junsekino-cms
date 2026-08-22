import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { newsIdSchema } from "@/modules/news/news.schema";

import { unpublishNews } from "@/modules/news/news.service";

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

    const news = await unpublishNews({
      companyId: params.companyId,

      newsId: params.newsId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: news,
    });
  } catch (error) {
    console.error("Unpublish news error:", error);

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

    return NextResponse.json(
      {
        success: false,

        message: "Unable to unpublish news.",
      },
      {
        status: 500,
      },
    );
  }
}
