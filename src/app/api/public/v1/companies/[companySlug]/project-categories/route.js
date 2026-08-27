import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { listPublicProjectCategories } from "@/modules/public/public-project-category.service";

export const revalidate = 300;

function parseTree(value) {
  if (value === null) {
    return true;
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

    const companyValidation = companySlugSchema.safeParse(params.companySlug);

    if (!companyValidation.success) {
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

    /*
     * Preserve existing company-slug
     * redirect architecture.
     */
    if (resolved.redirect) {
      return NextResponse.json(
        {
          success: true,

          redirect: true,

          redirectTo: resolved.redirectTo,
        },
        {
          status: 200,
        },
      );
    }

    const { searchParams } = new URL(request.url);

    const treeValue = searchParams.get("tree");

    const tree = parseTree(treeValue);

    if (tree === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid tree value.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await listPublicProjectCategories({
      companyId: resolved.company.id,

      tree,
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
    console.error("Public project categories error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve project categories.",
      },
      {
        status: 500,
      },
    );
  }
}
