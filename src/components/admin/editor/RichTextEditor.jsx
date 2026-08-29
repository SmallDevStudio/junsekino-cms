"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { EditorContent, useEditor } from "@tiptap/react";

import { StarterKit } from "@tiptap/starter-kit";

import { Underline } from "@tiptap/extension-underline";

import { Link } from "@tiptap/extension-link";

import { TextAlign } from "@tiptap/extension-text-align";

import { TextStyle } from "@tiptap/extension-text-style";

import { Color } from "@tiptap/extension-color";

import { useEffect } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * LEGACY STRING → TIPTAP
 * =========================================================
 */

function normalizeEditorContent(value) {
  if (value && typeof value === "object" && value.type === "doc") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const paragraphs = value
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => ({
        type: "paragraph",

        content: [
          {
            type: "text",

            text: paragraph,
          },
        ],
      }));

    return {
      type: "doc",

      content:
        paragraphs.length > 0
          ? paragraphs
          : [
              {
                type: "paragraph",
              },
            ],
    };
  }

  return {
    type: "doc",

    content: [
      {
        type: "paragraph",
      },
    ],
  };
}

/*
 * =========================================================
 * TOOLBAR BUTTON
 * =========================================================
 */

function ToolbarButton({
  active = false,

  disabled = false,

  label,

  onClick,

  children,
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center",

        "rounded-lg",

        "transition",

        active
          ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
          : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",

        disabled && "cursor-not-allowed opacity-30",
      )}
    >
      {children}
    </button>
  );
}

/*
 * =========================================================
 * DIVIDER
 * =========================================================
 */

function ToolbarDivider() {
  return (
    <span
      className="
        mx-1

        h-5
        w-px

        bg-[var(--admin-border)]
      "
    />
  );
}

/*
 * =========================================================
 * COMPANY COLOR
 * =========================================================
 */

function getCompanyPrimaryColor() {
  if (typeof window === "undefined") {
    return "#111111";
  }

  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--company-primary")
    .trim();

  return value || "#111111";
}

/*
 * =========================================================
 * RICH TEXT EDITOR
 * =========================================================
 */

