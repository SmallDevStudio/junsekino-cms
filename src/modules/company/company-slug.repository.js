import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getCompanyRef(companyId) {
  return adminDb.collection("companies").doc(companyId);
}

function getCompanySlugRef(slug) {
  return adminDb.collection("companySlugs").doc(slug);
}

export async function getCompanySlugRecord(slug) {
  const snapshot = await getCompanySlugRef(slug).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function resolveCompanyBySlug(slug) {
  const slugSnapshot = await getCompanySlugRef(slug).get();

  if (!slugSnapshot.exists) {
    return null;
  }

  const slugData = slugSnapshot.data();

  if (!slugData.companyId || slugData.status !== "active") {
    return null;
  }

  const companySnapshot = await getCompanyRef(slugData.companyId).get();

  if (!companySnapshot.exists) {
    return null;
  }

  const company = companySnapshot.data();

  if (company.deletedAt || company.status !== "active") {
    return null;
  }

  return {
    id: companySnapshot.id,

    ...company,
  };
}

export async function reserveCompanySlug({ companyId, slug, userId }) {
  const companyRef = getCompanyRef(companyId);

  const slugRef = getCompanySlugRef(slug);

  await adminDb.runTransaction(async (transaction) => {
    /*
     * All reads happen before writes.
     */

    const [companySnapshot, slugSnapshot] = await transaction.getAll(
      companyRef,
      slugRef,
    );

    if (!companySnapshot.exists) {
      throw new Error("COMPANY_NOT_FOUND");
    }

    const company = companySnapshot.data();

    if (company.deletedAt) {
      throw new Error("COMPANY_NOT_FOUND");
    }

    if (slugSnapshot.exists) {
      const existing = slugSnapshot.data();

      /*
       * Idempotent repair.
       *
       * Existing reservation belonging
       * to the same company is valid.
       */

      if (existing.companyId === companyId) {
        transaction.set(
          slugRef,
          {
            slug,

            companyId,

            status: "active",

            updatedAt: FieldValue.serverTimestamp(),

            updatedBy: userId,
          },
          {
            merge: true,
          },
        );

        transaction.update(companyRef, {
          slug,

          updatedAt: FieldValue.serverTimestamp(),

          updatedBy: userId,
        });

        return;
      }

      throw new Error("COMPANY_SLUG_EXISTS");
    }

    transaction.set(slugRef, {
      slug,

      companyId,

      status: "active",

      createdAt: FieldValue.serverTimestamp(),

      createdBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });

    transaction.update(companyRef, {
      slug,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  return {
    companyId,
    slug,
  };
}

export async function changeCompanySlug({ companyId, newSlug, userId }) {
  const companyRef = getCompanyRef(companyId);

  await adminDb.runTransaction(async (transaction) => {
    const companySnapshot = await transaction.get(companyRef);

    if (!companySnapshot.exists) {
      throw new Error("COMPANY_NOT_FOUND");
    }

    const company = companySnapshot.data();

    if (company.deletedAt) {
      throw new Error("COMPANY_NOT_FOUND");
    }

    const oldSlug = company.slug || null;

    if (oldSlug === newSlug) {
      return;
    }

    const newSlugRef = getCompanySlugRef(newSlug);

    const newSlugSnapshot = await transaction.get(newSlugRef);

    if (newSlugSnapshot.exists) {
      const existing = newSlugSnapshot.data();

      if (existing.companyId !== companyId) {
        throw new Error("COMPANY_SLUG_EXISTS");
      }
    }

    /*
     * Reserve new slug first.
     */

    transaction.set(
      newSlugRef,
      {
        slug: newSlug,

        companyId,

        status: "active",

        createdAt: FieldValue.serverTimestamp(),

        createdBy: userId,

        updatedAt: FieldValue.serverTimestamp(),

        updatedBy: userId,
      },
      {
        merge: true,
      },
    );

    /*
     * Retire old slug.
     *
     * We don't hard-delete it because
     * retaining the reservation helps
     * prevent another company from
     * immediately taking an old URL.
     */

    if (oldSlug) {
      const oldSlugRef = getCompanySlugRef(oldSlug);

      transaction.set(
        oldSlugRef,
        {
          status: "redirect",

          redirectTo: newSlug,

          updatedAt: FieldValue.serverTimestamp(),

          updatedBy: userId,
        },
        {
          merge: true,
        },
      );
    }

    transaction.update(companyRef, {
      slug: newSlug,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  return {
    companyId,

    slug: newSlug,
  };
}
