"use client";

import { Eye, LoaderCircle, Save, X } from "lucide-react";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import CoverImageField from "@/components/admin/media/CoverImageField";

import LocalizedFormField from "@/components/admin/localization/LocalizedFormField";

import LocalizedRichTextEditor from "@/components/admin/localization/LocalizedRichTextEditor";

import { PAGE_TYPE } from "@/constants/page";

import ContentSeoSection from "@/components/admin/content/ContentSeoSection";

import {
  applyContentSeoDefaults,
  syncSeoImageSource,
  syncSeoTextSource,
} from "@/utils/content-seo";

import AboutPreviewDialog from "./AboutPreviewDialog";

import AboutSectionsEditor from "./AboutSectionsEditor";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function emptyLocalized() {
  return {
    en: "",
    th: "",
  };
}

function emptySeoLanguage() {
  return {
    title: "",

    description: "",

    keywords: [],

    ogTitle: "",

    ogDescription: "",

    ogImage: null,
  };
}

function emptySeo() {
  return {
    en: emptySeoLanguage(),

    th: emptySeoLanguage(),

    index: true,

    follow: true,
  };
}

function normalizeSeoLanguage(value) {
  return {
    title: value?.title || "",

    description: value?.description || "",

    keywords: Array.isArray(value?.keywords) ? value.keywords : [],

    ogTitle: value?.ogTitle || "",

    ogDescription: value?.ogDescription || "",

    ogImage: value?.ogImage || null,
  };
}

function normalizeSeo(value) {
  return {
    en: normalizeSeoLanguage(value?.en),

    th: normalizeSeoLanguage(value?.th),

    index: value?.index !== false,

    follow: value?.follow !== false,
  };
}

function createVersionSlug() {
  return `about-${Date.now().toString(36)}`;
}

function normalizePage(page) {
  if (!page) {
    const normalized = {
      slug: createVersionSlug(),

      pageType: PAGE_TYPE.ABOUT,

      title: {
        en: "About",

        th: "",
      },

      excerpt: emptyLocalized(),

      content: emptyLocalized(),

      featuredImage: null,

      sections: [],

      navigation: {
        showInNavigation: false,

        label: {
          en: "About",

          th: "",
        },

        sortOrder: 0,
      },

      seo: emptySeo(),
    };

    return {
      ...normalized,

      seo: applyContentSeoDefaults({
        seo: normalized.seo,

        title: normalized.title,

        description: normalized.excerpt,

        keywords: [],

        image: normalized.featuredImage,
      }),
    };
  }

  const normalized = {
    ...page,

    title: {
      en: page.title?.en || "",

      th: page.title?.th || "",
    },

    excerpt: {
      en: page.excerpt?.en || "",

      th: page.excerpt?.th || "",
    },

    content: {
      en: page.content?.en || "",

      th: page.content?.th || "",
    },

    featuredImage: page.featuredImage || null,

    sections: Array.isArray(page.sections) ? page.sections : [],

    navigation: {
      showInNavigation: page.navigation?.showInNavigation === true,

      label: {
        en: page.navigation?.label?.en || "About",

        th: page.navigation?.label?.th || "",
      },

      sortOrder: page.navigation?.sortOrder ?? 0,
    },

    seo: normalizeSeo(page.seo),
  };

  return {
    ...normalized,

    seo: applyContentSeoDefaults({
      seo: normalized.seo,

      title: normalized.title,

      description: normalized.excerpt,

      keywords: [],

      image: normalized.featuredImage,
    }),
  };
}

/*
 * =========================================================
 * EDITOR
 * =========================================================
 */

