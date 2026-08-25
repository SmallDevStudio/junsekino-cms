import "server-only";

import {
  DASHBOARD_RECENT_LIMIT,
  DASHBOARD_TOP_CONTENT_LIMIT,
} from "@/constants/dashboard";

import { resolveDashboardDateKeys } from "./dashboard-date";

import {
  getAnalyticsDailyRecords,
  getContentRecord,
  getContentStatsRecords,
  getNotificationRecords,
  getSubmissionRecords,
} from "./dashboard.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

function timestampToMillis(value) {
  return value?.toMillis?.() || 0;
}

function resolveContentTitle(content) {
  if (!content) {
    return {
      th: "",
      en: "",
    };
  }

  if (content.title) {
    if (typeof content.title === "object") {
      return {
        th: content.title.th || "",

        en: content.title.en || "",
      };
    }

    return {
      th: String(content.title),

      en: String(content.title),
    };
  }

  if (content.name) {
    if (typeof content.name === "object") {
      return {
        th: content.name.th || "",

        en: content.name.en || "",
      };
    }

    return {
      th: String(content.name),

      en: String(content.name),
    };
  }

  return {
    th: "",
    en: "",
  };
}

function calculateOverview(analytics) {
  return analytics.reduce(
    (result, item) => {
      result.views += item.views || 0;

      result.uniqueVisitors += item.uniqueVisitors || 0;

      result.likes += item.likes || 0;

      result.shares += item.shares || 0;

      return result;
    },
    {
      views: 0,
      uniqueVisitors: 0,
      likes: 0,
      shares: 0,
    },
  );
}

function buildChart(dateKeys, analytics) {
  const map = new Map();

  for (const date of dateKeys) {
    map.set(date, {
      date,
      views: 0,
      uniqueVisitors: 0,
      likes: 0,
      shares: 0,
    });
  }

  for (const item of analytics) {
    const row = map.get(item.date);

    if (!row) {
      continue;
    }

    row.views += item.views || 0;

    row.uniqueVisitors += item.uniqueVisitors || 0;

    row.likes += item.likes || 0;

    row.shares += item.shares || 0;
  }

  return Array.from(map.values());
}

async function buildTopContent({ companyId, stats }) {
  const ranked = [...stats]
    .sort((a, b) => {
      const aScore = (a.views || 0) + (a.likes || 0) * 5 + (a.shares || 0) * 10;

      const bScore = (b.views || 0) + (b.likes || 0) * 5 + (b.shares || 0) * 10;

      return bScore - aScore;
    })
    .slice(0, DASHBOARD_TOP_CONTENT_LIMIT);

  const results = await Promise.all(
    ranked.map(async (item) => {
      const content = await getContentRecord({
        companyId,

        contentType: item.contentType,

        contentId: item.contentId,
      });

      return {
        contentType: item.contentType,

        contentId: item.contentId,

        title: resolveContentTitle(content),

        views: item.views || 0,

        likes: item.likes || 0,

        shares: item.shares || 0,
      };
    }),
  );

  return results;
}

function buildSubmissionMetrics(submissions, dateKeys) {
  const allowed = new Set(dateKeys);

  const result = {
    total: 0,
    new: 0,

    contact: 0,
    survey: 0,
    career: 0,
    custom: 0,
  };

  for (const item of submissions) {
    const created = item.createdAt?.toDate?.();

    if (!created) {
      continue;
    }

    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",

      year: "numeric",

      month: "2-digit",

      day: "2-digit",
    }).format(created);

    if (!allowed.has(date)) {
      continue;
    }

    result.total += 1;

    if (item.status === "new") {
      result.new += 1;
    }

    if (Object.prototype.hasOwnProperty.call(result, item.formType)) {
      result[item.formType] += 1;
    }
  }

  return result;
}

function buildRecentActivity({ submissions, notifications }) {
  const submissionItems = submissions.map((item) => ({
    type: "form_submission",

    id: item.id,

    title: {
      th: item.formName?.th || "แบบฟอร์ม",

      en: item.formName?.en || "Form",
    },

    status: item.status,

    createdAt: item.createdAt,

    timestamp: timestampToMillis(item.createdAt),
  }));

  const notificationItems = notifications.map((item) => ({
    type: "notification",

    id: item.id,

    title: item.title,

    level: item.level || "info",

    resource: item.resource || null,

    createdAt: item.createdAt,

    timestamp: timestampToMillis(item.createdAt),
  }));

  return [...submissionItems, ...notificationItems]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, DASHBOARD_RECENT_LIMIT)
    .map(({ timestamp, ...item }) => item);
}

export async function getDashboardMetrics({ companyId, range }) {
  const dateKeys = resolveDashboardDateKeys(range);

  const [analytics, stats, submissions, notifications] = await Promise.all([
    getAnalyticsDailyRecords({
      companyId,
      dateKeys,
    }),

    getContentStatsRecords(companyId),

    getSubmissionRecords(companyId),

    getNotificationRecords(companyId),
  ]);

  const overview = calculateOverview(analytics);

  const chart = buildChart(dateKeys, analytics);

  const topContent = await buildTopContent({
    companyId,
    stats,
  });

  const forms = buildSubmissionMetrics(submissions, dateKeys);

  const recentActivity = buildRecentActivity({
    submissions,
    notifications,
  });

  return serializeFirestoreDocument({
    range,

    period: {
      from: dateKeys[0],

      to: dateKeys[dateKeys.length - 1],
    },

    overview: {
      ...overview,

      submissions: forms.total,

      newSubmissions: forms.new,

      notifications: notifications.length,
    },

    chart,

    forms,

    topContent,

    recentActivity,
  });
}
