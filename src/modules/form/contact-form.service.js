import "server-only";

import { getFormBySlug } from "./form.repository";

import { createForm, publishForm, updateForm } from "./form.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

export const CONTACT_FORM_SLUG = "contact";

const PRIVACY_CONSENT_ID = "privacyConsent";

const TERMS_ACKNOWLEDGEMENT_ID = "termsAcknowledgement";

/*
 * =========================================================
 * CONSENT FIELDS
 * =========================================================
 */

function createPrivacyConsentField(sortOrder = 4) {
  return {
    id: PRIVACY_CONSENT_ID,

    type: "consent",

    label: {
      en: "I have read and acknowledged the Privacy Notice and consent to the processing of my information for the purpose of handling this request.",

      th: "ข้าพเจ้าได้อ่านและรับทราบประกาศความเป็นส่วนตัว และยินยอมให้บริษัทประมวลผลข้อมูลเพื่อดำเนินการตามคำขอนี้",
    },

    placeholder: {
      en: "",

      th: "",
    },

    helpText: {
      en: "",

      th: "",
    },

    required: true,

    sortOrder,

    options: [],

    validation: {
      allowedMimeTypes: [],
    },

    consent: {
      legalDocument: "privacy",

      required: true,
    },

    width: "full",

    enabled: true,
  };
}

function createTermsAcknowledgementField(sortOrder = 5) {
  return {
    id: TERMS_ACKNOWLEDGEMENT_ID,

    type: "consent",

    label: {
      en: "I confirm that I am authorized to submit the information, images, documents, drawings, and attachments provided, and acknowledge the Website Terms of Use.",

      th: "ข้าพเจ้ายืนยันว่ามีสิทธิส่งข้อมูล รูปภาพ เอกสาร แบบแปลน และไฟล์แนบดังกล่าว และรับทราบข้อกำหนดการใช้งานเว็บไซต์",
    },

    placeholder: {
      en: "",

      th: "",
    },

    helpText: {
      en: "",

      th: "",
    },

    required: true,

    sortOrder,

    options: [],

    validation: {
      allowedMimeTypes: [],
    },

    consent: {
      legalDocument: "terms",

      required: true,
    },

    width: "full",

    enabled: true,
  };
}

/*
 * =========================================================
 * DEFAULT CONTACT FORM
 * =========================================================
 */

function createDefaultContactFormInput() {
  return {
    name: {
      en: "Contact Us",

      th: "ติดต่อเรา",
    },

    slug: CONTACT_FORM_SLUG,

    type: "contact",

    description: {
      en: "Contact form for website enquiries.",

      th: "แบบฟอร์มสำหรับติดต่อสอบถามผ่านเว็บไซต์",
    },

    fields: [
      {
        id: "name",

        type: "text",

        label: {
          en: "Name & Surname",

          th: "ชื่อ - นามสกุล",
        },

        placeholder: {
          en: "Name & Surname",

          th: "ชื่อ - นามสกุล",
        },

        helpText: {
          en: "",

          th: "",
        },

        required: true,

        sortOrder: 0,

        options: [],

        validation: {
          minLength: 2,

          maxLength: 200,

          allowedMimeTypes: [],
        },

        width: "full",

        enabled: true,
      },

      {
        id: "email",

        type: "email",

        label: {
          en: "Email",

          th: "อีเมล",
        },

        placeholder: {
          en: "Email",

          th: "อีเมล",
        },

        helpText: {
          en: "",

          th: "",
        },

        required: true,

        sortOrder: 1,

        options: [],

        validation: {
          maxLength: 320,

          allowedMimeTypes: [],
        },

        width: "full",

        enabled: true,
      },

      {
        id: "tel",

        type: "phone",

        label: {
          en: "Tel",

          th: "หมายเลขโทรศัพท์",
        },

        placeholder: {
          en: "Tel",

          th: "หมายเลขโทรศัพท์",
        },

        helpText: {
          en: "",

          th: "",
        },

        required: false,

        sortOrder: 2,

        options: [],

        validation: {
          maxLength: 100,

          allowedMimeTypes: [],
        },

        width: "full",

        enabled: true,
      },

      {
        id: "information",

        type: "textarea",

        label: {
          en: "Information",

          th: "ข้อมูลที่ต้องการสอบถาม",
        },

        placeholder: {
          en: "Information",

          th: "ข้อมูลที่ต้องการสอบถาม",
        },

        helpText: {
          en: "",

          th: "",
        },

        required: true,

        sortOrder: 3,

        options: [],

        validation: {
          minLength: 2,

          maxLength: 5000,

          allowedMimeTypes: [],
        },

        width: "full",

        enabled: true,
      },

      createPrivacyConsentField(4),

      createTermsAcknowledgementField(5),
    ],

    settings: {
      submitLabel: {
        en: "Submit",

        th: "ส่งข้อมูล",
      },

      successTitle: {
        en: "Thank you",

        th: "ขอบคุณ",
      },

      successMessage: {
        en: "Thank you. We have received your message.",

        th: "ขอบคุณสำหรับข้อมูล เราได้รับข้อความของคุณเรียบร้อยแล้ว",
      },

      allowMultipleSubmissions: true,

      requirePrivacyConsent: true,

      notifyEmployees: true,

      sendEmailNotification: false,

      notificationEmails: [],
    },

    status: "draft",
  };
}