export default function AboutEditor({
  open,

  companyId,

  page,

  onClose,

  onSaved,
}) {
  const { t, errorMessage } = useAdminTranslation();

  const [form, setForm] = useState(() => normalizePage(page));

  const [saving, setSaving] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);

  /*
   * =======================================================
   * RESET FORM
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizePage(page));

      setPreviewOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, page]);

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * LOCALIZED FIELD
   * =======================================================
   */

  function updateLocalized(field, locale, value) {
    setForm((current) => {
      const previousValue = current[field]?.[locale] || "";

      let seo = current.seo;

      if (field === "title") {
        seo = syncSeoTextSource({
          seo,

          language: locale,

          previousSource: previousValue,

          nextSource: value,

          fields: ["title", "ogTitle"],
        });
      }

      if (field === "excerpt") {
        seo = syncSeoTextSource({
          seo,

          language: locale,

          previousSource: previousValue,

          nextSource: value,

          fields: ["description", "ogDescription"],
        });
      }

      return {
        ...current,

        [field]: {
          ...current[field],

          [locale]: value,
        },

        seo,
      };
    });
  }

  /*
   * =======================================================
   * FEATURED IMAGE
   * =======================================================
   */

  function updateFeaturedImage(featuredImage) {
    setForm((current) => ({
      ...current,

      featuredImage,

      seo: syncSeoImageSource({
        seo: current.seo,

        previousSource: current.featuredImage,

        nextSource: featuredImage,
      }),
    }));
  }

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  async function handleSave() {
    if (!companyId || saving) {
      return;
    }

    if (!form.title?.en?.trim()) {
      toast.error(t("about.messages.titleRequired"));

      return;
    }

    setSaving(true);

    try {
      const editing = Boolean(page?.id);

      /*
       * Keep About payload aligned with the
       * existing Page API.
       *
       * Do not introduce SEO/status/etc here yet.
       * Those should be added only when Page Schema
       * and Page Service support them.
       */
      const body = {
        slug: form.slug,

        pageType: PAGE_TYPE.ABOUT,

        title: form.title,

        excerpt: form.excerpt,

        content: form.content,

        featuredImage: form.featuredImage,

        sections: form.sections || [],

        navigation: form.navigation,

        seo: form.seo,
      };

      const response = await fetch(
        editing
          ? `/api/v1/companies/${companyId}/pages/${page.id}`
          : `/api/v1/companies/${companyId}/pages`,
        {
          method: editing ? "PATCH" : "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify(body),
        },
      );

      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.success === false) {
        throw new Error(
          errorMessage(
            payload?.code,

            payload?.message || t("about.messages.saveFailed"),
          ),
        );
      }

      toast.success(
        editing ? t("about.messages.updated") : t("about.messages.created"),
      );

      await onSaved?.(payload?.data);
    } catch (error) {
      console.error("Save About error:", error);

      toast.error(error?.message || t("about.messages.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <>
      <div
        className="
          fixed
          inset-0
          z-[180]

          flex
          justify-end
        "
      >
        {/* =================================
            BACKDROP
        ================================= */}

        <button
          type="button"
          aria-label={t("common.close")}
          onClick={saving ? undefined : onClose}
          className="
            absolute
            inset-0

            bg-black/30

            backdrop-blur-[1px]
          "
        />

        {/* =================================
            PANEL
        ================================= */}

        <div
          className="
            relative
            z-10

            flex
            h-full
            w-full
            max-w-[1040px]
            flex-col

            bg-[var(--admin-surface)]

            shadow-2xl
          "
        >
          {/* =================================
              HEADER
          ================================= */}

          <header
            className="
              flex
              min-h-20
              shrink-0

              items-center
              justify-between

              gap-4

              border-b
              border-[var(--admin-border)]

              px-5
              py-4

              sm:px-8
            "
          >
            <div className="min-w-0">
              <h2
                className="
                  admin-text-18
                  font-semibold
                  tracking-[-0.02em]

                  text-[var(--admin-foreground)]
                "
              >
                {page ? t("about.editTitle") : t("about.newVersionTitle")}
              </h2>

              <p
                className="
                  mt-1

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                {t("about.editorDescription")}
              </p>
            </div>

            <div
              className="
                flex
                shrink-0

                items-center
                gap-1
              "
            >
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                disabled={saving}
                className="
                  inline-flex
                  h-9

                  items-center
                  gap-2

                  rounded-xl

                  px-3

                  admin-text-12
                  font-medium

                  text-[var(--admin-muted)]

                  transition

                  hover:bg-[var(--admin-hover)]

                  hover:text-[var(--company-primary)]

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Eye size={15} />

                {t("common.preview")}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                aria-label={t("common.close")}
                className="
                  flex
                  h-9
                  w-9

                  items-center
                  justify-center

                  rounded-xl

                  text-[var(--admin-muted)]

                  transition

                  hover:bg-[var(--admin-hover)]

                  hover:text-[var(--admin-foreground)]

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* =================================
              BODY
          ================================= */}

          <div
            className="
              admin-sidebar-scrollbar-hide

              min-h-0
              flex-1

              overflow-y-auto

              px-5
              py-6

              sm:px-8
              sm:py-8
            "
          >
            {/* ===============================
                PAGE INFORMATION
            =============================== */}

            <section>
              <h3
                className="
                  admin-text-14
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("about.pageInformation")}
              </h3>

              <div className="mt-4">
                <LocalizedFormField
                  label={t("project.fields.title")}
                  value={form.title}
                  required
                  onChange={(locale, value) =>
                    updateLocalized("title", locale, value)
                  }
                  inputClassName="
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

                    placeholder:text-[var(--admin-muted-light)]

                    focus:border-[var(--company-primary)]

                    focus:ring-2
                    focus:ring-[var(--company-primary-soft)]
                  "
                />
              </div>

              <div className="mt-5">
                <LocalizedFormField
                  label={t("about.summary.label")}
                  type="textarea"
                  rows={4}
                  value={form.excerpt}
                  onChange={(locale, value) =>
                    updateLocalized("excerpt", locale, value)
                  }
                  placeholder={{
                    en: t("about.summary.placeholderEnglish"),

                    th: t("about.summary.placeholderThai"),
                  }}
                  infoTitle={t("about.summary.infoTitle")}
                  infoContent={t("about.summary.infoDescription")}
                />
              </div>
            </section>

            {/* ===============================
                COVER
            =============================== */}

            <section className="mt-10">
              <CoverImageField
                companyId={companyId}
                value={form.featuredImage}
                cropPreset="landscape"
                previewClassName="aspect-[17/10]"
                title={t("about.cover.title")}
                description={t("about.cover.description")}
                emptyTitle={t("about.cover.none")}
                emptyDescription={t("about.cover.emptyDescription")}
                selectLabel={t("about.cover.select")}
                pickerTitle={t("about.cover.dialogTitle")}
                disabled={saving}
                onChange={updateFeaturedImage}
              />
            </section>

            {/* ===============================
                CONTENT
            =============================== */}

            <section className="mt-10">
              <h3
                className="
                  admin-text-14
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("about.content.title")}
              </h3>

              <p
                className="
                  mt-1

                  admin-text-12
                  leading-[1.65]

                  text-[var(--admin-muted)]
                "
              >
                {t("about.content.description")}
              </p>

              <div className="mt-4">
                <LocalizedRichTextEditor
                  label={t("about.content.label")}
                  value={form.content}
                  minHeight={380}
                  onChange={(locale, value) =>
                    updateLocalized("content", locale, value)
                  }
                />

                <AboutSectionsEditor
                  companyId={companyId}
                  value={form.sections}
                  onChange={(sections) =>
                    setForm((current) => ({
                      ...current,
                      sections,
                    }))
                  }
                />
              </div>
            </section>
            <ContentSeoSection
              companyId={companyId}
              seo={form.seo}
              onChange={(seo) =>
                setForm((current) => ({
                  ...current,

                  seo,
                }))
              }
            />
          </div>

          {/* =================================
              FOOTER
          ================================= */}

          <footer
            className="
              flex
              shrink-0

              flex-col
              gap-3

              border-t
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-5
              py-4

              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-8
            "
          >
            <span
              className="
                admin-text-10
                leading-[1.5]

                text-[var(--admin-muted)]
              "
            >
              {t("about.actions.saveHint")}
            </span>

            <div
              className="
                flex
                shrink-0

                items-center
                gap-2
              "
            >
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="
                  h-10

                  rounded-xl

                  px-4

                  admin-text-14
                  font-medium

                  text-[var(--admin-muted)]

                  transition

                  hover:bg-[var(--admin-hover)]

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="
                  inline-flex
                  h-10

                  items-center
                  gap-2

                  rounded-xl

                  bg-[var(--company-primary)]

                  px-5

                  admin-text-14
                  font-medium

                  text-[var(--company-primary-foreground)]

                  transition

                  hover:bg-[var(--company-primary-hover)]

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {saving ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}

                {saving ? t("common.saving") : t("common.saveDraft")}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* =====================================
          PREVIEW
      ===================================== */}

      <AboutPreviewDialog
        open={previewOpen}
        companyId={companyId}
        value={form}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
