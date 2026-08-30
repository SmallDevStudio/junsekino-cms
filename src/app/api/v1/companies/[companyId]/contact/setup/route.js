import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { ensureContactForm } from "@/modules/form/contact-form.service";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

/*
 * =========================================================
 * COMPANY
 * =========================================================
 */

async function resolveCompanyId(context) {
  const params = await context.params;

  const result = companyIdSchema.safeParse(params.companyId);

  return result.success ? result.data : null;
}

/*
 * =========================================================
 * POST
 * =========================================================
 *
 * Ensures that the selected company has
 * its default Contact Form.
 *
 * Safe to call multiple times.
 * =========================================================
 */

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

      /*
       * Keep permission consistent with
       * current Form Manager until the
       * permission consistency pass.
       */
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

    const result = await ensureContactForm({
      companyId,

      currentUser: access.user,

      publish: true,
    });

    return NextResponse.json(
      {
        success: true,

        data: result,
      },
      {
        status: result.created ? 201 : 200,
      },
    );
  } catch (error) {
    console.error("Contact setup error:", error);

    const known = {
      FORM_SLUG_EXISTS: [409, "Contact form already exists."],

      FORM_NAME_REQUIRED: [400, "Contact form name is required."],

      FORM_FIELD_ID_DUPLICATE: [400, "Contact form field IDs must be unique."],

      FORM_FIELD_OPTIONS_REQUIRED: [
        400,
        "Contact form field configuration is invalid.",
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

        message: "Unable to setup Contact.",
      },
      {
        status: 500,
      },
    );
  }
}
