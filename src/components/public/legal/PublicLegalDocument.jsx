import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import PublicRichText from "@/components/public/content/PublicRichText";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function localized(value, locale = "en", fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return value?.[locale] || value?.en || value?.th || fallback;
}

function removeLeadingMarkdownTitle(value) {
  if (typeof value !== "string") {
    return value;
  }

  /*
   * Legal drafts may already begin with an H1.
   *
   * The page renders the document title separately,
   * so remove only the first Markdown H1 to prevent
   * duplicate visible headings.
   */
  return value.replace(/^\s*#\s+[^\r\n]+(?:\r?\n)+/, "").trim();
}

function resolveContent(value, locale) {
  const content = localized(value, locale, "");

  return removeLeadingMarkdownTitle(content);
}

function formatEffectiveDate(value, locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",

    month: "long",

    year: "numeric",
  }).format(date);
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function PublicLegalDocument({
  document,

  companySlug,

  companyName,

  locale = "en",
}) {
  const title = localized(
    document?.title,

    locale,

    locale === "th" ? "เอกสารทางกฎหมาย" : "Legal Document",
  );

  const content = resolveContent(document?.content, locale);

  const effectiveDate = formatEffectiveDate(
    document?.effectiveAt,

    locale,
  );

  const version = document?.version || null;

  const homeHref = `/${encodeURIComponent(companySlug)}`;

  const alternateLocale = locale === "th" ? "en" : "th";

  const alternateHref = `/${encodeURIComponent(
    companySlug,
  )}/legal/${encodeURIComponent(document.type)}?lang=${alternateLocale}`;

  return (
    <main
      className="
        flex-1

        bg-[var(--public-background)]

        px-5
        pb-20
        pt-10

        text-[var(--public-foreground)]

        sm:px-8
        sm:pb-24
        sm:pt-14

        lg:px-12
      "
    >
      <div className="mx-auto w-full max-w-[920px]">
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
          "
        >
          <Link
            href={homeHref}
            className="
              inline-flex
              items-center
              gap-2

              text-[11px]
              font-medium
              uppercase
              tracking-[0.1em]

              text-[var(--public-muted-foreground)]

              transition-colors

              hover:text-[var(--public-primary)]

              focus-visible:outline-2
              focus-visible:outline-offset-4
              focus-visible:outline-[var(--public-primary)]
            "
          >
            <ArrowLeft size={14} strokeWidth={1.5} />

            {locale === "th" ? "กลับไปยังเว็บไซต์" : "Back to website"}
          </Link>

          <Link
            href={alternateHref}
            hrefLang={alternateLocale}
            className="
              rounded-full

              border
              border-[var(--public-border)]

              bg-[var(--public-surface)]

              px-3
              py-1.5

              text-[10px]
              font-medium
              uppercase
              tracking-[0.08em]

              text-[var(--public-muted-foreground)]

              transition-colors

              hover:border-[var(--public-primary)]
              hover:text-[var(--public-primary)]

              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[var(--public-primary)]
            "
          >
            {alternateLocale === "th" ? "ภาษาไทย" : "English"}
          </Link>
        </div>

        <header
          className="
            mt-10

            border-b
            border-[var(--public-border)]

            pb-8

            sm:mt-14
            sm:pb-10
          "
        >
          <p
            className="
              text-[10px]
              font-medium
              uppercase
              tracking-[0.14em]

              text-[var(--public-primary)]
            "
          >
            {companyName}
          </p>

          <h1
            className="
              mt-3

              text-[28px]
              font-medium
              leading-[1.2]
              tracking-[-0.035em]

              text-[var(--public-foreground)]

              sm:text-[36px]
            "
          >
            {title}
          </h1>

          {(effectiveDate || version) && (
            <div
              className="
                mt-5

                flex
                flex-wrap
                gap-x-5
                gap-y-2

                text-[10px]
                leading-[1.6]

                text-[var(--public-muted-foreground)]
              "
            >
              {effectiveDate && (
                <span>
                  {locale === "th" ? "วันที่มีผลบังคับใช้" : "Effective date"}:{" "}
                  <span className="text-[var(--public-foreground)]">
                    {effectiveDate}
                  </span>
                </span>
              )}

              {version && (
                <span>
                  {locale === "th" ? "เวอร์ชัน" : "Version"}:{" "}
                  <span className="text-[var(--public-foreground)]">
                    {version}
                  </span>
                </span>
              )}
            </div>
          )}
        </header>

        <article className="pt-8 sm:pt-10">
          {content ? (
            <PublicRichText
              value={content}
              className="
                [&_h2:first-child]:mt-0

                [&_table]:my-6
                [&_table]:w-full
                [&_table]:border-collapse

                [&_th]:border
                [&_th]:border-[var(--public-border)]
                [&_th]:bg-[var(--public-surface)]
                [&_th]:px-3
                [&_th]:py-2
                [&_th]:text-left
                [&_th]:text-[10px]
                [&_th]:font-semibold

                [&_td]:border
                [&_td]:border-[var(--public-border)]
                [&_td]:px-3
                [&_td]:py-2
                [&_td]:align-top
                [&_td]:text-[10px]
              "
            />
          ) : (
            <p className="text-sm text-[var(--public-muted-foreground)]">
              {locale === "th"
                ? "ยังไม่มีเนื้อหาสำหรับภาษานี้"
                : "Content is not available in this language."}
            </p>
          )}
        </article>

        <footer
          className="
            mt-12

            border-t
            border-[var(--public-border)]

            pt-6

            text-[10px]
            leading-[1.7]

            text-[var(--public-muted-foreground)]
          "
        >
          {locale === "th"
            ? `หากมีคำถามเกี่ยวกับเอกสารฉบับนี้ กรุณาติดต่อ ${companyName}`
            : `If you have questions about this document, please contact ${companyName}.`}
        </footer>
      </div>
    </main>
  );
}
