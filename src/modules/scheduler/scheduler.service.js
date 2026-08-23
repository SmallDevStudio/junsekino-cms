import "server-only";

import {
  SCHEDULED_CONTENT_TYPES,
  SYSTEM_CRON_USER_ID,
} from "@/constants/scheduler";

import {
  findDueScheduledContent,
  publishScheduledDocument,
} from "./scheduler.repository";

import {
  AUDIT_ACTIONS,
  createAuditLogSafe,
} from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function resolveCompanyIdFromPath(path) {
  /*
   * Expected:
   *
   * companies/{companyId}/projects/{id}
   * companies/{companyId}/awards/{id}
   * ...
   */

  const parts = path.split("/");

  if (parts.length < 4 || parts[0] !== "companies") {
    return null;
  }

  return parts[1];
}

async function processContentType(contentType) {
  const items = await findDueScheduledContent({
    collectionGroup: contentType.collectionGroup,
  });

  const result = {
    type: contentType.key,

    found: items.length,

    published: 0,

    skipped: 0,

    failed: 0,

    items: [],
  };

  for (const item of items) {
    const companyId = resolveCompanyIdFromPath(item.path);

    if (!companyId) {
      result.failed += 1;

      result.items.push({
        id: item.id,

        path: item.path,

        status: "failed",

        reason: "INVALID_DOCUMENT_PATH",
      });

      continue;
    }

    try {
      const publishResult = await publishScheduledDocument({
        ref: item.ref,

        systemUserId: SYSTEM_CRON_USER_ID,
      });

      if (publishResult?.skipped) {
        result.skipped += 1;

        result.items.push({
          id: item.id,

          path: item.path,

          status: "skipped",

          reason: publishResult.reason,
        });

        continue;
      }

      result.published += 1;

      result.items.push({
        id: item.id,

        path: item.path,

        status: "published",
      });

      await createAuditLogSafe({
        userId: SYSTEM_CRON_USER_ID,

        companyId,

        action: AUDIT_ACTIONS.SYSTEM_SCHEDULED_PUBLISH,

        resource: contentType.key,

        resourceId: item.id,

        before: serializeFirestoreDocument(publishResult.before),

        after: serializeFirestoreDocument(publishResult.after),

        metadata: {
          trigger: "scheduled-publisher",

          documentPath: item.path,
        },
      });
    } catch (error) {
      console.error("Scheduled publish item error:", {
        type: contentType.key,

        path: item.path,

        error,
      });

      result.failed += 1;

      result.items.push({
        id: item.id,

        path: item.path,

        status: "failed",

        reason: error.message || "UNKNOWN_ERROR",
      });

      await createAuditLogSafe({
        userId: SYSTEM_CRON_USER_ID,

        companyId,

        action: AUDIT_ACTIONS.SYSTEM_SCHEDULED_PUBLISH_FAILED,

        resource: contentType.key,

        resourceId: item.id,

        before: null,

        after: null,

        metadata: {
          trigger: "scheduled-publisher",

          documentPath: item.path,

          error: error.message || "UNKNOWN_ERROR",
        },
      });
    }
  }

  return result;
}

export async function runScheduledPublisher() {
  const startedAt = new Date();

  const results = [];

  /*
   * Sequential by content type.
   *
   * More predictable for Firestore
   * and sufficient for the current
   * CMS scale.
   */
  for (const contentType of SCHEDULED_CONTENT_TYPES) {
    const result = await processContentType(contentType);

    results.push(result);
  }

  const totals = results.reduce(
    (accumulator, current) => {
      accumulator.found += current.found;

      accumulator.published += current.published;

      accumulator.skipped += current.skipped;

      accumulator.failed += current.failed;

      return accumulator;
    },
    {
      found: 0,
      published: 0,
      skipped: 0,
      failed: 0,
    },
  );

  return {
    success: totals.failed === 0,

    startedAt: startedAt.toISOString(),

    completedAt: new Date().toISOString(),

    totals,

    results,
  };
}
