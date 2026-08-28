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
 * TOOLBAR DIVIDER
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
 * COMPANY PRIMARY COLOR
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
  placeholder = "Write content...",
  minHeight = 260,
  disabled = false,
}) {
  const editor = useEditor({
    /*
     * Prevent SSR hydration mismatch
     * with Next.js App Router.
     */
    immediatelyRender: false,

    editable: !disabled,

    extensions: [
      /*
       * =====================================================
       * STARTER KIT
       * =====================================================
       *
       * Tiptap v3 StarterKit already includes
       * Link and Underline.
       *
       * We disable them here because this editor
       * registers separately configured versions
       * below.
       *
       * Without this, Tiptap warns:
       *
       * Duplicate extension names found:
       * ['link', 'underline']
       * =====================================================
       */

      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },

        link: false,

        underline: false,
      }),

      /*
       * Custom Underline
       */
      Underline,

      /*
       * Custom Link configuration
       */
      Link.configure({
        openOnClick: false,

        autolink: true,

        linkOnPaste: true,

        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",

          target: "_blank",
        },
      }),

      /*
       * Text alignment
       */
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      /*
       * Required by Color extension
       */
      TextStyle,

      /*
       * Text color
       */
      Color,
    ],

    content: normalizeEditorContent(value),

    editorProps: {
      attributes: {
        class: "rich-text-editor-content outline-none",
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
   * EDITABLE STATE
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

    const url = window.prompt("Enter URL", previousUrl || "");

    if (url === null) {
      return;
    }

    const normalized = url.trim();

    /*
     * Empty input removes link.
     */
    if (!normalized) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    /*
     * Normalize common URLs.
     */
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
            TEXT STYLE
        ================================= */}

        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>

        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>

        <ToolbarButton
          label="Underline"
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
          label="Heading 2"
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
          <span className="text-[11px] font-semibold">H2</span>
        </ToolbarButton>

        <ToolbarButton
          label="Heading 3"
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
          <span className="text-[11px] font-semibold">H3</span>
        </ToolbarButton>

        <ToolbarDivider />

        {/* =================================
            LISTS
        ================================= */}

        <ToolbarButton
          label="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>

        <ToolbarButton
          label="Numbered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* =================================
            ALIGNMENT
        ================================= */}

        <ToolbarButton
          label="Align Left"
          active={editor.isActive({
            textAlign: "left",
          })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={15} />
        </ToolbarButton>

        <ToolbarButton
          label="Align Center"
          active={editor.isActive({
            textAlign: "center",
          })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={15} />
        </ToolbarButton>

        <ToolbarButton
          label="Align Right"
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
          label="Link"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <Link2 size={15} />
        </ToolbarButton>

        {/* =================================
            TEXT COLOR
        ================================= */}

        <div
          className="
            ml-1
            flex
            items-center
            gap-1
          "
          title="Text color"
        >
          {["#111111", "#666666", "#800000", "#FE9800"].map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Text color ${color}`}
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
            title="Company color"
            aria-label="Company color"
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
            CLEAR FORMAT
        ================================= */}

        <ToolbarButton
          label="Clear Formatting"
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
          label="Undo"
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={15} />
        </ToolbarButton>

        <ToolbarButton
          label="Redo"
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={15} />
        </ToolbarButton>
      </div>

      {/* =================================
          EDITOR CONTENT
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

              text-sm

              text-[var(--admin-muted-light)]
            "
          >
            {placeholder}
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
