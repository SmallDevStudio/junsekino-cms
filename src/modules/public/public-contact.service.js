import "server-only";

import { PAGE_STATUS, PAGE_TYPE } from "@/constants/page";

import { getCompanyById } from "@/modules/company/company.repository";

import { listPageRecords } from "@/modules/page/page.repository";

import { getPublishedFormBySlug } from "@/modules/form/form.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * TEXT
 * =========================================================
 */

function normalizeText(value) {
  return String(value || "").trim();
}

function localizedValue(value, locale) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return normalizeText(value?.[locale] || value?.en || value?.th || "");
}

function mergeLocalizedContactValue(companyValue, pageValue) {
  return {
    en: localizedValue(companyValue, "en") || localizedValue(pageValue, "en"),

    th: localizedValue(companyValue, "th") || localizedValue(pageValue, "th"),
  };
}

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

function createMediaUrls({
  companySlug,

  mediaId,
}) {
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

function mapImage({
  companySlug,

  image,
}) {
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
 * COMPANY PROFILE
 * =========================================================
 */

function normalizeCompanyProfile(company = {}) {
  const profile = company.profile || {};

  return {
    email: normalizeText(profile.email) || normalizeText(company.email),

    phone: normalizeText(profile.phone) || normalizeText(company.phone),

    secondaryPhone: normalizeText(profile.secondaryPhone),

    website: normalizeText(profile.website) || normalizeText(company.website),

    address: {
      en:
        localizedValue(profile.address, "en") ||
        localizedValue(company.address, "en"),

      th:
        localizedValue(profile.address, "th") ||
        localizedValue(company.address, "th"),
    },

    mapUrl: normalizeText(profile.mapUrl) || normalizeText(company.mapUrl),

    latitude: profile.latitude ?? company.latitude ?? null,

    longitude: profile.longitude ?? company.longitude ?? null,

    businessHours: {
      en: localizedValue(profile.businessHours, "en"),

      th: localizedValue(profile.businessHours, "th"),
    },
  };
}

/*
 * =========================================================
 * CONTACT RESOLUTION
 * =========================================================
 *
 * Company Profile is the canonical source for:
 *
 * - Address
 * - Phone
 * - Email
 * - Website
 * - Map
 * - Business hours
 *
 * Contact Page remains the fallback for old records.
 * =========================================================
 */

function resolveContact({
  company,

  pageContact,
}) {
  const profile = normalizeCompanyProfile(company);

  const legacyContact = pageContact || {};

  const companyDisplayName = {
    en:
      normalizeText(legacyContact.companyDisplayName?.en) ||
      normalizeText(company.legalName) ||
      normalizeText(company.name),

    th: normalizeText(legacyContact.companyDisplayName?.th),
  };

  return {
    coverCaption: {
      en: legacyContact.coverCaption?.en || "",

      th: legacyContact.coverCaption?.th || "",
    },

    companyDisplayName,

    establishedYear: legacyContact.establishedYear || "",

    /*
     * Company Profile takes priority.
     *
     * Old Contact Page data is retained as fallback.
     */
    address: mergeLocalizedContactValue(
      profile.address,

      legacyContact.address,
    ),

    telephone: profile.phone || normalizeText(legacyContact.telephone),

    secondaryTelephone: profile.secondaryPhone || "",

    email: profile.email || normalizeText(legacyContact.email),

    website: profile.website || "",

    mapUrl: profile.mapUrl || "",

    latitude: profile.latitude,

    longitude: profile.longitude,

    businessHours: {
      en: profile.businessHours.en,

      th: profile.businessHours.th,
    },

    form: {
      enabled: legacyContact.form?.enabled !== false,

      formId: legacyContact.form?.formId || null,

      formSlug: legacyContact.form?.formSlug || "contact",
    },
  };
}

/*
 * =========================================================
 * PUBLIC CONTACT
 * =========================================================
 */

export async function getPublicContactPage({
  companyId,

  companySlug,
}) {
  const [company, records] = await Promise.all([
    getCompanyById(companyId),

    listPageRecords({
      companyId,
    }),
  ]);

  if (!company || company.deletedAt) {
    return null;
  }

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

  const contact = resolveContact({
    company,

    pageContact: serialized.contact,
  });

  let form = null;

  if (contact.form.enabled !== false) {
    const formSlug = contact.form.formSlug || "contact";

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

    contact,

    form: sanitizeForm(form),

    seo: serialized.seo || null,

    publishedAt: serialized.publishedAt || null,

    updatedAt: serialized.updatedAt || null,
  };
}
