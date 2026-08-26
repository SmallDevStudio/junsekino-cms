import { ADMIN_STATUS_META } from "@/constants/admin-ui";
import { cn } from "@/utils/cn";

const TONE_STYLES = {
  draft: {
    background: "var(--status-draft-bg)",
    border: "var(--status-draft-border)",
    color: "var(--status-draft-text)",
  },

  review: {
    background: "var(--status-review-bg)",
    border: "var(--status-review-border)",
    color: "var(--status-review-text)",
  },

  scheduled: {
    background: "var(--status-scheduled-bg)",
    border: "var(--status-scheduled-border)",
    color: "var(--status-scheduled-text)",
  },

  published: {
    background: "var(--status-published-bg)",
    border: "var(--status-published-border)",
    color: "var(--status-published-text)",
  },

  unpublished: {
    background: "var(--status-unpublished-bg)",
    border: "var(--status-unpublished-border)",
    color: "var(--status-unpublished-text)",
  },

  archived: {
    background: "var(--status-archived-bg)",
    border: "var(--status-archived-border)",
    color: "var(--status-archived-text)",
  },

  danger: {
    background: "var(--status-danger-bg)",
    border: "var(--status-danger-border)",
    color: "var(--status-danger-text)",
  },

  info: {
    background: "var(--status-info-bg)",
    border: "var(--status-info-border)",
    color: "var(--status-info-text)",
  },
};

function normalizeStatus(status) {
  if (typeof status !== "string") {
    return "";
  }

  return status.trim().toLowerCase();
}

function createFallbackLabel(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function StatusBadge({
  status,
  label,
  className,
  size = "default",
}) {
  const normalizedStatus = normalizeStatus(status);

  const metadata = ADMIN_STATUS_META[normalizedStatus] || {
    label: createFallbackLabel(normalizedStatus),
    tone: "draft",
  };

  const tone = TONE_STYLES[metadata.tone] || TONE_STYLES.draft;

  return (
    <span
      title={label || metadata.label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        "rounded-full border",
        "font-semibold uppercase",
        "whitespace-nowrap",

        size === "small"
          ? "px-2 py-0.5 text-[9px] tracking-[0.07em]"
          : "px-2.5 py-1 text-[10px] tracking-[0.08em]",

        className,
      )}
      style={{
        backgroundColor: tone.background,
        borderColor: tone.border,
        color: tone.color,
      }}
    >
      {label || metadata.label}
    </span>
  );
}
