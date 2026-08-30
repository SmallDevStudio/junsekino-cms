import "server-only";

import crypto from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const PRIVATE_COLLECTION = "privateSettings";

const EMAIL_DOCUMENT = "emailCredentials";

/*
 * =========================================================
 * KEY
 * =========================================================
 */

function getEncryptionKey() {
  const raw = process.env.EMAIL_CREDENTIALS_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("EMAIL_ENCRYPTION_KEY_NOT_CONFIGURED");
  }

  const key = Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new Error("EMAIL_ENCRYPTION_KEY_INVALID");
  }

  return key;
}

/*
 * =========================================================
 * REF
 * =========================================================
 */

function getCredentialRef(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection(PRIVATE_COLLECTION)
    .doc(EMAIL_DOCUMENT);
}

/*
 * =========================================================
 * ENCRYPT
 * =========================================================
 */

function encryptSecret(value) {
  const key = getEncryptionKey();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),

    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    version: 1,

    algorithm: "aes-256-gcm",

    iv: iv.toString("base64"),

    authTag: authTag.toString("base64"),

    ciphertext: encrypted.toString("base64"),
  };
}

/*
 * =========================================================
 * DECRYPT
 * =========================================================
 */

function decryptSecret(payload) {
  if (!payload?.ciphertext || !payload?.iv || !payload?.authTag) {
    return null;
  }

  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",

    key,

    Buffer.from(payload.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),

    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/*
 * =========================================================
 * STATUS
 * =========================================================
 */

export async function getSmtpPasswordStatus({ companyId }) {
  const snapshot = await getCredentialRef(companyId).get();

  if (!snapshot.exists) {
    return {
      configured: false,
    };
  }

  const data = snapshot.data();

  return {
    configured: Boolean(data?.smtpPassword?.ciphertext),

    updatedAt: data?.updatedAt || null,
  };
}

/*
 * =========================================================
 * SAVE
 * =========================================================
 */

export async function saveSmtpPassword({ companyId, password, userId }) {
  if (typeof password !== "string" || !password) {
    throw new Error("SMTP_PASSWORD_REQUIRED");
  }

  if (password.length > 4096) {
    throw new Error("SMTP_PASSWORD_TOO_LONG");
  }

  const encrypted = encryptSecret(password);

  await getCredentialRef(companyId).set(
    {
      smtpPassword: encrypted,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    },
    {
      merge: true,
    },
  );

  return {
    configured: true,
  };
}

/*
 * =========================================================
 * GET PASSWORD — SERVER ONLY
 * =========================================================
 */

export async function getSmtpPassword({ companyId }) {
  const snapshot = await getCredentialRef(companyId).get();

  if (!snapshot.exists) {
    return null;
  }

  return decryptSecret(snapshot.data()?.smtpPassword);
}

/*
 * =========================================================
 * DELETE
 * =========================================================
 */

export async function clearSmtpPassword({ companyId, userId }) {
  await getCredentialRef(companyId).set(
    {
      smtpPassword: FieldValue.delete(),

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    },
    {
      merge: true,
    },
  );

  return {
    configured: false,
  };
}
