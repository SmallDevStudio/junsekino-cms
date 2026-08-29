"use client";

import {
  Eye,
  Image as ImageIcon,
  LoaderCircle,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import MediaPicker from "@/components/admin/media/MediaPicker";

import LocalizedFormField from "@/components/admin/localization/LocalizedFormField";

import LocalizedRichTextEditor from "@/components/admin/localization/LocalizedRichTextEditor";

import { PAGE_TYPE } from "@/constants/page";

import AboutPreviewDialog from "./AboutPreviewDialog";

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

function createVersionSlug() {
  return `about-${Date.now().toString(36)}`;
}

function normalizePage(page) {
  if (!page) {
    return {
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
    };
  }

  return {
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

    sections: Array.isArray(page.sections) ? page.sections : [],

    navigation: {
      showInNavigation: page.navigation?.showInNavigation === true,

      label: {
        en: page.navigation?.label?.en || "About",

        th: page.navigation?.label?.th || "",
      },

      sortOrder: page.navigation?.sortOrder ?? 0,
    },
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

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizePage(page));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, page]);

  if (!open) {
    return null;
  }

  function updateLocalized(field, locale, value) {
    setForm((current) => ({
      ...current,

      [field]: {
        ...current[field],

        [locale]: value,
      },
    }));
  }

  /*
   * =======================================================
   * MEDIA
   * =======================================================
   */

  function selectCover(media) {
    if (!media?.id) {
      return;
    }

    setForm((current) => ({
      ...current,

      featuredImage: {
        mediaId: media.id,

        alt: {
          en: media.alt?.en || "",

          th: media.alt?.th || "",
        },

        caption: {
          en: media.caption?.en || "",

          th: media.caption?.th || "",
        },

        presentation: {
          objectFit: "cover",

          aspectRatio: "16:8",

          focalPoint: {
            x: 0.5,
            y: 0.5,
          },

          zoom: 1,
        },
      },
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

          body: JSON.stringify({
            slug: form.slug,

            pageType: PAGE_TYPE.ABOUT,

            title: form.title,

            excerpt: form.excerpt,

            content: form.content,

            featuredImage: form.featuredImage,

            sections: form.sections || [],

            navigation: form.navigation,
          }),
        },
      );

      const payload = await response.json();

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

      await onSaved?.(payload.data);
    } catch (error) {
      console.error("Save About error:", error);

      toast.error(error?.message || t("about.messages.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

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
          {/* HEADER */}

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

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
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
                "
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* BODY */}

          <div
            className="
              min-h-0
              flex-1

              overflow-y-auto

              px-5
              py-6

              sm:px-8
              sm:py-8
            "
          >
            {/* PAGE INFORMATION */}

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

                    outline-none

                    transition

                    focus:border-[var(--company-primary)]

                    focus:ring-2
                    focus:ring-[var(--company-primary-soft)]
                  "
                />
              </div>
            </section>

            {/* COVER */}

            <section className="mt-10">
              <h3
                className="
                  admin-text-14
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("about.cover.title")}
              </h3>

              <p
                className="
                  mt-1

                  admin-text-12
                  leading-[1.65]

                  text-[var(--admin-muted)]
                "
              >
                {t("about.cover.description")}
              </p>

              <div
                className="
                  mt-4

                  rounded-2xl

                  border
                  border-[var(--admin-border)]

                  p-4
                "
              >
                {form.featuredImage?.mediaId ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-12
                        w-12

                        shrink-0

                        items-center
                        justify-center

                        rounded-xl

                        bg-[var(--company-primary-soft)]

                        text-[var(--company-primary)]
                      "
                    >
                      <ImageIcon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className="
                          admin-text-12
                          font-medium

                          text-[var(--admin-foreground)]
                        "
                      >
                        {t("about.cover.selected")}
                      </div>

                      <div
                        className="
                          mt-1
                          truncate

                          admin-text-10

                          text-[var(--admin-muted)]
                        "
                      >
                        {form.featuredImage.mediaId}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label={t("common.remove")}
                      title={t("common.remove")}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          featuredImage: null,
                        }))
                      }
                      className="
                        flex
                        h-9
                        w-9

                        items-center
                        justify-center

                        rounded-xl

                        text-red-500

                        transition

                        hover:bg-red-50
                      "
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <ImageIcon
                      size={18}
                      className="text-[var(--admin-muted)]"
                    />

                    <span
                      className="
                        admin-text-12
                        text-[var(--admin-muted)]
                      "
                    >
                      {t("about.cover.none")}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="
                    mt-4

                    inline-flex
                    h-10

                    items-center
                    gap-2

                    rounded-xl

                    border
                    border-[var(--admin-border)]

                    px-4

                    admin-text-12
                    font-medium

                    text-[var(--admin-foreground)]

                    transition

                    hover:border-[var(--company-primary-border)]

                    hover:bg-[var(--company-primary-soft)]

                    hover:text-[var(--company-primary)]
                  "
                >
                  <ImageIcon size={15} />

                  {form.featuredImage?.mediaId
                    ? t("about.cover.change")
                    : t("about.cover.select")}
                </button>
              </div>
            </section>

            {/* CONTENT */}

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
              </div>
            </section>
          </div>

          {/* FOOTER */}

          <footer
            className="
              flex
              shrink-0

              flex-col
              gap-3

              border-t
              border-[var(--admin-border)]

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

            <div className="flex shrink-0 items-center gap-2">
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

      <MediaPicker
        open={mediaPickerOpen}
        companyId={companyId}
        multiple={false}
        selectedIds={
          form.featuredImage?.mediaId ? [form.featuredImage.mediaId] : []
        }
        title={t("about.cover.dialogTitle")}
        onClose={() => setMediaPickerOpen(false)}
        onConfirm={selectCover}
      />

      <AboutPreviewDialog
        open={previewOpen}
        companyId={companyId}
        value={form}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
