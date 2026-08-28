"use client";

import {
  Check,
  Languages,
  LayoutPanelLeft,
  Settings,
  SlidersHorizontal,
  TextCursorInput,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { ADMIN_DENSITY, ADMIN_LOCALE } from "@/constants/admin-ui";

import { useAdminUiPreferences } from "@/components/admin/ui/AdminUiPreferencesProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * OPTION BUTTON
 * =========================================================
 */

function OptionButton({ selected, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 items-center justify-center",

        "rounded-lg",

        "border",

        "px-3",

        "text-[10px] font-medium",

        "transition",

        selected
          ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
          : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",
      )}
    >
      {selected && <Check size={11} strokeWidth={2} className="mr-1.5" />}

      {children}
    </button>
  );
}

/*
 * =========================================================
 * SETTING ROW
 * =========================================================
 */

function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div
      className="
        border-b
        border-[var(--admin-border)]

        px-4
        py-4

        last:border-b-0
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <span
          className="
            mt-0.5

            flex
            h-8
            w-8
            shrink-0

            items-center
            justify-center

            rounded-lg

            bg-[var(--company-primary-soft)]

            text-[var(--company-primary)]
          "
        >
          <Icon size={15} strokeWidth={1.7} />
        </span>

        <div
          className="
            min-w-0
            flex-1
          "
        >
          <div
            className="
              text-[11px]
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {title}
          </div>

          {description && (
            <div
              className="
                mt-0.5

                text-[9px]
                leading-[1.45]

                text-[var(--admin-muted)]
              "
            >
              {description}
            </div>
          )}

          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * DISPLAY SETTINGS
 * =========================================================
 */

export default function AdminDisplaySettings() {
  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);

  const {
    locale,
    setLocale,

    density,
    setDensity,

    tooltipEnabled,
    setTooltipEnabled,

    sidebarCollapsed,
    setSidebarCollapsed,
  } = useAdminUiPreferences();

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* BUTTON */}

      <button
        type="button"
        aria-label="Display settings"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="
          flex
          h-10
          w-10

          items-center
          justify-center

          rounded-xl

          text-[var(--admin-muted)]

          transition

          hover:bg-[var(--admin-hover)]

          hover:text-[var(--company-primary)]
        "
      >
        <Settings size={18} strokeWidth={1.7} />
      </button>

      {/* POPOVER */}

      {open && (
        <div
          className="
            absolute
            right-0
            top-[calc(100%+10px)]
            z-[100]

            w-[330px]

            overflow-hidden

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            shadow-[0_18px_55px_rgba(0,0,0,0.12)]
          "
        >
          {/* HEADER */}

          <div
            className="
              flex
              items-center
              justify-between

              border-b
              border-[var(--admin-border)]

              px-4
              py-3
            "
          >
            <div>
              <div
                className="
                  text-[11px]
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                Display Settings
              </div>

              <div
                className="
                  mt-0.5

                  text-[9px]

                  text-[var(--admin-muted)]
                "
              >
                Personalize your admin workspace
              </div>
            </div>

            <button
              type="button"
              aria-label="Close settings"
              onClick={() => setOpen(false)}
              className="
                flex
                h-7
                w-7

                items-center
                justify-center

                rounded-lg

                text-[var(--admin-muted-light)]

                hover:bg-[var(--admin-hover)]

                hover:text-[var(--admin-foreground)]
              "
            >
              <X size={13} strokeWidth={1.7} />
            </button>
          </div>

          {/* LANGUAGE */}

          <SettingRow
            icon={Languages}
            title="Admin Language"
            description="Changes only the administration interface."
          >
            <div
              className="
                flex
                gap-2
              "
            >
              <OptionButton
                selected={locale === ADMIN_LOCALE.EN}
                onClick={() => setLocale(ADMIN_LOCALE.EN)}
              >
                English
              </OptionButton>

              <OptionButton
                selected={locale === ADMIN_LOCALE.TH}
                onClick={() => setLocale(ADMIN_LOCALE.TH)}
              >
                ไทย
              </OptionButton>
            </div>
          </SettingRow>

          {/* DENSITY */}

          <SettingRow
            icon={SlidersHorizontal}
            title="Interface Density"
            description="Controls spacing in lists, forms and panels."
          >
            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              <OptionButton
                selected={density === ADMIN_DENSITY.COMPACT}
                onClick={() => setDensity(ADMIN_DENSITY.COMPACT)}
              >
                Compact
              </OptionButton>

              <OptionButton
                selected={density === ADMIN_DENSITY.COMFORTABLE}
                onClick={() => setDensity(ADMIN_DENSITY.COMFORTABLE)}
              >
                Comfortable
              </OptionButton>

              <OptionButton
                selected={density === ADMIN_DENSITY.SPACIOUS}
                onClick={() => setDensity(ADMIN_DENSITY.SPACIOUS)}
              >
                Spacious
              </OptionButton>
            </div>
          </SettingRow>

          {/* TOOLTIP */}

          <SettingRow
            icon={TextCursorInput}
            title="Tooltips"
            description="Show contextual help when hovering icons."
          >
            <div
              className="
                flex
                gap-2
              "
            >
              <OptionButton
                selected={tooltipEnabled}
                onClick={() => setTooltipEnabled(true)}
              >
                On
              </OptionButton>

              <OptionButton
                selected={!tooltipEnabled}
                onClick={() => setTooltipEnabled(false)}
              >
                Off
              </OptionButton>
            </div>
          </SettingRow>

          {/* SIDEBAR */}

          <SettingRow
            icon={LayoutPanelLeft}
            title="Sidebar"
            description="Choose the default desktop sidebar state."
          >
            <div
              className="
                flex
                gap-2
              "
            >
              <OptionButton
                selected={!sidebarCollapsed}
                onClick={() => setSidebarCollapsed(false)}
              >
                Expanded
              </OptionButton>

              <OptionButton
                selected={sidebarCollapsed}
                onClick={() => setSidebarCollapsed(true)}
              >
                Collapsed
              </OptionButton>
            </div>
          </SettingRow>
        </div>
      )}
    </div>
  );
}
