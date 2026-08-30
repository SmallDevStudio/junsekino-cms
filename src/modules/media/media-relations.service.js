import "server-only";

import { adminDb } from "@/lib/firebase/admin";

/*
 * =========================================================
 * MEDIA RELATIONS
 * =========================================================
 *
 * Source of truth:
 *
 * Content documents themselves.
 *
 * We intentionally DO NOT store usedIn[] inside Media.
 *
 * Why:
 *
 * If Project is updated successfully but Media.usedIn
 * fails to update, the relation becomes inconsistent.
 *
 * This service discovers references from the actual
 * content records.
 * =========================================================
 */

/*
 * =========================================================
 * MODULE
 * =========================================================
 */

export const MEDIA_RELATION_MODULE = Object.freeze({
  PROJECT: "project",

  AWARD: "award",

  HOME_SLIDESHOW: "home-slideshow",

  PAGE: "page",

  PUBLIC_CONTENT: "public-content",
});

/*
 * =========================================================
 * LOCATION
 * =========================================================
 */

export const MEDIA_RELATION_LOCATION = Object.freeze({
  FEATURED_IMAGE: "featured-image",

  GALLERY: "gallery",

  SLIDESHOW: "slideshow",

  HERO: "hero",

  PAGE_SECTION_IMAGE: "page-section-image",

  PAGE_SECTION_GALLERY: "page-section-gallery",
});

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function companyCollection(companyId, collectionName) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection(collectionName);
}

function normalizeTitle(value, fallback = "") {
  if (typeof value === "string") {
    return {
      en: value,
      th: value,
    };
  }

  return {
    en: value?.en || value?.th || fallback,

    th: value?.th || value?.en || fallback,
  };
}

function isActiveRecord(record) {
  return Boolean(record && !record.deletedAt);
}

function mediaMatches(image, mediaId) {
  return Boolean(image?.mediaId && image.mediaId === mediaId);
}

function relationId({
  module,
  contentId,
  location,
  index = null,
  sectionIndex = null,
  sectionImageIndex = null,
}) {
  return [module, contentId, location, sectionIndex, index, sectionImageIndex]
    .filter((value) => value !== null && value !== undefined)
    .join(":");
}

function createRelation({
  module,

  contentId,

  contentTitle,

  status,

  location,

  index = null,

  sectionIndex = null,

  sectionId = null,

  sectionType = null,

  sectionImageIndex = null,

  extra = null,
}) {
  return {
    id: relationId({
      module,
      contentId,
      location,
      index,
      sectionIndex,
      sectionImageIndex,
    }),

    module,

    contentId,

    contentTitle: normalizeTitle(contentTitle),

    status: status || "draft",

    location,

    index,

    sectionIndex,

    sectionId,

    sectionType,

    sectionImageIndex,

    extra,
  };
}

/*
 * =========================================================
 * PROJECT
 * =========================================================
 */

function scanProject({ project, mediaId }) {
  const usages = [];

  if (!isActiveRecord(project)) {
    return usages;
  }

  /*
   * Featured / Cover
   */

  if (mediaMatches(project.featuredImage, mediaId)) {
    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.PROJECT,

        contentId: project.id,

        contentTitle: project.title,

        status: project.status,

        location: MEDIA_RELATION_LOCATION.FEATURED_IMAGE,
      }),
    );
  }

  /*
   * Gallery
   */

  const gallery = Array.isArray(project.gallery) ? project.gallery : [];

  gallery.forEach((image, index) => {
    if (!mediaMatches(image, mediaId)) {
      return;
    }

    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.PROJECT,

        contentId: project.id,

        contentTitle: project.title,

        status: project.status,

        location: MEDIA_RELATION_LOCATION.GALLERY,

        index,
      }),
    );
  });

  return usages;
}

/*
 * =========================================================
 * AWARD
 * =========================================================
 */

