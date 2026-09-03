"use client";

import {
  Award,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Contact,
  FileText,
  FolderKanban,
  Home,
  Image as ImageIcon,
  Info,
  Languages,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Mail,
  Menu,
  Newspaper,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useMemo, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import {
  ADMIN_DOCS_UPDATED_AT,
  ADMIN_DOCS_VERSION,
  getAdminDocs,
} from "@/constants/admin-docs";

/*
 * =========================================================
 * ICONS
 * =========================================================
 */

const ICONS = {
  rocket: Rocket,

  "layout-dashboard": LayoutDashboard,

  building: Building2,

  home: Home,

  info: Info,

  folder: FolderKanban,

  award: Award,

  newspaper: Newspaper,

  "file-text": FileText,

  contact: Contact,

  mail: Mail,

  image: ImageIcon,

  menu: Menu,

  users: Users,

  languages: Languages,

  bell: Bell,

  shield: ShieldCheck,

  search: Search,

  send: Send,

  "clipboard-check": ClipboardCheck,
};

/*
 * =========================================================
 * RECOMMENDED SETUP ORDER
 * =========================================================
 */

const QUICK_START_SECTION_IDS = [
  "localization",

  "company",

  "privacy",

  "media",

  "home",

  "navigation",

  "publishing",
];

/*
 * =========================================================
 * DATE
 * =========================================================
 */

function formatUpdatedDate(value, locale) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "2-digit",

    month: "short",

    year: "numeric",

    timeZone: "UTC",
  }).format(date);
}

/*
 * =========================================================
 * SECTION NAVIGATION
 * =========================================================
 */

