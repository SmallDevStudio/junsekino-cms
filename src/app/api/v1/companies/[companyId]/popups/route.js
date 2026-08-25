import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { POPUP_STATUSES } from "@/constants/popup";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createPopupSchema } from "@/modules/popup/popup.schema";

import { createPopup, listPopups } from "@/modules/popup/popup.service";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

async function resolveCompanyId(context) {
  const params = await context.params;

  const result = companyIdSchema.safeParse(params.companyId);

  return result.success ? result.data : null;
}

export async function GET(request, context) {
  try {
    const companyId = await resolveCompanyId(context);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid company.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId,

      permission: PERMISSIONS.COMPANY_UPDATE,
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

    if (status && !POPUP_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid popup status.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await listPopups({
      companyId,
      status,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("List popups error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve popups.",
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
          message: "Invalid company.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId,

      permission: PERMISSIONS.COMPANY_UPDATE,
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

    const validation = createPopupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid popup data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await createPopup({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create popup error:", error);

    if (error.message?.startsWith("POPUP_")) {
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
        message: "Unable to create popup.",
      },
      {
        status: 500,
      },
    );
  }
}
