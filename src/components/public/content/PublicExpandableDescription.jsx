"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * EXPANDABLE DESCRIPTION
 * =========================================================
 */

export default function PublicExpandableDescription({
  children,

  className,

  lines = 5,
}) {
  const contentRef = useRef(null);

  const [expanded, setExpanded] = useState(false);

  const [overflowing, setOverflowing] = useState(false);

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
        const lineHeight = Number.parseFloat(
          window.getComputedStyle(element).lineHeight,
        );

        if (!Number.isFinite(lineHeight)) {
          return;
        }

        const collapsedHeight = lineHeight * lines;

        setOverflowing(element.scrollHeight > collapsedHeight + 1);
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
  }, [children, lines]);

  return (
    <div>
      <p
        ref={contentRef}
        className={cn(
          "whitespace-pre-line",

          !expanded && "line-clamp-5",

          className,
        )}
        style={
          !expanded
            ? {
                WebkitLineClamp: lines,
              }
            : undefined
        }
      >
        {children}
      </p>

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
