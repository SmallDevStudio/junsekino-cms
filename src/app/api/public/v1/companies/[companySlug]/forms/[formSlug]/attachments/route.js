import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { formSlugSchema } from "@/modules/form/form.schema";

import { createFormAttachmentSchema } from "@/modules/form/form-attachment.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { createPublicFormAttachmentUpload } from "@/modules/form/form-attachment.service";

import { isTrustedOrigin } from "@/lib/auth/origin";

import {
  attachVisitorCookie,
  hashVisitorId,
  resolveVisitor,
} from "@/lib/visitor/visitor";

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

    const params = await context.params;

    const company = companySlugSchema.safeParse(params.companySlug);

    const form = formSlugSchema.safeParse(params.formSlug);

    if (!company.success || !form.success) {
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

    const resolved = await resolvePublicCompany(company.data);

    if (!resolved || resolved.redirect || !resolved.company) {
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

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid request body.",
        },

        {
          status: 400,
        },
      );
    }

    const validation = createFormAttachmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid attachment.",

          errors: validation.error.flatten().fieldErrors,
        },

        {
          status: 400,
        },
      );
    }

    const visitor = resolveVisitor(request);

    /*
     * Scope the visitor hash to the company.
     *
     * The upload workflow requires a stable
     * pseudonymous identifier so another
     * visitor cannot claim the uploaded file.
     */
    const visitorHash = hashVisitorId(
      visitor.visitorId,

      resolved.company.id,
    );

    const data = await createPublicFormAttachmentUpload({
      companyId: resolved.company.id,

      formSlug: form.data,

      input: validation.data,

      visitorHash,
    });

    const response = NextResponse.json(
      {
        success: true,

        data,
      },

      {
        status: 201,
      },
    );

    /*
     * The visitor explicitly started a file
     * upload. This cookie is necessary for
     * attachment ownership and security.
     */
    if (visitor.isNew) {
      attachVisitorCookie({
        response,

        visitorId: visitor.visitorId,
      });
    }

    return response;
  } catch (error) {
    console.error(
      "Create form attachment upload error:",

      error,
    );

    const errors = {
      FORM_NOT_FOUND: [404, "Form not found."],

      FORM_ATTACHMENT_FIELD_NOT_FOUND: [400, "Invalid file field."],

      FORM_ATTACHMENT_TYPE_NOT_ALLOWED: [400, "File type is not allowed."],

      FORM_ATTACHMENT_TOO_LARGE: [400, "File is too large."],
    };

    const known = errors[error.message];

    if (known) {
      return NextResponse.json(
        {
          success: false,

          message: known[1],
        },

        {
          status: known[0],
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to create attachment upload.",
      },

      {
        status: 500,
      },
    );
  }
}
