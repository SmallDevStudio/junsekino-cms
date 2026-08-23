import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createProjectCategorySchema } from "@/modules/project/project-category.schema";

import {
  createProjectCategory,
  listProjectCategories,
} from "@/modules/project/project-category.service";

async function getCompanyId(context) {
  const params = await context.params;

  const result = companyIdSchema.safeParse(params.companyId);

  return result.success ? result.data : null;
}

export async function GET(request, context) {
  const companyId = await getCompanyId(context);

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

    permission: PERMISSIONS.PROJECT_CATEGORY_VIEW,
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

  const data = await listProjectCategories({
    companyId,
  });

  return NextResponse.json({
    success: true,
    data,
  });
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

    const companyId = await getCompanyId(context);

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

      permission: PERMISSIONS.PROJECT_CATEGORY_CREATE,
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

    const validation = createProjectCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid category data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const category = await createProjectCategory({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create project category error:", error);

    if (error.message === "PROJECT_CATEGORY_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,
          message: "Category slug is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message === "PROJECT_CATEGORY_PARENT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Parent category not found.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create category.",
      },
      {
        status: 500,
      },
    );
  }
}
