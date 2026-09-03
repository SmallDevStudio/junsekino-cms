"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import PublicRichText from "./PublicRichText";

export default function PublicExpandableRichText({
  value,

  className = "",

  lines = 5,
}) {
  const contentRef = useRef(null);

  const [expanded, setExpanded] = useState(false);

  const [overflowing, setOverflowing] = useState(false);

  /*
   * PublicRichText uses approximately
   * 1.75 line-height at 13px.
   */
  const collapsedHeight = lines * 13 * 1.75;

  useEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return undefined;
    }

    let frameId = null;

    function measure() {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        setOverflowing(element.scrollHeight > collapsedHeight + 2);
      });
    }

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => {
      observer.disconnect();

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [collapsedHeight, value]);

  if (!value) {
    return null;
  }

  return (
    <div>
      <div
        className="
          relative
          overflow-hidden

          transition-[max-height]
          duration-300
          ease-out
        "
        style={
          expanded
            ? undefined
            : {
                maxHeight: `${collapsedHeight}px`,
              }
        }
      >
        <div ref={contentRef}>
          <PublicRichText value={value} className={className} />
        </div>

        {!expanded && overflowing && (
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-0
              bottom-0
              h-10

              bg-gradient-to-b
              from-transparent
              to-[var(--public-background)]
            "
          />
        )}
      </div>

      {overflowing && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="
            mt-2

            inline-flex
            items-center
            gap-1

            text-[10px]
            font-medium
            tracking-[0.02em]

            text-[var(--public-primary)]

            transition-opacity
            duration-200

            hover:opacity-65

            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[var(--public-primary)]
          "
        >
          <span>{expanded ? "Show less" : "Show more"}</span>

          {expanded ? (
            <ChevronUp size={13} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={13} strokeWidth={1.5} />
          )}
        </button>
      )}
    </div>
  );
}
