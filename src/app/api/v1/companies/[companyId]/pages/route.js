import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { PAGE_STATUSES, PAGE_TYPES } from "@/constants/page";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createPageSchema } from "@/modules/page/page.schema";

import { createPage, listPages } from "@/modules/page/page.service";

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

      permission: PERMISSIONS.PAGE_VIEW,
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

    const pageType = searchParams.get("pageType");

    const search = searchParams.get("search");

    if (status && !PAGE_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid page status.",
        },
        {
          status: 400,
        },
      );
    }

    if (pageType && !PAGE_TYPES.includes(pageType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid page type.",
        },
        {
          status: 400,
        },
      );
    }

    const pages = await listPages({
      companyId,
      status,
      pageType,
      search,
    });

    return NextResponse.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("List pages error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve pages.",
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

      permission: PERMISSIONS.PAGE_CREATE,
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

    const validation = createPageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid page data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const page = await createPage({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,
        data: page,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create page error:", error);

    if (error.message === "PAGE_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,
          message: "This page slug is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message === "PAGE_TITLE_REQUIRED") {
      return NextResponse.json(
        {
          success: false,
          message: "Page title is required in at least one language.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create page.",
      },
      {
        status: 500,
      },
    );
  }
}
