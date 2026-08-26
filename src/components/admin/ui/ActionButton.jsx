"use client";

import { ADMIN_ACTION_DISPLAY, ADMIN_ACTION_TONES } from "@/constants/admin-ui";

import { cn } from "@/utils/cn";

import AdminTooltip from "./AdminTooltip";

export default function ActionButton({
  icon: Icon,

  label,

  display = ADMIN_ACTION_DISPLAY.ICON_LABEL,

  tone = "neutral",

  tooltip = true,

  tooltipDelay = 300,

  tooltipPlacement = "top",

  type = "button",

  disabled = false,

  loading = false,

  onClick,

  className,

  size = "default",

  ...props
}) {
  const showIcon = display !== ADMIN_ACTION_DISPLAY.LABEL;

  const showLabel = display !== ADMIN_ACTION_DISPLAY.ICON;

  const toneConfig = ADMIN_ACTION_TONES[tone] || ADMIN_ACTION_TONES.neutral;

  const iconOnly = display === ADMIN_ACTION_DISPLAY.ICON;

  const accessibleLabel = label || "Action";

  const button = (
    <button
      {...props}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={accessibleLabel}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",

        "border font-medium",

        "transition-colors duration-150",

        "focus-visible:outline-none",

        "focus-visible:ring-2",

        "focus-visible:ring-[var(--company-primary)]",

        "focus-visible:ring-offset-2",

        "disabled:pointer-events-none",

        "disabled:cursor-not-allowed",

        "disabled:opacity-50",

        size === "small" ? "h-8 text-xs" : "h-10 text-sm",

        iconOnly
          ? size === "small"
            ? "w-8 rounded-lg"
            : "w-10 rounded-xl"
          : size === "small"
            ? "gap-1.5 rounded-lg px-3"
            : "gap-2 rounded-xl px-4",

        toneConfig.className,

        className,
      )}
    >
      {showIcon && Icon ? (
        <Icon
          size={size === "small" ? 14 : 16}
          aria-hidden="true"
          className={cn(loading && "animate-spin")}
        />
      ) : null}

      {showLabel ? <span>{label}</span> : null}
    </button>
  );

  return (
    <AdminTooltip
      content={accessibleLabel}
      enabled={tooltip && iconOnly}
      delay={tooltipDelay}
      placement={tooltipPlacement}
    >
      {button}
    </AdminTooltip>
  );
}
