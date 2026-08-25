import "server-only";

export function normalizeSeoMetadata(seo = {}) {
  return {
    metaTitle: {
      th: seo.metaTitle?.th || "",

      en: seo.metaTitle?.en || "",
    },

    metaDescription: {
      th: seo.metaDescription?.th || "",

      en: seo.metaDescription?.en || "",
    },

    ogTitle: {
      th: seo.ogTitle?.th || "",

      en: seo.ogTitle?.en || "",
    },

    ogDescription: {
      th: seo.ogDescription?.th || "",

      en: seo.ogDescription?.en || "",
    },

    ogImageMediaId: seo.ogImageMediaId || null,

    canonicalUrl: seo.canonicalUrl || null,

    noIndex: seo.noIndex === true,

    noFollow: seo.noFollow === true,
  };
}

export function resolveSeoMetadata({
  seo,
  title,
  description,
  defaultImageMediaId = null,
}) {
  const normalized = normalizeSeoMetadata(seo);

  return {
    metaTitle: {
      th: normalized.metaTitle.th || title?.th || "",

      en: normalized.metaTitle.en || title?.en || "",
    },

    metaDescription: {
      th: normalized.metaDescription.th || description?.th || "",

      en: normalized.metaDescription.en || description?.en || "",
    },

    ogTitle: {
      th: normalized.ogTitle.th || normalized.metaTitle.th || title?.th || "",

      en: normalized.ogTitle.en || normalized.metaTitle.en || title?.en || "",
    },

    ogDescription: {
      th:
        normalized.ogDescription.th ||
        normalized.metaDescription.th ||
        description?.th ||
        "",

      en:
        normalized.ogDescription.en ||
        normalized.metaDescription.en ||
        description?.en ||
        "",
    },

    ogImageMediaId: normalized.ogImageMediaId || defaultImageMediaId,

    canonicalUrl: normalized.canonicalUrl,

    noIndex: normalized.noIndex,

    noFollow: normalized.noFollow,
  };
}
