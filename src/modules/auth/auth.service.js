import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase/admin";

import { AUTH_SESSION } from "@/constants/auth";

import { USER_STATUS } from "@/constants/roles";

export async function getUserByUid(uid) {
  if (!uid) {
    return null;
  }

  const userRef = adminDb.collection("users").doc(uid);

  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    return null;
  }

  return {
    id: userSnapshot.id,
    ...userSnapshot.data(),
  };
}

export async function validatePlatformUser(uid) {
  const user = await getUserByUid(uid);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new Error("USER_INACTIVE");
  }

  return user;
}

export async function createPlatformSession(idToken) {
  const decodedToken = await adminAuth.verifyIdToken(idToken, true);

  const nowInSeconds = Math.floor(Date.now() / 1000);

  const authTime = decodedToken.auth_time || 0;

  const loginAge = nowInSeconds - authTime;

  if (loginAge > AUTH_SESSION.RECENT_LOGIN_MAX_AGE) {
    throw new Error("RECENT_LOGIN_REQUIRED");
  }

  const user = await validatePlatformUser(decodedToken.uid);

  const expiresInMilliseconds = AUTH_SESSION.EXPIRES_IN * 1000;

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: expiresInMilliseconds,
  });

  return {
    sessionCookie,
    user,
  };
}

export async function verifyPlatformSession(sessionCookie) {
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true,
    );

    const user = await validatePlatformUser(decodedToken.uid);

    return {
      uid: decodedToken.uid,

      email: decodedToken.email || user.email || null,

      displayName: user.displayName || null,

      userType: user.userType || null,

      status: user.status,

      isSuperAdmin: user.isSuperAdmin === true,

      defaultCompanyId: user.defaultCompanyId || null,

      firebase: {
        emailVerified: decodedToken.email_verified === true,

        authTime: decodedToken.auth_time || null,
      },
    };
  } catch (error) {
    console.error("Verify platform session error:", error);

    return null;
  }
}
