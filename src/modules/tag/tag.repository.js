import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("tags");
}

export async function getTagById({ companyId, tagId }) {
  const snapshot = await getCollection(companyId).doc(tagId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getTagBySlug({ companyId, slug }) {
  const snapshot = await getCollection(companyId)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];

  return {
    id: document.id,
    ...document.data(),
  };
}

export async function listTagRecords(companyId) {
  const snapshot = await getCollection(companyId).get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

export async function createTagRecord({ companyId, data, userId }) {
  const ref = getCollection(companyId).doc();

  await ref.set({
    ...data,

    usageCount: 0,

    status: "active",

    createdAt: FieldValue.serverTimestamp(),

    createdBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,

    deletedAt: null,
    deletedBy: null,
  });

  return getTagById({
    companyId,
    tagId: ref.id,
  });
}

export async function updateTagRecord({ companyId, tagId, data, userId }) {
  const ref = getCollection(companyId).doc(tagId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("TAG_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  await ref.update({
    ...data,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getTagById({
      companyId,
      tagId,
    }),
  };
}

export async function deleteTagRecord({ companyId, tagId, userId }) {
  const ref = getCollection(companyId).doc(tagId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("TAG_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  if ((before.usageCount || 0) > 0) {
    throw new Error("TAG_IN_USE");
  }

  await ref.update({
    status: "inactive",

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return before;
}
