import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { formSlugSchema } from "@/modules/form/form.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { getPublishedFormBySlug } from "@/modules/form/form.service";

export async function GET(request, context) {
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

    const data = await getPublishedFormBySlug({
      companyId: resolved.company.id,

      slug: form.data,
    });

    /*
     * Never expose admin metadata.
     */

    return NextResponse.json({
      success: true,

      data: {
        id: data.id,

        slug: data.slug,

        type: data.type,

        name: data.name,

        description: data.description,

        fields: data.fields,

        settings: {
          submitLabel: data.settings?.submitLabel,

          successTitle: data.settings?.successTitle,

          successMessage: data.settings?.successMessage,
        },
      },
    });
  } catch (error) {
    console.error("Public form error:", error);

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
