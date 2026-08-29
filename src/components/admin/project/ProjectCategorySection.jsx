"use client";

import { LoaderCircle, Plus, X } from "lucide-react";

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { COMPANY_LOCALES } from "@/constants/company";

import { cn } from "@/utils/cn";

import { slugify } from "@/utils/slug";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getCategoryName(category, fallback) {
  return (
    category?.name?.en?.trim() ||
    category?.name?.th?.trim() ||
    category?.slug ||
    fallback
  );
}

function emptyCategoryForm() {
  return {
    name: {
      th: "",
      en: "",
    },

    slug: "",
  };
}

/*
 * =========================================================
 * INLINE CATEGORY FORM
 * =========================================================
 */

function InlineCategoryForm({
  type,
  companyId,
  parentId = null,
  onCreated,
  onCancel,
}) {
  const { t } = useAdminTranslation();

  const { contentLocales } = useCompanyLocalization();

  const [form, setForm] = useState(emptyCategoryForm);

  const [saving, setSaving] = useState(false);

  const thaiEnabled =
    Array.isArray(contentLocales) &&
    contentLocales.includes(COMPANY_LOCALES.TH);

  const isSubCategory = type === "subcategory";

  const title = isSubCategory
    ? t("project.category.newSubCategory")
    : t("project.category.newCategory");

  /*
   * =======================================================
   * CREATE
   * =======================================================
   */

  async function handleCreate() {
    if (!companyId || saving) {
      return;
    }

    /*
     * English remains canonical.
     */
    if (!form.name.en.trim()) {
      toast.error(t("project.category.errors.nameRequired"));

      return;
    }

    const generatedSlug = slugify(form.slug || form.name.en);

    if (generatedSlug.length < 2) {
      toast.error(t("project.category.errors.slugInvalid"));

      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/project-categories`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            /*
             * Keep complete localized
             * shape even when Thai UI
             * is hidden.
             */
            name: {
              en: form.name.en.trim(),

              th: form.name.th.trim(),
            },

            slug: generatedSlug,

            parentId: parentId || null,

            description: {
              en: "",
              th: "",
            },

            sortOrder: 0,

            status: "active",
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message || t("project.category.errors.createFailed"),
        );
      }

      toast.success(
        isSubCategory
          ? t("project.category.messages.subCategoryCreated")
          : t("project.category.messages.categoryCreated"),
      );

      onCreated?.(result.data);
    } catch (error) {
      console.error("Create project category error:", error);

      toast.error(error?.message || t("project.category.errors.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * INPUT
   * =======================================================
   */

  function updateName(locale, value) {
    setForm((current) => ({
      ...current,

      name: {
        ...current.name,

        [locale]: value,
      },

      /*
       * Generate slug only from EN.
       */
      slug:
        locale === COMPANY_LOCALES.EN && !current.slug
          ? slugify(value)
          : current.slug,
    }));
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div
      className="
        mt-3

        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-background)]

        p-4
      "
    >
      <div
        className="
          flex
          items-center
          justify-between

          gap-4
        "
      >
        <div
          className="
            admin-text-12
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          {title}
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label={t("common.cancel")}
          title={t("common.cancel")}
          className="
            flex
            h-8
            w-8

            items-center
            justify-center

            rounded-lg

            text-[var(--admin-muted)]

            transition

            hover:bg-[var(--admin-hover)]

            hover:text-[var(--admin-foreground)]

            disabled:opacity-50
          "
        >
          <X size={14} />
        </button>
      </div>

      {/* =====================================
          NAMES
      ===================================== */}

      <div
        className={cn(
          "mt-4 grid gap-3",

          thaiEnabled && "sm:grid-cols-2",
        )}
      >
        {/* EN */}

        <label>
          <span
            className="
              admin-text-11

              text-[var(--admin-muted)]
            "
          >
            {t("project.category.fields.name")} — {t("contentLanguage.english")}
            <span className="ml-1 text-red-500">*</span>
          </span>

          <input
            value={form.name.en}
            onChange={(event) =>
              updateName(
                COMPANY_LOCALES.EN,

                event.target.value,
              )
            }
            placeholder={t("project.category.placeholders.englishName")}
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

        {/* TH */}

        {thaiEnabled && (
          <label>
            <span
              className="
                admin-text-11

                text-[var(--admin-muted)]
              "
            >
              {t("project.category.fields.name")} — {t("contentLanguage.thai")}
            </span>

            <input
              value={form.name.th}
              onChange={(event) =>
                updateName(
                  COMPANY_LOCALES.TH,

                  event.target.value,
                )
              }
              placeholder={t("project.category.placeholders.thaiName")}
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

      {/* =====================================
          SLUG
      ===================================== */}

      <label className="mt-4 block">
        <span
          className="
            admin-text-11

            text-[var(--admin-muted)]
          "
        >
          {t("project.category.fields.slug")}

          <span className="ml-1 text-red-500">*</span>
        </span>

        <input
          value={form.slug}
          onChange={(event) =>
            setForm((current) => ({
              ...current,

              slug: event.target.value,
            }))
          }
          placeholder="residential"
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

        <p
          className="
            mt-1.5

            admin-text-10
            leading-[1.5]

            text-[var(--admin-muted-light)]
          "
        >
          {t("project.category.slugHint")}
        </p>
      </label>

      {/* =====================================
          ACTION
      ===================================== */}

      <div
        className="
          mt-4

          flex
          justify-end

          gap-2
        "
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="
            h-9

            rounded-xl

            px-3

            admin-text-12
            font-medium

            text-[var(--admin-muted)]

            transition

            hover:bg-[var(--admin-hover)]

            disabled:opacity-50
          "
        >
          {t("common.cancel")}
        </button>

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="
            inline-flex
            h-9

            items-center
            justify-center
            gap-2

            rounded-xl

            bg-[var(--company-primary)]

            px-4

            admin-text-12
            font-medium

            text-[var(--company-primary-foreground)]

            transition

            hover:bg-[var(--company-primary-hover)]

            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {saving ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}

          {saving ? t("common.creating") : t("common.create")}
        </button>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * PROJECT CATEGORY SECTION
 * =========================================================
 */

export default function ProjectCategorySection({
  companyId,
  categories = [],
  categoryId,
  subCategoryId,
  onCategoryChange,
  onSubCategoryChange,
}) {
  const { t } = useAdminTranslation();

  const [localCategories, setLocalCategories] = useState(categories);

  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const [createSubCategoryOpen, setCreateSubCategoryOpen] = useState(false);

  /*
   * =======================================================
   * MERGE
   * =======================================================
   */

  const combinedCategories = useMemo(() => {
    const map = new Map();

    for (const category of categories) {
      map.set(category.id, category);
    }

    for (const category of localCategories) {
      map.set(category.id, category);
    }

    return [...map.values()];
  }, [categories, localCategories]);

  const rootCategories = useMemo(
    () =>
      combinedCategories.filter(
        (category) =>
          !category.parentId &&
          category.status === "active" &&
          !category.deletedAt,
      ),
    [combinedCategories],
  );

  const subCategories = useMemo(
    () =>
      combinedCategories.filter(
        (category) =>
          category.parentId === categoryId &&
          category.status === "active" &&
          !category.deletedAt,
      ),
    [combinedCategories, categoryId],
  );

  /*
   * =======================================================
   * CREATED
   * =======================================================
   */

  function handleRootCreated(category) {
    if (!category?.id) {
      return;
    }

    setLocalCategories((current) => [
      ...current.filter((item) => item.id !== category.id),

      category,
    ]);

    onCategoryChange?.(category.id);

    onSubCategoryChange?.(null);

    setCreateCategoryOpen(false);
  }

  function handleSubCategoryCreated(category) {
    if (!category?.id) {
      return;
    }

    setLocalCategories((current) => [
      ...current.filter((item) => item.id !== category.id),

      category,
    ]);

    onSubCategoryChange?.(category.id);

    setCreateSubCategoryOpen(false);
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

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
          {t("project.category.title")}
        </h3>

        <p
          className="
            mt-1

            admin-text-12
            leading-[1.65]

            text-[var(--admin-muted)]
          "
        >
          {t("project.category.description")}
        </p>
      </div>

      <div
        className="
          mt-4

          grid
          gap-5

          sm:grid-cols-2
        "
      >
        {/* =================================
            CATEGORY
        ================================= */}

        <div>
          <label>
            <span
              className="
                admin-text-12
                font-medium

                text-[var(--admin-muted)]
              "
            >
              {t("project.category.category")}
            </span>

            <select
              value={categoryId || ""}
              onChange={(event) => {
                onCategoryChange?.(event.target.value || null);

                onSubCategoryChange?.(null);

                setCreateSubCategoryOpen(false);
              }}
              className="
                mt-2

                h-11
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

                focus:border-[var(--company-primary)]

                focus:ring-2
                focus:ring-[var(--company-primary-soft)]
              "
            >
              <option value="">{t("project.category.noCategory")}</option>

              {rootCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryName(
                    category,

                    t("project.manager.untitledCategory"),
                  )}
                </option>
              ))}
            </select>
          </label>

          {!createCategoryOpen ? (
            <button
              type="button"
              onClick={() => setCreateCategoryOpen(true)}
              className="
                mt-2

                inline-flex
                items-center
                gap-1.5

                admin-text-11
                font-medium

                text-[var(--company-primary)]

                transition

                hover:opacity-70
              "
            >
              <Plus size={12} />

              {t("project.category.createCategory")}
            </button>
          ) : (
            <InlineCategoryForm
              type="category"
              companyId={companyId}
              onCreated={handleRootCreated}
              onCancel={() => setCreateCategoryOpen(false)}
            />
          )}
        </div>

        {/* =================================
            SUB CATEGORY
        ================================= */}

        <div>
          <label>
            <span
              className="
                admin-text-12
                font-medium

                text-[var(--admin-muted)]
              "
            >
              {t("project.category.subCategory")}
            </span>

            <select
              value={subCategoryId || ""}
              disabled={!categoryId}
              onChange={(event) =>
                onSubCategoryChange?.(event.target.value || null)
              }
              className="
                mt-2

                h-11
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

                focus:border-[var(--company-primary)]

                focus:ring-2
                focus:ring-[var(--company-primary-soft)]

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <option value="">{t("project.category.noSubCategory")}</option>

              {subCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryName(
                    category,

                    t("project.manager.untitledCategory"),
                  )}
                </option>
              ))}
            </select>
          </label>

          {categoryId && !createSubCategoryOpen && (
            <button
              type="button"
              onClick={() => setCreateSubCategoryOpen(true)}
              className="
                  mt-2

                  inline-flex
                  items-center
                  gap-1.5

                  admin-text-11
                  font-medium

                  text-[var(--company-primary)]

                  transition

                  hover:opacity-70
                "
            >
              <Plus size={12} />

              {t("project.category.createSubCategory")}
            </button>
          )}

          {categoryId && createSubCategoryOpen && (
            <InlineCategoryForm
              type="subcategory"
              companyId={companyId}
              parentId={categoryId}
              onCreated={handleSubCategoryCreated}
              onCancel={() => setCreateSubCategoryOpen(false)}
            />
          )}

          {!categoryId && (
            <p
              className="
                mt-2

                admin-text-11

                text-[var(--admin-muted-light)]
              "
            >
              {t("project.category.selectCategoryFirst")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
