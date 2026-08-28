import "server-only";

import { PAGE_STATUS, PAGE_TYPE } from "@/constants/page";

import { listPageRecords } from "@/modules/page/page.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * TIMESTAMP
 * =========================================================
 */

function getTimestampMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

/*
 * =========================================================
 * PUBLIC MEDIA URL
 * =========================================================
 */

function createMediaUrls({ companySlug, mediaId }) {
  if (!companySlug || !mediaId) {
    return null;
  }

  const base = `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(mediaId)}`;

  return {
    mediaId,

    thumbnailUrl: `${base}?variant=thumbnail`,

    mediumUrl: `${base}?variant=medium`,

    largeUrl: `${base}?variant=large`,
  };
}

/*
 * =========================================================
 * IMAGE
 * =========================================================
 */

function mapImage({ companySlug, image }) {
  if (!image?.mediaId) {
    return null;
  }

  const urls = createMediaUrls({
    companySlug,
    mediaId: image.mediaId,
  });

  return {
    mediaId: image.mediaId,

    alt: {
      en: image.alt?.en || "",

      th: image.alt?.th || "",
    },

    caption: {
      en: image.caption?.en || "",

      th: image.caption?.th || "",
    },

    presentation: {
      objectFit: image.presentation?.objectFit || "cover",

      aspectRatio: image.presentation?.aspectRatio || "auto",

      focalPoint: {
        x: image.presentation?.focalPoint?.x ?? 0.5,

        y: image.presentation?.focalPoint?.y ?? 0.5,
      },

      zoom: image.presentation?.zoom ?? 1,
    },

    ...urls,
  };
}

/*
 * =========================================================
 * SECTION
 * =========================================================
 */

function mapSection({ companySlug, section }) {
  if (!section || section.enabled === false) {
    return null;
  }

  const base = {
    id: section.id || "",

    type: section.type,

    enabled: true,

    sortOrder: section.sortOrder ?? 0,
  };

  switch (section.type) {
    case "richText":
      return {
        ...base,

        data: {
          ...section.data,
        },
      };

    case "image":
      return {
        ...base,

        data: {
          ...section.data,

          image: mapImage({
            companySlug,

            image: section.data?.image,
          }),
        },
      };

    case "imageText":
      return {
        ...base,

        data: {
          ...section.data,

          image: mapImage({
            companySlug,

            image: section.data?.image,
          }),
        },
      };

    case "gallery":
      return {
        ...base,

        data: {
          ...section.data,

          images: Array.isArray(section.data?.images)
            ? section.data.images
                .map((image) =>
                  mapImage({
                    companySlug,

                    image,
                  }),
                )
                .filter(Boolean)
            : [],
        },
      };

    case "spacer":
      return {
        ...base,

        data: {
          ...section.data,
        },
      };

    default:
      return null;
  }
}

/*
 * =========================================================
 * CURRENT PUBLIC ABOUT
 * =========================================================
 */

export async function getPublicAboutPage({ companyId, companySlug }) {
  const records = await listPageRecords({
    companyId,
  });

  const publishedAbout = records
    .filter(
      (page) =>
        !page.deletedAt &&
        page.pageType === PAGE_TYPE.ABOUT &&
        page.status === PAGE_STATUS.PUBLISHED &&
        Boolean(page.publishedAt),
    )
    .sort(
      (a, b) =>
        getTimestampMillis(b.publishedAt) - getTimestampMillis(a.publishedAt),
    );

  const page = publishedAbout[0];

  if (!page) {
    return null;
  }

  const serialized = serializeFirestoreDocument(page);

  return {
    id: serialized.id,

    slug: serialized.slug,

    pageType: serialized.pageType,

    title: {
      en: serialized.title?.en || "",

      th: serialized.title?.th || "",
    },

    excerpt: {
      en: serialized.excerpt?.en || "",

      th: serialized.excerpt?.th || "",
    },

    content: serialized.content || {
      en: "",
      th: "",
    },

    featuredImage: mapImage({
      companySlug,

      image: serialized.featuredImage,
    }),

    sections: Array.isArray(serialized.sections)
      ? serialized.sections
          .map((section) =>
            mapSection({
              companySlug,

              section,
            }),
          )
          .filter(Boolean)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      : [],

    seo: serialized.seo || null,

    publishedAt: serialized.publishedAt || null,

    updatedAt: serialized.updatedAt || null,
  };
}