export default function RichTextEditor({
  value,

  onChange,

  placeholder,

  minHeight = 260,

  disabled = false,
}) {
  const { t } = useAdminTranslation();

  const resolvedPlaceholder = placeholder || t("editor.placeholderEnglish");

  const editor = useEditor({
    /*
     * Prevent App Router hydration mismatch.
     */
    immediatelyRender: false,

    editable: !disabled,

    extensions: [
      /*
       * Tiptap v3 StarterKit already
       * includes Link and Underline.
       *
       * Disable them here because we
       * register configured versions
       * below.
       */
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },

        link: false,

        underline: false,
      }),

      Underline,

      Link.configure({
        openOnClick: false,

        autolink: true,

        linkOnPaste: true,

        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",

          target: "_blank",
        },
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      TextStyle,

      Color,
    ],

    content: normalizeEditorContent(value),

    editorProps: {
      attributes: {
        /*
         * admin-text-14 allows the base
         * editor font size to follow the
         * user's Admin typography setting.
         */
        class: "rich-text-editor-content admin-text-14 outline-none",
      },
    },

    onUpdate({ editor: currentEditor }) {
      onChange?.(currentEditor.getJSON());
    },
  });

  /*
   * =======================================================
   * EXTERNAL CONTENT SYNC
   * =======================================================
   *
   * State is not modified directly in
   * this effect. Editor is an external
   * system, which is a valid effect use.
   * =======================================================
   */

  useEffect(() => {
    if (!editor) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextContent = normalizeEditorContent(value);

      const currentContent = editor.getJSON();

      if (JSON.stringify(currentContent) !== JSON.stringify(nextContent)) {
        editor.commands.setContent(nextContent, {
          emitUpdate: false,
        });
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [editor, value]);

  /*
   * =======================================================
   * EDITABLE
   * =======================================================
   */

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [editor, disabled]);

  /*
   * =======================================================
   * INITIAL LOADING
   * =======================================================
   */

  if (!editor) {
    return (
      <div
        className="
          animate-pulse

          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-background)]
        "
        style={{
          minHeight,
        }}
      />
    );
  }

  /*
   * =======================================================
   * LINK
   * =======================================================
   */

  function setLink() {
    const previousUrl = editor.getAttributes("link").href;

    const url = window.prompt(
      t("editor.enterUrl"),

      previousUrl || "",
    );

    if (url === null) {
      return;
    }

    const normalized = url.trim();

    if (!normalized) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    const safeUrl = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(normalized)
      ? normalized
      : `https://${normalized}`;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: safeUrl,
      })
      .run();
  }

  /*
   * =======================================================
   * COLOR
   * =======================================================
   */

  function applyColor(color) {
    editor.chain().focus().setColor(color).run();
  }

  function applyCompanyColor() {
    applyColor(getCompanyPrimaryColor());
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div
      className="
        overflow-hidden

        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]

        transition

        focus-within:border-[var(--company-primary)]

        focus-within:ring-2
        focus-within:ring-[var(--company-primary-soft)]
      "
    >
      {/* =================================
          TOOLBAR
      ================================= */}

      <div
        className="
          flex
          flex-wrap
          items-center

          gap-1

          border-b
          border-[var(--admin-border)]

          bg-[var(--admin-background)]

          px-2
          py-2
        "
      >
        {/* =================================
            STYLE
        ================================= */}

        <ToolbarButton
          label={t("editor.bold")}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>

        <ToolbarButton
          label={t("editor.italic")}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>

        <ToolbarButton
          label={t("editor.underline")}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* =================================
            HEADINGS
        ================================= */}

        <ToolbarButton
          label={t("editor.heading2")}
          active={editor.isActive("heading", {
            level: 2,
          })}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run()
          }
        >
          <span
            className="
              admin-text-11
              font-semibold
            "
          >
            H2
          </span>
        </ToolbarButton>

        <ToolbarButton
          label={t("editor.heading3")}
          active={editor.isActive("heading", {
            level: 3,
          })}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 3,
              })
              .run()
          }
        >
          <span
            className="
              admin-text-11
              font-semibold
            "
          >
            H3
          </span>
        </ToolbarButton>

        <ToolbarDivider />

        {/* =================================
            LIST
        ================================= */}

        <ToolbarButton
          label={t("editor.bulletList")}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>

        <ToolbarButton
          label={t("editor.orderedList")}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <ToolbarButton
          label={t("editor.quote")}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* =================================
            ALIGN
        ================================= */}

        <ToolbarButton
          label={t("editor.alignLeft")}
          active={editor.isActive({
            textAlign: "left",
          })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={15} />
        </ToolbarButton>

        <ToolbarButton
          label={t("editor.alignCenter")}
          active={editor.isActive({
            textAlign: "center",
          })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={15} />
        </ToolbarButton>

        <ToolbarButton
          label={t("editor.alignRight")}
          active={editor.isActive({
            textAlign: "right",
          })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={15} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* =================================
            LINK
        ================================= */}

        <ToolbarButton
          label={t("editor.link")}
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <Link2 size={15} />
        </ToolbarButton>

        {/* =================================
            COLORS
        ================================= */}

        <div
          className="
            ml-1
            flex
            items-center
            gap-1
          "
          title={t("editor.textColor")}
        >
          {["#111111", "#666666", "#800000", "#FE9800"].map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`${t("editor.textColor")} ${color}`}
              onClick={() => applyColor(color)}
              className="
                  h-5
                  w-5

                  rounded-full

                  border
                  border-black/10

                  transition

                  hover:scale-110
                "
              style={{
                backgroundColor: color,
              }}
            />
          ))}

          <button
            type="button"
            title={t("editor.companyColor")}
            aria-label={t("editor.companyColor")}
            onClick={applyCompanyColor}
            className="
              h-5
              w-5

              rounded-full

              border
              border-[var(--company-primary-border)]

              bg-[var(--company-primary)]

              transition

              hover:scale-110
            "
          />
        </div>

        <ToolbarDivider />

        {/* =================================
            CLEAR
        ================================= */}

        <ToolbarButton
          label={t("editor.clearFormatting")}
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <RemoveFormatting size={15} />
        </ToolbarButton>

        {/* =================================
            HISTORY
        ================================= */}

        <ToolbarButton
          label={t("editor.undo")}
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={15} />
        </ToolbarButton>

        <ToolbarButton
          label={t("editor.redo")}
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={15} />
        </ToolbarButton>
      </div>

      {/* =================================
          CONTENT
      ================================= */}

      <div
        className="
          relative

          px-4
          py-3
        "
        style={{
          minHeight,
        }}
      >
        {editor.isEmpty && (
          <div
            className="
              pointer-events-none

              absolute
              left-4
              top-3

              admin-text-14

              text-[var(--admin-muted-light)]
            "
          >
            {resolvedPlaceholder}
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
