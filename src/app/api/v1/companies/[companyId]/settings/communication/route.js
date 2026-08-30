import { z } from "zod";

/*
 * =========================================================
 * COMMON
 * =========================================================
 */

const optionalEmailSchema = z.union([z.string().trim().email(), z.literal("")]);

/*
 * =========================================================
 * EMAIL
 * =========================================================
 */

const emailSettingsSchema = z.object({
  enabled: z.boolean().default(false),

  senderName: z.string().trim().max(150).default(""),

  senderEmail: optionalEmailSchema.default(""),

  replyTo: optionalEmailSchema.default(""),

  recipients: z.array(z.string().trim().email()).max(50).default([]),
});

/*
 * =========================================================
 * NOTIFICATION EVENT
 * =========================================================
 */

const notificationEventSchema = z.object({
  inApp: z.boolean().default(true),

  email: z.boolean().default(false),
});

/*
 * =========================================================
 * NOTIFICATIONS
 * =========================================================
 */

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
  /*
   * Reserved for future LINE integration.
   *
   * Secrets / access tokens must NOT be stored
   * directly in this settings object.
   */
  enabled: z.boolean().default(false),
});

const integrationsSchema = z.object({
  line: lineIntegrationSchema.default({
    enabled: false,
  }),
});

/*
 * =========================================================
 * COMMUNICATION SETTINGS
 * =========================================================
 */

export const communicationSettingsSchema = z.object({
  email: emailSettingsSchema.default({
    enabled: false,

    senderName: "",

    senderEmail: "",

    replyTo: "",

    recipients: [],
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
 * UPDATE / PATCH
 * =========================================================
 *
 * Do not use .deepPartial().
 *
 * The Zod version used by this project does not expose
 * deepPartial() on this schema.
 *
 * PATCH therefore declares optional fields explicitly.
 *
 * This also gives us tighter control over which nested
 * settings may be updated from the API.
 * =========================================================
 */

const updateEmailSettingsSchema = z.object({
  enabled: z.boolean().optional(),

  senderName: z.string().trim().max(150).optional(),

  senderEmail: optionalEmailSchema.optional(),

  replyTo: optionalEmailSchema.optional(),

  recipients: z.array(z.string().trim().email()).max(50).optional(),
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
