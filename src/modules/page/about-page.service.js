import "server-only";

import { PAGE_STATUS, PAGE_TYPE } from "@/constants/page";

import {
  getPage,
  listPages,
  publishPage,
  unpublishPage,
} from "@/modules/page/page.service";

/*
 * =========================================================
 * PUBLISH ABOUT
 * =========================================================
 *
 * About uses version-based publishing:
 *
 * Draft A
 * Draft B
 * Published C
 *
 * Publishing B automatically returns C
 * to Draft.
 *
 * Therefore one Company can expose only
 * one About version at a time.
 * =========================================================
 */

export async function publishAboutPage({ companyId, pageId, currentUser }) {
  const target = await getPage({
    companyId,
    pageId,
  });

  if (target.pageType !== PAGE_TYPE.ABOUT) {
    throw new Error("PAGE_IS_NOT_ABOUT");
  }

  /*
   * Find all About versions.
   */
  const aboutPages = await listPages({
    companyId,
    pageType: PAGE_TYPE.ABOUT,
  });

  /*
   * Unpublish current version first.
   *
   * We intentionally use the normal
   * Page service so audit logs remain
   * consistent.
   */
  const currentlyPublished = aboutPages.filter(
    (page) => page.id !== pageId && page.status === PAGE_STATUS.PUBLISHED,
  );

  for (const page of currentlyPublished) {
    await unpublishPage({
      companyId,

      pageId: page.id,

      currentUser,
    });
  }

  /*
   * Publish selected version.
   */
  return publishPage({
    companyId,
    pageId,

    scheduledAt: null,

    currentUser,
  });
}
