import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { listPublicWebsiteNews } from "@/modules/public/public-news.service";

export const revalidate = 300;

function parseBoolean(value) {
  if (value === null) {
    return null;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

export async function GET(request, context) {
  try {
    const params = await context.params;

    const validation = companySlugSchema.safeParse(params.companySlug);

    if (!validation.success) {
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

    const companySlug = validation.data;

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

    const { searchParams } = new URL(request.url);

    const featuredValue = searchParams.get("featured");

    const featured = parseBoolean(featuredValue);

    if (featuredValue !== null && featured === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid featured value.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await listPublicWebsiteNews({
      companyId: resolved.company.id,

      companySlug,

      category: searchParams.get("category"),

      featured,

      search: searchParams.get("search"),

      page: searchParams.get("page") || "1",

      limit: searchParams.get("limit") || "12",
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
    console.error("Public news list error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve news.",
      },
      {
        status: 500,
      },
    );
  }
}
