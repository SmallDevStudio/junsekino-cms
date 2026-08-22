import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getPeopleCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("people");
}

function getPeopleSlugsCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("peopleSlugs");
}

export async function getPersonById({ companyId, peopleId }) {
  const snapshot = await getPeopleCollection(companyId).doc(peopleId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getPersonBySlug({ companyId, slug }) {
  const snapshot = await getPeopleSlugsCollection(companyId).doc(slug).get();

  if (!snapshot.exists) {
    return null;
  }

  const { peopleId } = snapshot.data();

  if (!peopleId) {
    return null;
  }

  return getPersonById({
    companyId,
    peopleId,
  });
}

export async function listPeopleRecords({ companyId, includeDeleted = false }) {
  const snapshot = await getPeopleCollection(companyId).get();

  let people = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));

  if (!includeDeleted) {
    people = people.filter((person) => !person.deletedAt);
  }

  return people;
}

export async function createPeopleRecord({ companyId, data, userId }) {
  const peopleRef = getPeopleCollection(companyId).doc();

  const slugRef = getPeopleSlugsCollection(companyId).doc(data.slug);

  await adminDb.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      throw new Error("PEOPLE_SLUG_EXISTS");
    }

    transaction.set(peopleRef, {
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
      peopleId: peopleRef.id,

      slug: data.slug,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return getPersonById({
    companyId,

    peopleId: peopleRef.id,
  });
}

export async function updatePeopleRecord({
  companyId,
  peopleId,
  data,
  userId,
}) {
  const peopleRef = getPeopleCollection(companyId).doc(peopleId);

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(peopleRef);

    if (!snapshot.exists) {
      throw new Error("PEOPLE_NOT_FOUND");
    }

    before = {
      id: snapshot.id,
      ...snapshot.data(),
    };

    if (before.deletedAt) {
      throw new Error("PEOPLE_NOT_FOUND");
    }

    const oldSlug = before.slug;

    const newSlug = data.slug || oldSlug;

    if (oldSlug !== newSlug) {
      const oldSlugRef = getPeopleSlugsCollection(companyId).doc(oldSlug);

      const newSlugRef = getPeopleSlugsCollection(companyId).doc(newSlug);

      const newSlugSnapshot = await transaction.get(newSlugRef);

      if (newSlugSnapshot.exists) {
        throw new Error("PEOPLE_SLUG_EXISTS");
      }

      transaction.delete(oldSlugRef);

      transaction.set(newSlugRef, {
        peopleId,
        slug: newSlug,

        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(peopleRef, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  const after = await getPersonById({
    companyId,
    peopleId,
  });

  return {
    before,
    after,
  };
}

export async function publishPeopleRecord({ companyId, peopleId, userId }) {
  const peopleRef = getPeopleCollection(companyId).doc(peopleId);

  const snapshot = await peopleRef.get();

  if (!snapshot.exists) {
    throw new Error("PEOPLE_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PEOPLE_NOT_FOUND");
  }

  await peopleRef.update({
    status: "published",

    publishedAt: FieldValue.serverTimestamp(),

    publishedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  const after = await getPersonById({
    companyId,
    peopleId,
  });

  return {
    before,
    after,
  };
}

export async function unpublishPeopleRecord({ companyId, peopleId, userId }) {
  const peopleRef = getPeopleCollection(companyId).doc(peopleId);

  const snapshot = await peopleRef.get();

  if (!snapshot.exists) {
    throw new Error("PEOPLE_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PEOPLE_NOT_FOUND");
  }

  await peopleRef.update({
    status: "draft",

    publishedAt: null,

    publishedBy: null,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  const after = await getPersonById({
    companyId,
    peopleId,
  });

  return {
    before,
    after,
  };
}

export async function softDeletePeopleRecord({ companyId, peopleId, userId }) {
  const peopleRef = getPeopleCollection(companyId).doc(peopleId);

  const snapshot = await peopleRef.get();

  if (!snapshot.exists) {
    throw new Error("PEOPLE_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PEOPLE_ALREADY_DELETED");
  }

  await peopleRef.update({
    status: "archived",

    publishedAt: null,

    publishedBy: null,

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return before;
}