function DocsNavigation({
  sections,

  activeId,

  onChange,

  title,
}) {
  return (
    <aside
      className="
        hidden
        min-w-0

        lg:block
      "
    >
      <div
        className="
          sticky
          top-6

          overflow-hidden

          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]
        "
      >
        <div
          className="
            border-b
            border-[var(--admin-border)]

            px-4
            py-4
          "
        >
          <div
            className="
              flex
              items-center
              gap-2

              admin-text-11
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            <ListChecks size={15} />

            {title}
          </div>
        </div>

        <nav
          aria-label={title}
          className="
            max-h-[calc(100vh-220px)]
            overflow-y-auto

            p-2
          "
        >
          {sections.map((section, index) => {
            const Icon = ICONS[section.icon] || FileText;

            const active = section.id === activeId;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onChange(section.id)}
                className={`
                  group

                  flex
                  w-full
                  min-w-0

                  items-center
                  gap-3

                  rounded-xl

                  px-3
                  py-2.5

                  text-left

                  transition

                  ${
                    active
                      ? "bg-[var(--company-primary-soft)]"
                      : "hover:bg-[var(--admin-hover)]"
                  }
                `}
                style={
                  active
                    ? {
                        color: "var(--company-primary)",
                      }
                    : undefined
                }
              >
                <span
                  className={`
                    flex
                    h-8
                    w-8
                    shrink-0

                    items-center
                    justify-center

                    rounded-lg

                    ${
                      active
                        ? "bg-[var(--company-primary)] !text-white"
                        : "bg-[var(--admin-background)] text-[var(--admin-muted)]"
                    }
                  `}
                >
                  <Icon size={14} strokeWidth={1.8} />
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`
                      block

                      admin-text-10
                      font-semibold

                      ${active ? "" : "text-[var(--admin-foreground)]"}
                    `}
                  >
                    {index + 1}. {section.title}
                  </span>
                </span>

                <ChevronRight
                  size={14}
                  className={`
                    shrink-0

                    transition-transform

                    ${
                      active
                        ? "translate-x-0 opacity-100"
                        : "text-[var(--admin-muted)] opacity-40 group-hover:translate-x-0.5 group-hover:opacity-100"
                    }
                  `}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

/*
 * =========================================================
 * MOBILE NAVIGATION
 * =========================================================
 */

function DocsMobileNavigation({
  sections,

  activeId,

  onChange,

  label,
}) {
  return (
    <div className="lg:hidden">
      <label
        htmlFor="docs-section"
        className="
          mb-2
          block

          admin-text-10
          font-semibold

          text-[var(--admin-foreground)]
        "
      >
        {label}
      </label>

      <select
        id="docs-section"
        value={activeId}
        onChange={(event) => onChange(event.target.value)}
        className="
          h-11
          w-full

          rounded-xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          px-3

          admin-text-11

          text-[var(--admin-foreground)]

          outline-none

          transition

          focus:border-[var(--company-primary)]
          focus:ring-2
          focus:ring-[var(--company-primary-soft)]
        "
      >
        {sections.map((section, index) => (
          <option key={section.id} value={section.id}>
            {index + 1}. {section.title}
          </option>
        ))}
      </select>
    </div>
  );
}

/*
 * =========================================================
 * NUMBERED STEPS
 * =========================================================
 */

function StepList({
  items,

  title,
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section>
      <div
        className="
          mb-4

          flex
          items-center
          gap-2
        "
      >
        <span
          className="
            flex
            h-8
            w-8

            items-center
            justify-center

            rounded-lg

            bg-blue-500/10

            text-blue-600
          "
        >
          <ListChecks size={15} />
        </span>

        <h2
          className="
            admin-text-13
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          {title}
        </h2>
      </div>

      <ol className="space-y-3">
        {items.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="
              flex
              gap-3

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              p-4
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

                admin-text-9
                font-semibold

                !text-white
              "
            >
              {index + 1}
            </span>

            <p
              className="
                pt-0.5

                admin-text-11
                leading-[1.7]

                text-[var(--admin-foreground)]
              "
            >
              {item}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/*
 * =========================================================
 * CHECKLIST
 * =========================================================
 */

function Checklist({
  items,

  title,
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section>
      <div
        className="
          mb-4

          flex
          items-center
          gap-2
        "
      >
        <span
          className="
            flex
            h-8
            w-8

            items-center
            justify-center

            rounded-lg

            bg-emerald-500/10

            text-emerald-600
          "
        >
          <ClipboardCheck size={15} />
        </span>

        <h2
          className="
            admin-text-13
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          {title}
        </h2>
      </div>

      <ul
        className="
          grid
          gap-3

          xl:grid-cols-2
        "
      >
        {items.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="
              flex
              items-start
              gap-3

              rounded-xl

              border
              border-emerald-500/20

              bg-emerald-500/[0.06]

              p-4
            "
          >
            <CheckCircle2
              size={17}
              className="
                mt-0.5
                shrink-0

                text-emerald-600
              "
            />

            <p
              className="
                admin-text-11
                leading-[1.7]

                text-[var(--admin-foreground)]
              "
            >
              {item}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/*
 * =========================================================
 * NOTES
 * =========================================================
 */

function Notes({
  items,

  title,
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section
      className="
        rounded-2xl

        border
        border-amber-500/20

        bg-amber-500/[0.07]

        p-5
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <span
          className="
            flex
            h-9
            w-9
            shrink-0

            items-center
            justify-center

            rounded-xl

            bg-amber-500/15

            text-amber-600
          "
        >
          <Lightbulb size={16} />
        </span>

        <div className="min-w-0">
          <h2
            className="
              admin-text-12
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {title}
          </h2>

          <ul
            className="
              mt-3
              space-y-2
            "
          >
            {items.map((item, index) => (
              <li
                key={`${index}-${item}`}
                className="
                  flex
                  gap-2

                  admin-text-10
                  leading-[1.7]

                  text-[var(--admin-muted)]
                "
              >
                <span
                  aria-hidden="true"
                  className="
                    mt-[9px]
                    h-1
                    w-1
                    shrink-0

                    rounded-full

                    bg-amber-500
                  "
                />

                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/*
 * =========================================================
 * WORKSPACE
 * =========================================================
 */

export default function DocsWorkspace() {
  const { locale, t } = useAdminTranslation();

  const sections = useMemo(
    () => getAdminDocs(locale),

    [locale],
  );

  const [activeId, setActiveId] = useState(
    sections[0]?.id || "getting-started",
  );

  const activeSection =
    sections.find((section) => section.id === activeId) || sections[0];

  const activeIndex = sections.findIndex(
    (section) => section.id === activeSection?.id,
  );

  const quickStartSections = QUICK_START_SECTION_IDS.map((sectionId) =>
    sections.find((section) => section.id === sectionId),
  ).filter(Boolean);

  const ActiveIcon = ICONS[activeSection?.icon] || FileText;

  function selectSection(sectionId) {
    setActiveId(sectionId);

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,

          behavior: "smooth",
        });
      });
    }
  }

  function goToRelativeSection(offset) {
    const nextIndex = activeIndex + offset;

    const nextSection = sections[nextIndex];

    if (nextSection) {
      selectSection(nextSection.id);
    }
  }

  if (!activeSection) {
    return null;
  }

  return (
    <div className="min-w-0">
      {/* =================================
          HEADER
      ================================= */}

      <header
        className="
          flex
          flex-col
          gap-4

          border-b
          border-[var(--admin-border)]

          pb-6

          xl:flex-row
          xl:items-end
          xl:justify-between
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
            <BookOpen size={14} />

            {t("docs.eyebrow")}
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
            {t("docs.title")}
          </h1>

          <p
            className="
              mt-2
              max-w-[760px]

              admin-text-12
              leading-[1.7]

              text-[var(--admin-muted)]
            "
          >
            {t("docs.description")}
          </p>
        </div>

        <div
          className="
            flex
            flex-wrap
            gap-2
          "
        >
          <span
            className="
              inline-flex
              items-center

              rounded-full

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-3
              py-1.5

              admin-text-9
              font-medium

              text-[var(--admin-muted)]
            "
          >
            {t("docs.version", {
              version: ADMIN_DOCS_VERSION,
            })}
          </span>

          <span
            className="
              inline-flex
              items-center

              rounded-full

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-3
              py-1.5

              admin-text-9
              font-medium

              text-[var(--admin-muted)]
            "
          >
            {t("docs.updated", {
              date: formatUpdatedDate(
                ADMIN_DOCS_UPDATED_AT,

                locale,
              ),
            })}
          </span>
        </div>
      </header>

      {/* =================================
    QUICK START
================================= */}

      <section
        className="
    mt-6
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
      gap-3

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
            <div
              className="
          flex
          items-center
          gap-2

          admin-text-11
          font-semibold

          text-[var(--admin-foreground)]
        "
            >
              <Rocket size={15} className="text-[var(--company-primary)]" />

              {t("docs.quickStart.title")}
            </div>

            <p
              className="
          mt-1

          admin-text-10
          leading-[1.6]

          text-[var(--admin-muted)]
        "
            >
              {t("docs.quickStart.description")}
            </p>
          </div>

          <span
            className="
        inline-flex
        w-fit

        rounded-full

        bg-[var(--company-primary-soft)]

        px-3
        py-1.5

        admin-text-9
        font-semibold

        text-[var(--company-primary)]
      "
          >
            {t("docs.quickStart.phase")}
          </span>
        </div>

        <div
          className="
      grid
      gap-px

      bg-[var(--admin-border)]

      sm:grid-cols-2
      xl:grid-cols-4
    "
        >
          {quickStartSections.map((section, index) => {
            const Icon = ICONS[section.icon] || FileText;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
                aria-label={t("docs.quickStart.open", {
                  title: section.title,
                })}
                className="
            group

            flex
            min-w-0
            items-center
            gap-3

            bg-[var(--admin-surface)]

            p-4

            text-left

            transition

            hover:bg-[var(--admin-hover)]
          "
              >
                <span
                  className="
              flex
              h-9
              w-9
              shrink-0

              items-center
              justify-center

              rounded-xl

              bg-[var(--company-primary-soft)]

              text-[var(--company-primary)]
            "
                >
                  <Icon size={15} strokeWidth={1.8} />
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className="
                block

                admin-text-9
                font-semibold
                uppercase
                tracking-[0.1em]

                text-[var(--admin-muted)]
              "
                  >
                    {t("docs.quickStart.step", {
                      number: index + 1,
                    })}
                  </span>

                  <span
                    className="
                mt-0.5
                block

                admin-text-10
                font-semibold

                text-[var(--admin-foreground)]
              "
                  >
                    {section.title}
                  </span>
                </span>

                <ChevronRight
                  size={14}
                  className="
              shrink-0

              text-[var(--admin-muted)]

              transition-transform

              group-hover:translate-x-0.5
              group-hover:text-[var(--company-primary)]
            "
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* =================================
          MOBILE SECTION SELECTOR
      ================================= */}

      <div className="mt-6">
        <DocsMobileNavigation
          sections={sections}
          activeId={activeSection.id}
          onChange={selectSection}
          label={t("docs.selectSection")}
        />
      </div>

      {/* =================================
          CONTENT LAYOUT
      ================================= */}

      <div
        className="
          mt-6

          grid
          min-w-0
          gap-6

          lg:grid-cols-[280px_minmax(0,1fr)]
        "
      >
        <DocsNavigation
          sections={sections}
          activeId={activeSection.id}
          onChange={selectSection}
          title={t("docs.contents")}
        />

        <main className="min-w-0">
          <article
            className="
              overflow-hidden

              rounded-2xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]
            "
          >
            {/* =============================
                ACTIVE SECTION HEADER
            ============================= */}

            <div
              className="
                border-b
                border-[var(--admin-border)]

                bg-gradient-to-br
                from-[var(--company-primary-soft)]
                to-transparent

                p-5

                sm:p-7
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-4
                "
              >
                <span
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0

                    items-center
                    justify-center

                    rounded-2xl

                    bg-[var(--company-primary)]

                    !text-white

                    shadow-sm
                  "
                >
                  <ActiveIcon size={19} strokeWidth={1.8} />
                </span>

                <div className="min-w-0">
                  <p
                    className="
                      admin-text-9
                      font-semibold
                      uppercase
                      tracking-[0.14em]

                      text-[var(--company-primary)]
                    "
                  >
                    {t("docs.section", {
                      current: activeIndex + 1,

                      total: sections.length,
                    })}
                  </p>

                  <h2
                    className="
                      mt-1

                      text-xl
                      font-semibold
                      tracking-[-0.02em]

                      text-[var(--admin-foreground)]

                      sm:text-2xl
                    "
                  >
                    {activeSection.title}
                  </h2>

                  <p
                    className="
                      mt-2
                      max-w-[760px]

                      admin-text-11
                      leading-[1.75]

                      text-[var(--admin-muted)]
                    "
                  >
                    {activeSection.description}
                  </p>
                </div>
              </div>
            </div>

            {/* =============================
                ACTIVE SECTION BODY
            ============================= */}

            <div
              className="
                space-y-8

                p-5

                sm:p-7
              "
            >
              <StepList items={activeSection.steps} title={t("docs.steps")} />

              <Checklist
                items={activeSection.checklist}
                title={t("docs.checklist")}
              />

              <Notes items={activeSection.notes} title={t("docs.notes")} />
            </div>

            {/* =============================
                PREVIOUS / NEXT
            ============================= */}

            <footer
              className="
                flex
                flex-col
                gap-3

                border-t
                border-[var(--admin-border)]

                bg-[var(--admin-background)]

                p-4

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <button
                type="button"
                disabled={activeIndex <= 0}
                onClick={() => goToRelativeSection(-1)}
                className="
                  inline-flex
                  min-h-10
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  px-4

                  admin-text-10
                  font-semibold

                  text-[var(--admin-foreground)]

                  transition

                  hover:bg-[var(--admin-hover)]

                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <ChevronRight size={14} className="rotate-180" />

                {t("common.previous")}
              </button>

              <button
                type="button"
                disabled={activeIndex >= sections.length - 1}
                onClick={() => goToRelativeSection(1)}
                className="
                  inline-flex
                  min-h-10
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  bg-[var(--company-primary)]

                  px-4

                  admin-text-10
                  font-semibold

                  !text-white

                  transition

                  hover:opacity-90

                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {t("common.next")}

                <ChevronRight size={14} />
              </button>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
}
