"use client";

import { Eye, LoaderCircle, Mail, Save, X } from "lucide-react";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import CoverImageField from "@/components/admin/media/CoverImageField";

import LocalizedFormField from "@/components/admin/localization/LocalizedFormField";

import { PAGE_TYPE } from "@/constants/page";

import {
  applyContentSeoDefaults,
  syncSeoImageSource,
  syncSeoTextSource,
} from "@/utils/content-seo";

import CompanyContactProfileSummary from "./CompanyContactProfileSummary";

import ContentSeoSection from "@/components/admin/content/ContentSeoSection";

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
  return `contact-${Date.now().toString(36)}`;
}

function normalizeContact(
  contact,

  company,

  contactForm,
) {
  const profile = company?.profile || {};

  const profileAddress = profile.address || company?.address || {};

  return {
    coverCaption: {
      en: contact?.coverCaption?.en || "",

      th: contact?.coverCaption?.th || "",
    },

    /*
     * Display name and established year remain
     * page presentation data.
     */
    companyDisplayName: {
      en:
        contact?.companyDisplayName?.en ||
        company?.legalName ||
        company?.name ||
        "",

      th: contact?.companyDisplayName?.th || "",
    },

    establishedYear: contact?.establishedYear || "",

    /*
     * Company Profile is the canonical source.
     *
     * Contact Page data remains fallback for
     * existing records and migration safety.
     */
    address: {
      en: profileAddress?.en || contact?.address?.en || "",

      th: profileAddress?.th || contact?.address?.th || "",
    },

    telephone: profile.phone || company?.phone || contact?.telephone || "",

    email: profile.email || company?.email || contact?.email || "",

    form: {
      enabled: contact?.form?.enabled !== false,

      formId: contact?.form?.formId || contactForm?.id || null,

      formSlug: contact?.form?.formSlug || contactForm?.slug || "contact",
    },
  };
}

