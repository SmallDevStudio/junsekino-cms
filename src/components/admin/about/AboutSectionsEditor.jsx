"use client";

import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Copy,
  PanelLeft,
  PanelRight,
  Plus,
  Trash2,
} from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import LocalizedRichTextEditor from "@/components/admin/localization/LocalizedRichTextEditor";

import CoverImageField from "@/components/admin/media/CoverImageField";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * LAYOUT
 * =========================================================
 */

const ABOUT_SECTION_LAYOUT = {
  TEXT_ONLY: "text-only",

  IMAGE_LEFT: "image-left",

  IMAGE_RIGHT: "image-right",
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function createSectionId() {
  return `about-section-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function emptyLocalized() {
  return {
    en: "",
    th: "",
  };
}

/*
 * =========================================================
 * CREATE BLOCK
 * =========================================================
 */

function createTextBlock(sortOrder) {
  return {
    id: createSectionId(),

    type: "richText",

    enabled: true,

    sortOrder,

    data: {
      content: emptyLocalized(),

      width: "medium",

      textAlign: "left",
    },
  };
}

function createImageTextBlock(imagePosition, sortOrder) {
  return {
    id: createSectionId(),

    type: "imageText",

    enabled: true,

    sortOrder,

    data: {
      image: null,

      content: emptyLocalized(),

      imagePosition,

      imageWidth: "50",

      verticalAlign: "center",
    },
  };
}

/*
 * =========================================================
 * GET LAYOUT
 * =========================================================
 */

function getBlockLayout(block) {
  if (block?.type === "richText") {
    return ABOUT_SECTION_LAYOUT.TEXT_ONLY;
  }

  if (block?.type === "imageText" && block?.data?.imagePosition === "right") {
    return ABOUT_SECTION_LAYOUT.IMAGE_RIGHT;
  }

  return ABOUT_SECTION_LAYOUT.IMAGE_LEFT;
}

/*
 * =========================================================
 * CONVERT LAYOUT
 * =========================================================
 *
 * Preserve content when the user changes:
 *
 * Text → Image Left
 * Image Left → Text
 * Image Left → Image Right
 * =========================================================
 */

function convertBlockLayout(block, layout) {
  const content = block?.data?.content || emptyLocalized();

  const image = block?.type === "imageText" ? block.data?.image || null : null;

  if (layout === ABOUT_SECTION_LAYOUT.TEXT_ONLY) {
    return {
      id: block.id,

      type: "richText",

      enabled: block.enabled !== false,

      sortOrder: block.sortOrder ?? 0,

      data: {
        content,

        width: "medium",

        textAlign: "left",
      },
    };
  }

  return {
    id: block.id,

    type: "imageText",

    enabled: block.enabled !== false,

    sortOrder: block.sortOrder ?? 0,

    data: {
      image,

      content,

      imagePosition:
        layout === ABOUT_SECTION_LAYOUT.IMAGE_RIGHT ? "right" : "left",

      imageWidth: block?.data?.imageWidth || "50",

      verticalAlign: block?.data?.verticalAlign || "center",
    },
  };
}

/*
 * =========================================================
 * NORMALIZE ORDER
 * =========================================================
 */

function normalizeOrder(sections) {
  return sections.map((section, index) => ({
    ...section,

    sortOrder: index,
  }));
}

/*
 * =========================================================
 * SECTION CARD
 * =========================================================
 */

function AboutSectionCard({
  companyId,

  section,

  index,

  total,

  onChange,

  onMove,

  onDuplicate,

  onDelete,
}) {
  const { t } = useAdminTranslation();

  const layout = getBlockLayout(section);

  const hasImage = layout !== ABOUT_SECTION_LAYOUT.TEXT_ONLY;

  /*
   * =======================================================
   * LAYOUT
   * =======================================================
   */

  function changeLayout(nextLayout) {
    onChange(convertBlockLayout(section, nextLayout));
  }

  /*
   * =======================================================
   * CONTENT
   * =======================================================
   */

  function changeContent(language, value) {
    onChange({
      ...section,

      data: {
        ...section.data,

        content: {
          ...section.data.content,

          [language]: value,
        },
      },
    });
  }

  /*
   * =======================================================
   * IMAGE
   * =======================================================
   */

  function changeImage(image) {
    onChange({
      ...section,

      data: {
        ...section.data,

        image,
      },
    });
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

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
      {/* =================================
          HEADER
      ================================= */}

      <div
        className="
          flex
          flex-col
          gap-3

          border-b
          border-[var(--admin-border)]

          bg-[var(--admin-background)]

          px-4
          py-3

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
              h-8
              min-w-8

              items-center
              justify-center

              rounded-lg

              bg-[var(--company-primary-soft)]

              px-2

              admin-text-11
              font-semibold

              text-[var(--company-primary)]
            "
          >
            {index + 1}
          </div>

          <div>
            <div
              className="
                admin-text-12
                font-semibold

                text-[var(--admin-foreground)]
              "
            >
              {t("about.sections.section", {
                number: index + 1,
              })}
            </div>

            <div
              className="
                mt-0.5

                admin-text-10

                text-[var(--admin-muted)]
              "
            >
              {t(`about.sections.layouts.${layout}`)}
            </div>
          </div>
        </div>

        {/* ===============================
            ACTIONS
        =============================== */}

        <div
          className="
            flex
            items-center
            gap-1
          "
        >
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            title={t("about.sections.moveUp")}
            className="
              flex
              h-8
              w-8

              items-center
              justify-center

              rounded-lg

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]

              hover:text-[var(--admin-foreground)]

              disabled:opacity-20
            "
          >
            <ArrowUp size={13} />
          </button>

          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            title={t("about.sections.moveDown")}
            className="
              flex
              h-8
              w-8

              items-center
              justify-center

              rounded-lg

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]

              hover:text-[var(--admin-foreground)]

              disabled:opacity-20
            "
          >
            <ArrowDown size={13} />
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            title={t("about.sections.duplicate")}
            className="
              flex
              h-8
              w-8

              items-center
              justify-center

              rounded-lg

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]

              hover:text-[var(--admin-foreground)]
            "
          >
            <Copy size={13} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title={t("about.sections.delete")}
            className="
              flex
              h-8
              w-8

              items-center
              justify-center

              rounded-lg

              text-red-500

              transition

              hover:bg-red-50

              hover:text-red-600
            "
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* =================================
          BODY
      ================================= */}

      <div
        className="
          p-4

          sm:p-5
        "
      >
        {/* ===============================
            LAYOUT SELECTOR
        =============================== */}

        <div>
          <div
            className="
              admin-text-11
              font-medium

              text-[var(--admin-muted)]
            "
          >
            {t("about.sections.layout")}
          </div>

          <div
            className="
              mt-2

              grid
              gap-2

              sm:grid-cols-3
            "
          >
            <button
              type="button"
              onClick={() => changeLayout(ABOUT_SECTION_LAYOUT.TEXT_ONLY)}
              className={cn(
                "flex items-center gap-2",

                "rounded-xl",

                "border",

                "px-3 py-3",

                "admin-text-11 font-medium",

                "transition",

                layout === ABOUT_SECTION_LAYOUT.TEXT_ONLY
                  ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                  : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]",
              )}
            >
              <AlignLeft size={15} />

              {t("about.sections.layouts.text-only")}
            </button>

            <button
              type="button"
              onClick={() => changeLayout(ABOUT_SECTION_LAYOUT.IMAGE_LEFT)}
              className={cn(
                "flex items-center gap-2",

                "rounded-xl",

                "border",

                "px-3 py-3",

                "admin-text-11 font-medium",

                "transition",

                layout === ABOUT_SECTION_LAYOUT.IMAGE_LEFT
                  ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                  : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]",
              )}
            >
              <PanelLeft size={15} />

              {t("about.sections.layouts.image-left")}
            </button>

            <button
              type="button"
              onClick={() => changeLayout(ABOUT_SECTION_LAYOUT.IMAGE_RIGHT)}
              className={cn(
                "flex items-center gap-2",

                "rounded-xl",

                "border",

                "px-3 py-3",

                "admin-text-11 font-medium",

                "transition",

                layout === ABOUT_SECTION_LAYOUT.IMAGE_RIGHT
                  ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                  : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]",
              )}
            >
              <PanelRight size={15} />

              {t("about.sections.layouts.image-right")}
            </button>
          </div>
        </div>

        {/* ===============================
            IMAGE SETTINGS
        =============================== */}

        {hasImage && (
          <div
            className="
              mt-6

              rounded-2xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              p-4
            "
          >
            <CoverImageField
              companyId={companyId}
              value={section.data?.image || null}
              cropPreset="landscape"
              previewClassName="aspect-[4/3]"
              title={t("about.sections.image.title")}
              description={t("about.sections.image.description")}
              emptyTitle={t("about.sections.image.emptyTitle")}
              emptyDescription={t("about.sections.image.emptyDescription")}
              selectLabel={t("about.sections.image.select")}
              pickerTitle={t("about.sections.image.select")}
              onChange={changeImage}
            />

            {/* IMAGE WIDTH */}

            <div className="mt-4">
              <label
                className="
                  admin-text-11
                  font-medium

                  text-[var(--admin-muted)]
                "
              >
                {t("about.sections.imageWidth")}
              </label>

              <select
                value={section.data?.imageWidth || "50"}
                onChange={(event) =>
                  onChange({
                    ...section,

                    data: {
                      ...section.data,

                      imageWidth: event.target.value,
                    },
                  })
                }
                className="
                  mt-2

                  h-10
                  w-full

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  px-3

                  admin-text-12

                  text-[var(--admin-foreground)]

                  outline-none

                  focus:border-[var(--company-primary)]

                  focus:ring-2
                  focus:ring-[var(--company-primary-soft)]
                "
              >
                <option value="40">40%</option>

                <option value="50">50%</option>

                <option value="60">60%</option>
              </select>
            </div>
          </div>
        )}

        {/* ===============================
            CONTENT
        =============================== */}

        <div className="mt-6">
          <LocalizedRichTextEditor
            label={t("about.sections.content")}
            value={section.data?.content || emptyLocalized()}
            minHeight={220}
            onChange={changeContent}
          />
        </div>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * ABOUT SECTIONS EDITOR
 * =========================================================
 */

export default function AboutSectionsEditor({
  companyId,

  value = [],

  onChange,
}) {
  const { t } = useAdminTranslation();

  const sections = Array.isArray(value) ? value : [];

  /*
   * =======================================================
   * ADD
   * =======================================================
   */

  function addSection(layout) {
    const sortOrder = sections.length;

    const section =
      layout === ABOUT_SECTION_LAYOUT.TEXT_ONLY
        ? createTextBlock(sortOrder)
        : createImageTextBlock(
            layout === ABOUT_SECTION_LAYOUT.IMAGE_RIGHT ? "right" : "left",

            sortOrder,
          );

    onChange?.([...sections, section]);
  }

  /*
   * =======================================================
   * UPDATE
   * =======================================================
   */

  function updateSection(index, nextSection) {
    const next = [...sections];

    next[index] = nextSection;

    onChange?.(normalizeOrder(next));
  }

  /*
   * =======================================================
   * MOVE
   * =======================================================
   */

  function moveSection(index, direction) {
    const target = index + direction;

    if (target < 0 || target >= sections.length) {
      return;
    }

    const next = [...sections];

    [next[index], next[target]] = [next[target], next[index]];

    onChange?.(normalizeOrder(next));
  }

  /*
   * =======================================================
   * DUPLICATE
   * =======================================================
   */

  function duplicateSection(index) {
    const source = sections[index];

    const clone = structuredClone(source);

    clone.id = createSectionId();

    const next = [...sections];

    next.splice(index + 1, 0, clone);

    onChange?.(normalizeOrder(next));
  }

  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  function deleteSection(index) {
    const confirmed = window.confirm(t("about.sections.deleteConfirm"));

    if (!confirmed) {
      return;
    }

    const next = sections.filter((_, currentIndex) => currentIndex !== index);

    onChange?.(normalizeOrder(next));
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <section
      className="
        mt-10

        border-t
        border-[var(--admin-border)]

        pt-8
      "
    >
      {/* =================================
          HEADER
      ================================= */}

      <div>
        <h3
          className="
            admin-text-14
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          {t("about.sections.title")}
        </h3>

        <p
          className="
            mt-1

            max-w-2xl

            admin-text-12
            leading-[1.65]

            text-[var(--admin-muted)]
          "
        >
          {t("about.sections.description")}
        </p>
      </div>

      {/* =================================
          BLOCKS
      ================================= */}

      {sections.length > 0 ? (
        <div
          className="
            mt-5

            space-y-4
          "
        >
          {sections.map((section, index) => (
            <AboutSectionCard
              key={section.id || index}
              companyId={companyId}
              section={section}
              index={index}
              total={sections.length}
              onChange={(nextSection) => updateSection(index, nextSection)}
              onMove={(direction) => moveSection(index, direction)}
              onDuplicate={() => duplicateSection(index)}
              onDelete={() => deleteSection(index)}
            />
          ))}
        </div>
      ) : (
        <div
          className="
            mt-5

            rounded-2xl

            border
            border-dashed
            border-[var(--admin-border)]

            bg-[var(--admin-background)]

            p-8

            text-center
          "
        >
          <div
            className="
              admin-text-14
              font-medium

              text-[var(--admin-foreground)]
            "
          >
            {t("about.sections.empty.title")}
          </div>

          <p
            className="
              mt-1

              admin-text-12

              text-[var(--admin-muted)]
            "
          >
            {t("about.sections.empty.description")}
          </p>
        </div>
      )}

      {/* =================================
          ADD
      ================================= */}

      <div
        className="
          mt-5

          grid
          gap-2

          sm:grid-cols-3
        "
      >
        <button
          type="button"
          onClick={() => addSection(ABOUT_SECTION_LAYOUT.TEXT_ONLY)}
          className="
            inline-flex
            min-h-11

            items-center
            justify-center
            gap-2

            rounded-xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

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
          <Plus size={14} />

          {t("about.sections.addText")}
        </button>

        <button
          type="button"
          onClick={() => addSection(ABOUT_SECTION_LAYOUT.IMAGE_LEFT)}
          className="
            inline-flex
            min-h-11

            items-center
            justify-center
            gap-2

            rounded-xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

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
          <PanelLeft size={14} />

          {t("about.sections.addImageLeft")}
        </button>

        <button
          type="button"
          onClick={() => addSection(ABOUT_SECTION_LAYOUT.IMAGE_RIGHT)}
          className="
            inline-flex
            min-h-11

            items-center
            justify-center
            gap-2

            rounded-xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

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
          <PanelRight size={14} />

          {t("about.sections.addImageRight")}
        </button>
      </div>
    </section>
  );
}
