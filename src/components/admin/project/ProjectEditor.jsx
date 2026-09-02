"use client";

import { LoaderCircle, Save, Star, X } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import FormField from "@/components/admin/form/FormField";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import LocalizedFormField from "@/components/admin/localization/LocalizedFormField";
import LocalizedRichTextEditor from "@/components/admin/localization/LocalizedRichTextEditor";

import TagInput from "@/components/admin/tag/TagInput";

import {
  clearFieldError,
  focusFirstInvalidField,
  getFieldError,
  getInvalidFieldClass,
  hasErrors,
  normalizeServerFieldErrors,
} from "@/utils/admin-form-validation";

import {
  applyContentSeoDefaults,
  syncSeoImageSource,
  syncSeoKeywordsSource,
  syncSeoTextSource,
} from "@/utils/content-seo";

import { cn } from "@/utils/cn";

import { slugify } from "@/utils/slug";

import ProjectCategorySection from "./ProjectCategorySection";
import ProjectCreditsSection from "./ProjectCreditsSection";
import ProjectMediaSection from "./ProjectMediaSection";
import ProjectSeoSection from "./ProjectSeoSection";

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

function emptyProjectInfo() {
  return {
    location: emptyLocalized(),

    designYear: null,

    completionYear: null,

    area: {
      value: null,

      unit: "sqm",
    },

    client: emptyLocalized(),

    credits: {
      architecture: [],
      interior: [],
      landscape: [],
      consultant: [],
    },
  };
}

function emptyForm() {
  return {
    slug: "",

    title: emptyLocalized(),

    excerpt: emptyLocalized(),

    content: emptyLocalized(),

    categoryId: null,

    subCategoryId: null,

    projectInfo: emptyProjectInfo(),

    tags: [],

    featuredImage: null,

    gallery: [],

    featured: false,

    seo: emptySeo(),
  };
}

/*
 * =========================================================
 * NORMALIZE PROJECT
 * =========================================================
 */

