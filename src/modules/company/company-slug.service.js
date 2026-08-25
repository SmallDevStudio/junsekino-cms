import "server-only";

import { companySlugSchema } from "./company-slug.schema";

import {
  changeCompanySlug,
  getCompanySlugRecord,
  reserveCompanySlug,
  resolveCompanyBySlug,
} from "./company-slug.repository";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

export async function resolvePublicCompany(rawSlug) {
  const validation = companySlugSchema.safeParse(rawSlug);

  if (!validation.success) {
    return null;
  }

  const slug = validation.data;

  const slugRecord = await getCompanySlugRecord(slug);

  if (!slugRecord) {
    return null;
  }

  /*
   * Old slug.
   */

  if (slugRecord.status === "redirect" && slugRecord.redirectTo) {
    return {
      redirect: true,

      redirectTo: slugRecord.redirectTo,

      company: null,
    };
  }

  if (slugRecord.status !== "active") {
    return null;
  }

  const company = await resolveCompanyBySlug(slug);

  if (!company) {
    return null;
  }

  return {
    redirect: false,

    redirectTo: null,

    company: serializeFirestoreDocument(company),
  };
}

export async function assignCompanySlug({ companyId, slug, currentUser }) {
  const validation = companySlugSchema.safeParse(slug);

  if (!validation.success) {
    throw new Error("COMPANY_SLUG_INVALID");
  }

  const result = await reserveCompanySlug({
    companyId,

    slug: validation.data,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "COMPANY_SLUG_ASSIGN",

    resource: "company",

    resourceId: companyId,

    before: null,

    after: {
      slug: result.slug,
    },
  });

  return result;
}

export async function updateCompanySlug({ companyId, slug, currentUser }) {
  const validation = companySlugSchema.safeParse(slug);

  if (!validation.success) {
    throw new Error("COMPANY_SLUG_INVALID");
  }

  const result = await changeCompanySlug({
    companyId,

    newSlug: validation.data,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "COMPANY_SLUG_UPDATE",

    resource: "company",

    resourceId: companyId,

    before: null,

    after: {
      slug: result.slug,
    },
  });

  return result;
}
