"use client";

import { cn } from "@/utils/cn";

export default function ActionButtonGroup({
  children,

  className,

  align = "end",

  wrap = true,
}) {
  const alignClasses = {
    start: "justify-start",

    center: "justify-center",

    end: "justify-end",

    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",

        wrap && "flex-wrap",

        alignClasses[align] || alignClasses.end,

        className,
      )}
    >
      {children}
    </div>
  );
}
