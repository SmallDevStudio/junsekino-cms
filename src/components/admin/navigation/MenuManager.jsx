"use client";

import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  GripVertical,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";
import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";
import LocalizedFormField from "@/components/admin/localization/LocalizedFormField";

const SYSTEM_KEYS = new Set([
  "home",
  "about",
  "project",
  "award",
  "public",
  "contact",
]);

function createExternalItem() {
  return {
    key: `external-${Date.now().toString(36)}`,

    type: "external",

    label: {
      en: "",
      th: "",
    },

    path: "",

    url: "https://",

    enabled: true,

    openInNewTab: true,

    sortOrder: 0,
  };
}

function normalizeItems(items = []) {
  return [...items]
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item, index) => ({
      ...item,

      label: {
        en: item.label?.en || "",
        th: item.label?.th || "",
      },

      path: item.path || "",

      url: item.url || "",

      enabled: item.enabled !== false,

      openInNewTab: item.openInNewTab === true,

      sortOrder: (index + 1) * 10,
    }));
}

function MenuItemCard({
  item,
  index,
  total,
  saving,
  t,
  onChange,
  onMove,
  onRemove,
}) {
  const system = SYSTEM_KEYS.has(item.key);

  function update(field, value) {
    onChange(index, {
      ...item,

      [field]: value,
    });
  }

  function updateLabel(locale, value) {
    onChange(index, {
      ...item,

      label: {
        ...item.label,

        [locale]: value,
      },
    });
  }

  return (
    <article
      className="
        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]

        p-4
        sm:p-5
      "
    >
      <div className="flex items-start gap-3">
        <span
          className="
            mt-2
            hidden

            text-[var(--admin-muted-light)]

            sm:block
          "
        >
          <GripVertical size={17} />
        </span>

        <span
          className="
            flex
            h-10
            w-10
            shrink-0

            items-center
            justify-center

            rounded-xl

            bg-[var(--company-primary-soft)]

            text-[var(--company-primary)]
          "
        >
          {system ? <LockKeyhole size={16} /> : <ExternalLink size={16} />}
        </span>

        <div className="min-w-0 flex-1">
          <div
            className="
              flex
              flex-wrap
              items-start
              justify-between
              gap-3
            "
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className="
                    admin-text-12
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {item.label?.en || t("menuManagement.labels.newItem")}
                </h2>

                <span
                  className="
                    rounded-full

                    bg-[var(--admin-background)]

                    px-2
                    py-1

                    admin-text-8
                    font-semibold
                    uppercase
                    tracking-[0.1em]

                    text-[var(--admin-muted)]
                  "
                >
                  {system
                    ? t("menuManagement.types.system")
                    : t("menuManagement.types.external")}
                </span>
              </div>

              <p
                className="
                  mt-1

                  admin-text-9

                  text-[var(--admin-muted)]
                "
              >
                {system
                  ? `/${item.path || ""}`
                  : item.url || t("menuManagement.labels.externalUrl")}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onMove(index, -1)}
                disabled={saving || index === 0}
                aria-label={t("menuManagement.actions.moveUp")}
                title={t("menuManagement.actions.moveUp")}
                className="
                  flex
                  h-8
                  w-8

                  items-center
                  justify-center

                  rounded-lg

                  border
                  border-[var(--admin-border)]

                  text-[var(--admin-muted)]

                  transition

                  hover:bg-[var(--admin-hover)]
                  hover:text-[var(--admin-foreground)]

                  disabled:cursor-not-allowed
                  disabled:opacity-35
                "
              >
                <ArrowUp size={14} />
              </button>

              <button
                type="button"
                onClick={() => onMove(index, 1)}
                disabled={saving || index === total - 1}
                aria-label={t("menuManagement.actions.moveDown")}
                title={t("menuManagement.actions.moveDown")}
                className="
                  flex
                  h-8
                  w-8

                  items-center
                  justify-center

                  rounded-lg

                  border
                  border-[var(--admin-border)]

                  text-[var(--admin-muted)]

                  transition

                  hover:bg-[var(--admin-hover)]
                  hover:text-[var(--admin-foreground)]

                  disabled:cursor-not-allowed
                  disabled:opacity-35
                "
              >
                <ArrowDown size={14} />
              </button>

              {!system && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={saving}
                  aria-label={t("menuManagement.actions.delete")}
                  title={t("menuManagement.actions.delete")}
                  className="
                    flex
                    h-8
                    w-8

                    items-center
                    justify-center

                    rounded-lg

                    border
                    border-red-500/20

                    text-red-500

                    transition

                    hover:bg-red-500/10

                    disabled:opacity-50
                  "
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <LocalizedFormField
              label={t("menuManagement.fields.label")}
              value={item.label}
              onChange={updateLabel}
              required
              disabled={saving}
              maxLength={80}
              fieldName={`menu-${item.key}-label`}
            />
          </div>

          {!system && (
            <label className="mt-4 block">
              <span
                className="
                  admin-text-9
                  font-semibold
                  uppercase
                  tracking-[0.1em]

                  text-[var(--admin-muted)]
                "
              >
                {t("menuManagement.fields.externalUrl")}
              </span>

              <div className="relative mt-2">
                <Link2
                  size={14}
                  className="
                    absolute
                    left-3
                    top-1/2

                    -translate-y-1/2

                    text-[var(--admin-muted)]
                  "
                />

                <input
                  type="url"
                  value={item.url || ""}
                  onChange={(event) => update("url", event.target.value)}
                  disabled={saving}
                  placeholder={t("menuManagement.fields.externalPlaceholder")}
                  className="
                    h-10
                    w-full

                    rounded-xl

                    border
                    border-[var(--admin-border)]

                    bg-[var(--admin-background)]

                    pl-9
                    pr-3

                    admin-text-11

                    text-[var(--admin-foreground)]

                    outline-none
                    transition

                    focus:border-[var(--company-primary)]
                  "
                />
              </div>
            </label>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-5">
            <label
              className="
                inline-flex
                cursor-pointer
                items-center
                gap-2

                admin-text-10

                text-[var(--admin-foreground)]
              "
            >
              <input
                type="checkbox"
                checked={item.enabled !== false}
                onChange={(event) => update("enabled", event.target.checked)}
                disabled={saving}
                className="
                  h-4
                  w-4

                  accent-[var(--company-primary)]
                "
              />

              {t("menuManagement.fields.visible")}
            </label>

            {!system && (
              <label
                className="
                  inline-flex
                  cursor-pointer
                  items-center
                  gap-2

                  admin-text-10

                  text-[var(--admin-foreground)]
                "
              >
                <input
                  type="checkbox"
                  checked={item.openInNewTab === true}
                  onChange={(event) =>
                    update(
                      "openInNewTab",

                      event.target.checked,
                    )
                  }
                  disabled={saving}
                  className="
                    h-4
                    w-4

                    accent-[var(--company-primary)]
                  "
                />

                {t("menuManagement.fields.newTab")}
              </label>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MenuManager() {
  const { t } = useAdminTranslation();

  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const loadItems = useCallback(
    async (signal) => {
      if (!activeCompanyId) {
        setItems([]);

        setLoading(false);

        return;
      }

      setLoading(true);

      setError("");

      try {
        const response = await fetch(
          `/api/v1/companies/${encodeURIComponent(activeCompanyId)}/navigation`,

          {
            cache: "no-store",

            credentials: "same-origin",

            signal,
          },
        );

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || t("menuManagement.errors.load"));
        }

        setItems(normalizeItems(payload.data?.items));
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          console.error(
            "Load navigation error:",

            loadError,
          );

          setError(loadError.message || t("menuManagement.errors.load"));
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },

    [activeCompanyId, t],
  );

  useEffect(() => {
    const controller = new AbortController();

    /*
     * Start after the effect body to comply
     * with react-hooks/set-state-in-effect.
     */
    const timeoutId = window.setTimeout(() => {
      loadItems(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);

      controller.abort();
    };
  }, [loadItems]);

  const visibleCount = useMemo(
    () => items.filter((item) => item.enabled !== false).length,

    [items],
  );

  const externalCount = useMemo(
    () => items.filter((item) => item.type === "external").length,

    [items],
  );

  function updateItem(index, value) {
    setSuccess("");

    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function moveItem(index, direction) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    setSuccess("");

    setItems((current) => {
      const next = [...current];

      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

      return normalizeItems(next);
    });
  }

  function removeItem(index) {
    if (!window.confirm(t("menuManagement.confirm.delete"))) {
      return;
    }

    setSuccess("");

    setItems((current) =>
      normalizeItems(current.filter((_, itemIndex) => itemIndex !== index)),
    );
  }

  function addExternalItem() {
    setSuccess("");

    setItems((current) =>
      normalizeItems([
        ...current,

        {
          ...createExternalItem(),

          sortOrder: (current.length + 1) * 10,
        },
      ]),
    );
  }

  async function saveItems() {
    if (!activeCompanyId || saving) {
      return;
    }

    const missingEnglish = items.some((item) => !item.label?.en?.trim());

    if (missingEnglish) {
      setError(t("menuManagement.errors.englishRequired"));

      return;
    }

    const invalidExternal = items.some(
      (item) =>
        item.type === "external" && !/^https?:\/\//i.test(item.url || ""),
    );

    if (invalidExternal) {
      setError(t("menuManagement.errors.invalidExternal"));

      return;
    }

    setSaving(true);

    setError("");

    setSuccess("");

    try {
      const response = await fetch(
        `/api/v1/companies/${encodeURIComponent(activeCompanyId)}/navigation`,

        {
          method: "PATCH",

          credentials: "same-origin",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            items: normalizeItems(items),
          }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || t("menuManagement.errors.save"));
      }

      setItems(normalizeItems(payload.data?.items));

      setSuccess(t("menuManagement.messages.saved"));
    } catch (saveError) {
      console.error(
        "Save navigation error:",

        saveError,
      );

      setError(saveError.message || t("menuManagement.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  async function resetItems() {
    if (
      !activeCompanyId ||
      saving ||
      !window.confirm(t("menuManagement.confirm.reset"))
    ) {
      return;
    }

    setSaving(true);

    setError("");

    setSuccess("");

    try {
      const response = await fetch(
        `/api/v1/companies/${encodeURIComponent(activeCompanyId)}/navigation`,

        {
          method: "DELETE",

          credentials: "same-origin",
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || t("menuManagement.errors.reset"));
      }

      setItems(normalizeItems(payload.data?.items));

      setSuccess(t("menuManagement.messages.reset"));
    } catch (resetError) {
      console.error(
        "Reset navigation error:",

        resetError,
      );

      setError(resetError.message || t("menuManagement.errors.reset"));
    } finally {
      setSaving(false);
    }
  }

  if (companyLoading || loading) {
    return (
      <div
        className="
          flex
          min-h-[420px]

          items-center
          justify-center

          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]
        "
      >
        <div className="text-center text-[var(--admin-muted)]">
          <LoaderCircle className="mx-auto animate-spin" size={24} />

          <p className="mt-3 admin-text-11">{t("menuManagement.loading")}</p>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div
        className="
          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          p-8

          text-center
          admin-text-11
          text-[var(--admin-muted)]
        "
      >
        {t("menuManagement.noCompany")}
      </div>
    );
  }

  const companyName = activeCompany.name || activeCompany.slug;

  return (
    <div>
      <header
        className="
          flex
          flex-col
          gap-5

          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-2

              admin-text-10
              font-semibold
              uppercase
              tracking-[0.14em]

              text-[var(--company-primary)]
            "
          >
            <Menu size={14} />

            {t("menuManagement.eyebrow")}
          </div>

          <h1
            className="
              mt-2

              admin-text-28
              font-semibold
              tracking-[-0.03em]

              text-[var(--admin-foreground)]
            "
          >
            {t("menuManagement.title")}
          </h1>

          <p
            className="
              mt-2
              max-w-[720px]

              admin-text-12
              leading-[1.65]

              text-[var(--admin-muted)]
            "
          >
            {t(
              "menuManagement.description",

              {
                company: companyName,
              },
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadItems()}
            disabled={saving}
            className="
              inline-flex
              h-10

              items-center
              justify-center
              gap-2

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-3

              admin-text-10
              font-semibold

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]
              hover:text-[var(--admin-foreground)]

              disabled:opacity-50
            "
          >
            <RefreshCw size={14} />

            {t("common.refresh")}
          </button>

          <button
            type="button"
            onClick={resetItems}
            disabled={saving}
            className="
              inline-flex
              h-10

              items-center
              justify-center
              gap-2

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-3

              admin-text-10
              font-semibold

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]
              hover:text-[var(--admin-foreground)]

              disabled:opacity-50
            "
          >
            <RotateCcw size={14} />

            {t("common.reset")}
          </button>

          <button
            type="button"
            onClick={saveItems}
            disabled={saving}
            className="
              inline-flex
              h-10

              items-center
              justify-center
              gap-2

              rounded-xl

              bg-[var(--company-primary)]

              px-4

              admin-text-10
              font-semibold

              text-[var(--company-primary-foreground)]

              transition

              hover:opacity-90

              disabled:opacity-50
            "
          >
            {saving ? (
              <LoaderCircle className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}

            {saving ? t("common.saving") : t("menuManagement.actions.save")}
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div
          className="
            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            p-4
          "
        >
          <p
            className="
              admin-text-9
              uppercase
              tracking-[0.1em]

              text-[var(--admin-muted)]
            "
          >
            {t("menuManagement.summary.total")}
          </p>

          <p
            className="
              mt-2

              text-2xl
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {items.length}
          </p>
        </div>

        <div
          className="
            rounded-2xl

            border
            border-emerald-500/20

            bg-emerald-500/[0.08]

            p-4
          "
        >
          <p
            className="
              admin-text-9
              uppercase
              tracking-[0.1em]

              text-[var(--admin-muted)]
            "
          >
            {t("menuManagement.summary.visible")}
          </p>

          <p
            className="
              mt-2

              text-2xl
              font-semibold

              text-emerald-600
              dark:text-emerald-400
            "
          >
            {visibleCount}
          </p>
        </div>

        <div
          className="
            rounded-2xl

            border
            border-violet-500/20

            bg-violet-500/[0.08]

            p-4
          "
        >
          <p
            className="
              admin-text-9
              uppercase
              tracking-[0.1em]

              text-[var(--admin-muted)]
            "
          >
            {t("menuManagement.summary.external")}
          </p>

          <p
            className="
              mt-2

              text-2xl
              font-semibold

              text-violet-600
              dark:text-violet-400
            "
          >
            {externalCount}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="
            mt-5

            rounded-xl

            border
            border-red-500/25

            bg-red-500/10

            px-4
            py-3

            admin-text-10
            text-red-600

            dark:text-red-400
          "
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="
            mt-5

            rounded-xl

            border
            border-emerald-500/25

            bg-emerald-500/10

            px-4
            py-3

            admin-text-10
            text-emerald-600

            dark:text-emerald-400
          "
        >
          {success}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {items.map((item, index) => (
          <MenuItemCard
            key={item.key}
            item={item}
            index={index}
            total={items.length}
            saving={saving}
            t={t}
            onChange={updateItem}
            onMove={moveItem}
            onRemove={removeItem}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addExternalItem}
        disabled={saving || items.length >= 30}
        className="
          mt-4

          inline-flex
          h-11
          w-full

          items-center
          justify-center
          gap-2

          rounded-2xl

          border
          border-dashed
          border-[var(--company-primary-border)]

          bg-[var(--company-primary-soft)]

          admin-text-10
          font-semibold

          text-[var(--company-primary)]

          transition

          hover:opacity-80

          disabled:opacity-50
        "
      >
        <Plus size={15} />

        {t("menuManagement.actions.addExternal")}
      </button>
    </div>
  );
}
