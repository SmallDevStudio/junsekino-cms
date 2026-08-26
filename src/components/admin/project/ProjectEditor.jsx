"use client";

import { LoaderCircle, Send, Trash2, Undo2, X } from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/utils/cn";

function emptyLocalized() {
  return {
    th: "",
    en: "",
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
        architecture: project.projectInfo?.credits?.architecture || [],

        interior: project.projectInfo?.credits?.interior || [],

        landscape: project.projectInfo?.credits?.landscape || [],

        consultant: project.projectInfo?.credits?.consultant || [],
      },
    },

    tags: Array.isArray(project.tags) ? project.tags : [],

    featuredImage: project.featuredImage || null,

    gallery: Array.isArray(project.gallery) ? project.gallery : [],

    featured: project.featured === true,
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeYear(value) {
  if (value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeArea(value) {
  if (value === "") {
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

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizeProject(project));

      setTagInput("");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, project]);

  const rootCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          !category.parentId &&
          category.status === "active" &&
          !category.deletedAt,
      ),
    [categories],
  );

  const subCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.parentId === form.categoryId &&
          category.status === "active" &&
          !category.deletedAt,
      ),
    [categories, form.categoryId],
  );

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

  function addTag() {
    const value = tagInput.trim();

    if (!value) {
      return;
    }

    setForm((current) => {
      if (current.tags.includes(value)) {
        return current;
      }

      return {
        ...current,

        tags: [...current.tags, value],
      };
    });

    setTagInput("");
  }

  function removeTag(tag) {
    setForm((current) => ({
      ...current,

      tags: current.tags.filter((item) => item !== tag),
    }));
  }

  async function handleSave() {
    if (!companyId) {
      return;
    }

    if (!form.title.th.trim() && !form.title.en.trim()) {
      toast.error("Project title is required.");

      return;
    }

    if (!form.slug.trim()) {
      toast.error("Project slug is required.");

      return;
    }

    try {
      setSaving(true);

      const editing = Boolean(project?.id);

      const url = editing
        ? `/api/v1/companies/${companyId}/projects/${project.id}`
        : `/api/v1/companies/${companyId}/projects`;

      const payload = {
        slug: slugify(form.slug),

        title: form.title,

        excerpt: form.excerpt,

        content: form.content,

        categoryId: form.categoryId || null,

        subCategoryId: form.subCategoryId || null,

        projectInfo: form.projectInfo,

        tags: form.tags,

        featuredImage: form.featuredImage,

        gallery: form.gallery,

        featured: form.featured,
      };

      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Unable to save project.");
      }

      toast.success(editing ? "Project updated." : "Project created.");

      await onSaved?.(result.data);
    } catch (error) {
      console.error("Save project error:", error);

      toast.error(error?.message || "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[160] flex justify-end">
      <button
        type="button"
        aria-label="Close project editor"
        onClick={onClose}
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
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)]"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <section>
            <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
              Basic Information
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs font-medium text-[var(--admin-muted)]">
                  Title — Thai
                </span>

                <input
                  value={form.title.th}
                  onChange={(event) =>
                    updateLocalized("title", "th", event.target.value)
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--company-primary)]"
                />
              </label>

              <label>
                <span className="text-xs font-medium text-[var(--admin-muted)]">
                  Title — English
                </span>

                <input
                  value={form.title.en}
                  onChange={(event) => {
                    const value = event.target.value;

                    setForm((current) => ({
                      ...current,

                      title: {
                        ...current.title,
                        en: value,
                      },

                      slug: current.slug || slugify(value),
                    }));
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--company-primary)]"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-medium text-[var(--admin-muted)]">
                Slug
              </span>

              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    slug: event.target.value,
                  }))
                }
                placeholder="house-project-2026"
                className="mt-2 h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--company-primary)]"
              />
            </label>
          </section>

          <section className="mt-10">
            <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
              Category
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs font-medium text-[var(--admin-muted)]">
                  Category
                </span>

                <select
                  value={form.categoryId || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      categoryId: event.target.value || null,

                      subCategoryId: null,
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm"
                >
                  <option value="">No category</option>

                  {rootCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name?.en || category.name?.th || category.slug}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-medium text-[var(--admin-muted)]">
                  Sub-category
                </span>

                <select
                  value={form.subCategoryId || ""}
                  disabled={!form.categoryId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      subCategoryId: event.target.value || null,
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm disabled:opacity-50"
                >
                  <option value="">No sub-category</option>

                  {subCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name?.en || category.name?.th || category.slug}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="mt-10">
            <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
              Project Information
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs text-[var(--admin-muted)]">
                  Location — Thai
                </span>

                <input
                  value={form.projectInfo.location.th}
                  onChange={(event) =>
                    updateProjectInfoLocalized(
                      "location",
                      "th",
                      event.target.value,
                    )
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] px-3 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-[var(--admin-muted)]">
                  Location — English
                </span>

                <input
                  value={form.projectInfo.location.en}
                  onChange={(event) =>
                    updateProjectInfoLocalized(
                      "location",
                      "en",
                      event.target.value,
                    )
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] px-3 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-[var(--admin-muted)]">
                  Design Year
                </span>

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

                        designYear: normalizeYear(event.target.value),
                      },
                    }))
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] px-3 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-[var(--admin-muted)]">
                  Completion Year
                </span>

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

                        completionYear: normalizeYear(event.target.value),
                      },
                    }))
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] px-3 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-[var(--admin-muted)]">Area</span>

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

                          value: normalizeArea(event.target.value),
                        },
                      },
                    }))
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] px-3 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-[var(--admin-muted)]">Unit</span>

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
                  className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] px-3 text-sm"
                >
                  <option value="sqm">sqm</option>

                  <option value="sqft">sqft</option>
                </select>
              </label>
            </div>
          </section>

          <section className="mt-10">
            <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
              Content
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-xs text-[var(--admin-muted)]">
                  Excerpt — Thai
                </span>

                <textarea
                  rows={4}
                  value={form.excerpt.th}
                  onChange={(event) =>
                    updateLocalized("excerpt", "th", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--admin-border)] p-3 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-[var(--admin-muted)]">
                  Excerpt — English
                </span>

                <textarea
                  rows={4}
                  value={form.excerpt.en}
                  onChange={(event) =>
                    updateLocalized("excerpt", "en", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--admin-border)] p-3 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-[var(--admin-muted)]">
                  Content — Thai
                </span>

                <textarea
                  rows={10}
                  value={form.content.th}
                  onChange={(event) =>
                    updateLocalized("content", "th", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--admin-border)] p-3 text-sm"
                />
              </label>

              <label>
                <span className="text-xs text-[var(--admin-muted)]">
                  Content — English
                </span>

                <textarea
                  rows={10}
                  value={form.content.en}
                  onChange={(event) =>
                    updateLocalized("content", "en", event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--admin-border)] p-3 text-sm"
                />
              </label>
            </div>
          </section>

          <section className="mt-10">
            <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
              Tags
            </h3>

            <div className="mt-4 flex gap-2">
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="architecture"
                className="h-10 flex-1 rounded-xl border border-[var(--admin-border)] px-3 text-sm"
              />

              <button
                type="button"
                onClick={addTag}
                className="h-10 rounded-xl border border-[var(--admin-border)] px-4 text-xs font-medium"
              >
                Add
              </button>
            </div>

            {form.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full bg-[var(--admin-hover)] px-3 py-1 text-xs text-[var(--admin-foreground)]"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    featured: event.target.checked,
                  }))
                }
              />

              <span className="text-sm text-[var(--admin-foreground)]">
                Featured Project
              </span>
            </label>
          </section>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--admin-border)] px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-xl px-4 text-sm font-medium text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
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
              "disabled:opacity-50",
            )}
          >
            {saving && <LoaderCircle size={15} className="animate-spin" />}

            {saving ? "Saving..." : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}
