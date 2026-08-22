import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  projectIdSchema,
  publishProjectSchema,
} from "@/modules/project/project.schema";

import { publishProject } from "@/modules/project/project.service";

async function resolveParams(context) {
  const params = await context.params;

  const companyValidation = companyIdSchema.safeParse(params.companyId);

  const projectValidation = projectIdSchema.safeParse(params.projectId);

  if (!companyValidation.success || !projectValidation.success) {
    return null;
  }

  return {
    companyId: companyValidation.data,

    projectId: projectValidation.data,
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

      permission: PERMISSIONS.PROJECT_PUBLISH,
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

    const validation = publishProjectSchema.safeParse(body);

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

    const project = await publishProject({
      companyId: params.companyId,

      projectId: params.projectId,

      scheduledAt: validation.data.scheduledAt || null,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Publish project error:", error);

    const badRequestErrors = [
      "PROJECT_TITLE_REQUIRED",
      "PROJECT_CONTENT_REQUIRED",
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

    if (error.message === "PROJECT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to publish project.",
      },
      {
        status: 500,
      },
    );
  }
}
