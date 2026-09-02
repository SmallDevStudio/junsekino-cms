import "server-only";

import crypto from "node:crypto";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

import { listCompanies } from "@/modules/company/company.repository";

import { cleanupExpiredFormAttachments } from "@/modules/form/form-attachment.service";

import { cleanupExpiredFormSubmissions } from "@/modules/form/form-submission.service";

const JOB_NAME = "privacyRetention";

const LOCK_DURATION_MS = 10 * 60 * 1000;

function getJobRef() {
  return adminDb.collection("systemJobs").doc(JOB_NAME);
}

async function acquireJobLock() {
  const ref = getJobRef();

  const jobId = crypto.randomUUID();

  const now = new Date();

  const lockExpiresAt = new Date(now.getTime() + LOCK_DURATION_MS);

  let acquired = false;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    const existing = snapshot.exists ? snapshot.data() : null;

    const existingExpiration = existing?.lockExpiresAt?.toDate?.() || null;

    const lockIsActive =
      existing?.status === "running" &&
      existingExpiration &&
      existingExpiration.getTime() > now.getTime();

    if (lockIsActive) {
      return;
    }

    transaction.set(
      ref,

      {
        jobName: JOB_NAME,

        jobId,

        status: "running",

        startedAt: FieldValue.serverTimestamp(),

        lockExpiresAt: Timestamp.fromDate(lockExpiresAt),

        completedAt: null,

        error: null,

        updatedAt: FieldValue.serverTimestamp(),
      },

      {
        merge: true,
      },
    );

    acquired = true;
  });

  if (!acquired) {
    throw new Error("RETENTION_CLEANUP_ALREADY_RUNNING");
  }

  return {
    jobId,
  };
}

async function completeJob({ jobId, result }) {
  const ref = getJobRef();

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.jobId !== jobId) {
    return;
  }

  await ref.set(
    {
      status: "completed",

      completedAt: FieldValue.serverTimestamp(),

      lockExpiresAt: null,

      result,

      error: null,

      updatedAt: FieldValue.serverTimestamp(),
    },

    {
      merge: true,
    },
  );
}

async function failJob({ jobId, error }) {
  const ref = getJobRef();

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.jobId !== jobId) {
    return;
  }

  await ref.set(
    {
      status: "failed",

      completedAt: FieldValue.serverTimestamp(),

      lockExpiresAt: null,

      error: String(
        error?.message || error || "RETENTION_CLEANUP_FAILED",
      ).slice(0, 2000),

      updatedAt: FieldValue.serverTimestamp(),
    },

    {
      merge: true,
    },
  );
}

function createCompanyResult(company) {
  return {
    companyId: company.id,

    companyName: company.name || company.legalName || company.id,

    attachments: {
      processed: 0,

      deleted: 0,

      failed: 0,
    },

    submissions: {
      processed: 0,

      deleted: 0,

      failed: 0,

      attachmentCount: 0,
    },

    success: false,

    error: null,
  };
}

export async function runPrivacyRetentionCleanup({
  attachmentLimit = 50,
  submissionLimit = 25,
} = {}) {
  const lock = await acquireJobLock();

  const result = {
    jobId: lock.jobId,

    startedAt: new Date().toISOString(),

    completedAt: null,

    companiesProcessed: 0,

    companiesSucceeded: 0,

    companiesFailed: 0,

    totals: {
      attachmentsProcessed: 0,

      attachmentsDeleted: 0,

      attachmentsFailed: 0,

      submissionsProcessed: 0,

      submissionsDeleted: 0,

      submissionsFailed: 0,

      submittedAttachmentsDeleted: 0,
    },

    companies: [],
  };

  try {
    const companies = await listCompanies();

    const activeCompanies = companies.filter(
      (company) => !company.deletedAt && company.status === "active",
    );

    for (const company of activeCompanies) {
      const companyResult = createCompanyResult(company);

      result.companiesProcessed += 1;

      try {
        /*
         * Remove expired temporary files first.
         */
        const attachments = await cleanupExpiredFormAttachments({
          companyId: company.id,

          limit: attachmentLimit,
        });

        companyResult.attachments = {
          processed: attachments.processed,

          deleted: attachments.deleted,

          failed: attachments.failed,
        };

        /*
         * Then remove expired submissions and
         * their attached private Storage files.
         */
        const submissions = await cleanupExpiredFormSubmissions({
          companyId: company.id,

          limit: submissionLimit,
        });

        companyResult.submissions = {
          processed: submissions.processed,

          deleted: submissions.deleted,

          failed: submissions.failed,

          attachmentCount: submissions.attachmentCount,
        };

        result.totals.attachmentsProcessed += attachments.processed;

        result.totals.attachmentsDeleted += attachments.deleted;

        result.totals.attachmentsFailed += attachments.failed;

        result.totals.submissionsProcessed += submissions.processed;

        result.totals.submissionsDeleted += submissions.deleted;

        result.totals.submissionsFailed += submissions.failed;

        result.totals.submittedAttachmentsDeleted +=
          submissions.attachmentCount;

        companyResult.success = true;

        result.companiesSucceeded += 1;
      } catch (error) {
        console.error(
          `Privacy retention cleanup failed for company ${company.id}:`,

          error,
        );

        companyResult.error =
          error.message || "COMPANY_RETENTION_CLEANUP_FAILED";

        result.companiesFailed += 1;
      }

      result.companies.push(companyResult);
    }

    result.completedAt = new Date().toISOString();

    await completeJob({
      jobId: lock.jobId,

      result,
    });

    return result;
  } catch (error) {
    await failJob({
      jobId: lock.jobId,

      error,
    });

    throw error;
  }
}
