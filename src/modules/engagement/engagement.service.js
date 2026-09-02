import "server-only";

import { getPublishedEngagementContent } from "./engagement-content.repository";

import {
  getEngagementStats,
  getVisitorReaction,
  incrementShareRecord,
  incrementViewRecord,
  likeContentRecord,
  unlikeContentRecord,
} from "./engagement.repository";

function getBangkokDateKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",

    year: "numeric",

    month: "2-digit",

    day: "2-digit",
  });

  return formatter.format(new Date());
}

async function validateContent({ companyId, contentType, contentId }) {
  const content = await getPublishedEngagementContent({
    companyId,
    contentType,
    contentId,
  });

  if (!content) {
    throw new Error("ENGAGEMENT_CONTENT_NOT_FOUND");
  }

  return content;
}

export async function getContentEngagement({
  companyId,
  contentType,
  contentId,
  visitorHash,
}) {
  await validateContent({
    companyId,
    contentType,
    contentId,
  });

  const [stats, reaction] = await Promise.all([
    getEngagementStats({
      companyId,
      contentType,
      contentId,
    }),

    visitorHash
      ? getVisitorReaction({
          companyId,
          contentType,
          contentId,
          visitorHash,
        })
      : Promise.resolve({
          liked: false,
        }),
  ]);

  return {
    ...stats,

    liked: reaction.liked,
  };
}

export async function likeContent({
  companyId,
  contentType,
  contentId,
  visitorHash,
}) {
  await validateContent({
    companyId,
    contentType,
    contentId,
  });

  const dateKey = getBangkokDateKey();

  await likeContentRecord({
    companyId,
    contentType,
    contentId,
    visitorHash,
    dateKey,
  });

  return getContentEngagement({
    companyId,
    contentType,
    contentId,
    visitorHash,
  });
}

export async function unlikeContent({
  companyId,
  contentType,
  contentId,
  visitorHash,
}) {
  await validateContent({
    companyId,
    contentType,
    contentId,
  });

  const dateKey = getBangkokDateKey();

  await unlikeContentRecord({
    companyId,
    contentType,
    contentId,
    visitorHash,
    dateKey,
  });

  return getContentEngagement({
    companyId,
    contentType,
    contentId,
    visitorHash,
  });
}

export async function shareContent({
  companyId,
  contentType,
  contentId,
  channel,
}) {
  await validateContent({
    companyId,
    contentType,
    contentId,
  });

  const dateKey = getBangkokDateKey();

  await incrementShareRecord({
    companyId,
    contentType,
    contentId,
    channel,
    dateKey,
  });

  return getEngagementStats({
    companyId,
    contentType,
    contentId,
  });
}

export async function viewContent({
  companyId,
  contentType,
  contentId,
  visitorHash = null,
  analyticsConsent = false,
}) {
  await validateContent({
    companyId,
    contentType,
    contentId,
  });

  /*
   * A passive page view is optional Analytics.
   * Return the current aggregate counters without
   * recording a view when consent is unavailable.
   */
  if (!analyticsConsent || !visitorHash) {
    const stats = await getEngagementStats({
      companyId,

      contentType,

      contentId,
    });

    return {
      ...stats,

      counted: false,

      unique: false,
    };
  }

  const dateKey = getBangkokDateKey();

  const result = await incrementViewRecord({
    companyId,
    contentType,
    contentId,
    dateKey,

    visitorHash,

    countUnique: analyticsConsent,
  });

  const stats = await getEngagementStats({
    companyId,
    contentType,
    contentId,
  });

  return {
    ...stats,

    counted: result.counted,

    unique: result.unique,
  };
}
