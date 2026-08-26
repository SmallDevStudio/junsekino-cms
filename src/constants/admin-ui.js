export const ADMIN_ACTION_DISPLAY = {
  ICON_LABEL: "icon-label",
  ICON: "icon",
  LABEL: "label",
};

export const ADMIN_DENSITY = {
  COMFORTABLE: "comfortable",
  COMPACT: "compact",
  SPACIOUS: "spacious",
};

export const ADMIN_UI_DEFAULTS = {
  actionDisplay: ADMIN_ACTION_DISPLAY.ICON_LABEL,

  tooltipEnabled: true,

  tooltipDelay: 300,

  density: ADMIN_DENSITY.COMFORTABLE,
};

export const ADMIN_ACTION_DISPLAY_OPTIONS = [
  {
    value: ADMIN_ACTION_DISPLAY.ICON_LABEL,
    label: "Icon + Text",
  },
  {
    value: ADMIN_ACTION_DISPLAY.ICON,
    label: "Icon only",
  },
  {
    value: ADMIN_ACTION_DISPLAY.LABEL,
    label: "Text only",
  },
];

export const ADMIN_DENSITY_OPTIONS = [
  {
    value: ADMIN_DENSITY.COMPACT,
    label: "Compact",
  },
  {
    value: ADMIN_DENSITY.COMFORTABLE,
    label: "Comfortable",
  },
  {
    value: ADMIN_DENSITY.SPACIOUS,
    label: "Spacious",
  },
];

export const ADMIN_STATUS_META = {
  draft: {
    label: "Draft",
    tone: "draft",
  },

  review: {
    label: "Review",
    tone: "review",
  },

  scheduled: {
    label: "Scheduled",
    tone: "scheduled",
  },

  published: {
    label: "Published",
    tone: "published",
  },

  public: {
    label: "Public",
    tone: "published",
  },

  active: {
    label: "Active",
    tone: "published",
  },

  unpublished: {
    label: "Unpublished",
    tone: "unpublished",
  },

  unpublic: {
    label: "Unpublished",
    tone: "unpublished",
  },

  inactive: {
    label: "Inactive",
    tone: "unpublished",
  },

  archived: {
    label: "Archived",
    tone: "archived",
  },

  deleted: {
    label: "Deleted",
    tone: "danger",
  },

  error: {
    label: "Error",
    tone: "danger",
  },
};

export const ADMIN_ACTION_TONES = {
  neutral: {
    className:
      "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-foreground)] hover:bg-[var(--admin-hover)]",
  },

  primary: {
    className:
      "border-[var(--company-primary)] bg-[var(--company-primary)] text-[var(--company-primary-foreground)] hover:border-[var(--company-primary-hover)] hover:bg-[var(--company-primary-hover)] hover:text-[var(--company-primary-hover-foreground)]",
  },

  edit: {
    className:
      "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100",
  },

  success: {
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100",
  },

  warning: {
    className:
      "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100",
  },

  danger: {
    className:
      "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
  },

  info: {
    className:
      "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100",
  },
};
