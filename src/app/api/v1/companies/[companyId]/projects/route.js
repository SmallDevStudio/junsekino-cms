import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { PROJECT_STATUSES } from "@/constants/project";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createProjectSchema } from "@/modules/project/project.schema";

import { createProject, listProjects } from "@/modules/project/project.service";

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

      permission: PERMISSIONS.PROJECT_VIEW,
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

    if (status && !PROJECT_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project status.",
        },
        {
          status: 400,
        },
      );
    }

    const projects = await listProjects({
      companyId,
      status,
      search,
    });

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("List projects error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve projects.",
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

      permission: PERMISSIONS.PROJECT_CREATE,
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

    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid project data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const project = await createProject({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,
        data: project,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create project error:", error);

    if (error.message === "PROJECT_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,
          message: "This project slug is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message === "PROJECT_TITLE_REQUIRED") {
      return NextResponse.json(
        {
          success: false,
          message: "Project title is required in at least one language.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create project.",
      },
      {
        status: 500,
      },
    );
  }
}
