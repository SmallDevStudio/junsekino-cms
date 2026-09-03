import { getSiteUrl } from "@/lib/seo/site-url";

import { createPublicSitemap } from "@/modules/seo/sitemap.service";

export const revalidate = 3600;

export default async function sitemap() {
  const siteUrl = getSiteUrl();

  try {
    return await createPublicSitemap(siteUrl);
  } catch (error) {
    console.error("Sitemap generation error:", error);

    return [
      {
        url: siteUrl,

        lastModified: new Date(),

        changeFrequency: "weekly",

        priority: 1,
      },
    ];
  }
}
