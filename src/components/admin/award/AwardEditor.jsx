"use client";

import { LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import ContentMediaSection from "@/components/admin/content/ContentMediaSection";
import ContentSeoSection from "@/components/admin/content/ContentSeoSection";
import FormField from "@/components/admin/form/FormField";

import {
  clearFieldError,
  focusFirstInvalidField,
  getFieldError,
  getInvalidFieldClass,
  hasErrors,
  normalizeServerFieldErrors,
  validateAwardForm,
} from "@/utils/admin-form-validation";
import { cn } from "@/utils/cn";
import { slugify } from "@/utils/slug";

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

function normalizeYear(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : null;
}

function getProjectTitle(project) {
  return (
    project?.title?.en?.trim() ||
    project?.title?.th?.trim() ||
    project?.slug ||
    "Untitled project"
  );
}

export default function AwardEditor({
  open,
  companyId,
  award,
  projects = [],
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => normalizeAward(award));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const slugManuallyEditedRef = useRef(false);

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

  function applyValidationErrors(validationErrors) {
    setErrors(validationErrors);
    focusFirstInvalidField(validationErrors);

    toast.error("Please complete the required fields.");
  }

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

    const validationErrors = validateAwardForm(normalizedForm);

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

        if (response.ok && result?.success !== false) {
          setForm((current) => ({
            ...current,
            slug: currentSlug,
          }));

          slugManuallyEditedRef.current = true;

          toast.success(
            award
              ? "Award updated successfully."
              : "Award created successfully.",
          );

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
          (result?.code === "AWARD_SLUG_EXISTS" ||
            String(result?.message || "")
              .toLowerCase()
              .includes("slug"));

        if (!slugConflict) {
          throw new Error(result?.message || "Unable to save award.");
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
    } catch (saveError) {
      console.error("Save award error:", saveError);

      toast.error(saveError?.message || "Unable to save award.");
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
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        aria-label="Close award editor"
        className="absolute inset-0 bg-black/40"
        onClick={saving ? undefined : onClose}
      />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-5xl flex-col bg-[var(--admin-background)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-6">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Awards
            </div>

            <h2 className="mt-1 text-xl font-semibold text-[var(--admin-foreground)]">
              {award ? "Edit Award" : "New Award"}
            </h2>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--admin-border)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          id="award-editor-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto"
        >
          <div className="p-5 sm:p-6">
            <section>
              <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
                Basic Information
              </h3>

              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                Configure the award title, URL and related project.
              </p>

              <div
                data-form-field="title"
                className="mt-5 grid gap-4 sm:grid-cols-2"
              >
                <FormField
                  label="Title — English"
                  required
                  error={getFieldError(errors, "title")}
                >
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
                          !award && !slugManuallyEditedRef.current
                            ? slugify(value)
                            : current.slug,
                      }));

                      clearFieldError(setErrors, "title");

                      if (!award && !slugManuallyEditedRef.current) {
                        clearFieldError(setErrors, "slug");
                      }
                    }}
                    className={cn(
                      inputClass,
                      getInvalidFieldClass(errors.title),
                    )}
                  />
                </FormField>

                <FormField label="Title — ไทย" required>
                  <input
                    value={form.title.th}
                    aria-invalid={Boolean(errors.title)}
                    onChange={(event) =>
                      updateLocalized("title", "th", event.target.value)
                    }
                    className={cn(
                      inputClass,
                      getInvalidFieldClass(errors.title),
                    )}
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
                    placeholder="award-slug"
                    className={cn(
                      inputClass,
                      getInvalidFieldClass(errors.slug),
                    )}
                  />
                </FormField>
              </div>

              <FormField label="Linked Project" className="mt-4">
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
                  <option value="">No linked project</option>

                  {projects.map((projectItem) => (
                    <option key={projectItem.id} value={projectItem.id}>
                      {getProjectTitle(projectItem)}
                    </option>
                  ))}
                </select>
              </FormField>
            </section>

            <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
              <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
                Award Information
              </h3>

              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                Enter information provided by the awarding organization.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div data-form-field="awardName" className="contents">
                  <FormField
                    label="Award Name — English"
                    required
                    error={getFieldError(errors, "awardName")}
                  >
                    <input
                      value={form.awardInfo.name.en}
                      aria-invalid={Boolean(errors.awardName)}
                      onChange={(event) =>
                        updateAwardInfo("name", "en", event.target.value)
                      }
                      className={cn(
                        inputClass,
                        getInvalidFieldClass(errors.awardName),
                      )}
                    />
                  </FormField>

                  <FormField label="Award Name — ไทย" required>
                    <input
                      value={form.awardInfo.name.th}
                      aria-invalid={Boolean(errors.awardName)}
                      onChange={(event) =>
                        updateAwardInfo("name", "th", event.target.value)
                      }
                      className={cn(
                        inputClass,
                        getInvalidFieldClass(errors.awardName),
                      )}
                    />
                  </FormField>
                </div>

                {[
                  ["organization", "Organization"],
                  ["category", "Category"],
                  ["level", "Level"],
                ].map(([field, label]) => (
                  <div key={field} className="contents">
                    <FormField label={`${label} — English`}>
                      <input
                        value={form.awardInfo[field].en}
                        onChange={(event) =>
                          updateAwardInfo(field, "en", event.target.value)
                        }
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label={`${label} — ไทย`}>
                      <input
                        value={form.awardInfo[field].th}
                        onChange={(event) =>
                          updateAwardInfo(field, "th", event.target.value)
                        }
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                ))}
              </div>

              <div data-form-field="awardYear" className="mt-4 sm:max-w-xs">
                <FormField
                  label="Award Year"
                  error={getFieldError(errors, "awardYear")}
                >
                  <input
                    type="number"
                    min="1900"
                    max="2200"
                    value={form.awardInfo.year ?? ""}
                    aria-invalid={Boolean(errors.awardYear)}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,

                        awardInfo: {
                          ...current.awardInfo,
                          year: event.target.value,
                        },
                      }));

                      clearFieldError(setErrors, "awardYear");
                    }}
                    className={cn(
                      inputClass,
                      getInvalidFieldClass(errors.awardYear),
                    )}
                  />
                </FormField>
              </div>
            </section>

            <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
              <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
                Content
              </h3>

              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                Add short and long-form award descriptions in both languages.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
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

                <FormField label="Excerpt — ไทย">
                  <textarea
                    rows={4}
                    value={form.excerpt.th}
                    onChange={(event) =>
                      updateLocalized("excerpt", "th", event.target.value)
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

                <FormField label="Content — ไทย">
                  <textarea
                    rows={10}
                    value={form.content.th}
                    onChange={(event) =>
                      updateLocalized("content", "th", event.target.value)
                    }
                    className={textareaClass}
                  />
                </FormField>
              </div>
            </section>

            <ContentMediaSection
              companyId={companyId}
              contentLabel="Award"
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

            <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--admin-border)] p-4 sm:p-5">
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
                    Featured Award
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">
                    Highlight this award in supported public layouts.
                  </span>
                </span>
              </label>
            </section>

            <ContentSeoSection
              companyId={companyId}
              contentLabel="Award"
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

        <div className="flex items-center justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-6">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-10 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium text-[var(--admin-foreground)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="award-editor-form"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--company-primary)] px-5 text-sm font-medium text-[var(--company-primary-foreground)] transition hover:bg-[var(--company-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <LoaderCircle size={15} className="animate-spin" />}

            {saving ? "Saving..." : award ? "Save Changes" : "Create Award"}
          </button>
        </div>
      </div>
    </div>
  );
}
