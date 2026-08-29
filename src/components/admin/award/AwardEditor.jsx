"use client";

import { Award, LoaderCircle, Save, Star, X } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import ContentMediaSection from "@/components/admin/content/ContentMediaSection";
import ContentSeoSection from "@/components/admin/content/ContentSeoSection";

import FormField from "@/components/admin/form/FormField";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import LocalizedFormField from "@/components/admin/localization/LocalizedFormField";
import LocalizedRichTextEditor from "@/components/admin/localization/LocalizedRichTextEditor";

import {
  clearFieldError,
  focusFirstInvalidField,
  getFieldError,
  getInvalidFieldClass,
  hasErrors,
  normalizeServerFieldErrors,
} from "@/utils/admin-form-validation";

import { cn } from "@/utils/cn";

import { slugify } from "@/utils/slug";

/*
 * =========================================================
 * EMPTY VALUES
 * =========================================================
 */

function emptyLocalized() {
  return {
    th: "",
    en: "",
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
    th: emptySeoLanguage(),

    en: emptySeoLanguage(),

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
    th: normalizeSeoLanguage(value?.th),

    en: normalizeSeoLanguage(value?.en),

    index: value?.index !== false,

    follow: value?.follow !== false,
  };
}

function emptyForm() {
  return {
    slug: "",

    title: emptyLocalized(),

    projectId: null,

    awardInfo: {
      name: emptyLocalized(),

      organization: emptyLocalized(),

      year: null,

      category: emptyLocalized(),

      level: emptyLocalized(),
    },

    excerpt: emptyLocalized(),

    content: emptyLocalized(),

    featuredImage: null,

    gallery: [],

    featured: false,

    seo: emptySeo(),
  };
}

/*
 * =========================================================
 * NORMALIZE
 * =========================================================
 */

