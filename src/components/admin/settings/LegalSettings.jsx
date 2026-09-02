"use client";

import {
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  History,
  LoaderCircle,
  Plus,
  Save,
  Send,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const DOCUMENT_TYPES = ["privacy", "cookies", "terms"];

const EMPTY_FORM = {
  title: {
    en: "",
    th: "",
  },

  content: {
    en: "",
    th: "",
  },

  changeSummary: {
    en: "",
    th: "",
  },

  effectiveAt: "",

  requireReConsent: false,
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeLocalized(value = {}) {
  return {
    en: value?.en || "",
    th: value?.th || "",
  };
}

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60 * 1000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function normalizeVersion(version) {
  return {
    ...version,

    title: normalizeLocalized(version?.title),

    content: normalizeLocalized(version?.content),

    changeSummary: normalizeLocalized(version?.changeSummary),
  };
}

function createForm(version = null) {
  if (!version) {
    return {
      ...EMPTY_FORM,

      title: {
        ...EMPTY_FORM.title,
      },

      content: {
        ...EMPTY_FORM.content,
      },

      changeSummary: {
        ...EMPTY_FORM.changeSummary,
      },
    };
  }

  return {
    title: normalizeLocalized(version.title),

    content: normalizeLocalized(version.content),

    changeSummary: normalizeLocalized(version.changeSummary),

    effectiveAt: toDateTimeLocal(version.effectiveAt),

    requireReConsent: version.requireReConsent === true,
  };
}

function createPayload(form) {
  return {
    title: {
      en: form.title.en.trim(),

      th: form.title.th.trim(),
    },

    content: {
      en: form.content.en,

      th: form.content.th,
    },

    changeSummary: {
      en: form.changeSummary.en.trim(),

      th: form.changeSummary.th.trim(),
    },

    effectiveAt: form.effectiveAt
      ? new Date(form.effectiveAt).toISOString()
      : null,

    requireReConsent: form.requireReConsent === true,
  };
}

function formatDate(value, locale) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",

    timeStyle: "short",
  }).format(date);
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function LegalSettings() {
  const { t, locale } = useAdminTranslation();

  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const [documentType, setDocumentType] = useState("privacy");

  const [language, setLanguage] = useState("en");

  const [versions, setVersions] = useState([]);

  const [selectedVersionId, setSelectedVersionId] = useState(null);

  const [form, setForm] = useState(createForm());

  const [creatingNew, setCreatingNew] = useState(true);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [publishing, setPublishing] = useState(false);

  const selectedVersion = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) || null,
    [versions, selectedVersionId],
  );

  const editable = creatingNew || selectedVersion?.status === "draft";

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  const loadVersions = useCallback(
    async ({ preferredVersionId = null } = {}) => {
      if (!activeCompanyId) {
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          `/api/v1/companies/${activeCompanyId}/legal/${documentType}`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("settings.legal.messages.loadFailed"),
          );
        }

        const loadedVersions = Array.isArray(payload?.data)
          ? payload.data.map(normalizeVersion)
          : [];

        setVersions(loadedVersions);

        const preferred =
          loadedVersions.find((version) => version.id === preferredVersionId) ||
          null;

        const draft =
          loadedVersions.find((version) => version.status === "draft") || null;

        const initial = preferred || draft || loadedVersions[0] || null;

        if (initial) {
          setSelectedVersionId(initial.id);

          setForm(createForm(initial));

          setCreatingNew(false);
        } else {
          setSelectedVersionId(null);

          setForm(createForm());

          setCreatingNew(true);
        }
      } catch (error) {
        console.error("Load legal versions error:", error);

        setVersions([]);

        setSelectedVersionId(null);

        setForm(createForm());

        setCreatingNew(true);

        toast.error(error?.message || t("settings.legal.messages.loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [activeCompanyId, documentType, t],
  );

  useEffect(() => {
    if (!activeCompanyId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      loadVersions();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, documentType, loadVersions]);

  /*
   * =======================================================
   * FORM
   * =======================================================
   */

  function updateLocalized(field, fieldLocale, value) {
    setForm((current) => ({
      ...current,

      [field]: {
        ...current[field],

        [fieldLocale]: value,
      },
    }));
  }

  function selectVersion(version) {
    if (saving || publishing) {
      return;
    }

    setSelectedVersionId(version.id);

    setForm(createForm(version));

    setCreatingNew(false);
  }

  function createNewDraft(source = null) {
    if (saving || publishing) {
      return;
    }

    setSelectedVersionId(null);

    setForm(createForm(source));

    setCreatingNew(true);

    setLanguage("en");
  }

  function validateForm() {
    const hasTitle = form.title.en.trim() || form.title.th.trim();

    const hasContent = form.content.en.trim() || form.content.th.trim();

    if (!hasTitle) {
      toast.error(t("settings.legal.messages.titleRequired"));

      return false;
    }

    if (!hasContent) {
      toast.error(t("settings.legal.messages.contentRequired"));

      return false;
    }

    return true;
  }

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  async function saveDraft() {
    if (!activeCompanyId || saving || !editable) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const isExistingDraft =
        !creatingNew && selectedVersion?.status === "draft";

      const url = isExistingDraft
        ? `/api/v1/companies/${activeCompanyId}/legal/${documentType}/${selectedVersion.id}`
        : `/api/v1/companies/${activeCompanyId}/legal/${documentType}`;

      const response = await fetch(url, {
        method: isExistingDraft ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(createPayload(form)),
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("settings.legal.messages.saveFailed"),
        );
      }

      toast.success(
        isExistingDraft
          ? t("settings.legal.messages.updated")
          : t("settings.legal.messages.created"),
      );

      await loadVersions({
        preferredVersionId: payload?.data?.id || null,
      });
    } catch (error) {
      console.error("Save legal draft error:", error);

      toast.error(error?.message || t("settings.legal.messages.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * PUBLISH
   * =======================================================
   */

  async function publishDraft() {
    if (
      !activeCompanyId ||
      !selectedVersion ||
      selectedVersion.status !== "draft" ||
      publishing
    ) {
      return;
    }

    const confirmed = window.confirm(t("settings.legal.confirm.publish"));

    if (!confirmed) {
      return;
    }

    try {
      setPublishing(true);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/legal/${documentType}/publish`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            versionId: selectedVersion.id,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("settings.legal.messages.publishFailed"),
        );
      }

      toast.success(t("settings.legal.messages.published"));

      await loadVersions({
        preferredVersionId: selectedVersion.id,
      });
    } catch (error) {
      console.error("Publish legal version error:", error);

      toast.error(error?.message || t("settings.legal.messages.publishFailed"));
    } finally {
      setPublishing(false);
    }
  }

  /*
   * =======================================================
   * STATE
   * =======================================================
   */

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
        <LoaderCircle
          size={20}
          className="
            animate-spin
            text-[var(--company-primary)]
          "
        />
      </div>
    );
  }

  if (!activeCompany || !activeCompanyId) {
    return null;
  }

  return (
    <div className="grid gap-6">
      {/* =================================
          HEADER
      ================================= */}

      <div
        className="
          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4

            border-b
            border-[var(--admin-border)]

            px-5
            py-5

            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6
          "
        >
          <div className="flex items-start gap-3">
            <div
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
              <FileText size={17} />
            </div>

            <div>
              <h2 className="admin-text-16 font-semibold text-[var(--admin-foreground)]">
                {t("settings.legal.title")}
              </h2>

              <p className="mt-1 admin-text-10 leading-[1.6] text-[var(--admin-muted)]">
                {t("settings.legal.description")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => createNewDraft(selectedVersion)}
            disabled={saving || publishing}
            className="
              inline-flex
              h-10
              items-center
              justify-center
              gap-2

              rounded-xl

              border
              border-[var(--admin-border)]

              px-4

              admin-text-10
              font-semibold

              transition

              hover:bg-[var(--admin-hover)]

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <Plus size={15} />

            {t("settings.legal.actions.newDraft")}
          </button>
        </div>

        {/* DOCUMENT TYPES */}

        <div className="flex flex-wrap gap-2 px-5 py-4 sm:px-6">
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDocumentType(type)}
              disabled={saving || publishing}
              className={cn(
                "h-9 rounded-lg px-4",

                "admin-text-10 font-semibold",

                "transition",

                documentType === type
                  ? "bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
                  : "bg-[var(--admin-background)] text-[var(--admin-muted)] hover:text-[var(--admin-foreground)]",
              )}
            >
              {t(`settings.legal.types.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {/* =================================
          EDITOR
      ================================= */}

      <div
        className="
          grid
          gap-6

          xl:grid-cols-[270px_minmax(0,1fr)]
        "
      >
        {/* VERSION HISTORY */}

        <aside
          className="
            self-start

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            p-3
          "
        >
          <div className="flex items-center gap-2 px-2 py-2 admin-text-11 font-semibold">
            <History size={15} />

            {t("settings.legal.history.title")}
          </div>

          <div className="mt-2 grid gap-2">
            {versions.length === 0 ? (
              <div className="rounded-xl bg-[var(--admin-background)] px-3 py-5 text-center admin-text-9 text-[var(--admin-muted)]">
                {t("settings.legal.history.empty")}
              </div>
            ) : (
              versions.map((version) => {
                const active = version.id === selectedVersionId;

                return (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => selectVersion(version)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition",

                      active
                        ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
                        : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="admin-text-10 font-semibold text-[var(--admin-foreground)]">
                        {version.version
                          ? `v${version.version}`
                          : t("settings.legal.status.draft")}
                      </span>

                      <span
                        className={cn(
                          "rounded-full px-2 py-1 admin-text-8 font-semibold uppercase",

                          version.status === "published"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : version.status === "archived"
                              ? "bg-neutral-500/10 text-[var(--admin-muted)]"
                              : "bg-amber-500/10 text-amber-600",
                        )}
                      >
                        {t(`settings.legal.status.${version.status}`)}
                      </span>
                    </div>

                    <div className="mt-2 line-clamp-2 admin-text-9 text-[var(--admin-muted)]">
                      {version.title?.[language] ||
                        version.title?.en ||
                        version.title?.th ||
                        t("settings.legal.history.untitled")}
                    </div>

                    <div className="mt-2 flex items-center gap-1 admin-text-8 text-[var(--admin-muted)]">
                      <Clock3 size={11} />

                      {formatDate(
                        version.publishedAt || version.createdAt,
                        locale,
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* FORM */}

        <section
          className="
            overflow-hidden

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4

              border-b
              border-[var(--admin-border)]

              px-5
              py-4

              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-6
            "
          >
            <div>
              <div className="admin-text-12 font-semibold text-[var(--admin-foreground)]">
                {creatingNew
                  ? t("settings.legal.editor.newDraft")
                  : selectedVersion?.status === "draft"
                    ? t("settings.legal.editor.editDraft")
                    : t("settings.legal.editor.viewVersion")}
              </div>

              {!editable ? (
                <div className="mt-1 admin-text-9 text-[var(--admin-muted)]">
                  {t("settings.legal.editor.publishedReadonly")}
                </div>
              ) : null}
            </div>

            <div className="flex gap-2">
              {["en", "th"].map((editorLocale) => (
                <button
                  key={editorLocale}
                  type="button"
                  onClick={() => setLanguage(editorLocale)}
                  className={cn(
                    "h-9 rounded-lg px-3 admin-text-10 font-semibold transition",

                    language === editorLocale
                      ? "bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
                      : "bg-[var(--admin-background)] text-[var(--admin-muted)]",
                  )}
                >
                  {editorLocale === "en" ? "EN" : "TH"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:px-6">
            <label className="grid gap-1.5">
              <span className="admin-text-10 font-medium">
                {t("settings.legal.fields.title")}
              </span>

              <input
                value={form.title[language]}
                disabled={!editable}
                onChange={(event) =>
                  updateLocalized("title", language, event.target.value)
                }
                className="
                  h-11
                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-background)]

                  px-3

                  admin-text-11

                  outline-none

                  focus:border-[var(--company-primary)]

                  disabled:cursor-not-allowed
                  disabled:opacity-70
                "
              />
            </label>

            <label className="grid gap-1.5">
              <span className="admin-text-10 font-medium">
                {t("settings.legal.fields.content")}
              </span>

              <textarea
                rows={18}
                value={form.content[language]}
                disabled={!editable}
                onChange={(event) =>
                  updateLocalized("content", language, event.target.value)
                }
                className="
                  min-h-[420px]
                  resize-y
                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-background)]

                  px-4
                  py-3

                  font-mono
                  text-sm
                  leading-7

                  outline-none

                  focus:border-[var(--company-primary)]

                  disabled:cursor-not-allowed
                  disabled:opacity-70
                "
              />

              <span className="admin-text-8 text-[var(--admin-muted)]">
                {t("settings.legal.fields.contentHint")}
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="admin-text-10 font-medium">
                {t("settings.legal.fields.changeSummary")}
              </span>

              <textarea
                rows={3}
                value={form.changeSummary[language]}
                disabled={!editable}
                onChange={(event) =>
                  updateLocalized("changeSummary", language, event.target.value)
                }
                className="
                  resize-y
                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-background)]

                  px-3
                  py-3

                  admin-text-11

                  outline-none

                  focus:border-[var(--company-primary)]

                  disabled:cursor-not-allowed
                  disabled:opacity-70
                "
              />
            </label>

            <label className="grid gap-1.5">
              <span className="admin-text-10 font-medium">
                {t("settings.legal.fields.effectiveAt")}
              </span>

              <input
                type="datetime-local"
                value={form.effectiveAt}
                disabled={!editable}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    effectiveAt: event.target.value,
                  }))
                }
                className="
                  h-11
                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-background)]

                  px-3

                  admin-text-11

                  outline-none

                  focus:border-[var(--company-primary)]

                  disabled:cursor-not-allowed
                  disabled:opacity-70
                "
              />
            </label>

            <label
              className={cn(
                "flex items-start gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-4",

                editable ? "cursor-pointer" : "cursor-not-allowed opacity-70",
              )}
            >
              <input
                type="checkbox"
                checked={form.requireReConsent}
                disabled={!editable}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    requireReConsent: event.target.checked,
                  }))
                }
                className="
                  mt-1
                  h-4
                  w-4

                  accent-[var(--company-primary)]
                "
              />

              <span>
                <span className="block admin-text-10 font-semibold">
                  {t("settings.legal.fields.requireReConsent")}
                </span>

                <span className="mt-1 block admin-text-9 leading-[1.55] text-[var(--admin-muted)]">
                  {t("settings.legal.fields.requireReConsentDescription")}
                </span>
              </span>
            </label>
          </div>

          {/* ACTIONS */}

          <div
            className="
              flex
              flex-col
              gap-3

              border-t
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              px-5
              py-4

              sm:flex-row
              sm:justify-end
              sm:px-6
            "
          >
            {!editable && selectedVersion ? (
              <button
                type="button"
                onClick={() => createNewDraft(selectedVersion)}
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  px-4

                  admin-text-10
                  font-semibold
                "
              >
                <Copy size={15} />

                {t("settings.legal.actions.copyToDraft")}
              </button>
            ) : null}

            {editable ? (
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving || publishing}
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  px-4

                  admin-text-10
                  font-semibold

                  disabled:opacity-60
                "
              >
                {saving ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}

                {saving
                  ? t("settings.legal.actions.saving")
                  : t("settings.legal.actions.saveDraft")}
              </button>
            ) : null}

            {selectedVersion?.status === "draft" ? (
              <button
                type="button"
                onClick={publishDraft}
                disabled={saving || publishing}
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

                  disabled:opacity-60
                "
              >
                {publishing ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}

                {publishing
                  ? t("settings.legal.actions.publishing")
                  : t("settings.legal.actions.publish")}
              </button>
            ) : null}

            {selectedVersion?.status === "published" ? (
              <div className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500/10 px-4 admin-text-10 font-semibold text-emerald-600">
                <CheckCircle2 size={15} />

                {t("settings.legal.status.published")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
