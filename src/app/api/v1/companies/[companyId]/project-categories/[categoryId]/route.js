import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  projectCategoryIdSchema,
  updateProjectCategorySchema,
} from "@/modules/project/project-category.schema";

import { updateProjectCategory } from "@/modules/project/project-category.service";

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

    const params = await context.params;

    const company = companyIdSchema.safeParse(params.companyId);

    const category = projectCategoryIdSchema.safeParse(params.categoryId);

    if (!company.success || !category.success) {
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

      permission: PERMISSIONS.PROJECT_CATEGORY_UPDATE,
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

    const validation = updateProjectCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid category data.",
        },
        {
          status: 400,
        },
      );
    }

    const result = await updateProjectCategory({
      companyId: company.data,

      categoryId: category.data,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Update project category error:", error);

    const messages = {
      PROJECT_CATEGORY_NOT_FOUND: "Category not found.",

      PROJECT_CATEGORY_SLUG_EXISTS: "Category slug is already in use.",

      PROJECT_CATEGORY_PARENT_NOT_FOUND: "Parent category not found.",

      PROJECT_CATEGORY_CANNOT_PARENT_SELF: "Category cannot be its own parent.",
    };

    if (messages[error.message]) {
      return NextResponse.json(
        {
          success: false,
          message: messages[error.message],
        },
        {
          status: error.message === "PROJECT_CATEGORY_NOT_FOUND" ? 404 : 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update category.",
      },
      {
        status: 500,
      },
    );
  }
}
