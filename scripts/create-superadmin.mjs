import { cert, getApps, initializeApp } from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";

import { FieldValue, getFirestore } from "firebase-admin/firestore";

const {
  FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY,
} = process.env;

if (
  !FIREBASE_ADMIN_PROJECT_ID ||
  !FIREBASE_ADMIN_CLIENT_EMAIL ||
  !FIREBASE_ADMIN_PRIVATE_KEY
) {
  console.error("Missing Firebase Admin environment variables.");

  process.exit(1);
}

const privateKey = FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: FIREBASE_ADMIN_PROJECT_ID,

          clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,

          privateKey,
        }),
      });

const auth = getAuth(app);

const db = getFirestore(app);

const args = process.argv.slice(2);

const email = args[0]?.trim().toLowerCase();

const password = args[1];

const displayName = args[2]?.trim() || "Super Administrator";

if (!email || !password) {
  console.error(`
Usage:

node --env-file=.env.local scripts/create-superadmin.mjs <email> <password> "<display name>"

Example:

node --env-file=.env.local scripts/create-superadmin.mjs admin@example.com "StrongPassword123!" "Junsekino Admin"
`);

  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must contain at least 8 characters.");

  process.exit(1);
}

async function findOrCreateUser() {
  try {
    const existing = await auth.getUserByEmail(email);

    console.log(`Existing Firebase user found: ${existing.uid}`);

    await auth.updateUser(existing.uid, {
      displayName,
      disabled: false,
    });

    return existing;
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  const created = await auth.createUser({
    email,
    password,
    displayName,
    emailVerified: false,
    disabled: false,
  });

  console.log(`Firebase user created: ${created.uid}`);

  return created;
}

async function bootstrap() {
  try {
    console.log("");
    console.log("Creating Junsekino SUPERADMIN...");
    console.log("");

    const user = await findOrCreateUser();

    const userRef = db.collection("users").doc(user.uid);

    const existing = await userRef.get();

    const baseData = {
      email,
      displayName,

      userType: "staff",

      status: "active",

      isSuperAdmin: true,

      defaultCompanyId: null,

      updatedAt: FieldValue.serverTimestamp(),
    };

    if (existing.exists) {
      await userRef.set(baseData, {
        merge: true,
      });

      console.log("Existing user document updated.");
    } else {
      await userRef.set({
        ...baseData,

        createdAt: FieldValue.serverTimestamp(),
      });

      console.log("User document created.");
    }

    console.log("");
    console.log("SUPERADMIN successfully created.");

    console.log("");
    console.log(`Email: ${email}`);

    console.log(`UID: ${user.uid}`);

    console.log("");
  } catch (error) {
    console.error("Unable to create SUPERADMIN:");

    console.error(error);

    process.exit(1);
  }
}

await bootstrap();

process.exit(0);
