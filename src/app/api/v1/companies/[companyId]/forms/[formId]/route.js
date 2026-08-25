import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { formIdSchema, updateFormSchema } from "@/modules/form/form.schema";

import { deleteForm, getForm, updateForm } from "@/modules/form/form.service";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const form = formIdSchema.safeParse(params.formId);

  if (!company.success || !form.success) {
    return null;
  }

  return {
    companyId: company.data,

    formId: form.data,
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
          message: "Invalid form request.",
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

    const data = await getForm({
      companyId: params.companyId,

      formId: params.formId,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get form error:", error);

    if (error.message === "FORM_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Form not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve form.",
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
          message: "Invalid form request.",
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

    const validation = updateFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid form data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await updateForm({
      companyId: params.companyId,

      formId: params.formId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update form error:", error);

    if (error.message === "FORM_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Form not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "FORM_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,

          message: "Form slug is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message?.startsWith("FORM_")) {
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
        message: "Unable to update form.",
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
          message: "Invalid form request.",
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

    const data = await deleteForm({
      companyId: params.companyId,

      formId: params.formId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Delete form error:", error);

    if (error.message === "FORM_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Form not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete form.",
      },
      {
        status: 500,
      },
    );
  }
}
