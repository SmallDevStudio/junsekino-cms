"use client";

import { LoaderCircle, Plus, X } from "lucide-react";

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { cn } from "@/utils/cn";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryName(category) {
  return (
    category?.name?.en?.trim() ||
    category?.name?.th?.trim() ||
    category?.slug ||
    "Untitled category"
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

function InlineCategoryForm({
  type,
  companyId,
  parentId = null,
  onCreated,
  onCancel,
}) {
  const [form, setForm] = useState(emptyCategoryForm);

  const [saving, setSaving] = useState(false);

  const title = type === "subcategory" ? "New Sub-category" : "New Category";

  async function handleCreate() {
    if (!companyId) {
      return;
    }

    if (!form.name.th.trim() && !form.name.en.trim()) {
      toast.error("Category name is required.");

      return;
    }

    const generatedSlug = slugify(form.slug || form.name.en || form.name.th);

    if (generatedSlug.length < 2) {
      toast.error("Please enter an English slug with at least 2 characters.");

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
            name: {
              th: form.name.th.trim(),
              en: form.name.en.trim(),
            },

            slug: generatedSlug,

            parentId: parentId || null,

            description: {
              th: "",
              en: "",
            },

            sortOrder: 0,

            status: "active",
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Unable to create category.");
      }

      toast.success(
        type === "subcategory" ? "Sub-category created." : "Category created.",
      );

      onCreated?.(result.data);
    } catch (error) {
      console.error("Create project category error:", error);

      toast.error(error?.message || "Unable to create category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-semibold text-[var(--admin-foreground)]">
          {title}
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="Cancel"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="text-[11px] text-[var(--admin-muted)]">
            Name — Thai
          </span>

          <input
            value={form.name.th}
            onChange={(event) =>
              setForm((current) => ({
                ...current,

                name: {
                  ...current.name,

                  th: event.target.value,
                },
              }))
            }
            className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--company-primary)]"
          />
        </label>

        <label>
          <span className="text-[11px] text-[var(--admin-muted)]">
            Name — English
          </span>

          <input
            value={form.name.en}
            onChange={(event) => {
              const value = event.target.value;

              setForm((current) => ({
                ...current,

                name: {
                  ...current.name,
                  en: value,
                },

                slug: current.slug || slugify(value),
              }));
            }}
            className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--company-primary)]"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-[11px] text-[var(--admin-muted)]">Slug</span>

        <input
          value={form.slug}
          onChange={(event) =>
            setForm((current) => ({
              ...current,

              slug: event.target.value,
            }))
          }
          placeholder="residential"
          className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm outline-none focus:border-[var(--company-primary)]"
        />
      </label>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="h-9 rounded-xl px-3 text-xs font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)]"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-2",
            "rounded-xl",
            "bg-[var(--company-primary)] px-4",
            "text-xs font-medium",
            "text-[var(--company-primary-foreground)]",
            "transition hover:opacity-90",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {saving ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}

          {saving ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}

export default function ProjectCategorySection({
  companyId,
  categories = [],
  categoryId,
  subCategoryId,
  onCategoryChange,
  onSubCategoryChange,
}) {
  const [localCategories, setLocalCategories] = useState(categories);

  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const [createSubCategoryOpen, setCreateSubCategoryOpen] = useState(false);

  /*
   * categories prop comes from ProjectManager.
   *
   * Newly-created inline categories remain inside this
   * component until ProjectManager reloads after Save.
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

  return (
    <section className="mt-10">
      <div>
        <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
          Category
        </h3>

        <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
          Assign the project to a category and optional sub-category.
        </p>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {/* Category */}

        <div>
          <label>
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              Category
            </span>

            <select
              value={categoryId || ""}
              onChange={(event) => {
                onCategoryChange?.(event.target.value || null);

                onSubCategoryChange?.(null);

                setCreateSubCategoryOpen(false);
              }}
              className="mt-2 h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none focus:border-[var(--company-primary)]"
            >
              <option value="">No category</option>

              {rootCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryName(category)}
                </option>
              ))}
            </select>
          </label>

          {!createCategoryOpen ? (
            <button
              type="button"
              onClick={() => setCreateCategoryOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--company-primary)] transition hover:opacity-70"
            >
              <Plus size={12} />
              Create new category
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

        {/* Sub-category */}

        <div>
          <label>
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              Sub-category
            </span>

            <select
              value={subCategoryId || ""}
              disabled={!categoryId}
              onChange={(event) =>
                onSubCategoryChange?.(event.target.value || null)
              }
              className="mt-2 h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none focus:border-[var(--company-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No sub-category</option>

              {subCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryName(category)}
                </option>
              ))}
            </select>
          </label>

          {categoryId && !createSubCategoryOpen && (
            <button
              type="button"
              onClick={() => setCreateSubCategoryOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--company-primary)] transition hover:opacity-70"
            >
              <Plus size={12} />
              Create new sub-category
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
            <p className="mt-2 text-[11px] text-[var(--admin-muted-light)]">
              Select a category first before creating a sub-category.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
