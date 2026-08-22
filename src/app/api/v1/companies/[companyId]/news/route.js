import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { NEWS_STATUSES } from "@/constants/news";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createNewsSchema } from "@/modules/news/news.schema";

import { createNews, listNews } from "@/modules/news/news.service";

async function resolveCompanyId(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  if (!validation.success) {
    return null;
  }

  return validation.data;
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

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");

    const search = searchParams.get("search");

    if (status && !NEWS_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid news status.",
        },
        {
          status: 400,
        },
      );
    }

    const news = await listNews({
      companyId,
      status,
      search,
    });

    return NextResponse.json({
      success: true,

      data: news,
    });
  } catch (error) {
    console.error("List news error:", error);

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

      permission: PERMISSIONS.NEWS_CREATE,
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

    const validation = createNewsSchema.safeParse(body);

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

    const news = await createNews({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,

        data: news,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create news error:", error);

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

    if (error.message === "NEWS_TITLE_REQUIRED") {
      return NextResponse.json(
        {
          success: false,

          message: "News title is required in at least one language.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to create news.",
      },
      {
        status: 500,
      },
    );
  }
}
