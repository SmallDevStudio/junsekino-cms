import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { FORM_STATUSES, FORM_TYPES } from "@/constants/form";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createFormSchema } from "@/modules/form/form.schema";

import { createForm, listForms } from "@/modules/form/form.service";

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
          message: "Invalid company ID.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ใช้ COMPANY_UPDATE ชั่วคราว
     * จนกว่าเราจะทำ Permission
     * consistency pass
     */
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

    const type = searchParams.get("type");

    const search = searchParams.get("search");

    if (status && !FORM_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid form status.",
        },
        {
          status: 400,
        },
      );
    }

    if (type && !FORM_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid form type.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await listForms({
      companyId,
      status,
      type,
      search,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("List forms error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve forms.",
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

    const validation = createFormSchema.safeParse(body);

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

    const data = await createForm({
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
    console.error("Create form error:", error);

    const known = {
      FORM_SLUG_EXISTS: [409, "Form slug is already in use."],

      FORM_NAME_REQUIRED: [400, "Form name is required."],

      FORM_FIELD_ID_DUPLICATE: [400, "Form field IDs must be unique."],

      FORM_FIELD_OPTIONS_REQUIRED: [
        400,
        "Select or radio fields require options.",
      ],

      FORM_CONSENT_LEGAL_DOCUMENT_REQUIRED: [
        400,
        "Consent field requires a legal document.",
      ],
    };

    if (known[error.message]) {
      const [status, message] = known[error.message];

      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create form.",
      },
      {
        status: 500,
      },
    );
  }
}
