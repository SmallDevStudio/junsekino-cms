import React from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/*
 * =========================================================
 * RICH TEXT TYPES
 * =========================================================
 */

function isTiptapDocument(value) {
  return value && typeof value === "object" && value.type === "doc";
}

function isLegacyString(value) {
  return typeof value === "string";
}

/*
 * =========================================================
 * SAFE URL
 * =========================================================
 *
 * Rich Text content is CMS-authored, but we still should
 * not render javascript:, data: or other unexpected
 * protocols into public anchor elements.
 * =========================================================
 */

function getSafeHref(value) {
  if (typeof value !== "string") {
    return null;
  }

  const href = value.trim();

  if (!href) {
    return null;
  }

  if (href.startsWith("/") || href.startsWith("#")) {
    return href;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
    return href;
  }

  return null;
}

/*
 * =========================================================
 * SAFE COLOR
 * =========================================================
 */

function getSafeColor(value) {
  if (typeof value !== "string") {
    return null;
  }

  const color = value.trim();

  if (/^#[0-9a-fA-F]{3}$/.test(color) || /^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return null;
}

/*
 * =========================================================
 * SAFE ALIGNMENT
 * =========================================================
 */

function getSafeTextAlign(value) {
  if (["left", "center", "right", "justify"].includes(value)) {
    return value;
  }

  return undefined;
}

/*
 * =========================================================
 * MARKS
 * =========================================================
 */

function applyMarks(content, marks = [], key) {
  if (!Array.isArray(marks) || marks.length === 0) {
    return content;
  }

  return marks.reduce((current, mark, index) => {
    const markKey = `${key}-mark-${index}`;

    switch (mark?.type) {
      case "bold":
        return <strong key={markKey}>{current}</strong>;

      case "italic":
        return <em key={markKey}>{current}</em>;

      case "underline":
        return <u key={markKey}>{current}</u>;

      case "strike":
        return <s key={markKey}>{current}</s>;

      case "code":
        return <code key={markKey}>{current}</code>;

      case "link": {
        const href = getSafeHref(mark.attrs?.href);

        if (!href) {
          return current;
        }

        const external = /^https?:\/\//i.test(href);

        return (
          <a
            key={markKey}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
          >
            {current}
          </a>
        );
      }

      case "textStyle": {
        const color = getSafeColor(mark.attrs?.color);

        if (!color) {
          return current;
        }

        return (
          <span
            key={markKey}
            style={{
              color,
            }}
          >
            {current}
          </span>
        );
      }

      default:
        return current;
    }
  }, content);
}

/*
 * =========================================================
 * NODE CHILDREN
 * =========================================================
 */

function renderChildren(node, path) {
  if (!Array.isArray(node?.content)) {
    return null;
  }

  return node.content.map((child, index) =>
    renderNode(child, `${path}-${index}`),
  );
}

/*
 * =========================================================
 * TIPTAP NODE
 * =========================================================
 */

function renderNode(node, path) {
  if (!node || typeof node !== "object") {
    return null;
  }

  switch (node.type) {
    /*
     * =====================================
     * TEXT
     * =====================================
     */

    case "text": {
      const text = typeof node.text === "string" ? node.text : "";

      return (
        <React.Fragment key={path}>
          {applyMarks(text, node.marks, path)}
        </React.Fragment>
      );
    }

    /*
     * =====================================
     * PARAGRAPH
     * =====================================
     */

    case "paragraph":
      return (
        <p
          key={path}
          style={{
            textAlign: getSafeTextAlign(node.attrs?.textAlign),
          }}
        >
          {renderChildren(node, path)}
        </p>
      );

    /*
     * =====================================
     * HEADING
     * =====================================
     */

    case "heading": {
      const level = Number(node.attrs?.level);

      const textAlign = getSafeTextAlign(node.attrs?.textAlign);

      if (level === 3) {
        return (
          <h3
            key={path}
            style={{
              textAlign,
            }}
          >
            {renderChildren(node, path)}
          </h3>
        );
      }

      /*
       * We intentionally normalize all
       * other heading levels to H2.
       *
       * The shared editor currently only
       * exposes H2/H3.
       */
      return (
        <h2
          key={path}
          style={{
            textAlign,
          }}
        >
          {renderChildren(node, path)}
        </h2>
      );
    }

    /*
     * =====================================
     * LISTS
     * =====================================
     */

    case "bulletList":
      return <ul key={path}>{renderChildren(node, path)}</ul>;

    case "orderedList":
      return (
        <ol
          key={path}
          start={
            Number.isInteger(node.attrs?.start) ? node.attrs.start : undefined
          }
        >
          {renderChildren(node, path)}
        </ol>
      );

    case "listItem":
      return <li key={path}>{renderChildren(node, path)}</li>;

    /*
     * =====================================
     * BLOCKQUOTE
     * =====================================
     */

    case "blockquote":
      return <blockquote key={path}>{renderChildren(node, path)}</blockquote>;

    /*
     * =====================================
     * HARD BREAK
     * =====================================
     */

    case "hardBreak":
      return <br key={path} />;

    /*
     * =====================================
     * HORIZONTAL RULE
     * =====================================
     */

    case "horizontalRule":
      return <hr key={path} />;

    /*
     * =====================================
     * CODE BLOCK
     * =====================================
     */

    case "codeBlock":
      return (
        <pre key={path}>
          <code>{renderChildren(node, path)}</code>
        </pre>
      );

    /*
     * =====================================
     * DOCUMENT
     * =====================================
     */

    case "doc":
      return (
        <React.Fragment key={path}>{renderChildren(node, path)}</React.Fragment>
      );

    /*
     * =====================================
     * UNKNOWN NODE
     * =====================================
     *
     * Future TipTap extensions should not
     * crash Public pages.
     *
     * We render known children but ignore
     * the unsupported wrapper.
     * =====================================
     */

    default:
      return (
        <React.Fragment key={path}>{renderChildren(node, path)}</React.Fragment>
      );
  }
}

/*
 * =========================================================
 * SHARED PUBLIC STYLES
 * =========================================================
 */

const CONTENT_CLASS_NAME = `
  text-[12px]
  leading-[1.65]
  text-black/80

  sm:text-[13px]

  [&_a]:text-[var(--public-primary)]
  [&_a]:underline
  [&_a]:decoration-current/25
  [&_a]:underline-offset-2
  [&_a]:transition-opacity
  [&_a:hover]:opacity-65

  [&_blockquote]:my-5
  [&_blockquote]:border-l
  [&_blockquote]:border-[var(--public-primary)]
  [&_blockquote]:pl-4
  [&_blockquote]:text-black/55

  [&_code]:rounded
  [&_code]:bg-black/[0.04]
  [&_code]:px-1
  [&_code]:py-0.5
  [&_code]:text-[0.92em]

  [&_h2]:mb-3
  [&_h2]:mt-7
  [&_h2]:text-[16px]
  [&_h2]:font-semibold
  [&_h2]:leading-[1.4]

  [&_h3]:mb-3
  [&_h3]:mt-6
  [&_h3]:text-[14px]
  [&_h3]:font-semibold
  [&_h3]:leading-[1.45]

  [&_hr]:my-7
  [&_hr]:border-0
  [&_hr]:border-t
  [&_hr]:border-black/[0.08]

  [&_li]:mb-1

  [&_ol]:my-4
  [&_ol]:list-decimal
  [&_ol]:pl-5

  [&_p]:mb-4

  [&_pre]:my-5
  [&_pre]:overflow-x-auto
  [&_pre]:rounded-xl
  [&_pre]:bg-black/[0.035]
  [&_pre]:p-4

  [&_strong]:font-semibold

  [&_ul]:my-4
  [&_ul]:list-disc
  [&_ul]:pl-5

  [&_u]:underline
  [&_u]:underline-offset-2
`;

/*
 * =========================================================
 * PUBLIC RICH TEXT
 * =========================================================
 *
 * Supported inputs:
 *
 * 1. Legacy Markdown / plain string
 * 2. TipTap JSON document
 *
 * No raw HTML is enabled.
 * =========================================================
 */

export default function PublicRichText({ value, className = "" }) {
  if (!value) {
    return null;
  }

  /*
   * =====================================
   * LEGACY
   * =====================================
   */

  if (isLegacyString(value)) {
    if (!value.trim()) {
      return null;
    }

    return (
      <div className={`${CONTENT_CLASS_NAME} ${className}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
      </div>
    );
  }

  /*
   * =====================================
   * TIPTAP
   * =====================================
   */

  if (isTiptapDocument(value)) {
    return (
      <div className={`${CONTENT_CLASS_NAME} ${className}`}>
        {renderNode(value, "root")}
      </div>
    );
  }

  /*
   * Unsupported / malformed content.
   *
   * Fail quietly on Public instead of
   * breaking the entire page.
   */
  return null;
}
