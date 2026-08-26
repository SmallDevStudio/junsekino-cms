"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

export default function AdminTooltip({
  children,
  content,
  enabled = true,
  delay = 300,
  placement = "top",
}) {
  const [open, setOpen] = useState(false);

  const timeoutRef = useRef(null);

  function clearTimer() {
    if (!timeoutRef.current) {
      return;
    }

    window.clearTimeout(timeoutRef.current);

    timeoutRef.current = null;
  }

  function show() {
    if (!enabled || !content) {
      return;
    }

    clearTimer();

    timeoutRef.current = window.setTimeout(
      () => {
        setOpen(true);
      },
      Math.max(0, Number(delay) || 0),
    );
  }

  function hide() {
    clearTimer();

    setOpen(false);
  }

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  if (!enabled || !content) {
    return children;
  }

  const placementClasses = {
    top: "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",

    bottom: "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",

    left: "right-[calc(100%+8px)] top-1/2 -translate-y-1/2",

    right: "left-[calc(100%+8px)] top-1/2 -translate-y-1/2",
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {open && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-[500]",
            "whitespace-nowrap rounded-lg",
            "bg-neutral-950 px-2.5 py-1.5",
            "text-[11px] font-medium text-white",
            "shadow-lg",
            placementClasses[placement] || placementClasses.top,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
