import "server-only";

import { getFormBySlug } from "./form.repository";

import { createForm, publishForm } from "./form.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

export const CONTACT_FORM_SLUG = "contact";

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
          th: "เบอร์โทรศัพท์",
        },

        placeholder: {
          en: "Tel",
          th: "เบอร์โทรศัพท์",
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

      /*
       * Privacy consent is disabled initially.
       *
       * We can enable this from Form Manager
       * once the company has published its
       * Privacy Notice.
       */
      requirePrivacyConsent: false,

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
 * ENSURE CONTACT FORM
 * =========================================================
 */

export async function ensureContactForm({
  companyId,
  currentUser,
  publish = true,
}) {
  /*
   * First reuse an existing contact form.
   *
   * This makes the operation idempotent:
   * calling bootstrap repeatedly will not
   * create duplicate forms.
   */
  let form = await getExistingContactForm(companyId);

  if (form) {
    return {
      form,

      created: false,
    };
  }

  /*
   * Create the default form through the
   * existing Form Service so audit logging,
   * normalization and validation remain
   * centralized.
   */
  form = await createForm({
    companyId,

    input: createDefaultContactFormInput(),

    currentUser,
  });

  /*
   * Contact is a system/default form.
   *
   * Publishing immediately allows the
   * public Contact page to work without
   * another setup step.
   */
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
