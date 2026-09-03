"use client";

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
} from "lucide-react";

import Link from "next/link";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { getDocsContent } from "@/constants/docs-content";

import {
  findDocsArticle,
  getDocsSearchItems,
} from "@/constants/docs-navigation";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function ArticleSection({
  section,

  locale,
}) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <h2
        className="
          text-[19px]
          font-semibold
          tracking-[-0.02em]

          text-[var(--admin-foreground)]
        "
      >
        {section.title}
      </h2>

      {section.paragraphs?.map((paragraph, index) => (
        <p
          key={`${section.id}-paragraph-${index}`}
          className="
              mt-3

              max-w-[860px]

              text-[12px]
              leading-[1.9]

              text-[var(--admin-muted)]
            "
        >
          {paragraph}
        </p>
      ))}

      {section.items?.length > 0 && (
        <ul className="mt-4 space-y-3">
          {section.items.map((item, index) => (
            <li
              key={`${section.id}-item-${index}`}
              className="
                flex
                items-start
                gap-3

                text-[12px]
                leading-[1.75]

                text-[var(--admin-foreground)]
              "
            >
              <CheckCircle2
                size={16}
                className="
                  mt-0.5
                  shrink-0

                  text-emerald-600
                "
              />

              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {section.steps?.length > 0 && (
        <ol className="mt-5 space-y-4">
          {section.steps.map((step, index) => (
            <li
              key={`${section.id}-step-${index}`}
              className="
                flex
                items-start
                gap-4
              "
            >
              <span
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center

                  rounded-full

                  bg-[var(--company-primary)]

                  text-[10px]
                  font-semibold

                  !text-white
                "
              >
                {index + 1}
              </span>

              <p
                className="
                  pt-1

                  text-[12px]
                  leading-[1.75]

                  text-[var(--admin-foreground)]
                "
              >
                {step}
              </p>
            </li>
          ))}
        </ol>
      )}

      {section.notes?.length > 0 && (
        <div
          className="
            mt-5

            rounded-2xl

            border
            border-amber-500/25

            bg-amber-500/[0.07]

            p-4
          "
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={17}
              className="
                mt-0.5
                shrink-0

                text-amber-600
              "
            />

            <div>
              <h3
                className="
                  text-[11px]
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {locale === "th" ? "หมายเหตุสำคัญ" : "Important notes"}
              </h3>

              <ul className="mt-2 space-y-2">
                {section.notes.map((note, index) => (
                  <li
                    key={`${section.id}-note-${index}`}
                    className="
                        flex
                        gap-2

                        text-[10px]
                        leading-[1.7]

                        text-[var(--admin-muted)]
                      "
                  >
                    <span
                      className="
                          mt-[7px]
                          h-1
                          w-1
                          shrink-0

                          rounded-full

                          bg-amber-500
                        "
                    />

                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/*
 * =========================================================
 * PLACEHOLDER
 * =========================================================
 */

function PendingArticle({
  article,

  category,
  locale,
}) {
  return (
    <article
      className="
        overflow-hidden

        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]
      "
    >
      <div className="p-6 sm:p-8">
        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center

            rounded-2xl

            bg-[var(--company-primary-soft)]

            text-[var(--company-primary)]
          "
        >
          <Clock3 size={20} />
        </div>

        <p
          className="
            mt-6

            text-[9px]
            font-semibold
            uppercase
            tracking-[0.14em]

            text-[var(--company-primary)]
          "
        >
          {category.title}
        </p>

        <h1
          className="
            mt-2

            text-2xl
            font-semibold
            tracking-[-0.03em]

            text-[var(--admin-foreground)]

            sm:text-3xl
          "
        >
          {article.title}
        </h1>

        <p
          className="
            mt-3
            max-w-[720px]

            text-[12px]
            leading-[1.8]

            text-[var(--admin-muted)]
          "
        >
          {article.description}
        </p>

        <div
          className="
            mt-8

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-background)]

            p-5
          "
        >
          <p
            className="
              text-[11px]
              leading-[1.8]

              text-[var(--admin-muted)]
            "
          >
            {locale === "th"
              ? "คู่มือหัวข้อนี้กำลังอยู่ระหว่างจัดทำ คุณยังสามารถเลือกหัวข้ออื่นจาก Sidebar หรือค้นหาคู่มือจากช่อง Search ด้านบนได้"
              : "This guide is being prepared. You can select another article from the sidebar or use the documentation search above."}
          </p>
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * ARTICLE
 * =========================================================
 */

export default function DocsArticle({
  categoryId,

  articleId,
}) {
  const { locale } = useAdminTranslation();

  const resolved = findDocsArticle({
    categoryId,

    articleId,

    locale,
  });

  const content = getDocsContent({
    categoryId,

    articleId,

    locale,
  });

  if (!resolved) {
    return null;
  }

  const allArticles = getDocsSearchItems(locale);

  const currentIndex = allArticles.findIndex(
    (item) => item.categoryId === categoryId && item.id === articleId,
  );

  const previousArticle =
    currentIndex > 0 ? allArticles[currentIndex - 1] : null;

  const nextArticle =
    currentIndex >= 0 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  if (!content) {
    return (
      <PendingArticle
        article={resolved.article}
        category={resolved.category}
        locale={locale}
      />
    );
  }

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1120px]
      "
    >
      <nav
        aria-label="Breadcrumb"
        className="
          mb-5
          flex
          flex-wrap
          items-center
          gap-2

          text-[9px]
          font-medium

          text-[var(--admin-muted)]
        "
      >
        <Link href="/docs" className="hover:text-[var(--company-primary)]">
          Docs
        </Link>

        <ChevronRight size={11} />

        <span>{resolved.category.title}</span>

        <ChevronRight size={11} />

        <span className="text-[var(--admin-foreground)]">
          {resolved.article.title}
        </span>
      </nav>

      <article
        className="
          overflow-hidden

          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]
        "
      >
        <header
          className="
            border-b
            border-[var(--admin-border)]

            bg-gradient-to-br
            from-[var(--company-primary-soft)]
            to-transparent

            p-6

            sm:p-8
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center

              rounded-2xl

              bg-[var(--company-primary)]

              !text-white
            "
          >
            <BookOpen size={18} />
          </div>

          <p
            className="
              mt-5

              text-[9px]
              font-semibold
              uppercase
              tracking-[0.15em]

              text-[var(--company-primary)]
            "
          >
            {content.eyebrow}
          </p>

          <h1
            className="
              mt-2

              max-w-[820px]

              text-2xl
              font-semibold
              tracking-[-0.035em]

              text-[var(--admin-foreground)]

              sm:text-4xl
            "
          >
            {content.title}
          </h1>

          <p
            className="
              mt-4
              max-w-[820px]

              text-[12px]
              leading-[1.85]

              text-[var(--admin-muted)]

              sm:text-[13px]
            "
          >
            {content.description}
          </p>
        </header>

        <div className="p-6 sm:p-8">
          <section className="space-y-4">
            {content.introduction?.map((paragraph, index) => (
              <p
                key={`introduction-${index}`}
                className="
                    max-w-[860px]

                    text-[12px]
                    leading-[1.9]

                    text-[var(--admin-foreground)]
                  "
              >
                {paragraph}
              </p>
            ))}
          </section>

          {content.highlights?.length > 0 && (
            <section
              className="
                mt-8
                grid
                gap-3

                sm:grid-cols-2
              "
            >
              {content.highlights.map((highlight, index) => (
                <div
                  key={`highlight-${index}`}
                  className="
                      rounded-2xl

                      border
                      border-[var(--admin-border)]

                      bg-[var(--admin-background)]

                      p-5
                    "
                >
                  <h2
                    className="
                        text-[12px]
                        font-semibold

                        text-[var(--admin-foreground)]
                      "
                  >
                    {highlight.title}
                  </h2>

                  <p
                    className="
                        mt-2

                        text-[10px]
                        leading-[1.75]

                        text-[var(--admin-muted)]
                      "
                  >
                    {highlight.description}
                  </p>
                </div>
              ))}
            </section>
          )}

          <div
            className="
              mt-10
              space-y-10

              border-t
              border-[var(--admin-border)]

              pt-9
            "
          >
            {content.sections.map((section) => (
              <ArticleSection
                key={section.id}
                section={section}
                locale={locale}
              />
            ))}
          </div>
        </div>

        <footer
          className="
            grid
            gap-px

            border-t
            border-[var(--admin-border)]

            bg-[var(--admin-border)]

            sm:grid-cols-2
          "
        >
          <div className="bg-[var(--admin-surface)]">
            {previousArticle && (
              <Link
                href={previousArticle.href}
                className="
                  group
                  block
                  h-full

                  p-5

                  transition

                  hover:bg-[var(--admin-hover)]
                "
              >
                <span
                  className="
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]

                    text-[var(--admin-muted)]
                  "
                >
                  {locale === "th" ? "ก่อนหน้า" : "Previous"}
                </span>

                <span
                  className="
                    mt-2
                    flex
                    items-center
                    gap-2

                    text-[11px]
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  <ArrowRight size={13} className="rotate-180" />

                  {previousArticle.title}
                </span>
              </Link>
            )}
          </div>

          <div className="bg-[var(--admin-surface)]">
            {nextArticle && (
              <Link
                href={nextArticle.href}
                className="
                  group
                  block
                  h-full

                  p-5

                  text-right

                  transition

                  hover:bg-[var(--admin-hover)]
                "
              >
                <span
                  className="
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]

                    text-[var(--admin-muted)]
                  "
                >
                  {locale === "th" ? "ถัดไป" : "Next"}
                </span>

                <span
                  className="
                    mt-2
                    flex
                    items-center
                    justify-end
                    gap-2

                    text-[11px]
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {nextArticle.title}

                  <ArrowRight size={13} />
                </span>
              </Link>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
