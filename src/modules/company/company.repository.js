import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

const companiesCollection = adminDb.collection("companies");

const companySlugsCollection = adminDb.collection("companySlugs");

export async function getCompanyById(companyId) {
  const snapshot = await companiesCollection.doc(companyId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getCompanyBySlug(slug) {
  const slugSnapshot = await companySlugsCollection.doc(slug).get();

  if (!slugSnapshot.exists) {
    return null;
  }

  const { companyId } = slugSnapshot.data();

  return getCompanyById(companyId);
}

export async function listCompanies({ includeDeleted = false } = {}) {
  const snapshot = await companiesCollection.get();

  const companies = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));

  const filtered = includeDeleted
    ? companies
    : companies.filter((company) => !company.deletedAt);

  return filtered.sort((a, b) => {
    const nameA = a.name?.toLowerCase() || "";

    const nameB = b.name?.toLowerCase() || "";

    return nameA.localeCompare(nameB);
  });
}

export async function createCompanyRecord({ data, userId }) {
  const companyRef = companiesCollection.doc();

  const slugRef = companySlugsCollection.doc(data.slug);

  await adminDb.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      throw new Error("COMPANY_SLUG_EXISTS");
    }

    transaction.set(companyRef, {
      ...data,

      createdAt: FieldValue.serverTimestamp(),

      createdBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,

      deletedAt: null,
      deletedBy: null,
    });

    transaction.set(slugRef, {
      companyId: companyRef.id,

      slug: data.slug,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return getCompanyById(companyRef.id);
}

export async function updateCompanyRecord({ companyId, data, userId }) {
  const companyRef = companiesCollection.doc(companyId);

  let previousData = null;

  await adminDb.runTransaction(async (transaction) => {
    const companySnapshot = await transaction.get(companyRef);

    if (!companySnapshot.exists) {
      throw new Error("COMPANY_NOT_FOUND");
    }

    previousData = companySnapshot.data();

    const oldSlug = previousData.slug;

    const newSlug = data.slug || oldSlug;

    if (newSlug && newSlug !== oldSlug) {
      const newSlugRef = companySlugsCollection.doc(newSlug);

      const oldSlugRef = companySlugsCollection.doc(oldSlug);

      const newSlugSnapshot = await transaction.get(newSlugRef);

      if (newSlugSnapshot.exists) {
        throw new Error("COMPANY_SLUG_EXISTS");
      }

      transaction.delete(oldSlugRef);

      transaction.set(newSlugRef, {
        companyId,
        slug: newSlug,

        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(companyRef, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  const updated = await getCompanyById(companyId);

  return {
    before: {
      id: companyId,
      ...previousData,
    },

    after: updated,
  };
}

export async function softDeleteCompanyRecord({ companyId, userId }) {
  const companyRef = companiesCollection.doc(companyId);

  let previousData = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(companyRef);

    if (!snapshot.exists) {
      throw new Error("COMPANY_NOT_FOUND");
    }

    previousData = snapshot.data();

    if (previousData.deletedAt) {
      throw new Error("COMPANY_ALREADY_DELETED");
    }

    transaction.update(companyRef, {
      status: "archived",

      deletedAt: FieldValue.serverTimestamp(),

      deletedBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  return {
    id: companyId,
    ...previousData,
  };
}
