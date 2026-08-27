import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { getPublicWebsiteContentBySlug } from "@/modules/public/public-content.service";

export const revalidate = 300;

function normalizeContentSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase();

  if (
    !slug ||
    slug.length < 2 ||
    slug.length > 150 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    return null;
  }

  return slug;
}

export async function GET(request, context) {
  try {
    const params = await context.params;

    const companyValidation = companySlugSchema.safeParse(params.companySlug);

    const slug = normalizeContentSlug(params.slug);

    if (!companyValidation.success || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid public content request.",
        },
        {
          status: 400,
        },
      );
    }

    const companySlug = companyValidation.data;

    const resolved = await resolvePublicCompany(companySlug);

    if (!resolved) {
      return NextResponse.json(
        {
          success: false,
          message: "Company not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (resolved.redirect) {
      return NextResponse.json({
        success: true,

        redirect: true,

        redirectTo: resolved.redirectTo,
      });
    }

    const data = await getPublicWebsiteContentBySlug({
      companyId: resolved.company.id,

      companySlug,

      slug,
    });

    const response = NextResponse.json({
      success: true,

      redirect: false,

      data,
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=60",
    );

    return response;
  } catch (error) {
    console.error("Public content detail error:", error);

    if (error.message === "PUBLIC_CONTENT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Public content not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve public content.",
      },
      {
        status: 500,
      },
    );
  }
}
