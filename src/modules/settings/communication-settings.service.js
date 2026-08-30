import "server-only";

import {
  communicationSettingsSchema,
  updateCommunicationSettingsSchema,
} from "./communication-settings.schema";

import {
  getCommunicationSettingsRecord,
  saveCommunicationSettingsRecord,
} from "./communication-settings.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

/*
 * =========================================================
 * DEFAULT
 * =========================================================
 */

export const DEFAULT_COMMUNICATION_SETTINGS = communicationSettingsSchema.parse(
  {},
);

/*
 * =========================================================
 * MERGE
 * =========================================================
 */

function mergeCommunicationSettings(current, input) {
  return {
    email: {
      ...current.email,
      ...input.email,

      recipients: input.email?.recipients ?? current.email.recipients,

      smtp: {
        ...current.email.smtp,
        ...input.email?.smtp,
      },
    },

    notifications: {
      ...current.notifications,
      ...input.notifications,

      events: {
        ...current.notifications.events,
        ...input.notifications?.events,

        formSubmission: {
          ...current.notifications.events.formSubmission,

          ...input.notifications?.events?.formSubmission,
        },
      },
    },

    integrations: {
      ...current.integrations,
      ...input.integrations,

      line: {
        ...current.integrations.line,
        ...input.integrations?.line,
      },
    },
  };
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getCommunicationSettings({ companyId }) {
  const record = await getCommunicationSettingsRecord({
    companyId,
  });

  if (!record) {
    return DEFAULT_COMMUNICATION_SETTINGS;
  }

  /*
   * Merge old/incomplete records into current defaults
   * before validation.
   */

  const merged = mergeCommunicationSettings(
    DEFAULT_COMMUNICATION_SETTINGS,
    record,
  );

  return communicationSettingsSchema.parse(serializeFirestoreDocument(merged));
}

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export async function updateCommunicationSettings({
  companyId,
  input,
  currentUser,
}) {
  const parsed = updateCommunicationSettingsSchema.parse(input);

  const current = await getCommunicationSettings({
    companyId,
  });

  const merged = mergeCommunicationSettings(current, parsed);

  const validated = communicationSettingsSchema.parse(merged);

  const result = await saveCommunicationSettingsRecord({
    companyId,

    data: validated,

    userId: currentUser.uid,
  });

  const before = result.before
    ? serializeFirestoreDocument(result.before)
    : null;

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "COMMUNICATION_SETTINGS_UPDATE",

    resource: "communicationSettings",

    resourceId: "communication",

    before,

    after,
  });

  return communicationSettingsSchema.parse({
    ...DEFAULT_COMMUNICATION_SETTINGS,

    ...after,

    email: {
      ...DEFAULT_COMMUNICATION_SETTINGS.email,
      ...after.email,
    },

    notifications: {
      ...DEFAULT_COMMUNICATION_SETTINGS.notifications,
      ...after.notifications,

      events: {
        ...DEFAULT_COMMUNICATION_SETTINGS.notifications.events,
        ...after.notifications?.events,
      },
    },

    integrations: {
      ...DEFAULT_COMMUNICATION_SETTINGS.integrations,
      ...after.integrations,
    },
  });
}
