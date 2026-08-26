import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getProjectsCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("projects");
}

function getProjectSlugsCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("projectSlugs");
}

export async function getProjectById({ companyId, projectId }) {
  const snapshot = await getProjectsCollection(companyId).doc(projectId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getProjectBySlug({ companyId, slug }) {
  const slugSnapshot = await getProjectSlugsCollection(companyId)
    .doc(slug)
    .get();

  if (!slugSnapshot.exists) {
    return null;
  }

  const { projectId } = slugSnapshot.data();

  return getProjectById({
    companyId,
    projectId,
  });
}

export async function listProjectRecords({
  companyId,
  includeDeleted = false,
}) {
  const snapshot = await getProjectsCollection(companyId).get();

  let projects = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));

  if (!includeDeleted) {
    projects = projects.filter((project) => !project.deletedAt);
  }

  return projects;
}

export async function createProjectRecord({ companyId, data, userId }) {
  const projectRef = getProjectsCollection(companyId).doc();

  const slugRef = getProjectSlugsCollection(companyId).doc(data.slug);

  await adminDb.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      const error = new Error("PROJECT_SLUG_EXISTS");

      error.slug = data.slug;

      throw error;
    }

    transaction.set(projectRef, {
      ...data,

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
      projectId: projectRef.id,

      slug: data.slug,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return getProjectById({
    companyId,
    projectId: projectRef.id,
  });
}

export async function updateProjectRecord({
  companyId,
  projectId,
  data,
  userId,
}) {
  const projectRef = getProjectsCollection(companyId).doc(projectId);

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(projectRef);

    if (!snapshot.exists) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    before = {
      id: snapshot.id,

      ...snapshot.data(),
    };

    if (before.deletedAt) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const oldSlug = before.slug;

    const newSlug = data.slug || oldSlug;

    if (newSlug !== oldSlug) {
      const newSlugRef = getProjectSlugsCollection(companyId).doc(newSlug);

      const oldSlugRef = getProjectSlugsCollection(companyId).doc(oldSlug);

      const newSlugSnapshot = await transaction.get(newSlugRef);

      if (newSlugSnapshot.exists) {
        const error = new Error("PROJECT_SLUG_EXISTS");

        error.slug = newSlug;

        throw error;
      }

      transaction.delete(oldSlugRef);

      transaction.set(newSlugRef, {
        projectId,

        slug: newSlug,

        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(projectRef, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  const after = await getProjectById({
    companyId,
    projectId,
  });

  return {
    before,
    after,
  };
}

export async function publishProjectRecord({
  companyId,
  projectId,
  userId,
  scheduledAt = null,
}) {
  const projectRef = getProjectsCollection(companyId).doc(projectId);

  const snapshot = await projectRef.get();

  if (!snapshot.exists) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  if (scheduledAt) {
    const scheduleDate = new Date(scheduledAt);

    if (Number.isNaN(scheduleDate.getTime())) {
      throw new Error("INVALID_SCHEDULE_DATE");
    }

    if (scheduleDate.getTime() <= Date.now()) {
      throw new Error("SCHEDULE_MUST_BE_FUTURE");
    }

    await projectRef.update({
      status: "scheduled",

      scheduledAt: Timestamp.fromDate(scheduleDate),

      publishedAt: null,

      publishedBy: null,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  } else {
    await projectRef.update({
      status: "published",

      scheduledAt: null,

      publishedAt: FieldValue.serverTimestamp(),

      publishedBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  }

  const after = await getProjectById({
    companyId,
    projectId,
  });

  return {
    before,
    after,
  };
}

export async function unpublishProjectRecord({ companyId, projectId, userId }) {
  const projectRef = getProjectsCollection(companyId).doc(projectId);

  const snapshot = await projectRef.get();

  if (!snapshot.exists) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  await projectRef.update({
    status: "draft",

    scheduledAt: null,

    publishedAt: null,

    publishedBy: null,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  const after = await getProjectById({
    companyId,
    projectId,
  });

  return {
    before,
    after,
  };
}

export async function softDeleteProjectRecord({
  companyId,
  projectId,
  userId,
}) {
  const projectRef = getProjectsCollection(companyId).doc(projectId);

  const snapshot = await projectRef.get();

  if (!snapshot.exists) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PROJECT_ALREADY_DELETED");
  }

  await projectRef.update({
    status: "archived",

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return before;
}
