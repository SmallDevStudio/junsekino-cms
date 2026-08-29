"use client";

import { Plus, Trash2 } from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { COMPANY_LOCALES } from "@/constants/company";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

const CREDIT_GROUP_KEYS = [
  "architecture",
  "interior",
  "landscape",
  "consultant",
];

function normalizeCredits(credits) {
  return {
    architecture: Array.isArray(credits?.architecture)
      ? credits.architecture
      : [],

    interior: Array.isArray(credits?.interior) ? credits.interior : [],

    landscape: Array.isArray(credits?.landscape) ? credits.landscape : [],

    consultant: Array.isArray(credits?.consultant) ? credits.consultant : [],
  };
}

function emptyCredit() {
  return {
    en: "",
    th: "",
  };
}

/*
 * =========================================================
 * CREDIT GROUP
 * =========================================================
 */

function CreditGroup({ groupKey, items, onChange, thaiEnabled }) {
  const { t } = useAdminTranslation();

  const groupLabel = t(`project.credits.groups.${groupKey}.label`);

  const groupDescription = t(`project.credits.groups.${groupKey}.description`);

  /*
   * =======================================================
   * ADD
   * =======================================================
   */

  function addCredit() {
    onChange([...items, emptyCredit()]);
  }

  /*
   * =======================================================
   * UPDATE
   * =======================================================
   */

  function updateCredit(index, language, value) {
    const nextItems = items.map((item, itemIndex) => {
      if (itemIndex !== index) {
        return item;
      }

      return {
        ...item,

        [language]: value,
      };
    });

    onChange(nextItems);
  }

  /*
   * =======================================================
   * REMOVE
   * =======================================================
   */

  function removeCredit(index) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div
      className="
        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]
      "
    >
      {/* =====================================
          HEADER
      ===================================== */}

      <div
        className="
          flex
          flex-col
          gap-3

          border-b
          border-[var(--admin-border)]

          p-4

          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div>
          <div
            className="
              admin-text-12
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {groupLabel}
          </div>

          <p
            className="
              mt-1

              admin-text-11
              leading-[1.6]

              text-[var(--admin-muted)]
            "
          >
            {groupDescription}
          </p>
        </div>

        <button
          type="button"
          onClick={addCredit}
          className={cn(
            "inline-flex h-9 shrink-0",

            "items-center justify-center gap-2",

            "self-start",

            "rounded-xl",

            "border border-[var(--admin-border)]",

            "bg-[var(--admin-surface)]",

            "px-3",

            "admin-text-12 font-medium",

            "text-[var(--admin-foreground)]",

            "transition",

            "hover:border-[var(--company-primary-border)]",

            "hover:bg-[var(--company-primary-soft)]",

            "hover:text-[var(--company-primary)]",
          )}
        >
          <Plus size={14} />

          {t("common.add")}
        </button>
      </div>

      {/* =====================================
          EMPTY
      ===================================== */}

      {items.length === 0 ? (
        <div
          className="
            px-4
            py-7

            text-center
          "
        >
          <p
            className="
              admin-text-12

              text-[var(--admin-muted)]
            "
          >
            {t("project.credits.empty", {
              type: groupLabel,
            })}
          </p>

          <button
            type="button"
            onClick={addCredit}
            className="
              mt-3

              inline-flex
              items-center
              gap-1.5

              admin-text-12
              font-medium

              text-[var(--company-primary)]

              transition

              hover:opacity-70
            "
          >
            <Plus size={13} />

            {t("project.credits.addCredit", {
              type: groupLabel,
            })}
          </button>
        </div>
      ) : (
        /*
         * ===================================
         * ITEMS
         * ===================================
         */

        <div
          className="
            divide-y
            divide-[var(--admin-border)]
          "
        >
          {items.map((credit, index) => (
            <div key={`${groupKey}-${index}`} className="p-4">
              <div
                className="
                    flex
                    items-start
                    gap-3
                  "
              >
                <div
                  className={cn(
                    "grid min-w-0 flex-1 gap-3",

                    thaiEnabled && "sm:grid-cols-2",
                  )}
                >
                  {/* =======================
                        ENGLISH
                    ======================= */}

                  <label>
                    <span
                      className="
                          admin-text-11

                          text-[var(--admin-muted)]
                        "
                    >
                      {t("project.credits.fields.name")} —{" "}
                      {t("contentLanguage.english")}
                    </span>

                    <input
                      value={credit?.en || ""}
                      onChange={(event) =>
                        updateCredit(
                          index,

                          COMPANY_LOCALES.EN,

                          event.target.value,
                        )
                      }
                      placeholder={t("project.credits.placeholders.english")}
                      maxLength={250}
                      className="
                          mt-2

                          h-10
                          w-full

                          rounded-xl

                          border
                          border-[var(--admin-border)]

                          bg-[var(--admin-surface)]

                          px-3

                          admin-text-14

                          text-[var(--admin-foreground)]

                          outline-none

                          transition

                          placeholder:text-[var(--admin-muted-light)]

                          focus:border-[var(--company-primary)]

                          focus:ring-2
                          focus:ring-[var(--company-primary-soft)]
                        "
                    />
                  </label>

                  {/* =======================
                        THAI
                    ======================= */}

                  {thaiEnabled && (
                    <label>
                      <span
                        className="
                            admin-text-11

                            text-[var(--admin-muted)]
                          "
                      >
                        {t("project.credits.fields.name")} —{" "}
                        {t("contentLanguage.thai")}
                      </span>

                      <input
                        value={credit?.th || ""}
                        onChange={(event) =>
                          updateCredit(
                            index,

                            COMPANY_LOCALES.TH,

                            event.target.value,
                          )
                        }
                        placeholder={t("project.credits.placeholders.thai")}
                        maxLength={250}
                        className="
                            mt-2

                            h-10
                            w-full

                            rounded-xl

                            border
                            border-[var(--admin-border)]

                            bg-[var(--admin-surface)]

                            px-3

                            admin-text-14

                            text-[var(--admin-foreground)]

                            outline-none

                            transition

                            placeholder:text-[var(--admin-muted-light)]

                            focus:border-[var(--company-primary)]

                            focus:ring-2
                            focus:ring-[var(--company-primary-soft)]
                          "
                      />

                      <div
                        className="
                            mt-1.5

                            admin-text-10

                            text-[var(--admin-muted-light)]
                          "
                      >
                        {t("contentLanguage.thaiOptional")}
                      </div>
                    </label>
                  )}
                </div>

                {/* =========================
                      REMOVE
                  ========================= */}

                <button
                  type="button"
                  onClick={() => removeCredit(index)}
                  aria-label={t("project.credits.remove", {
                    type: groupLabel,
                  })}
                  title={t("common.remove")}
                  className="
                      mt-6

                      flex
                      h-9
                      w-9
                      shrink-0

                      items-center
                      justify-center

                      rounded-xl

                      text-red-500

                      transition

                      hover:bg-red-50
                      hover:text-red-600
                    "
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div
                className="
                    mt-3

                    admin-text-10

                    text-[var(--admin-muted-light)]
                  "
              >
                {t("project.credits.creditNumber", {
                  number: index + 1,
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * PROJECT CREDITS
 * =========================================================
 */

export default function ProjectCreditsSection({ credits, onChange }) {
  const { t } = useAdminTranslation();

  const { contentLocales } = useCompanyLocalization();

  const normalized = normalizeCredits(credits);

  const thaiEnabled =
    Array.isArray(contentLocales) &&
    contentLocales.includes(COMPANY_LOCALES.TH);

  function updateGroup(group, items) {
    onChange?.({
      ...normalized,

      [group]: items,
    });
  }

  return (
    <section className="mt-10">
      <div>
        <h3
          className="
            admin-text-14
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          {t("project.credits.title")}
        </h3>

        <p
          className="
            mt-1
            max-w-2xl

            admin-text-12
            leading-[1.65]

            text-[var(--admin-muted)]
          "
        >
          {t("project.credits.description")}
        </p>
      </div>

      <div
        className="
          mt-4

          grid
          gap-4
        "
      >
        {CREDIT_GROUP_KEYS.map((groupKey) => (
          <CreditGroup
            key={groupKey}
            groupKey={groupKey}
            items={normalized[groupKey]}
            thaiEnabled={thaiEnabled}
            onChange={(items) =>
              updateGroup(
                groupKey,

                items,
              )
            }
          />
        ))}
      </div>
    </section>
  );
}