/*
 * =========================================================
 * GET EXISTING
 * =========================================================
 */

async function getExistingContactForm(companyId) {
  const form = await getFormBySlug({
    companyId,

    slug: CONTACT_FORM_SLUG,
  });

  if (!form || form.deletedAt) {
    return null;
  }

  return serializeFirestoreDocument(form);
}

/*
 * =========================================================
 * REPAIR
 * =========================================================
 */

function getNextSortOrder(fields) {
  const highest = fields.reduce((result, field) => {
    const sortOrder = Number(field?.sortOrder);

    if (!Number.isFinite(sortOrder)) {
      return result;
    }

    return Math.max(result, sortOrder);
  }, -1);

  return highest + 1;
}

function repairConsentField(field) {
  const legalDocument = field?.consent?.legalDocument;

  if (
    field?.type !== "consent" ||
    !["privacy", "terms"].includes(legalDocument)
  ) {
    return {
      field,

      changed: false,
    };
  }

  const changed =
    field.required !== true ||
    field.enabled === false ||
    field.consent?.required !== true;

  if (!changed) {
    return {
      field,

      changed: false,
    };
  }

  return {
    field: {
      ...field,

      required: true,

      enabled: true,

      consent: {
        ...field.consent,

        legalDocument,

        required: true,
      },
    },

    changed: true,
  };
}

function repairContactForm(form) {
  const existingFields = Array.isArray(form?.fields) ? form.fields : [];

  let changed = false;

  const fields = existingFields.map((field) => {
    const repaired = repairConsentField(field);

    if (repaired.changed) {
      changed = true;
    }

    return repaired.field;
  });

  const hasPrivacyConsent = fields.some(
    (field) =>
      field?.type === "consent" &&
      field?.consent?.legalDocument === "privacy" &&
      field?.enabled !== false,
  );

  const hasTermsAcknowledgement = fields.some(
    (field) =>
      field?.type === "consent" &&
      field?.consent?.legalDocument === "terms" &&
      field?.enabled !== false,
  );

  let nextSortOrder = getNextSortOrder(fields);

  if (!hasPrivacyConsent) {
    fields.push(createPrivacyConsentField(nextSortOrder));

    nextSortOrder += 1;

    changed = true;
  }

  if (!hasTermsAcknowledgement) {
    fields.push(createTermsAcknowledgementField(nextSortOrder));

    changed = true;
  }

  if (form?.settings?.requirePrivacyConsent !== true) {
    changed = true;
  }

  return {
    changed,

    fields,

    settings: {
      requirePrivacyConsent: true,
    },
  };
}

/*
 * =========================================================
 * ENSURE CONTACT FORM
 * =========================================================
 */

export async function ensureContactForm({
  companyId,

  currentUser,

  publish = true,
}) {
  let form = await getExistingContactForm(companyId);

  /*
   * Existing forms are repaired without
   * replacing or removing user-defined fields.
   */
  if (form) {
    const repair = repairContactForm(form);

    if (repair.changed) {
      form = await updateForm({
        companyId,

        formId: form.id,

        input: {
          fields: repair.fields,

          settings: repair.settings,
        },

        currentUser,
      });
    }

    return {
      form,

      created: false,

      repaired: repair.changed,
    };
  }

  /*
   * Create the default form through the
   * existing Form Service so validation,
   * normalization and audit logging remain
   * centralized.
   */
  form = await createForm({
    companyId,

    input: createDefaultContactFormInput(),

    currentUser,
  });

  if (publish && form.status !== "published") {
    form = await publishForm({
      companyId,

      formId: form.id,

      currentUser,
    });
  }

  return {
    form,

    created: true,

    repaired: false,
  };
}

/*
 * =========================================================
 * GET CONTACT FORM
 * =========================================================
 */

export async function getContactForm({ companyId }) {
  return getExistingContactForm(companyId);
}