function normalizeProject(project) {
  if (!project) {
    return emptyForm();
  }

  const normalized = {
    slug: project.slug || "",

    title: {
      th: project.title?.th || "",

      en: project.title?.en || "",
    },

    excerpt: {
      th: project.excerpt?.th || "",

      en: project.excerpt?.en || "",
    },

    content: {
      th: project.content?.th || "",

      en: project.content?.en || "",
    },

    categoryId: project.categoryId || null,

    subCategoryId: project.subCategoryId || null,

    projectInfo: {
      location: {
        th: project.projectInfo?.location?.th || "",

        en: project.projectInfo?.location?.en || "",
      },

      designYear: project.projectInfo?.designYear ?? null,

      completionYear: project.projectInfo?.completionYear ?? null,

      area: {
        value: project.projectInfo?.area?.value ?? null,

        unit: project.projectInfo?.area?.unit || "sqm",
      },

      client: {
        th: project.projectInfo?.client?.th || "",

        en: project.projectInfo?.client?.en || "",
      },

      credits: {
        architecture: Array.isArray(project.projectInfo?.credits?.architecture)
          ? project.projectInfo.credits.architecture
          : [],

        interior: Array.isArray(project.projectInfo?.credits?.interior)
          ? project.projectInfo.credits.interior
          : [],

        landscape: Array.isArray(project.projectInfo?.credits?.landscape)
          ? project.projectInfo.credits.landscape
          : [],

        consultant: Array.isArray(project.projectInfo?.credits?.consultant)
          ? project.projectInfo.credits.consultant
          : [],
      },
    },

    tags: Array.isArray(project.tags) ? project.tags : [],

    featuredImage: project.featuredImage || null,

    gallery: Array.isArray(project.gallery) ? project.gallery : [],

    featured: project.featured === true,

    seo: normalizeSeo(project.seo),
  };

  return {
    ...normalized,

    seo: applyContentSeoDefaults({
      seo: normalized.seo,

      title: normalized.title,

      description: normalized.excerpt,

      keywords: normalized.tags,

      image: normalized.featuredImage,
    }),
  };
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeArray(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function extractTagSuggestions(projects) {
  const tags = new Map();

  for (const item of projects) {
    if (!Array.isArray(item?.tags)) {
      continue;
    }

    for (const rawTag of item.tags) {
      const tag = String(rawTag || "")
        .trim()
        .replace(/\s+/g, " ");

      if (!tag) {
        continue;
      }

      const key = tag.toLowerCase();

      if (!tags.has(key)) {
        tags.set(key, tag);
      }
    }
  }

  return [...tags.values()].sort((first, second) =>
    first.localeCompare(second, "en", {
      sensitivity: "base",
    }),
  );
}

function normalizeYear(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeArea(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/*
 * =========================================================
 * SECTION HEADER
 * =========================================================
 */

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
 * PROJECT EDITOR
 * =========================================================
 */

export default function ProjectEditor({
  open,
  companyId,
  project,
  categories = [],
  onClose,
  onSaved,
}) {
  const { t } = useAdminTranslation();

  const [form, setForm] = useState(() => normalizeProject(project));

  const [saving, setSaving] = useState(false);

  const [tagSuggestions, setTagSuggestions] = useState([]);

  const [tagSuggestionsLoading, setTagSuggestionsLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const slugManuallyEditedRef = useRef(false);

  /*
   * =======================================================
   * OPEN / PROJECT SYNC
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizeProject(project));

      setErrors({});

      slugManuallyEditedRef.current = Boolean(project?.id);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, project]);

  /*
   * =======================================================
   * TAG SUGGESTIONS
   * =======================================================
   */

  useEffect(() => {
    if (!open || !companyId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setTagSuggestionsLoading(true);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/projects`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("project.editor.errors.loadTags"),
          );
        }

        if (cancelled) {
          return;
        }

        setTagSuggestions(extractTagSuggestions(normalizeArray(payload)));
      } catch (error) {
        console.error("Load project tag suggestions error:", error);

        if (!cancelled) {
          setTagSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setTagSuggestionsLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;

      window.clearTimeout(timeoutId);
    };
  }, [open, companyId, t]);

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * LOCALIZED UPDATE
   * =======================================================
   */

  function updateLocalized(field, language, value) {
    setForm((current) => {
      const previousValue = current[field]?.[language] || "";

      return {
        ...current,

        [field]: {
          ...current[field],

          [language]: value,
        },

        seo:
          field === "excerpt"
            ? syncSeoTextSource({
                seo: current.seo,

                language,

                previousSource: previousValue,

                nextSource: value,

                fields: ["description", "ogDescription"],
              })
            : current.seo,
      };
    });

    if (field === "title") {
      clearFieldError(setErrors, "title");
    }
  }

  function updateProjectInfoLocalized(field, language, value) {
    setForm((current) => ({
      ...current,

      projectInfo: {
        ...current.projectInfo,

        [field]: {
          ...current.projectInfo[field],

          [language]: value,
        },
      },
    }));
  }

  /*
   * =======================================================
   * TITLE / AUTO SLUG
   * =======================================================
   */

  function updateTitle(language, value) {
    setForm((current) => {
      const previousTitle = current.title?.[language] || "";

      return {
        ...current,

        title: {
          ...current.title,

          [language]: value,
        },

        slug:
          language === "en" && !project && !slugManuallyEditedRef.current
            ? slugify(value)
            : current.slug,

        seo: syncSeoTextSource({
          seo: current.seo,

          language,

          previousSource: previousTitle,

          nextSource: value,

          fields: ["title", "ogTitle"],
        }),
      };
    });

    clearFieldError(setErrors, "title");

    if (language === "en" && !project && !slugManuallyEditedRef.current) {
      clearFieldError(setErrors, "slug");
    }
  }

  /*
   * =======================================================
   * VALIDATION
   * =======================================================
   *
   * EN is canonical.
   *
   * Thai can be enabled by Company,
   * but cannot replace the required
   * English project title.
   * =======================================================
   */

  function validateForm(value) {
    const validationErrors = {};

    if (!value.title?.en?.trim()) {
      validationErrors.title = t("project.editor.validation.titleRequired");
    }

    if (!value.slug?.trim()) {
      validationErrors.slug = t("project.editor.validation.slugRequired");
    }

    return validationErrors;
  }

  function applyValidationErrors(validationErrors) {
    setErrors(validationErrors);

    focusFirstInvalidField(validationErrors);

    toast.error(t("project.messages.requiredFields"));
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

    const normalizedForm = {
      ...form,

      slug: slugify(form.slug),
    };

    const validationErrors = validateForm(normalizedForm);

    if (hasErrors(validationErrors)) {
      applyValidationErrors(validationErrors);

      return;
    }

    const editing = Boolean(project?.id);

    const url = editing
      ? `/api/v1/companies/${companyId}/projects/${project.id}`
      : `/api/v1/companies/${companyId}/projects`;

    /*
     * Complete localized data is always
     * submitted.
     *
     * Hidden Thai fields are preserved.
     */
    function createPayload(slug) {
      return {
        slug,

        title: form.title,

        excerpt: form.excerpt,

        content: form.content,

        categoryId: form.categoryId || null,

        subCategoryId: form.subCategoryId || null,

        projectInfo: {
          ...form.projectInfo,

          designYear: normalizeYear(form.projectInfo.designYear),

          completionYear: normalizeYear(form.projectInfo.completionYear),

          area: {
            ...form.projectInfo.area,

            value: normalizeArea(form.projectInfo.area.value),
          },
        },

        tags: form.tags,

        featuredImage: form.featuredImage,

        gallery: form.gallery,

        featured: form.featured,

        seo: form.seo,
      };
    }

    try {
      setSaving(true);

      setErrors({});

      let currentSlug = normalizedForm.slug;

      let conflictAttempts = 0;

      const maxConflictAttempts = 5;

      while (conflictAttempts <= maxConflictAttempts) {
        const response = await fetch(url, {
          method: editing ? "PATCH" : "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify(createPayload(currentSlug)),
        });

        let result = null;

        try {
          result = await response.json();
        } catch {
          result = null;
        }

        /*
         * =================================
         * SUCCESS
         * =================================
         */

        if (response.ok && result?.success !== false) {
          setForm((current) => ({
            ...current,

            slug: currentSlug,
          }));

          slugManuallyEditedRef.current = true;

          toast.success(
            editing
              ? t("project.messages.updated")
              : t("project.messages.created"),
          );

          await onSaved?.(result?.data);

          return;
        }

        /*
         * =================================
         * SERVER FIELD ERRORS
         * =================================
         */

        const serverErrors = normalizeServerFieldErrors(result?.errors);

        if (hasErrors(serverErrors)) {
          setErrors(serverErrors);

          focusFirstInvalidField(serverErrors);
        }

        /*
         * =================================
         * SLUG CONFLICT
         * =================================
         */

        const slugConflict =
          response.status === 409 &&
          (result?.code === "PROJECT_SLUG_EXISTS" ||
            String(result?.message || "")
              .toLowerCase()
              .includes("slug"));

        if (!slugConflict) {
          throw new Error(result?.message || t("project.messages.saveFailed"));
        }

        const suggestedSlug = slugify(result?.suggestedSlug);

        if (!suggestedSlug || suggestedSlug === currentSlug) {
          const slugErrors = {
            slug: t("project.editor.slug.exists"),
          };

          setErrors(slugErrors);

          focusFirstInvalidField(slugErrors);

          toast.error(t("project.editor.slug.noAlternative"));

          return;
        }

        const confirmed = window.confirm(
          t("project.editor.slug.confirmSuggestion", {
            current: currentSlug,

            suggested: suggestedSlug,
          }),
        );

        if (!confirmed) {
          const slugErrors = {
            slug: t("project.editor.slug.exists"),
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
          throw new Error(t("project.editor.slug.reserveFailed"));
        }
      }
    } catch (error) {
      console.error("Save project error:", error);

      toast.error(error?.message || t("project.messages.saveFailed"));
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
   * RENDER
   * =======================================================
   */

  return (
    <div
      className="
        fixed
        inset-0
        z-[180]

        flex
        justify-end
      "
    >
      {/* =====================================
          BACKDROP
      ===================================== */}

      <button
        type="button"
        aria-label={t("common.close")}
        disabled={saving}
        onClick={handleClose}
        className="
          absolute
          inset-0

          bg-black/30

          backdrop-blur-[1px]
        "
      />

      {/* =====================================
          PANEL
      ===================================== */}

      <div
        className="
          relative
          z-10

          flex
          h-full
          w-full
          max-w-[1120px]
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
            min-h-[80px]
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
            <div
              className="
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              {t("project.editor.sectionLabel")}
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
              {project ? t("project.editProject") : t("project.newProject")}
            </h2>

            <p
              className="
                mt-1

                admin-text-12

                text-[var(--admin-muted)]
              "
            >
              {t("project.projectContent")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label={t("common.close")}
            title={t("common.close")}
            className="
              flex
              h-9
              w-9
              shrink-0

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

        {/* =================================
            CONTENT
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
              BASIC INFORMATION
          =============================== */}

          <section>
            <SectionHeader
              title={t("project.basicInformation")}
              description={t("project.editor.basicDescription")}
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
                label={t("project.fields.title")}
                value={form.title}
                required
                error={getFieldError(errors, "title")}
                onChange={updateTitle}
                placeholder={{
                  en: t("project.editor.placeholders.titleEnglish"),

                  th: t("project.editor.placeholders.titleThai"),
                }}
              />

              {/* SLUG */}

              <div data-form-field="slug">
                <FormField
                  label={t("project.fields.slug")}
                  required
                  error={getFieldError(errors, "slug")}
                  hint={t("project.editor.slug.hint")}
                  infoTitle={t("project.editor.slug.infoTitle")}
                  infoContent={t("project.editor.slug.infoDescription")}
                >
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      const value = event.target.value;

                      slugManuallyEditedRef.current = true;

                      setForm((current) => ({
                        ...current,

                        slug: value,
                      }));

                      clearFieldError(setErrors, "slug");
                    }}
                    onBlur={() => {
                      setForm((current) => ({
                        ...current,

                        slug: slugify(current.slug),
                      }));
                    }}
                    placeholder="house-001"
                    className={cn(
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

                      getInvalidFieldClass(getFieldError(errors, "slug")),
                    )}
                  />
                </FormField>
              </div>

              {/* EXCERPT */}

              <LocalizedFormField
                label={t("project.fields.excerpt")}
                type="textarea"
                rows={4}
                value={form.excerpt}
                onChange={(language, value) =>
                  updateLocalized("excerpt", language, value)
                }
                placeholder={{
                  en: t("project.editor.placeholders.excerptEnglish"),

                  th: t("project.editor.placeholders.excerptThai"),
                }}
                infoTitle={t("project.editor.excerpt.infoTitle")}
                infoContent={t("project.editor.excerpt.infoDescription")}
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
              title={t("project.content")}
              description={t("project.editor.contentDescription")}
            />

            <div className="mt-5">
              <LocalizedRichTextEditor
                label={t("project.fields.content")}
                value={form.content}
                minHeight={340}
                onChange={(language, value) =>
                  updateLocalized("content", language, value)
                }
                placeholder={{
                  en: t("project.editor.placeholders.contentEnglish"),

                  th: t("project.editor.placeholders.contentThai"),
                }}
              />
            </div>
          </section>

          {/* ===============================
              CATEGORY
          =============================== */}

          <ProjectCategorySection
            companyId={companyId}
            categories={categories}
            categoryId={form.categoryId}
            subCategoryId={form.subCategoryId}
            onCategoryChange={(categoryId) =>
              setForm((current) => ({
                ...current,

                categoryId,

                /*
                 * Sub-category becomes
                 * invalid when parent
                 * category changes.
                 */
                subCategoryId:
                  current.categoryId === categoryId
                    ? current.subCategoryId
                    : null,
              }))
            }
            onSubCategoryChange={(subCategoryId) =>
              setForm((current) => ({
                ...current,

                subCategoryId,
              }))
            }
          />

          {/* ===============================
              PROJECT INFORMATION
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
              title={t("project.projectInformation")}
              description={t("project.editor.projectInfoDescription")}
            />

            <div
              className="
                mt-5

                grid
                gap-5
              "
            >
              {/* LOCATION */}

              <LocalizedFormField
                label={t("project.fields.location")}
                value={form.projectInfo.location}
                onChange={(language, value) =>
                  updateProjectInfoLocalized("location", language, value)
                }
              />

              {/* CLIENT */}

              <LocalizedFormField
                label={t("project.fields.client")}
                value={form.projectInfo.client}
                onChange={(language, value) =>
                  updateProjectInfoLocalized("client", language, value)
                }
              />

              {/* YEARS */}

              <div
                className="
                  grid
                  gap-5

                  sm:grid-cols-2
                "
              >
                <FormField
                  label={t("project.fields.designYear")}
                  hint={t("project.editor.yearHint")}
                >
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1900"
                    max="2200"
                    value={form.projectInfo.designYear ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        projectInfo: {
                          ...current.projectInfo,

                          designYear: event.target.value,
                        },
                      }))
                    }
                    placeholder="2024"
                    className="
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
                </FormField>

                <FormField
                  label={t("project.fields.completionYear")}
                  hint={t("project.editor.yearHint")}
                >
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1900"
                    max="2200"
                    value={form.projectInfo.completionYear ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        projectInfo: {
                          ...current.projectInfo,

                          completionYear: event.target.value,
                        },
                      }))
                    }
                    placeholder="2025"
                    className="
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
                </FormField>
              </div>

              {/* AREA */}

              <div
                className="
                  grid
                  gap-3

                  sm:grid-cols-[minmax(0,1fr)_160px]
                "
              >
                <FormField
                  label={t("project.fields.area")}
                  infoTitle={t("project.editor.area.infoTitle")}
                  infoContent={t("project.editor.area.infoDescription")}
                >
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.projectInfo.area.value ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        projectInfo: {
                          ...current.projectInfo,

                          area: {
                            ...current.projectInfo.area,

                            value: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="450"
                    className="
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
                </FormField>

                <FormField label={t("project.fields.unit")}>
                  <select
                    value={form.projectInfo.area.unit}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        projectInfo: {
                          ...current.projectInfo,

                          area: {
                            ...current.projectInfo.area,

                            unit: event.target.value,
                          },
                        },
                      }))
                    }
                    className="
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
                    <option value="sqm">m²</option>

                    <option value="sqft">ft²</option>

                    <option value="rai">{t("project.editor.units.rai")}</option>
                  </select>
                </FormField>
              </div>
            </div>
          </section>

          {/* ===============================
              CREDITS
          =============================== */}

          <ProjectCreditsSection
            credits={form.projectInfo.credits}
            onChange={(credits) =>
              setForm((current) => ({
                ...current,

                projectInfo: {
                  ...current.projectInfo,

                  credits,
                },
              }))
            }
          />

          {/* ===============================
              TAGS
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
              title={t("project.tags")}
              description={t("project.editor.tagsDescription")}
            />

            <div className="mt-4">
              <TagInput
                value={form.tags}
                suggestions={tagSuggestions}
                loadingSuggestions={tagSuggestionsLoading}
                placeholder={t("project.editor.tagsPlaceholder")}
                onChange={(tags) =>
                  setForm((current) => ({
                    ...current,

                    tags,

                    seo: syncSeoKeywordsSource({
                      seo: current.seo,

                      previousSource: current.tags,

                      nextSource: tags,
                    }),
                  }))
                }
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
                    {t("project.editor.featured.title")}
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
                    {t("project.editor.featured.description")}
                  </span>
                </span>
              </span>
            </label>
          </section>

          {/* ===============================
              MEDIA
          =============================== */}

          <ProjectMediaSection
            companyId={companyId}
            featuredImage={form.featuredImage}
            gallery={form.gallery}
            /*
             * Project listing on the Public website
             * displays the project cover as a square.
             *
             * Keep the Admin crop aligned with
             * the actual Public presentation.
             */
            coverCropPreset="square"
            coverPreviewClassName="aspect-square"
            onFeaturedImageChange={(featuredImage) =>
              setForm((current) => ({
                ...current,

                featuredImage,

                seo: syncSeoImageSource({
                  seo: current.seo,

                  previousSource: current.featuredImage,

                  nextSource: featuredImage,
                }),
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

          <ProjectSeoSection
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
          <div
            className="
              admin-text-11
              leading-[1.55]

              text-[var(--admin-muted)]
            "
          >
            {t("project.editor.saveHint")}
          </div>

          <div
            className="
              flex
              shrink-0
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
              type="button"
              onClick={handleSave}
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
              ) : (
                <Save size={15} />
              )}

              {saving
                ? t("common.saving")
                : project
                  ? t("common.saveChanges")
                  : t("common.create")}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
