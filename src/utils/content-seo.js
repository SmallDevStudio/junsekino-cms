/*
 * =========================================================
 * CONTENT SEO SYNCHRONIZATION
 * =========================================================
 *
 * SEO values follow their Content source while:
 *
 * - the SEO field is empty; or
 * - the SEO field still equals the previous source value.
 *
 * Once an editor changes an SEO field to a custom value,
 * later Content edits no longer overwrite it.
 * =========================================================
 */

const SEO_LANGUAGES = ["en", "th"];

const SEO_TEXT_LIMITS = {
  title: 70,

  description: 180,

  ogTitle: 100,

  ogDescription: 200,
};

function cloneSeo(seo = {}) {
  return {
    ...seo,

    en: {
      ...(seo.en || {}),
    },

    th: {
      ...(seo.th || {}),
    },
  };
}

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

function hasText(value) {
  return normalizeText(value).trim().length > 0;
}

function normalizeSeoText(field, value) {
  const text = normalizeText(value);

  const limit = SEO_TEXT_LIMITS[field];

  return limit ? text.slice(0, limit) : text;
}

function normalizeKeywords(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function areKeywordListsEqual(first, second) {
  const firstList = normalizeKeywords(first);

  const secondList = normalizeKeywords(second);

  if (firstList.length !== secondList.length) {
    return false;
  }

  return firstList.every((item, index) => item === secondList[index]);
}

function getMediaId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return value.mediaId || value.id || null;
  }

  return null;
}

function isSameMedia(first, second) {
  const firstId = getMediaId(first);

  const secondId = getMediaId(second);

  return Boolean(firstId) && firstId === secondId;
}

/*
 * =========================================================
 * INITIAL DEFAULTS
 * =========================================================
 */

export function applyContentSeoDefaults({
  seo,

  title,

  description,

  keywords,

  image,
}) {
  const next = cloneSeo(seo);

  const safeKeywords = normalizeKeywords(keywords);

  for (const language of SEO_LANGUAGES) {
    const languageTitle = normalizeText(title?.[language]);

    const languageDescription = normalizeText(description?.[language]);

    next[language] = {
      ...next[language],

      title: hasText(next[language]?.title)
        ? next[language].title
        : normalizeSeoText("title", languageTitle),

      description: hasText(next[language]?.description)
        ? next[language].description
        : normalizeSeoText("description", languageDescription),

      keywords:
        normalizeKeywords(next[language]?.keywords).length > 0
          ? next[language].keywords
          : safeKeywords,

      ogTitle: hasText(next[language]?.ogTitle)
        ? next[language].ogTitle
        : normalizeSeoText("ogTitle", languageTitle),

      ogDescription: hasText(next[language]?.ogDescription)
        ? next[language].ogDescription
        : normalizeSeoText("ogDescription", languageDescription),

      ogImage: next[language]?.ogImage || getMediaId(image),
    };
  }

  return next;
}

/*
 * =========================================================
 * TEXT SOURCE
 * =========================================================
 */

export function syncSeoTextSource({
  seo,

  language,

  previousSource,

  nextSource,

  fields,
}) {
  if (!SEO_LANGUAGES.includes(language)) {
    return seo;
  }

  const next = cloneSeo(seo);

  const previousText = normalizeText(previousSource);

  const nextText = normalizeText(nextSource);

  const languageSeo = {
    ...next[language],
  };

  for (const field of fields || []) {
    const currentValue = normalizeText(languageSeo[field]);

    if (
      !hasText(currentValue) ||
      currentValue === normalizeSeoText(field, previousText)
    ) {
      languageSeo[field] = normalizeSeoText(field, nextText);
    }
  }

  next[language] = languageSeo;

  return next;
}

/*
 * =========================================================
 * KEYWORD SOURCE
 * =========================================================
 */

export function syncSeoKeywordsSource({
  seo,

  previousSource,

  nextSource,
}) {
  const next = cloneSeo(seo);

  const safeNextSource = normalizeKeywords(nextSource);

  for (const language of SEO_LANGUAGES) {
    const currentKeywords = normalizeKeywords(next[language]?.keywords);

    if (
      currentKeywords.length === 0 ||
      areKeywordListsEqual(currentKeywords, previousSource)
    ) {
      next[language] = {
        ...next[language],

        keywords: safeNextSource,
      };
    }
  }

  return next;
}

/*
 * =========================================================
 * IMAGE SOURCE
 * =========================================================
 */

export function syncSeoImageSource({
  seo,

  previousSource,

  nextSource,
}) {
  const next = cloneSeo(seo);

  for (const language of SEO_LANGUAGES) {
    const currentImage = next[language]?.ogImage || null;

    if (!currentImage || isSameMedia(currentImage, previousSource)) {
      next[language] = {
        ...next[language],

        ogImage: getMediaId(nextSource),
      };
    }
  }

  return next;
}
