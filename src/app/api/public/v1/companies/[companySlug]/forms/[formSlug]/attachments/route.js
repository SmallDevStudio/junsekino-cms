import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { formSlugSchema } from "@/modules/form/form.schema";

import { createFormAttachmentSchema } from "@/modules/form/form-attachment.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { createPublicFormAttachmentUpload } from "@/modules/form/form-attachment.service";

import {
  attachVisitorCookie,
  hashVisitorId,
  resolveVisitor,
} from "@/lib/visitor/visitor";

export async function POST(request, context) {
  try {
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

    const body = await request.json();

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

    const visitorHash = hashVisitorId(visitor.visitorId);

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

    if (visitor.isNew) {
      attachVisitorCookie({
        response,

        visitorId: visitor.visitorId,
      });
    }

    return response;
  } catch (error) {
    console.error("Create form attachment upload error:", error);

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