function normalizeAward(award) {
  if (!award) {
    return emptyForm();
  }

  return {
    slug: award.slug || "",

    title: {
      th: award.title?.th || "",

      en: award.title?.en || "",
    },

    projectId: award.projectId || null,

    awardInfo: {
      name: {
        th: award.awardInfo?.name?.th || "",

        en: award.awardInfo?.name?.en || "",
      },

      organization: {
        th: award.awardInfo?.organization?.th || "",

        en: award.awardInfo?.organization?.en || "",
      },

      year: award.awardInfo?.year ?? null,

      category: {
        th: award.awardInfo?.category?.th || "",

        en: award.awardInfo?.category?.en || "",
      },

      level: {
        th: award.awardInfo?.level?.th || "",

        en: award.awardInfo?.level?.en || "",
      },
    },

    excerpt: {
      th: award.excerpt?.th || "",

      en: award.excerpt?.en || "",
    },

    content: {
      th: award.content?.th || "",

      en: award.content?.en || "",
    },

    featuredImage: award.featuredImage || null,

    gallery: Array.isArray(award.gallery) ? award.gallery : [],

    featured: award.featured === true,

    seo: normalizeSeo(award.seo),
  };
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeYear(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : null;
}

function getProjectTitle(project, fallback) {
  return (
    project?.title?.en?.trim() ||
    project?.title?.th?.trim() ||
    project?.slug ||
    fallback
  );
}

function SectionHeader({ title, description }) {
  return (
    <div>
      <h3
        className="
          admin-text-14
          font-semibold

          text-[var(--admin-foreground)]
        "
      >
        {title}
      </h3>

      {description && (
        <p
          className="
            mt-1
            max-w-2xl

            admin-text-12
            leading-[1.65]

            text-[var(--admin-muted)]
          "
        >
          {description}
        </p>
      )}
    </div>
  );
}

/*
 * =========================================================
 * AWARD EDITOR
 * =========================================================
 */

export default function AwardEditor({
  open,

  companyId,

  award,

  projects = [],

  onClose,

  onSaved,
}) {
  const { t } = useAdminTranslation();

  const [form, setForm] = useState(() => normalizeAward(award));

  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});

  const slugManuallyEditedRef = useRef(false);

  /*
   * =======================================================
   * OPEN SYNC
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizeAward(award));

      setErrors({});

      slugManuallyEditedRef.current = Boolean(award?.id);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [award, open]);

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * LOCALIZED
   * =======================================================
   */

  function updateLocalized(field, language, value) {
    setForm((current) => ({
      ...current,

      [field]: {
        ...current[field],

        [language]: value,
      },
    }));

    if (field === "title") {
      clearFieldError(setErrors, "title");
    }
  }

  function updateTitle(language, value) {
    setForm((current) => ({
      ...current,

      title: {
        ...current.title,

        [language]: value,
      },

      slug:
        language === "en" && !award && !slugManuallyEditedRef.current
          ? slugify(value)
          : current.slug,
    }));

    clearFieldError(setErrors, "title");

    if (language === "en" && !award && !slugManuallyEditedRef.current) {
      clearFieldError(setErrors, "slug");
    }
  }

  function updateAwardInfo(field, language, value) {
    setForm((current) => ({
      ...current,

      awardInfo: {
        ...current.awardInfo,

        [field]: {
          ...current.awardInfo[field],

          [language]: value,
        },
      },
    }));

    if (field === "name") {
      clearFieldError(setErrors, "awardName");
    }
  }

  /*
   * =======================================================
   * VALIDATION
   * =======================================================
   */

  function validateForm(value) {
    const nextErrors = {};

    /*
     * English is canonical.
     */
    if (!value.title?.en?.trim()) {
      nextErrors.title = t("award.editor.validation.titleRequired");
    }

    if (!value.slug?.trim()) {
      nextErrors.slug = t("award.editor.validation.slugRequired");
    }

    if (!value.awardInfo?.name?.en?.trim()) {
      nextErrors.awardName = t("award.editor.validation.awardNameRequired");
    }

    return nextErrors;
  }

  function applyValidationErrors(validationErrors) {
    setErrors(validationErrors);

    focusFirstInvalidField(validationErrors);

    toast.error(t("award.messages.requiredFields"));
  }

  /*
   * =======================================================
   * PAYLOAD
   * =======================================================
   */

  function createPayload(currentForm, slug) {
    return {
      slug,

      title: currentForm.title,

      projectId: currentForm.projectId || null,

      awardInfo: {
        ...currentForm.awardInfo,

        year: normalizeYear(currentForm.awardInfo.year),
      },

      excerpt: currentForm.excerpt,

      content: currentForm.content,

      featuredImage: currentForm.featuredImage,

      gallery: currentForm.gallery,

      featured: currentForm.featured,

      seo: currentForm.seo,
    };
  }

  /*
   * =======================================================
   * REQUEST
   * =======================================================
   */

  async function saveAward(payload) {
    const editing = Boolean(award?.id);

    const response = await fetch(
      editing
        ? `/api/v1/companies/${companyId}/awards/${award.id}`
        : `/api/v1/companies/${companyId}/awards`,
      {
        method: editing ? "PATCH" : "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      },
    );

    let result = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    return {
      response,
      result,
    };
  }

  /*
   * =======================================================
   * SUBMIT
   * =======================================================
   */

  async function handleSubmit(event) {
    event.preventDefault();

    if (!companyId || saving) {
      return;
    }

    const normalizedSlug = slugify(form.slug);

    const normalizedForm = {
      ...form,

      slug: normalizedSlug,
    };

    const validationErrors = validateForm(normalizedForm);

    if (hasErrors(validationErrors)) {
      applyValidationErrors(validationErrors);

      return;
    }

    try {
      setSaving(true);

      setErrors({});

      let currentSlug = normalizedSlug;

      let conflictAttempts = 0;

      const maxConflictAttempts = 5;

      while (conflictAttempts <= maxConflictAttempts) {
        const payload = createPayload(form, currentSlug);

        const { response, result } = await saveAward(payload);

        /*
         * SUCCESS
         */

        if (response.ok && result?.success !== false) {
          setForm((current) => ({
            ...current,

            slug: currentSlug,
          }));

          slugManuallyEditedRef.current = true;

          toast.success(
            award ? t("award.messages.updated") : t("award.messages.created"),
          );

          await onSaved?.(result?.data);

          return;
        }

        /*
         * SERVER FIELD ERROR
         */

        const serverErrors = normalizeServerFieldErrors(result?.errors);

        if (hasErrors(serverErrors)) {
          setErrors(serverErrors);

          focusFirstInvalidField(serverErrors);
        }

        /*
         * SLUG CONFLICT
         */

        const slugConflict =
          response.status === 409 &&
          (result?.code === "AWARD_SLUG_EXISTS" ||
            String(result?.message || "")
              .toLowerCase()
              .includes("slug"));

        if (!slugConflict) {
          throw new Error(result?.message || t("award.messages.saveFailed"));
        }

        const suggestedSlug = slugify(result?.suggestedSlug);

        if (!suggestedSlug || suggestedSlug === currentSlug) {
          const slugErrors = {
            slug: t("award.editor.slug.exists"),
          };

          setErrors(slugErrors);

          focusFirstInvalidField(slugErrors);

          toast.error(t("award.editor.slug.noAlternative"));

          return;
        }

        const confirmed = window.confirm(
          t("award.editor.slug.confirmSuggestion", {
            current: currentSlug,

            suggested: suggestedSlug,
          }),
        );

        if (!confirmed) {
          const slugErrors = {
            slug: t("award.editor.slug.exists"),
          };

          setErrors(slugErrors);

          focusFirstInvalidField(slugErrors);

          return;
        }

        currentSlug = suggestedSlug;

        conflictAttempts += 1;

        setForm((current) => ({
          ...current,

          slug: suggestedSlug,
        }));

        slugManuallyEditedRef.current = true;

        clearFieldError(setErrors, "slug");

        if (conflictAttempts > maxConflictAttempts) {
          throw new Error(t("award.editor.slug.reserveFailed"));
        }
      }
    } catch (saveError) {
      console.error("Save award error:", saveError);

      toast.error(saveError?.message || t("award.messages.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * CLOSE
   * =======================================================
   */

  function handleClose() {
    if (saving) {
      return;
    }

    onClose?.();
  }

  /*
   * =======================================================
   * INPUT CLASS
   * =======================================================
   */

  const inputClass = cn(
    "h-11 w-full",

    "rounded-xl",

    "border border-[var(--admin-border)]",

    "bg-[var(--admin-surface)]",

    "px-3",

    "admin-text-14",

    "text-[var(--admin-foreground)]",

    "outline-none transition",

    "placeholder:text-[var(--admin-muted-light)]",

    "focus:border-[var(--company-primary)]",

    "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
  );

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
      "
    >
      {/* BACKDROP */}

      <button
        type="button"
        aria-label={t("common.close")}
        className="
          absolute
          inset-0

          bg-black/40

          backdrop-blur-[1px]
        "
        onClick={handleClose}
        disabled={saving}
      />

      {/* PANEL */}

      <div
        className="
          absolute
          inset-y-0
          right-0

          flex
          w-full
          max-w-[1120px]
          flex-col

          bg-[var(--admin-background)]

          shadow-2xl
        "
      >
        {/* HEADER */}

        <header
          className="
            flex
            min-h-[80px]
            shrink-0

            items-center
            justify-between

            gap-4

            border-b
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            px-5
            py-4

            sm:px-8
          "
        >
          <div>
            <div
              className="
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              {t("award.editor.sectionLabel")}
            </div>

            <h2
              className="
                mt-1

                admin-text-18
                font-semibold
                tracking-[-0.02em]

                text-[var(--admin-foreground)]
              "
            >
              {award ? t("award.editAward") : t("award.newAward")}
            </h2>

            <p
              className="
                mt-1

                admin-text-12

                text-[var(--admin-muted)]
              "
            >
              {t("award.editor.headerDescription")}
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleClose}
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

              disabled:opacity-50
            "
          >
            <X size={18} />
          </button>
        </header>

        {/* FORM */}

        <form
          id="award-editor-form"
          onSubmit={handleSubmit}
          noValidate
          className="
            admin-sidebar-scrollbar-hide

            min-h-0
            flex-1

            overflow-y-auto
          "
        >
          <div
            className="
              px-5
              py-6

              sm:px-8
              sm:py-8
            "
          >
            {/* ===============================
                BASIC
            =============================== */}

            <section>
              <SectionHeader
                title={t("award.editor.basic.title")}
                description={t("award.editor.basic.description")}
              />

              <div
                className="
                  mt-5

                  grid
                  gap-5
                "
              >
                {/* TITLE */}

                <LocalizedFormField
                  fieldName="title"
                  label={t("award.fields.title")}
                  required
                  value={form.title}
                  error={getFieldError(errors, "title")}
                  onChange={updateTitle}
                  placeholder={{
                    en: t("award.editor.placeholders.titleEnglish"),

                    th: t("award.editor.placeholders.titleThai"),
                  }}
                />

                {/* SLUG */}

                <div data-form-field="slug">
                  <FormField
                    label={t("award.fields.slug")}
                    required
                    error={getFieldError(errors, "slug")}
                    hint={t("award.editor.slug.hint")}
                    infoTitle={t("award.editor.slug.infoTitle")}
                    infoContent={t("award.editor.slug.infoDescription")}
                  >
                    <input
                      value={form.slug}
                      aria-invalid={Boolean(errors.slug)}
                      onChange={(event) => {
                        slugManuallyEditedRef.current = true;

                        setForm((current) => ({
                          ...current,

                          slug: event.target.value,
                        }));

                        clearFieldError(setErrors, "slug");
                      }}
                      onBlur={() => {
                        setForm((current) => ({
                          ...current,

                          slug: slugify(current.slug),
                        }));
                      }}
                      placeholder="international-design-award-2026"
                      className={cn(
                        inputClass,

                        getInvalidFieldClass(getFieldError(errors, "slug")),
                      )}
                    />
                  </FormField>
                </div>

                {/* PROJECT */}

                <FormField
                  label={t("award.fields.linkedProject")}
                  hint={t("award.editor.projectHint")}
                  infoTitle={t("award.editor.projectInfoTitle")}
                  infoContent={t("award.editor.projectInfoDescription")}
                >
                  <select
                    value={form.projectId || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        projectId: event.target.value || null,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">
                      {t("award.editor.noLinkedProject")}
                    </option>

                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {getProjectTitle(
                          project,

                          t("award.manager.untitledProject"),
                        )}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </section>

            {/* ===============================
                AWARD INFORMATION
            =============================== */}

            <section
              className="
                mt-10

                border-t
                border-[var(--admin-border)]

                pt-8
              "
            >
              <SectionHeader
                title={t("award.editor.awardInfo.title")}
                description={t("award.editor.awardInfo.description")}
              />

              <div
                className="
                  mt-5

                  grid
                  gap-5
                "
              >
                {/* AWARD NAME */}

                <LocalizedFormField
                  fieldName="awardName"
                  label={t("award.fields.awardName")}
                  required
                  value={form.awardInfo.name}
                  error={getFieldError(errors, "awardName")}
                  onChange={(language, value) =>
                    updateAwardInfo("name", language, value)
                  }
                />

                {/* ORGANIZATION */}

                <LocalizedFormField
                  label={t("award.fields.organization")}
                  value={form.awardInfo.organization}
                  onChange={(language, value) =>
                    updateAwardInfo("organization", language, value)
                  }
                />

                {/* CATEGORY */}

                <LocalizedFormField
                  label={t("award.fields.category")}
                  value={form.awardInfo.category}
                  onChange={(language, value) =>
                    updateAwardInfo("category", language, value)
                  }
                />

                {/* LEVEL */}

                <LocalizedFormField
                  label={t("award.fields.level")}
                  value={form.awardInfo.level}
                  onChange={(language, value) =>
                    updateAwardInfo("level", language, value)
                  }
                />

                {/* YEAR */}

                <FormField
                  label={t("award.fields.year")}
                  infoTitle={t("award.editor.year.infoTitle")}
                  infoContent={t("award.editor.year.infoDescription")}
                >
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1900"
                    max="2200"
                    value={form.awardInfo.year ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        awardInfo: {
                          ...current.awardInfo,

                          year: event.target.value,
                        },
                      }))
                    }
                    placeholder="2026"
                    className={inputClass}
                  />
                </FormField>
              </div>
            </section>

            {/* ===============================
                EXCERPT
            =============================== */}

            <section
              className="
                mt-10

                border-t
                border-[var(--admin-border)]

                pt-8
              "
            >
              <SectionHeader
                title={t("award.editor.summary.title")}
                description={t("award.editor.summary.description")}
              />

              <div className="mt-5">
                <LocalizedFormField
                  label={t("award.fields.excerpt")}
                  type="textarea"
                  rows={4}
                  value={form.excerpt}
                  onChange={(language, value) =>
                    updateLocalized("excerpt", language, value)
                  }
                  placeholder={{
                    en: t("award.editor.placeholders.excerptEnglish"),

                    th: t("award.editor.placeholders.excerptThai"),
                  }}
                />
              </div>
            </section>

            {/* ===============================
                CONTENT
            =============================== */}

            <section
              className="
                mt-10

                border-t
                border-[var(--admin-border)]

                pt-8
              "
            >
              <SectionHeader
                title={t("award.editor.content.title")}
                description={t("award.editor.content.description")}
              />

              <div className="mt-5">
                <LocalizedRichTextEditor
                  label={t("award.fields.content")}
                  value={form.content}
                  minHeight={300}
                  onChange={(language, value) =>
                    updateLocalized("content", language, value)
                  }
                  placeholder={{
                    en: t("award.editor.placeholders.contentEnglish"),

                    th: t("award.editor.placeholders.contentThai"),
                  }}
                />
              </div>
            </section>

            {/* ===============================
                FEATURED
            =============================== */}

            <section
              className="
                mt-10

                border-t
                border-[var(--admin-border)]

                pt-8
              "
            >
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3",

                  "rounded-2xl",

                  "border",

                  "p-4",

                  "transition",

                  form.featured
                    ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]"
                    : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
                )}
              >
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      featured: event.target.checked,
                    }))
                  }
                  className="
                    mt-1

                    accent-[var(--company-primary)]
                  "
                />

                <span
                  className="
                    flex
                    min-w-0
                    flex-1

                    items-start
                    gap-3
                  "
                >
                  <span
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0

                      items-center
                      justify-center

                      rounded-xl

                      bg-[var(--company-primary-soft)]

                      text-[var(--company-primary)]
                    "
                  >
                    <Star size={16} />
                  </span>

                  <span>
                    <span
                      className="
                        block

                        admin-text-14
                        font-medium

                        text-[var(--admin-foreground)]
                      "
                    >
                      {t("award.editor.featured.title")}
                    </span>

                    <span
                      className="
                        mt-1
                        block

                        admin-text-12
                        leading-[1.6]

                        text-[var(--admin-muted)]
                      "
                    >
                      {t("award.editor.featured.description")}
                    </span>
                  </span>
                </span>
              </label>
            </section>

            {/* ===============================
                MEDIA
            =============================== */}

            <ContentMediaSection
              companyId={companyId}
              featuredImage={form.featuredImage}
              gallery={form.gallery}
              onFeaturedImageChange={(featuredImage) =>
                setForm((current) => ({
                  ...current,

                  featuredImage,
                }))
              }
              onGalleryChange={(gallery) =>
                setForm((current) => ({
                  ...current,

                  gallery,
                }))
              }
            />

            {/* ===============================
                SEO
            =============================== */}

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
        </form>

        {/* FOOTER */}

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
          <div
            className="
              admin-text-11
              leading-[1.55]

              text-[var(--admin-muted)]
            "
          >
            {t("award.editor.saveHint")}
          </div>

          <div
            className="
              flex
              items-center
              justify-end
              gap-2
            "
          >
            <button
              type="button"
              onClick={handleClose}
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

                disabled:opacity-50
              "
            >
              {t("common.cancel")}
            </button>

            <button
              type="submit"
              form="award-editor-form"
              disabled={saving}
              className="
                inline-flex
                h-10
                min-w-32

                items-center
                justify-center
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
              ) : award ? (
                <Save size={15} />
              ) : (
                <Award size={15} />
              )}

              {saving
                ? t("common.saving")
                : award
                  ? t("common.saveChanges")
                  : t("common.create")}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
