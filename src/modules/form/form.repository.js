import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getFormsCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("forms");
}

function getFormSlugsCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("formSlugs");
}

export async function getFormById({ companyId, formId }) {
  const snapshot = await getFormsCollection(companyId).doc(formId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function getFormBySlug({ companyId, slug }) {
  const slugSnapshot = await getFormSlugsCollection(companyId).doc(slug).get();

  if (!slugSnapshot.exists) {
    return null;
  }

  const { formId } = slugSnapshot.data();

  if (!formId) {
    return null;
  }

  return getFormById({
    companyId,
    formId,
  });
}

export async function listFormRecords(companyId) {
  const snapshot = await getFormsCollection(companyId).get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

export async function createFormRecord({ companyId, data, userId }) {
  const formRef = getFormsCollection(companyId).doc();

  const slugRef = getFormSlugsCollection(companyId).doc(data.slug);

  await adminDb.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      throw new Error("FORM_SLUG_EXISTS");
    }

    transaction.set(formRef, {
      ...data,

      status: "draft",

      createdAt: FieldValue.serverTimestamp(),

      createdBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,

      publishedAt: null,

      publishedBy: null,

      deletedAt: null,

      deletedBy: null,
    });

    transaction.set(slugRef, {
      formId: formRef.id,

      slug: data.slug,

      createdAt: FieldValue.serverTimestamp(),

      createdBy: userId,
    });
  });

  return getFormById({
    companyId,

    formId: formRef.id,
  });
}

export async function updateFormRecord({ companyId, formId, data, userId }) {
  const formRef = getFormsCollection(companyId).doc(formId);

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(formRef);

    if (!snapshot.exists || snapshot.data().deletedAt) {
      throw new Error("FORM_NOT_FOUND");
    }

    before = {
      id: snapshot.id,

      ...snapshot.data(),
    };

    const oldSlug = before.slug;

    const newSlug = data.slug || oldSlug;

    if (oldSlug !== newSlug) {
      const oldSlugRef = getFormSlugsCollection(companyId).doc(oldSlug);

      const newSlugRef = getFormSlugsCollection(companyId).doc(newSlug);

      const existing = await transaction.get(newSlugRef);

      if (existing.exists) {
        throw new Error("FORM_SLUG_EXISTS");
      }

      transaction.delete(oldSlugRef);

      transaction.set(newSlugRef, {
        formId,

        slug: newSlug,

        createdAt: FieldValue.serverTimestamp(),

        createdBy: userId,
      });
    }

    transaction.update(formRef, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  return {
    before,

    after: await getFormById({
      companyId,
      formId,
    }),
  };
}

export async function publishFormRecord({ companyId, formId, userId }) {
  const ref = getFormsCollection(companyId).doc(formId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("FORM_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  await ref.update({
    status: "published",

    publishedAt: FieldValue.serverTimestamp(),

    publishedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getFormById({
      companyId,
      formId,
    }),
  };
}

export async function unpublishFormRecord({ companyId, formId, userId }) {
  const ref = getFormsCollection(companyId).doc(formId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("FORM_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  await ref.update({
    status: "draft",

    publishedAt: null,

    publishedBy: null,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getFormById({
      companyId,
      formId,
    }),
  };
}

export async function softDeleteFormRecord({ companyId, formId, userId }) {
  const ref = getFormsCollection(companyId).doc(formId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("FORM_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("FORM_ALREADY_DELETED");
  }

  await ref.update({
    status: "archived",

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return before;
}
