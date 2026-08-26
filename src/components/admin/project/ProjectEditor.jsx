"use client";

import { LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import FormField from "@/components/admin/form/FormField";
import TagInput from "@/components/admin/tag/TagInput";

import {
  clearFieldError,
  focusFirstInvalidField,
  getFieldError,
  getInvalidFieldClass,
  hasErrors,
  normalizeServerFieldErrors,
  validateProjectForm,
} from "@/utils/admin-form-validation";
import { cn } from "@/utils/cn";
import { slugify } from "@/utils/slug";

import ProjectCategorySection from "./ProjectCategorySection";
import ProjectCreditsSection from "./ProjectCreditsSection";
import ProjectMediaSection from "./ProjectMediaSection";
import ProjectSeoSection from "./ProjectSeoSection";

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

function normalizeProject(project) {
  if (!project) {
    return emptyForm();
  }

  return {
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
}

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

  return [...tags.values()].sort((a, b) =>
    a.localeCompare(b, "en", {
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

export default function ProjectEditor({
  open,
  companyId,
  project,
  categories = [],
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => normalizeProject(project));

  const [saving, setSaving] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [errors, setErrors] = useState({});

  const slugManuallyEditedRef = useRef(false);

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

  useEffect(() => {
    if (!open || !companyId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
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
            payload?.message || "Unable to retrieve project tags.",
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
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, companyId]);

  if (!open) {
    return null;
  }

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

  function applyValidationErrors(validationErrors) {
    setErrors(validationErrors);

    focusFirstInvalidField(validationErrors);

    toast.error("Please complete the required fields.");
  }

  async function handleSave() {
    if (!companyId || saving) {
      return;
    }

    const normalizedForm = {
      ...form,
      slug: slugify(form.slug),
    };

    const validationErrors = validateProjectForm(normalizedForm);

    if (hasErrors(validationErrors)) {
      applyValidationErrors(validationErrors);
      return;
    }

    const editing = Boolean(project?.id);

    const url = editing
      ? `/api/v1/companies/${companyId}/projects/${project.id}`
      : `/api/v1/companies/${companyId}/projects`;

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

        if (response.ok && result?.success !== false) {
          setForm((current) => ({
            ...current,
            slug: currentSlug,
          }));

          slugManuallyEditedRef.current = true;

          toast.success(editing ? "Project updated." : "Project created.");

          await onSaved?.(result?.data);

          return;
        }

        const serverErrors = normalizeServerFieldErrors(result?.errors);

        if (hasErrors(serverErrors)) {
          setErrors(serverErrors);
          focusFirstInvalidField(serverErrors);
        }

        const slugConflict =
          response.status === 409 &&
          (result?.code === "PROJECT_SLUG_EXISTS" ||
            String(result?.message || "")
              .toLowerCase()
              .includes("slug"));

        if (!slugConflict) {
          throw new Error(result?.message || "Unable to save project.");
        }

        const suggestedSlug = slugify(result?.suggestedSlug);

        if (!suggestedSlug || suggestedSlug === currentSlug) {
          const slugErrors = {
            slug: "This slug is already in use.",
          };

          setErrors(slugErrors);
          focusFirstInvalidField(slugErrors);

          toast.error(
            "This slug is already in use and no alternative slug is currently available.",
          );

          return;
        }

        const confirmed = window.confirm(
          `The slug "${currentSlug}" is already in use.\n\n` +
            `Would you like to use "${suggestedSlug}" instead?`,
        );

        if (!confirmed) {
          const slugErrors = {
            slug: "This slug is already in use.",
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
          throw new Error(
            "Unable to reserve an available slug. Please enter another slug.",
          );
        }
      }
    } catch (error) {
      console.error("Save project error:", error);

      toast.error(error?.message || "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = cn(
    "h-11 w-full rounded-xl",
    "border border-[var(--admin-border)]",
    "bg-[var(--admin-surface)] px-3",
    "text-sm text-[var(--admin-foreground)]",
    "outline-none transition",
    "placeholder:text-[var(--admin-muted-light)]",
    "focus:border-[var(--company-primary)]",
    "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
  );

  const smallInputClass = cn(inputClass, "h-10");

  const textareaClass = cn(
    "w-full rounded-xl",
    "border border-[var(--admin-border)]",
    "bg-[var(--admin-surface)] p-3",
    "text-sm text-[var(--admin-foreground)]",
    "outline-none transition",
    "placeholder:text-[var(--admin-muted-light)]",
    "focus:border-[var(--company-primary)]",
    "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
  );

  return (
    <div className="fixed inset-0 z-[160] flex justify-end">
      <button
        type="button"
        aria-label="Close project editor"
        onClick={saving ? undefined : onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
      />

      <div className="relative z-10 flex h-full w-full max-w-5xl flex-col bg-[var(--admin-surface)] shadow-2xl">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-[var(--admin-border)] px-5 sm:px-8">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--admin-foreground)]">
              {project ? "Edit Project" : "New Project"}
            </h2>

            <p className="mt-1 text-xs text-[var(--admin-muted)]">
              Project content and information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <section>
            <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
              Basic Information
            </h3>

            <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
              Enter the project title and URL. Fields marked with * are
              required.
            </p>

            <div
              data-form-field="title"
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <FormField
                label="Title — Thai"
                required
                error={getFieldError(errors, "title")}
              >
                <input
                  value={form.title.th}
                  aria-invalid={Boolean(errors.title)}
                  onChange={(event) =>
                    updateLocalized("title", "th", event.target.value)
                  }
                  className={cn(inputClass, getInvalidFieldClass(errors.title))}
                />
              </FormField>

              <FormField label="Title — English" required>
                <input
                  value={form.title.en}
                  aria-invalid={Boolean(errors.title)}
                  onChange={(event) => {
                    const value = event.target.value;

                    setForm((current) => ({
                      ...current,

                      title: {
                        ...current.title,
                        en: value,
                      },

                      slug:
                        !project && !slugManuallyEditedRef.current
                          ? slugify(value)
                          : current.slug,
                    }));

                    clearFieldError(setErrors, "title");

                    if (!project && !slugManuallyEditedRef.current) {
                      clearFieldError(setErrors, "slug");
                    }
                  }}
                  className={cn(inputClass, getInvalidFieldClass(errors.title))}
                />
              </FormField>
            </div>

            <div data-form-field="slug" className="mt-4">
              <FormField
                label="Slug"
                required
                error={getFieldError(errors, "slug")}
                hint="Lowercase letters, numbers and hyphens only."
              >
                <input
                  value={form.slug}
                  aria-invalid={Boolean(errors.slug)}
                  onChange={(event) => {
                    slugManuallyEditedRef.current = true;

                    setForm((current) => ({
                      ...current,

                      slug: slugify(event.target.value),
                    }));

                    clearFieldError(setErrors, "slug");
                  }}
                  placeholder="house-project-2026"
                  className={cn(inputClass, getInvalidFieldClass(errors.slug))}
                />
              </FormField>
            </div>
          </section>

          <ProjectCategorySection
            companyId={companyId}
            categories={categories}
            categoryId={form.categoryId}
            subCategoryId={form.subCategoryId}
            onCategoryChange={(categoryId) =>
              setForm((current) => ({
                ...current,
                categoryId,
                subCategoryId: null,
              }))
            }
            onSubCategoryChange={(subCategoryId) =>
              setForm((current) => ({
                ...current,
                subCategoryId,
              }))
            }
          />

          <ProjectMediaSection
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

          <section className="mt-10">
            <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
              Project Information
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Location — Thai">
                <input
                  value={form.projectInfo.location.th}
                  onChange={(event) =>
                    updateProjectInfoLocalized(
                      "location",
                      "th",
                      event.target.value,
                    )
                  }
                  className={smallInputClass}
                />
              </FormField>

              <FormField label="Location — English">
                <input
                  value={form.projectInfo.location.en}
                  onChange={(event) =>
                    updateProjectInfoLocalized(
                      "location",
                      "en",
                      event.target.value,
                    )
                  }
                  className={smallInputClass}
                />
              </FormField>

              <FormField label="Design Year">
                <input
                  type="number"
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
                  className={smallInputClass}
                />
              </FormField>

              <FormField label="Completion Year">
                <input
                  type="number"
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
                  className={smallInputClass}
                />
              </FormField>

              <FormField label="Area">
                <input
                  type="number"
                  min="0"
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
                  className={smallInputClass}
                />
              </FormField>

              <FormField label="Unit">
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
                  className={smallInputClass}
                >
                  <option value="sqm">sqm</option>

                  <option value="sqft">sqft</option>
                </select>
              </FormField>

              <FormField label="Client — Thai">
                <input
                  value={form.projectInfo.client.th}
                  onChange={(event) =>
                    updateProjectInfoLocalized(
                      "client",
                      "th",
                      event.target.value,
                    )
                  }
                  className={smallInputClass}
                />
              </FormField>

              <FormField label="Client — English">
                <input
                  value={form.projectInfo.client.en}
                  onChange={(event) =>
                    updateProjectInfoLocalized(
                      "client",
                      "en",
                      event.target.value,
                    )
                  }
                  className={smallInputClass}
                />
              </FormField>
            </div>
          </section>

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

          <section className="mt-10">
            <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
              Content
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Excerpt — Thai">
                <textarea
                  rows={4}
                  value={form.excerpt.th}
                  onChange={(event) =>
                    updateLocalized("excerpt", "th", event.target.value)
                  }
                  className={textareaClass}
                />
              </FormField>

              <FormField label="Excerpt — English">
                <textarea
                  rows={4}
                  value={form.excerpt.en}
                  onChange={(event) =>
                    updateLocalized("excerpt", "en", event.target.value)
                  }
                  className={textareaClass}
                />
              </FormField>

              <FormField label="Content — Thai">
                <textarea
                  rows={10}
                  value={form.content.th}
                  onChange={(event) =>
                    updateLocalized("content", "th", event.target.value)
                  }
                  className={textareaClass}
                />
              </FormField>

              <FormField label="Content — English">
                <textarea
                  rows={10}
                  value={form.content.en}
                  onChange={(event) =>
                    updateLocalized("content", "en", event.target.value)
                  }
                  className={textareaClass}
                />
              </FormField>
            </div>
          </section>

          <section className="mt-10">
            <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
              Tags
            </h3>

            <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
              Add keywords used for classification, search and related content.
            </p>

            <div className="mt-4">
              <TagInput
                value={form.tags}
                suggestions={tagSuggestions}
                placeholder="architecture"
                onChange={(tags) =>
                  setForm((current) => ({
                    ...current,
                    tags,
                  }))
                }
              />
            </div>
          </section>

          <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    featured: event.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 accent-[var(--company-primary)]"
              />

              <span>
                <span className="block text-sm font-medium text-[var(--admin-foreground)]">
                  Featured Project
                </span>

                <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">
                  Mark this project as featured for highlighted sections of the
                  website.
                </span>
              </span>
            </label>
          </section>

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

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-xl px-4 text-sm font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "inline-flex h-10 min-w-24 items-center justify-center gap-2",
              "rounded-xl",
              "bg-[var(--company-primary)] px-5",
              "text-sm font-medium",
              "text-[var(--company-primary-foreground)]",
              "transition hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {saving && <LoaderCircle size={15} className="animate-spin" />}

            {saving ? "Saving..." : project ? "Save Changes" : "Create Project"}
          </button>
        </footer>
      </div>
    </div>
  );
}
