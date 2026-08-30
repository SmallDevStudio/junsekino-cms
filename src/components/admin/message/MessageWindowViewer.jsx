"use client";

import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import MessageReaderAvatars from "./MessageReaderAvatars";

function localized(value, locale) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return locale === "th"
    ? value.th || value.en || ""
    : value.en || value.th || "";
}

function formatDate(value, locale) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "long",

    timeStyle: "short",
  }).format(date);
}

function displayValue(value, t) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

export default function MessageWindowViewer({ submissionId }) {
  const { activeCompanyId } = useCompanyWorkspace();

  const { t, locale } = useAdminTranslation();

  const [item, setItem] = useState(null);

  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeCompanyId || !submissionId) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/form-submissions/${encodeURIComponent(
          submissionId,
        )}?includeDeleted=1`,
        {
          cache: "no-store",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("messages.errors.loadFailed"));
      }

      let loaded = payload.data;

      if (!loaded.deletedAt && loaded.readByCurrentUser !== true) {
        const readResponse = await fetch(
          `/api/v1/companies/${activeCompanyId}/form-submissions/${encodeURIComponent(
            submissionId,
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type": "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              action: "mark_read",
            }),
          },
        );

        const readPayload = await readResponse.json();

        if (readResponse.ok && readPayload?.success !== false) {
          loaded = readPayload.data;
        }
      }

      setItem(loaded);
    } catch (error) {
      console.error("Load message window error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, submissionId, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[70vh]

          items-center
          justify-center
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

  if (!item) {
    return (
      <div
        className="
          py-20

          text-center

          admin-text-12

          text-[var(--admin-muted)]
        "
      >
        {t("messages.errors.notFound")}
      </div>
    );
  }

  const fields = Array.isArray(item.fieldsSnapshot)
    ? item.fieldsSnapshot.filter(
        (field) =>
          field?.enabled !== false &&
          !["heading", "paragraph"].includes(field?.type),
      )
    : [];

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1100px]

        py-6
      "
    >
      <button
        type="button"
        onClick={() => window.close()}
        className="
          inline-flex
          items-center
          gap-2

          admin-text-10
          font-medium

          text-[var(--admin-muted)]

          hover:text-[var(--company-primary)]
        "
      >
        <ArrowLeft size={14} />

        {t("messages.window.back")}
      </button>

      <article
        className="
          mt-5

          rounded-3xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          p-6

          sm:p-8
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5

            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                admin-text-9
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              {t("messages.drawer.sectionLabel")}
            </div>

            <h1
              className="
                mt-2

                admin-text-24
                font-semibold

                text-[var(--admin-foreground)]
              "
            >
              {localized(item.formName, locale) ||
                t("messages.fallbackMessage")}
            </h1>

            <div
              className="
                mt-2

                admin-text-10

                text-[var(--admin-muted)]
              "
            >
              {formatDate(item.createdAt, locale)}
            </div>
          </div>

          <MessageReaderAvatars readBy={item.readBy} max={4} size="md" />
        </div>

        <div
          className="
            mt-8

            flex
            items-center
            gap-2
          "
        >
          <Mail
            size={15}
            className="
              text-[var(--company-primary)]
            "
          />

          <h2
            className="
              admin-text-13
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {t("messages.drawer.messageInformation")}
          </h2>
        </div>

        <div
          className="
            mt-4

            divide-y
            divide-[var(--admin-border)]

            rounded-2xl

            border
            border-[var(--admin-border)]
          "
        >
          {fields.map((field) => (
            <div
              key={field.id}
              className="
                  grid
                  gap-2

                  px-5
                  py-4

                  sm:grid-cols-[180px_1fr]
                "
            >
              <div
                className="
                    admin-text-10
                    font-medium

                    text-[var(--admin-muted)]
                  "
              >
                {localized(field.label, locale) || field.id}
              </div>

              <div
                className="
                    whitespace-pre-wrap

                    admin-text-11
                    leading-[1.8]

                    text-[var(--admin-foreground)]
                  "
              >
                {displayValue(item.values?.[field.id], t)}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
