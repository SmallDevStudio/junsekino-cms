import { z } from "zod";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

export const EMAIL_PROVIDERS = {
  RESEND: "resend",
  SMTP: "smtp",
};

export const SMTP_SECURITY = {
  NONE: "none",
  STARTTLS: "starttls",
  TLS: "tls",
};

/*
 * =========================================================
 * COMMON
 * =========================================================
 */

const optionalEmailSchema = z.union([z.string().trim().email(), z.literal("")]);

/*
 * =========================================================
 * SMTP
 * =========================================================
 */

const smtpSettingsSchema = z.object({
  host: z.string().trim().max(255).default(""),

  port: z.number().int().min(1).max(65535).default(587),

  security: z
    .enum([SMTP_SECURITY.NONE, SMTP_SECURITY.STARTTLS, SMTP_SECURITY.TLS])
    .default(SMTP_SECURITY.STARTTLS),

  username: z.string().trim().max(320).default(""),
});

/*
 * =========================================================
 * EMAIL
 * =========================================================
 */

const emailSettingsSchema = z.object({
  enabled: z.boolean().default(false),

  provider: z
    .enum([EMAIL_PROVIDERS.RESEND, EMAIL_PROVIDERS.SMTP])
    .default(EMAIL_PROVIDERS.RESEND),

  senderName: z.string().trim().max(150).default(""),

  senderEmail: optionalEmailSchema.default(""),

  replyTo: optionalEmailSchema.default(""),

  recipients: z.array(z.string().trim().email()).max(50).default([]),

  smtp: smtpSettingsSchema.default({
    host: "",
    port: 587,
    security: SMTP_SECURITY.STARTTLS,
    username: "",
  }),
});

/*
 * =========================================================
 * NOTIFICATIONS
 * =========================================================
 */

const notificationEventSchema = z.object({
  inApp: z.boolean().default(true),

  email: z.boolean().default(false),
});

const notificationEventsSchema = z.object({
  formSubmission: notificationEventSchema.default({
    inApp: true,
    email: false,
  }),
});

const notificationSettingsSchema = z.object({
  inApp: z.boolean().default(true),

  email: z.boolean().default(false),

  events: notificationEventsSchema.default({
    formSubmission: {
      inApp: true,
      email: false,
    },
  }),
});

/*
 * =========================================================
 * INTEGRATIONS
 * =========================================================
 */

const lineIntegrationSchema = z.object({
  enabled: z.boolean().default(false),
});

const integrationsSchema = z.object({
  line: lineIntegrationSchema.default({
    enabled: false,
  }),
});

/*
 * =========================================================
 * FULL SETTINGS
 * =========================================================
 */

export const communicationSettingsSchema = z.object({
  email: emailSettingsSchema.default({
    enabled: false,

    provider: EMAIL_PROVIDERS.RESEND,

    senderName: "",

    senderEmail: "",

    replyTo: "",

    recipients: [],

    smtp: {
      host: "",

      port: 587,

      security: SMTP_SECURITY.STARTTLS,

      username: "",
    },
  }),

  notifications: notificationSettingsSchema.default({
    inApp: true,

    email: false,

    events: {
      formSubmission: {
        inApp: true,

        email: false,
      },
    },
  }),

  integrations: integrationsSchema.default({
    line: {
      enabled: false,
    },
  }),
});

/*
 * =========================================================
 * PATCH
 * =========================================================
 */

const updateSmtpSettingsSchema = z.object({
  host: z.string().trim().max(255).optional(),

  port: z.number().int().min(1).max(65535).optional(),

  security: z
    .enum([SMTP_SECURITY.NONE, SMTP_SECURITY.STARTTLS, SMTP_SECURITY.TLS])
    .optional(),

  username: z.string().trim().max(320).optional(),
});

const updateEmailSettingsSchema = z.object({
  enabled: z.boolean().optional(),

  provider: z.enum([EMAIL_PROVIDERS.RESEND, EMAIL_PROVIDERS.SMTP]).optional(),

  senderName: z.string().trim().max(150).optional(),

  senderEmail: optionalEmailSchema.optional(),

  replyTo: optionalEmailSchema.optional(),

  recipients: z.array(z.string().trim().email()).max(50).optional(),

  smtp: updateSmtpSettingsSchema.optional(),
});

const updateNotificationEventSchema = z.object({
  inApp: z.boolean().optional(),

  email: z.boolean().optional(),
});

const updateNotificationEventsSchema = z.object({
  formSubmission: updateNotificationEventSchema.optional(),
});

const updateNotificationSettingsSchema = z.object({
  inApp: z.boolean().optional(),

  email: z.boolean().optional(),

  events: updateNotificationEventsSchema.optional(),
});

const updateLineIntegrationSchema = z.object({
  enabled: z.boolean().optional(),
});

const updateIntegrationsSchema = z.object({
  line: updateLineIntegrationSchema.optional(),
});

export const updateCommunicationSettingsSchema = z.object({
  email: updateEmailSettingsSchema.optional(),

  notifications: updateNotificationSettingsSchema.optional(),

  integrations: updateIntegrationsSchema.optional(),
});