function scanAward({ award, mediaId }) {
  const usages = [];

  if (!isActiveRecord(award)) {
    return usages;
  }

  if (mediaMatches(award.featuredImage, mediaId)) {
    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.AWARD,

        contentId: award.id,

        contentTitle: award.title,

        status: award.status,

        location: MEDIA_RELATION_LOCATION.FEATURED_IMAGE,
      }),
    );
  }

  const gallery = Array.isArray(award.gallery) ? award.gallery : [];

  gallery.forEach((image, index) => {
    if (!mediaMatches(image, mediaId)) {
      return;
    }

    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.AWARD,

        contentId: award.id,

        contentTitle: award.title,

        status: award.status,

        location: MEDIA_RELATION_LOCATION.GALLERY,

        index,
      }),
    );
  });

  return usages;
}

/*
 * =========================================================
 * PUBLIC CONTENT
 * =========================================================
 */

function scanPublicContent({ content, mediaId }) {
  const usages = [];

  if (!isActiveRecord(content)) {
    return usages;
  }

  if (mediaMatches(content.featuredImage, mediaId)) {
    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.PUBLIC_CONTENT,

        contentId: content.id,

        contentTitle: content.title,

        status: content.status,

        location: MEDIA_RELATION_LOCATION.FEATURED_IMAGE,
      }),
    );
  }

  const gallery = Array.isArray(content.gallery) ? content.gallery : [];

  gallery.forEach((image, index) => {
    if (!mediaMatches(image, mediaId)) {
      return;
    }

    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.PUBLIC_CONTENT,

        contentId: content.id,

        contentTitle: content.title,

        status: content.status,

        location: MEDIA_RELATION_LOCATION.GALLERY,

        index,
      }),
    );
  });

  return usages;
}

/*
 * =========================================================
 * HOME SLIDESHOW
 * =========================================================
 */

function scanHomeSlideshow({ slideshow, mediaId }) {
  const usages = [];

  if (!isActiveRecord(slideshow)) {
    return usages;
  }

  const slides = Array.isArray(slideshow.slides)
    ? [...slideshow.slides].sort(
        (first, second) => (first?.sortOrder ?? 0) - (second?.sortOrder ?? 0),
      )
    : [];

  slides.forEach((slide, index) => {
    if (slide?.mediaId !== mediaId) {
      return;
    }

    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.HOME_SLIDESHOW,

        contentId: slideshow.id,

        contentTitle: slideshow.name,

        status: slideshow.status,

        location: MEDIA_RELATION_LOCATION.SLIDESHOW,

        index,

        extra: {
          enabled: slide?.enabled !== false,

          slideId: slide?.id || null,
        },
      }),
    );
  });

  return usages;
}

/*
 * =========================================================
 * PAGE BLOCK
 * =========================================================
 */

function scanPageSection({
  page,

  section,

  sectionIndex,

  mediaId,
}) {
  const usages = [];

  if (!section) {
    return usages;
  }

  /*
   * Image Block
   *
   * {
   *   type: "image",
   *   data: {
   *     image: {}
   *   }
   * }
   */

  if (section.type === "image" && mediaMatches(section?.data?.image, mediaId)) {
    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.PAGE,

        contentId: page.id,

        contentTitle: page.title,

        status: page.status,

        location: MEDIA_RELATION_LOCATION.PAGE_SECTION_IMAGE,

        sectionIndex,

        sectionId: section.id || null,

        sectionType: section.type,
      }),
    );
  }

  /*
   * Image + Text
   */

  if (
    section.type === "imageText" &&
    mediaMatches(section?.data?.image, mediaId)
  ) {
    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.PAGE,

        contentId: page.id,

        contentTitle: page.title,

        status: page.status,

        location: MEDIA_RELATION_LOCATION.PAGE_SECTION_IMAGE,

        sectionIndex,

        sectionId: section.id || null,

        sectionType: section.type,

        extra: {
          imagePosition: section?.data?.imagePosition || null,
        },
      }),
    );
  }

  /*
   * Gallery Block
   */

  if (section.type === "gallery") {
    const images = Array.isArray(section?.data?.images)
      ? section.data.images
      : [];

    images.forEach((image, sectionImageIndex) => {
      if (!mediaMatches(image, mediaId)) {
        return;
      }

      usages.push(
        createRelation({
          module: MEDIA_RELATION_MODULE.PAGE,

          contentId: page.id,

          contentTitle: page.title,

          status: page.status,

          location: MEDIA_RELATION_LOCATION.PAGE_SECTION_GALLERY,

          sectionIndex,

          sectionId: section.id || null,

          sectionType: section.type,

          sectionImageIndex,
        }),
      );
    });
  }

  return usages;
}

