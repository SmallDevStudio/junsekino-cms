import "server-only";

import { DEFAULT_PEOPLE_SEO, PEOPLE_STATUS } from "@/constants/people";

import {
  createPeopleRecord,
  getPersonById,
  listPeopleRecords,
  publishPeopleRecord,
  softDeletePeopleRecord,
  unpublishPeopleRecord,
  updatePeopleRecord,
} from "./people.repository";

import {
  AUDIT_ACTIONS,
  createAuditLogSafe,
} from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function mergeLocalized(defaults = {}, value = {}) {
  return {
    th: value.th ?? defaults.th ?? "",

    en: value.en ?? defaults.en ?? "",
  };
}

function mergeSeo(seo = {}) {
  return {
    ...DEFAULT_PEOPLE_SEO,
    ...seo,

    th: {
      ...DEFAULT_PEOPLE_SEO.th,
      ...(seo.th || {}),
    },

    en: {
      ...DEFAULT_PEOPLE_SEO.en,
      ...(seo.en || {}),
    },
  };
}

function normalizeSocial(social = {}) {
  return {
    website: social.website || null,

    linkedin: social.linkedin || null,

    instagram: social.instagram || null,

    facebook: social.facebook || null,

    x: social.x || null,
  };
}

function normalizePeopleInput(input) {
  return {
    ...input,

    slug: input.slug?.trim().toLowerCase(),

    name: mergeLocalized({}, input.name),

    position: mergeLocalized({}, input.position),

    biography: mergeLocalized({}, input.biography),

    peopleType: input.peopleType || "staff",

    email: input.email || null,

    phone: input.phone || null,

    profileImage: input.profileImage ?? null,

    social: normalizeSocial(input.social),

    sortOrder: input.sortOrder ?? 0,

    featured: input.featured === true,

    status: PEOPLE_STATUS.DRAFT,

    seo: mergeSeo(input.seo),
  };
}

function validatePeopleName(person) {
  const hasThai = Boolean(person.name?.th?.trim());

  const hasEnglish = Boolean(person.name?.en?.trim());

  if (!hasThai && !hasEnglish) {
    throw new Error("PEOPLE_NAME_REQUIRED");
  }
}

export async function listPeople({
  companyId,
  status = null,
  peopleType = null,
  search = null,
}) {
  let people = await listPeopleRecords({
    companyId,
  });

  if (status) {
    people = people.filter((person) => person.status === status);
  }

  if (peopleType) {
    people = people.filter((person) => person.peopleType === peopleType);
  }

  if (search) {
    const keyword = search.trim().toLowerCase();

    people = people.filter((person) => {
      const values = [
        person.name?.th,
        person.name?.en,
        person.position?.th,
        person.position?.en,
        person.slug,
        person.peopleType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }

  people.sort((a, b) => {
    const orderA = a.sortOrder ?? 0;

    const orderB = b.sortOrder ?? 0;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const nameA = (a.name?.en || a.name?.th || "").toLowerCase();

    const nameB = (b.name?.en || b.name?.th || "").toLowerCase();

    return nameA.localeCompare(nameB);
  });

  return people.map(serializeFirestoreDocument);
}

export async function getPerson({ companyId, peopleId }) {
  const person = await getPersonById({
    companyId,
    peopleId,
  });

  if (!person || person.deletedAt) {
    throw new Error("PEOPLE_NOT_FOUND");
  }

  return serializeFirestoreDocument(person);
}

export async function createPerson({ companyId, input, currentUser }) {
  const data = normalizePeopleInput(input);

  validatePeopleName(data);

  const person = await createPeopleRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(person);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PEOPLE_CREATE,

    resource: "people",

    resourceId: person.id,

    before: null,

    after: serialized,
  });

  return serialized;
}

export async function updatePerson({
  companyId,
  peopleId,
  input,
  currentUser,
}) {
  const existing = await getPersonById({
    companyId,
    peopleId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("PEOPLE_NOT_FOUND");
  }

  const updateData = {
    ...input,
  };

  if (input.slug) {
    updateData.slug = input.slug.trim().toLowerCase();
  }

  if (input.name) {
    updateData.name = mergeLocalized(existing.name, input.name);
  }

  if (input.position) {
    updateData.position = mergeLocalized(existing.position, input.position);
  }

  if (input.biography) {
    updateData.biography = mergeLocalized(existing.biography, input.biography);
  }

  if (input.social) {
    updateData.social = normalizeSocial({
      ...existing.social,
      ...input.social,
    });
  }

  if (input.seo) {
    updateData.seo = mergeSeo({
      ...existing.seo,
      ...input.seo,

      th: {
        ...existing.seo?.th,
        ...input.seo?.th,
      },

      en: {
        ...existing.seo?.en,
        ...input.seo?.en,
      },
    });
  }

  delete updateData.status;
  delete updateData.publishedAt;
  delete updateData.publishedBy;
  delete updateData.deletedAt;
  delete updateData.deletedBy;

  const preview = {
    ...existing,
    ...updateData,
  };

  validatePeopleName(preview);

  const result = await updatePeopleRecord({
    companyId,
    peopleId,

    data: updateData,

    userId: currentUser.uid,
  });

  const serializedBefore = serializeFirestoreDocument(result.before);

  const serializedAfter = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PEOPLE_UPDATE,

    resource: "people",

    resourceId: peopleId,

    before: serializedBefore,

    after: serializedAfter,
  });

  return serializedAfter;
}

export async function publishPerson({ companyId, peopleId, currentUser }) {
  const existing = await getPersonById({
    companyId,
    peopleId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("PEOPLE_NOT_FOUND");
  }

  validatePeopleName(existing);

  const result = await publishPeopleRecord({
    companyId,
    peopleId,

    userId: currentUser.uid,
  });

  const serializedBefore = serializeFirestoreDocument(result.before);

  const serializedAfter = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PEOPLE_PUBLISH,

    resource: "people",

    resourceId: peopleId,

    before: serializedBefore,

    after: serializedAfter,
  });

  return serializedAfter;
}

export async function unpublishPerson({ companyId, peopleId, currentUser }) {
  const result = await unpublishPeopleRecord({
    companyId,
    peopleId,

    userId: currentUser.uid,
  });

  const serializedBefore = serializeFirestoreDocument(result.before);

  const serializedAfter = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PEOPLE_UNPUBLISH,

    resource: "people",

    resourceId: peopleId,

    before: serializedBefore,

    after: serializedAfter,
  });

  return serializedAfter;
}

export async function deletePerson({ companyId, peopleId, currentUser }) {
  const before = await softDeletePeopleRecord({
    companyId,
    peopleId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PEOPLE_DELETE,

    resource: "people",

    resourceId: peopleId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: peopleId,

    deleted: true,
  };
}
