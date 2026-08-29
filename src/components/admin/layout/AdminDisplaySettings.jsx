"use client";

import {
  Check,
  Languages,
  LayoutPanelLeft,
  Settings,
  SlidersHorizontal,
  TextCursorInput,
  Type,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import {
  ADMIN_DENSITY,
  ADMIN_FONT_SIZE,
  ADMIN_LOCALE,
} from "@/constants/admin-ui";

import { useAdminUiPreferences } from "@/components/admin/ui/AdminUiPreferencesProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

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
        "flex min-h-8 items-center justify-center",

        "rounded-lg",

        "border",

        "px-3 py-1.5",

        "admin-text-10 font-medium",

        "transition",

        selected
          ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
          : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",
      )}
    >
      {selected && (
        <Check size={11} strokeWidth={2} className="mr-1.5 shrink-0" />
      )}

      <span className="whitespace-nowrap">{children}</span>
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
              admin-text-11
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

                admin-text-9
                leading-[1.55]

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

    fontSize,
    setFontSize,

    tooltipEnabled,
    setTooltipEnabled,

    sidebarCollapsed,
    setSidebarCollapsed,
  } = useAdminUiPreferences();

  const { t } = useAdminTranslation();

  /*
   * =======================================================
   * CLOSE POPOVER
   * =======================================================
   */

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

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div ref={containerRef} className="relative">
      {/* =====================================
          SETTINGS BUTTON
      ===================================== */}

      <button
        type="button"
        aria-label={t("displaySettings.title")}
        aria-expanded={open}
        title={t("displaySettings.title")}
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

      {/* =====================================
          POPOVER
      ===================================== */}

      {open && (
        <div
          className="
            absolute
            right-0
            top-[calc(100%+10px)]
            z-[100]

            w-[350px]
            max-w-[calc(100vw-24px)]

            overflow-hidden

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            shadow-[0_18px_55px_rgba(0,0,0,0.12)]
          "
        >
          {/* =================================
              HEADER
          ================================= */}

          <div
            className="
              flex
              items-center
              justify-between

              gap-3

              border-b
              border-[var(--admin-border)]

              px-4
              py-3
            "
          >
            <div className="min-w-0">
              <div
                className="
                  admin-text-11
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("displaySettings.title")}
              </div>

              <div
                className="
                  mt-0.5

                  admin-text-9
                  leading-[1.5]

                  text-[var(--admin-muted)]
                "
              >
                {t("displaySettings.description")}
              </div>
            </div>

            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setOpen(false)}
              className="
                flex
                h-7
                w-7
                shrink-0

                items-center
                justify-center

                rounded-lg

                text-[var(--admin-muted-light)]

                transition

                hover:bg-[var(--admin-hover)]

                hover:text-[var(--admin-foreground)]
              "
            >
              <X size={13} strokeWidth={1.7} />
            </button>
          </div>

          {/* =================================
              LANGUAGE
          ================================= */}

          <SettingRow
            icon={Languages}
            title={t("preferences.language.title")}
            description={t("displaySettings.language.description")}
          >
            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              <OptionButton
                selected={locale === ADMIN_LOCALE.EN}
                onClick={() => setLocale(ADMIN_LOCALE.EN)}
              >
                {t("preferences.language.english")}
              </OptionButton>

              <OptionButton
                selected={locale === ADMIN_LOCALE.TH}
                onClick={() => setLocale(ADMIN_LOCALE.TH)}
              >
                {t("preferences.language.thai")}
              </OptionButton>
            </div>
          </SettingRow>

          {/* =================================
              FONT SIZE
          ================================= */}

          <SettingRow
            icon={Type}
            title={t("displaySettings.fontSize.title")}
            description={t("displaySettings.fontSize.description")}
          >
            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              <OptionButton
                selected={fontSize === ADMIN_FONT_SIZE.SMALL}
                onClick={() => setFontSize(ADMIN_FONT_SIZE.SMALL)}
              >
                {t("displaySettings.fontSize.small")}
              </OptionButton>

              <OptionButton
                selected={fontSize === ADMIN_FONT_SIZE.MEDIUM}
                onClick={() => setFontSize(ADMIN_FONT_SIZE.MEDIUM)}
              >
                {t("displaySettings.fontSize.medium")}
              </OptionButton>

              <OptionButton
                selected={fontSize === ADMIN_FONT_SIZE.LARGE}
                onClick={() => setFontSize(ADMIN_FONT_SIZE.LARGE)}
              >
                {t("displaySettings.fontSize.large")}
              </OptionButton>
            </div>
          </SettingRow>

          {/* =================================
              DENSITY
          ================================= */}

          <SettingRow
            icon={SlidersHorizontal}
            title={t("preferences.density.title")}
            description={t("displaySettings.density.description")}
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
                {t("preferences.density.compact")}
              </OptionButton>

              <OptionButton
                selected={density === ADMIN_DENSITY.COMFORTABLE}
                onClick={() => setDensity(ADMIN_DENSITY.COMFORTABLE)}
              >
                {t("preferences.density.comfortable")}
              </OptionButton>

              <OptionButton
                selected={density === ADMIN_DENSITY.SPACIOUS}
                onClick={() => setDensity(ADMIN_DENSITY.SPACIOUS)}
              >
                {t("preferences.density.spacious")}
              </OptionButton>
            </div>
          </SettingRow>

          {/* =================================
              TOOLTIP
          ================================= */}

          <SettingRow
            icon={TextCursorInput}
            title={t("preferences.tooltip.title")}
            description={t("preferences.tooltip.description")}
          >
            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              <OptionButton
                selected={tooltipEnabled}
                onClick={() => setTooltipEnabled(true)}
              >
                {t("displaySettings.on")}
              </OptionButton>

              <OptionButton
                selected={!tooltipEnabled}
                onClick={() => setTooltipEnabled(false)}
              >
                {t("displaySettings.off")}
              </OptionButton>
            </div>
          </SettingRow>

          {/* =================================
              SIDEBAR
          ================================= */}

          <SettingRow
            icon={LayoutPanelLeft}
            title={t("displaySettings.sidebar.title")}
            description={t("displaySettings.sidebar.description")}
          >
            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              <OptionButton
                selected={!sidebarCollapsed}
                onClick={() => setSidebarCollapsed(false)}
              >
                {t("displaySettings.sidebar.expanded")}
              </OptionButton>

              <OptionButton
                selected={sidebarCollapsed}
                onClick={() => setSidebarCollapsed(true)}
              >
                {t("displaySettings.sidebar.collapsed")}
              </OptionButton>
            </div>
          </SettingRow>
        </div>
      )}
    </div>
  );
}
