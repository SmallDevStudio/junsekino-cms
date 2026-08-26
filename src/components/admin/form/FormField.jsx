"use client";

import { cn } from "@/utils/cn";

export default function FormField({
  label,
  required = false,
  error = "",
  hint = "",
  children,
  className,
}) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="text-xs font-medium text-[var(--admin-muted)]">
          {label}

          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}

      <div className="mt-2">{children}</div>

      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[10px] leading-4 text-[var(--admin-muted-light)]">
          {hint}
        </p>
      ) : null}
    </label>
  );
}
