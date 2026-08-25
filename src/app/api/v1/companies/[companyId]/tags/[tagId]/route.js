import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { tagIdSchema, updateTagSchema } from "@/modules/tag/tag.schema";

import { deleteTag, getTag, updateTag } from "@/modules/tag/tag.service";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const tag = tagIdSchema.safeParse(params.tagId);

  if (!company.success || !tag.success) {
    return null;
  }

  return {
    companyId: company.data,

    tagId: tag.data,
  };
}

async function resolveAccess(params) {
  return getCompanyPermission({
    companyId: params.companyId,

    permission: PERMISSIONS.COMPANY_UPDATE,
  });
}

export async function GET(request, context) {
  try {
    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid tag.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await resolveAccess(params);

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

    const data = await getTag({
      companyId: params.companyId,

      tagId: params.tagId,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error.message === "TAG_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Tag not found.",
        },
        {
          status: 404,
        },
      );
    }

    console.error("Get tag error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve tag.",
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
          message: "Invalid tag.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await resolveAccess(params);

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

    const validation = updateTagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid tag data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await updateTag({
      companyId: params.companyId,

      tagId: params.tagId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update tag error:", error);

    if (error.message === "TAG_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Tag not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "TAG_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,
          message: "Tag already exists.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update tag.",
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
          message: "Invalid tag.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await resolveAccess(params);

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

    const data = await deleteTag({
      companyId: params.companyId,

      tagId: params.tagId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Delete tag error:", error);

    if (error.message === "TAG_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Tag not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "TAG_IN_USE") {
      return NextResponse.json(
        {
          success: false,

          message:
            "This tag is currently used by content and cannot be deleted.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete tag.",
      },
      {
        status: 500,
      },
    );
  }
}