/*
 * =========================================================
 * PAGE / ABOUT
 * =========================================================
 */

function scanPage({ page, mediaId }) {
  const usages = [];

  if (!isActiveRecord(page)) {
    return usages;
  }

  /*
   * Featured Image / About Cover
   */

  if (mediaMatches(page.featuredImage, mediaId)) {
    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.PAGE,

        contentId: page.id,

        contentTitle: page.title,

        status: page.status,

        location: MEDIA_RELATION_LOCATION.FEATURED_IMAGE,

        extra: {
          pageType: page.pageType || "standard",
        },
      }),
    );
  }

  /*
   * Hero
   */

  if (mediaMatches(page?.hero?.media, mediaId)) {
    usages.push(
      createRelation({
        module: MEDIA_RELATION_MODULE.PAGE,

        contentId: page.id,

        contentTitle: page.title,

        status: page.status,

        location: MEDIA_RELATION_LOCATION.HERO,

        extra: {
          pageType: page.pageType || "standard",
        },
      }),
    );
  }

  /*
   * Page Builder
   */

  const sections = Array.isArray(page.sections) ? page.sections : [];

  sections.forEach((section, sectionIndex) => {
    usages.push(
      ...scanPageSection({
        page,

        section,

        sectionIndex,

        mediaId,
      }),
    );
  });

  return usages;
}

/*
 * =========================================================
 * SNAPSHOT
 * =========================================================
 */

function snapshotItems(snapshot) {
  return snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));
}

/*
 * =========================================================
 * FIND MEDIA USAGES
 * =========================================================
 */

export async function findMediaUsages({
  companyId,

  mediaId,
}) {
  /*
   * All collections are read concurrently.
   *
   * This avoids sequential database latency.
   */

  const [
    projectsSnapshot,

    awardsSnapshot,

    slideshowsSnapshot,

    pagesSnapshot,

    publicContentsSnapshot,
  ] = await Promise.all([
    companyCollection(companyId, "projects").get(),

    companyCollection(companyId, "awards").get(),

    companyCollection(companyId, "homeSlideshows").get(),

    companyCollection(companyId, "pages").get(),

    companyCollection(companyId, "publicContents").get(),
  ]);

  const projects = snapshotItems(projectsSnapshot);

  const awards = snapshotItems(awardsSnapshot);

  const slideshows = snapshotItems(slideshowsSnapshot);

  const pages = snapshotItems(pagesSnapshot);

  const publicContents = snapshotItems(publicContentsSnapshot);

  const usages = [
    ...projects.flatMap((project) =>
      scanProject({
        project,
        mediaId,
      }),
    ),

    ...awards.flatMap((award) =>
      scanAward({
        award,
        mediaId,
      }),
    ),

    ...slideshows.flatMap((slideshow) =>
      scanHomeSlideshow({
        slideshow,
        mediaId,
      }),
    ),

    ...pages.flatMap((page) =>
      scanPage({
        page,
        mediaId,
      }),
    ),

    ...publicContents.flatMap((content) =>
      scanPublicContent({
        content,
        mediaId,
      }),
    ),
  ];

  /*
   * Group summary.
   */

  const modules = usages.reduce((accumulator, usage) => {
    accumulator[usage.module] = (accumulator[usage.module] || 0) + 1;

    return accumulator;
  }, {});

  return {
    mediaId,

    usageCount: usages.length,

    modules,

    usages,
  };
}
