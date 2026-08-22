import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { newsIdSchema, updateNewsSchema } from "@/modules/news/news.schema";

import { deleteNews, getNews, updateNews } from "@/modules/news/news.service";

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

      permission: PERMISSIONS.NEWS_VIEW,
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

    const news = await getNews({
      companyId: params.companyId,

      newsId: params.newsId,
    });

    return NextResponse.json({
      success: true,

      data: news,
    });
  } catch (error) {
    console.error("Get news error:", error);

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

        message: "Unable to retrieve news.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request, context) {
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

      permission: PERMISSIONS.NEWS_UPDATE,
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

    const validation = updateNewsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid news data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    if (Object.keys(validation.data).length === 0) {
      return NextResponse.json(
        {
          success: false,

          message: "No news data supplied.",
        },
        {
          status: 400,
        },
      );
    }

    const news = await updateNews({
      companyId: params.companyId,

      newsId: params.newsId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: news,
    });
  } catch (error) {
    console.error("Update news error:", error);

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

    if (error.message === "NEWS_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,

          message: "This news slug is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update news.",
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

      permission: PERMISSIONS.NEWS_DELETE,
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

    const result = await deleteNews({
      companyId: params.companyId,

      newsId: params.newsId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error("Delete news error:", error);

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

    if (error.message === "NEWS_ALREADY_DELETED") {
      return NextResponse.json(
        {
          success: false,

          message: "News has already been deleted.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to delete news.",
      },
      {
        status: 500,
      },
    );
  }
}
