export const LEGAL_DOCUMENT_TYPE = {
  PRIVACY: "privacy",
  COOKIES: "cookies",
  TERMS: "terms",
};

export const LEGAL_DOCUMENT_TYPES = Object.values(LEGAL_DOCUMENT_TYPE);

export const LEGAL_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const LEGAL_STATUSES = Object.values(LEGAL_STATUS);

export const CONSENT_CATEGORY = {
  NECESSARY: "necessary",
  ANALYTICS: "analytics",
  FUNCTIONAL: "functional",
  MARKETING: "marketing",
};

export const CONSENT_CATEGORIES = Object.values(CONSENT_CATEGORY);

export const CONSENT_COOKIE_NAME = "jsk_consent";

export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export const DEFAULT_COOKIE_CATEGORIES = {
  necessary: {
    required: true,

    enabledByDefault: true,

    title: {
      th: "คุกกี้ที่จำเป็น",
      en: "Necessary Cookies",
    },

    description: {
      th: "คุกกี้ประเภทนี้จำเป็นต่อการทำงานพื้นฐานและความปลอดภัยของเว็บไซต์ และไม่สามารถปิดการใช้งานผ่านระบบตั้งค่าคุกกี้ของเว็บไซต์ได้",

      en: "These cookies are required for essential website functionality and security and cannot be disabled through the website cookie preference controls.",
    },
  },

  analytics: {
    required: false,

    enabledByDefault: false,

    title: {
      th: "คุกกี้เพื่อการวิเคราะห์",
      en: "Analytics Cookies",
    },

    description: {
      th: "ช่วยให้เราเข้าใจการใช้งานเว็บไซต์ เช่น จำนวนผู้เข้าชม หน้าที่ได้รับความนิยม และประสิทธิภาพของเว็บไซต์ เพื่อใช้ปรับปรุงบริการ",

      en: "These cookies help us understand website usage, such as visitor numbers, popular pages and website performance, so that we can improve our services.",
    },
  },

  functional: {
    required: false,

    enabledByDefault: false,

    title: {
      th: "คุกกี้ด้านการทำงาน",
      en: "Functional Cookies",
    },

    description: {
      th: "ใช้เพื่อจดจำการตั้งค่าและตัวเลือกของผู้ใช้งาน เพื่อมอบประสบการณ์ที่เหมาะสมยิ่งขึ้น",

      en: "These cookies remember your settings and preferences to provide a more convenient and personalized experience.",
    },
  },

  marketing: {
    required: false,

    enabledByDefault: false,

    title: {
      th: "คุกกี้เพื่อการตลาด",
      en: "Marketing Cookies",
    },

    description: {
      th: "ใช้เพื่อวัดผลหรือปรับเนื้อหาและการประชาสัมพันธ์ให้เหมาะสมกับความสนใจ โดยอาจเกี่ยวข้องกับบริการของบุคคลที่สาม",

      en: "These cookies may be used to measure or personalize content and promotional activities and may involve third-party services.",
    },
  },
};
