import "server-only";

import { PAGE_STATUS, PAGE_TYPE } from "@/constants/page";

import { listPageRecords } from "@/modules/page/page.repository";

import { getPublishedFormBySlug } from "@/modules/form/form.service";

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
 * MEDIA
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

function mapImage({ companySlug, image }) {
  if (!image?.mediaId) {
    return null;
  }

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

    /*
     * Current Media Core stores
     * crop data on the usage reference.
     */
    crop: image.crop || null,

    ...createMediaUrls({
      companySlug,

      mediaId: image.mediaId,
    }),
  };
}

/*
 * =========================================================
 * FORM
 * =========================================================
 */

function sanitizeForm(form) {
  if (!form) {
    return null;
  }

  return {
    id: form.id,

    slug: form.slug,

    type: form.type,

    name: form.name,

    description: form.description,

    fields: Array.isArray(form.fields)
      ? form.fields.filter((field) => field.enabled !== false)
      : [],

    settings: {
      submitLabel: form.settings?.submitLabel || null,

      successTitle: form.settings?.successTitle || null,

      successMessage: form.settings?.successMessage || null,
    },
  };
}

/*
 * =========================================================
 * PUBLIC CONTACT
 * =========================================================
 */

export async function getPublicContactPage({ companyId, companySlug }) {
  const records = await listPageRecords({
    companyId,
  });

  const published = records
    .filter(
      (page) =>
        !page.deletedAt &&
        page.pageType === PAGE_TYPE.CONTACT &&
        page.status === PAGE_STATUS.PUBLISHED &&
        Boolean(page.publishedAt),
    )
    .sort(
      (a, b) =>
        getTimestampMillis(b.publishedAt) - getTimestampMillis(a.publishedAt),
    );

  const page = published[0];

  if (!page) {
    return null;
  }

  const serialized = serializeFirestoreDocument(page);

  const contact = serialized.contact || {};

  let form = null;

  if (contact.form?.enabled !== false) {
    const formSlug = contact.form?.formSlug || "contact";

    try {
      form = await getPublishedFormBySlug({
        companyId,

        slug: formSlug,
      });
    } catch (error) {
      if (error.message !== "FORM_NOT_FOUND") {
        throw error;
      }
    }
  }

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

    featuredImage: mapImage({
      companySlug,

      image: serialized.featuredImage,
    }),

    contact: {
      coverCaption: {
        en: contact.coverCaption?.en || "",

        th: contact.coverCaption?.th || "",
      },

      companyDisplayName: {
        en: contact.companyDisplayName?.en || "",

        th: contact.companyDisplayName?.th || "",
      },

      establishedYear: contact.establishedYear || "",

      address: {
        en: contact.address?.en || "",

        th: contact.address?.th || "",
      },

      telephone: contact.telephone || "",

      email: contact.email || "",

      form: {
        enabled: contact.form?.enabled !== false,

        formId: contact.form?.formId || null,

        formSlug: contact.form?.formSlug || "contact",
      },
    },

    form: sanitizeForm(form),

    seo: serialized.seo || null,

    publishedAt: serialized.publishedAt || null,

    updatedAt: serialized.updatedAt || null,
  };
}