function normalizePage(page, company, contactForm) {
  if (!page) {
    const normalized = {
      slug: createVersionSlug(),

      pageType: PAGE_TYPE.CONTACT,

      title: {
        en: "Contact",

        th: "ติดต่อ",
      },

      excerpt: emptyLocalized(),

      content: emptyLocalized(),

      featuredImage: null,

      sections: [],

      navigation: {
        showInNavigation: false,

        label: {
          en: "Contact",

          th: "ติดต่อ",
        },

        sortOrder: 0,
      },

      contact: normalizeContact(null, company, contactForm),

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
      en: page.title?.en || "Contact",

      th: page.title?.th || "",
    },

    excerpt: {
      en: page.excerpt?.en || "",

      th: page.excerpt?.th || "",
    },

    content: page.content || emptyLocalized(),

    featuredImage: page.featuredImage || null,

    sections: Array.isArray(page.sections) ? page.sections : [],

    navigation: {
      showInNavigation: page.navigation?.showInNavigation === true,

      label: {
        en: page.navigation?.label?.en || "Contact",

        th: page.navigation?.label?.th || "ติดต่อ",
      },

      sortOrder: page.navigation?.sortOrder ?? 0,
    },

    contact: normalizeContact(page.contact, company, contactForm),

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
 * LOCALIZED TEXTAREA
 * =========================================================
 */

function LocalizedTextarea({
  label,

  value,

  onChange,

  rows = 4,

  disabled = false,
}) {
  return (
    <div
      className="
        grid
        gap-4

        lg:grid-cols-2
      "
    >
      {["en", "th"].map((locale) => (
        <label key={locale} className="block">
          <div
            className="
                admin-text-11
                font-medium

                text-[var(--admin-muted)]
              "
          >
            {label}{" "}
            <span
              className="
                  uppercase

                  text-[var(--company-primary)]
                "
            >
              {locale}
            </span>
          </div>

          <textarea
            rows={rows}
            disabled={disabled}
            value={value?.[locale] || ""}
            onChange={(event) =>
              onChange(
                locale,

                event.target.value,
              )
            }
            className="
                mt-2
                w-full
                resize-y

                rounded-xl

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]

                px-3
                py-3

                admin-text-13
                leading-[1.7]

                text-[var(--admin-foreground)]

                outline-none

                transition

                focus:border-[var(--company-primary)]

                focus:ring-2
                focus:ring-[var(--company-primary-soft)]

                disabled:bg-[var(--admin-background)]

                disabled:opacity-70
              "
          />
        </label>
      ))}
    </div>
  );
}

/*
 * =========================================================
 * EDITOR
 * =========================================================
 */

export default function ContactEditor({
  open,

  companyId,

  company,

  page,

  contactForm,

  readOnly = false,

  onClose,

  onSaved,
}) {
  const { t, errorMessage } = useAdminTranslation();

  const [form, setForm] = useState(() =>
    normalizePage(page, company, contactForm),
  );

  const [saving, setSaving] = useState(false);

  /*
   * =======================================================
   * RESET
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizePage(page, company, contactForm));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, page, company, contactForm]);

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * UPDATE
   * =======================================================
   */

  function updatePageLocalized(field, locale, value) {
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

  function updateContactLocalized(field, locale, value) {
    setForm((current) => ({
      ...current,

      contact: {
        ...current.contact,

        [field]: {
          ...current.contact?.[field],

          [locale]: value,
        },
      },
    }));
  }

  function updateContact(field, value) {
    setForm((current) => ({
      ...current,

      contact: {
        ...current.contact,

        [field]: value,
      },
    }));
  }

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
    if (!companyId || saving || readOnly) {
      return;
    }

    if (!form.title?.en?.trim()) {
      toast.error(t("contact.messages.titleRequired"));

      return;
    }

    if (
      form.contact?.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact.email)
    ) {
      toast.error(t("contact.messages.emailInvalid"));

      return;
    }

    setSaving(true);

    try {
      const editing = Boolean(page?.id);

      const body = {
        slug: form.slug,

        pageType: PAGE_TYPE.CONTACT,

        title: form.title,

        excerpt: form.excerpt,

        content: form.content,

        featuredImage: form.featuredImage,

        sections: form.sections || [],

        navigation: form.navigation,

        seo: form.seo,

        contact: {
          ...form.contact,

          form: {
            enabled: form.contact?.form?.enabled !== false,

            formId: contactForm?.id || form.contact?.form?.formId || null,

            formSlug:
              contactForm?.slug || form.contact?.form?.formSlug || "contact",
          },
        },
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

            payload?.message || t("contact.messages.saveFailed"),
          ),
        );
      }

      toast.success(
        editing ? t("contact.messages.updated") : t("contact.messages.created"),
      );

      await onSaved?.(payload?.data);
    } catch (error) {
      console.error("Save Contact error:", error);

      toast.error(error?.message || t("contact.messages.saveFailed"));
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
              {readOnly
                ? t("contact.preview.title")
                : page
                  ? t("contact.editTitle")
                  : t("contact.newVersionTitle")}
            </h2>

            <p
              className="
                mt-1

                admin-text-12

                text-[var(--admin-muted)]
              "
            >
              {t("contact.editorDescription")}
            </p>
          </div>

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
        </header>

        {/* BODY */}

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
          {/* PAGE */}

          <section>
            <h3
              className="
                admin-text-14
                font-semibold

                text-[var(--admin-foreground)]
              "
            >
              {t("contact.pageInformation")}
            </h3>

            <div className="mt-4">
              <LocalizedFormField
                label={t("project.fields.title")}
                value={form.title}
                required
                disabled={readOnly}
                onChange={(locale, value) =>
                  updatePageLocalized("title", locale, value)
                }
              />
            </div>

            <div className="mt-5">
              <LocalizedFormField
                label={t("contact.summary.label")}
                type="textarea"
                rows={4}
                value={form.excerpt}
                disabled={readOnly}
                onChange={(locale, value) =>
                  updatePageLocalized("excerpt", locale, value)
                }
                placeholder={{
                  en: t("contact.summary.placeholderEnglish"),

                  th: t("contact.summary.placeholderThai"),
                }}
                infoTitle={t("contact.summary.infoTitle")}
                infoContent={t("contact.summary.infoDescription")}
              />
            </div>
          </section>

          {/* COVER */}

          <section className="mt-10">
            <CoverImageField
              companyId={companyId}
              value={form.featuredImage}
              /*
               * Contact is now the shared
               * About / Contact page-cover
               * visual standard.
               */
              cropPreset="landscape"
              previewClassName="aspect-[17/10]"
              title={t("contact.cover.title")}
              description={t("contact.cover.description")}
              emptyTitle={t("contact.cover.none")}
              emptyDescription={t("contact.cover.emptyDescription")}
              selectLabel={t("contact.cover.select")}
              pickerTitle={t("contact.cover.dialogTitle")}
              disabled={saving || readOnly}
              onChange={updateFeaturedImage}
            />
          </section>

          {/* CAPTION */}

          <section className="mt-8">
            <LocalizedFormField
              label={t("contact.fields.coverCaption")}
              value={form.contact?.coverCaption}
              disabled={readOnly}
              onChange={(locale, value) =>
                updateContactLocalized(
                  "coverCaption",

                  locale,

                  value,
                )
              }
            />
          </section>

          {/* COMPANY INFO */}

          {/* COMPANY INFORMATION */}

          <section className="mt-10">
            <h3
              className="
                admin-text-14
                font-semibold

                text-[var(--admin-foreground)]
              "
            >
              {t("contact.companyInformation")}
            </h3>

            <p
              className="
                mt-1

                admin-text-12
                leading-[1.65]

                text-[var(--admin-muted)]
              "
            >
              {t("contact.companyInformationDescription")}
            </p>

            {/*
             * Display name and established year are
             * presentation fields belonging to the
             * Contact Page version.
             */}

            <div className="mt-5">
              <LocalizedFormField
                label={t("contact.fields.companyDisplayName")}
                value={form.contact?.companyDisplayName}
                disabled={readOnly}
                onChange={(locale, value) =>
                  updateContactLocalized(
                    "companyDisplayName",

                    locale,

                    value,
                  )
                }
              />
            </div>

            <div className="mt-5 max-w-sm">
              <label className="block">
                <span
                  className="
                    admin-text-11
                    font-medium

                    text-[var(--admin-muted)]
                  "
                >
                  {t("contact.fields.establishedYear")}
                </span>

                <input
                  type="text"
                  disabled={readOnly}
                  value={form.contact?.establishedYear || ""}
                  onChange={(event) =>
                    updateContact(
                      "establishedYear",

                      event.target.value,
                    )
                  }
                  className="
                    mt-2
                    h-11
                    w-full

                    rounded-xl

                    border
                    border-[var(--admin-border)]

                    bg-[var(--admin-surface)]

                    px-3

                    admin-text-13

                    outline-none

                    transition

                    focus:border-[var(--company-primary)]

                    focus:ring-2
                    focus:ring-[var(--company-primary-soft)]

                    disabled:bg-[var(--admin-background)]
                    disabled:opacity-70
                  "
                />
              </label>
            </div>

            {/*
             * Address, telephone, email, website and
             * business hours come from Company Profile.
             */}

            <CompanyContactProfileSummary company={company} locale="en" />
          </section>

          {/* FORM */}

          <section className="mt-10">
            <h3
              className="
                admin-text-14
                font-semibold

                text-[var(--admin-foreground)]
              "
            >
              {t("contact.form.title")}
            </h3>

            <div
              className="
                mt-4

                rounded-2xl

                border
                border-[var(--admin-border)]

                bg-[var(--admin-background)]

                p-5
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-4

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-10
                      w-10

                      items-center
                      justify-center

                      rounded-xl

                      bg-[var(--company-primary-soft)]

                      text-[var(--company-primary)]
                    "
                  >
                    <Mail size={17} />
                  </div>

                  <div>
                    <div
                      className="
                        admin-text-12
                        font-semibold
                      "
                    >
                      {contactForm?.name?.en || t("contact.form.defaultName")}
                    </div>

                    <div
                      className="
                        mt-0.5

                        admin-text-10

                        text-[var(--admin-muted)]
                      "
                    >
                      {contactForm
                        ? `${contactForm.slug} · ${contactForm.status}`
                        : t("contact.form.preparing")}
                    </div>
                  </div>
                </div>

                <label
                  className="
                    inline-flex
                    items-center
                    gap-2

                    admin-text-11
                    font-medium
                  "
                >
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={form.contact?.form?.enabled !== false}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        contact: {
                          ...current.contact,

                          form: {
                            ...current.contact?.form,

                            enabled: event.target.checked,
                          },
                        },
                      }))
                    }
                  />

                  {t("contact.form.enabled")}
                </label>
              </div>
            </div>
          </section>

          {!readOnly && (
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
          )}
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

              text-[var(--admin-muted)]
            "
          >
            {readOnly
              ? t("contact.preview.description")
              : t("contact.actions.saveHint")}
          </span>

          <div
            className="
              flex
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

                hover:bg-[var(--admin-hover)]
              "
            >
              {readOnly ? t("common.close") : t("common.cancel")}
            </button>

            {!readOnly && (
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
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
