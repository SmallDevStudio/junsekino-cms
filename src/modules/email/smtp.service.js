import "server-only";

import nodemailer from "nodemailer";

import { SMTP_SECURITY } from "@/modules/settings/communication-settings.schema";

import { getSmtpPassword } from "./email-credential.service";

/*
 * =========================================================
 * TRANSPORT
 * =========================================================
 */

export async function createCompanySmtpTransport({ companyId, smtp }) {
  if (!smtp?.host) {
    throw new Error("SMTP_HOST_REQUIRED");
  }

  if (!smtp?.port) {
    throw new Error("SMTP_PORT_REQUIRED");
  }

  const password = await getSmtpPassword({
    companyId,
  });

  const hasAuth = Boolean(smtp.username && password);

  const secure = smtp.security === SMTP_SECURITY.TLS;

  const requireTLS = smtp.security === SMTP_SECURITY.STARTTLS;

  return nodemailer.createTransport({
    host: smtp.host,

    port: Number(smtp.port),

    secure,

    requireTLS,

    auth: hasAuth
      ? {
          user: smtp.username,

          pass: password,
        }
      : undefined,

    connectionTimeout: 10000,

    greetingTimeout: 10000,

    socketTimeout: 15000,
  });
}

/*
 * =========================================================
 * VERIFY
 * =========================================================
 */

export async function verifyCompanySmtp({ companyId, smtp }) {
  const transport = await createCompanySmtpTransport({
    companyId,
    smtp,
  });

  await transport.verify();

  return {
    connected: true,
  };
}
