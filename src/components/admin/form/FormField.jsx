"use client";

import { CircleHelp, X } from "lucide-react";

import { useState } from "react";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * FORM FIELD
 * =========================================================
 *
 * Shared Admin form wrapper.
 *
 * Supports:
 * - Admin font scaling
 * - Validation
 * - Hint
 * - Required marker
 * - Optional information balloon
 * =========================================================
 */

export default function FormField({
  label,

  required = false,

  error = "",

  hint = "",

  children,

  className,

  /*
   * Optional helper information.
   *
   * This supports the Admin UX principle
   * where unusual fields may explain
   * themselves via an information icon.
   */
  infoTitle = "",

  infoContent = "",
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  const hasInfo = Boolean(infoTitle || infoContent);

  return (
    <label className={cn("block", className)}>
      {/* =====================================
          LABEL
      ===================================== */}

      {label && (
        <span
          className="
            flex
            items-center
            gap-1.5

            admin-text-12
            font-medium

            text-[var(--admin-muted)]
          "
        >
          <span>
            {label}

            {required && (
              <span
                className="
                  ml-1
                  text-red-500
                "
                aria-hidden="true"
              >
                *
              </span>
            )}
          </span>

          {/* =================================
              INFORMATION
          ================================= */}

          {hasInfo && (
            <span
              className="
                relative
                inline-flex
              "
            >
              <button
                type="button"
                aria-expanded={infoOpen}
                onClick={(event) => {
                  /*
                   * Prevent label click from
                   * focusing/toggling the
                   * input unexpectedly.
                   */
                  event.preventDefault();

                  setInfoOpen((current) => !current);
                }}
                className="
                  flex
                  h-5
                  w-5

                  items-center
                  justify-center

                  rounded-full

                  text-[var(--admin-muted-light)]

                  transition

                  hover:bg-[var(--company-primary-soft)]
                  hover:text-[var(--company-primary)]
                "
              >
                <CircleHelp size={13} strokeWidth={1.7} />
              </button>

              {infoOpen && (
                <span
                  className="
                    absolute
                    left-0
                    top-[calc(100%+7px)]
                    z-[100]

                    w-[280px]
                    max-w-[calc(100vw-32px)]

                    rounded-xl

                    border
                    border-[var(--admin-border)]

                    bg-[var(--admin-surface)]

                    p-3

                    shadow-[0_12px_35px_rgba(0,0,0,0.12)]
                  "
                >
                  <span
                    className="
                      flex
                      items-start
                      justify-between
                      gap-2
                    "
                  >
                    <span className="min-w-0">
                      {infoTitle && (
                        <span
                          className="
                            block

                            admin-text-11
                            font-semibold

                            text-[var(--admin-foreground)]
                          "
                        >
                          {infoTitle}
                        </span>
                      )}

                      {infoContent && (
                        <span
                          className="
                            mt-1
                            block

                            admin-text-10
                            leading-[1.6]

                            text-[var(--admin-muted)]
                          "
                        >
                          {infoContent}
                        </span>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();

                        setInfoOpen(false);
                      }}
                      className="
                        flex
                        h-6
                        w-6
                        shrink-0

                        items-center
                        justify-center

                        rounded-lg

                        text-[var(--admin-muted-light)]

                        transition

                        hover:bg-[var(--admin-hover)]
                        hover:text-[var(--admin-foreground)]
                      "
                    >
                      <X size={12} />
                    </button>
                  </span>
                </span>
              )}
            </span>
          )}
        </span>
      )}

      {/* =====================================
          CONTROL
      ===================================== */}

      <div className="mt-2">{children}</div>

      {/* =====================================
          MESSAGE
      ===================================== */}

      {error ? (
        <p
          role="alert"
          className="
            mt-1.5

            admin-text-12
            font-medium

            leading-[1.5]

            text-red-500
          "
        >
          {error}
        </p>
      ) : hint ? (
        <p
          className="
            mt-1.5

            admin-text-10
            leading-[1.6]

            text-[var(--admin-muted-light)]
          "
        >
          {hint}
        </p>
      ) : null}
    </label>
  );
}
