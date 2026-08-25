import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { popupIdSchema, updatePopupSchema } from "@/modules/popup/popup.schema";

import {
  deletePopup,
  getPopup,
  updatePopup,
} from "@/modules/popup/popup.service";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const popup = popupIdSchema.safeParse(params.popupId);

  if (!company.success || !popup.success) {
    return null;
  }

  return {
    companyId: company.data,

    popupId: popup.data,
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
          message: "Invalid popup request.",
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

    const data = await getPopup({
      companyId: params.companyId,

      popupId: params.popupId,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get popup error:", error);

    if (error.message === "POPUP_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Popup not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve popup.",
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
          message: "Invalid popup request.",
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

    const validation = updatePopupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid popup data.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await updatePopup({
      companyId: params.companyId,

      popupId: params.popupId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update popup error:", error);

    if (error.message === "POPUP_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Popup not found.",
        },
        {
          status: 404,
        },
      );
    }

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
        message: "Unable to update popup.",
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
          message: "Invalid popup request.",
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

    const data = await deletePopup({
      companyId: params.companyId,

      popupId: params.popupId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Delete popup error:", error);

    if (error.message === "POPUP_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Popup not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete popup.",
      },
      {
        status: 500,
      },
    );
  }
}
