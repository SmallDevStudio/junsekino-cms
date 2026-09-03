import { getSiteUrl, isProductionWebsite } from "@/lib/seo/site-url";

export default function robots() {
  const siteUrl = getSiteUrl();

  if (!isProductionWebsite()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",

      allow: "/",

      disallow: ["/admin/", "/api/", "/docs/"],
    },

    sitemap: `${siteUrl}/sitemap.xml`,

    host: siteUrl,
  };
}
