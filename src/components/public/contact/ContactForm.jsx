"use client";

import { Check, LoaderCircle } from "lucide-react";

import { useState } from "react";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function localized(value, locale, fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return value?.[locale] || value?.en || value?.th || fallback;
}

function createInitialValues(fields) {
  const result = {};

  for (const field of fields) {
    if (!field?.id) {
      continue;
    }

    if (field.type === "checkbox") {
      result[field.id] = false;

      continue;
    }

    result[field.id] = "";
  }

  return result;
}

/*
 * =========================================================
 * CONTACT FORM
 * =========================================================
 */

export default function ContactForm({
  companySlug,

  form,

  locale = "en",

  preview = false,
}) {
  const fields = Array.isArray(form?.fields) ? form.fields : [];

  const [values, setValues] = useState(() => createInitialValues(fields));

  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  if (!form) {
    return null;
  }

  function updateValue(fieldId, value) {
    setValues((current) => ({
      ...current,

      [fieldId]: value,
    }));

    setFieldErrors((current) => {
      if (!current[fieldId]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[fieldId];

      return next;
    });
  }

  function validate() {
    const nextErrors = {};

    for (const field of fields) {
      if (field.enabled === false) {
        continue;
      }

      if (["heading", "paragraph"].includes(field.type)) {
        continue;
      }

      const value = values[field.id];

      if (
        field.required &&
        (value === undefined || value === null || String(value).trim() === "")
      ) {
        nextErrors[field.id] =
          locale === "th" ? "กรุณากรอกข้อมูล" : "This field is required.";
      }

      if (
        field.type === "email" &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
      ) {
        nextErrors[field.id] =
          locale === "th"
            ? "กรุณากรอกอีเมลให้ถูกต้อง"
            : "Enter a valid email address.";
      }
    }

    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (preview || submitting) {
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);

      setError("");

      const response = await fetch(
        `/api/public/v1/companies/${encodeURIComponent(
          companySlug,
        )}/forms/${encodeURIComponent(form.slug)}/submit`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            values,

            source: {
              pagePath:
                typeof window !== "undefined" ? window.location.pathname : null,

              referrer:
                typeof document !== "undefined"
                  ? document.referrer || null
                  : null,
            },

            /*
             * Honeypot.
             */
            website: "",
          }),
        },
      );

      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.success === false) {
        if (payload?.error?.fieldId) {
          setFieldErrors({
            [payload.error.fieldId]:
              locale === "th" ? "ข้อมูลไม่ถูกต้อง" : "Invalid value.",
          });
        }

        throw new Error(
          payload?.message ||
            (locale === "th"
              ? "ไม่สามารถส่งข้อมูลได้"
              : "Unable to submit form."),
        );
      }

      setSuccess(true);

      setValues(createInitialValues(fields));
    } catch (submitError) {
      setError(
        submitError?.message ||
          (locale === "th"
            ? "ไม่สามารถส่งข้อมูลได้"
            : "Unable to submit form."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className="
          py-10
          text-center
        "
      >
        <div
          className="
            mx-auto
            flex
            h-10
            w-10

            items-center
            justify-center

            rounded-full

            border
            border-black/10
          "
        >
          <Check size={16} strokeWidth={1.4} />
        </div>

        <div
          className="
            mt-4

            text-[13px]
            font-normal

            text-black
          "
        >
          {localized(form.settings?.successTitle, locale, "Thank you")}
        </div>

        <p
          className="
            mx-auto
            mt-2
            max-w-[440px]

            text-[11px]
            leading-[1.7]

            text-black/45
          "
        >
          {localized(
            form.settings?.successMessage,
            locale,
            "Thank you. We have received your message.",
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div
        className="
          space-y-5
        "
      >
        {fields.map((field) => {
          if (field.enabled === false) {
            return null;
          }

          if (field.type === "heading") {
            return (
              <h3
                key={field.id}
                className="
                    text-[13px]
                    font-normal
                  "
              >
                {localized(field.label, locale)}
              </h3>
            );
          }

          if (field.type === "paragraph") {
            return (
              <p
                key={field.id}
                className="
                    text-[11px]
                    leading-[1.7]

                    text-black/55
                  "
              >
                {localized(field.label, locale)}
              </p>
            );
          }

          const label = localized(field.label, locale);

          const placeholder = localized(field.placeholder, locale);

          const hasError = Boolean(fieldErrors[field.id]);

          const commonClass = `
              mt-1.5
              w-full

              border
              bg-white

              px-3

              text-[12px]
              text-black

              outline-none

              transition

              placeholder:text-black/25

              ${
                hasError
                  ? "border-red-400"
                  : "border-black/20 focus:border-black/55"
              }
            `;

          return (
            <label key={field.id} className="block">
              <div
                className="
                    text-[11px]
                    leading-none

                    text-black/75
                  "
              >
                {label}

                {field.required && <span className="ml-0.5">*</span>}
              </div>

              {field.type === "textarea" ? (
                <textarea
                  rows={6}
                  value={values[field.id] || ""}
                  placeholder={placeholder}
                  disabled={preview || submitting}
                  onChange={(event) =>
                    updateValue(field.id, event.target.value)
                  }
                  className={`${commonClass} min-h-[130px] resize-y py-3`}
                />
              ) : field.type === "consent" ? (
                <div className="mt-2">
                  <label
                    className="
                        flex
                        items-start
                        gap-2
                      "
                  >
                    <input
                      type="checkbox"
                      checked={values[field.id] === true}
                      disabled={preview || submitting}
                      onChange={(event) =>
                        updateValue(field.id, event.target.checked)
                      }
                    />

                    <span
                      className="
                          text-[10px]
                          leading-[1.6]

                          text-black/60
                        "
                    >
                      {label}
                    </span>
                  </label>
                </div>
              ) : (
                <input
                  type={
                    field.type === "email"
                      ? "email"
                      : field.type === "phone"
                        ? "tel"
                        : "text"
                  }
                  value={values[field.id] || ""}
                  placeholder={placeholder}
                  disabled={preview || submitting}
                  onChange={(event) =>
                    updateValue(field.id, event.target.value)
                  }
                  className={`${commonClass} h-9`}
                />
              )}

              {hasError && (
                <div
                  className="
                      mt-1

                      text-[9px]

                      text-red-500
                    "
                >
                  {fieldErrors[field.id]}
                </div>
              )}
            </label>
          );
        })}
      </div>

      {error && (
        <div
          className="
            mt-4

            text-[10px]

            text-red-500
          "
        >
          {error}
        </div>
      )}

      <div
        className="
          mt-6
          flex
          justify-end
        "
      >
        <button
          type="submit"
          disabled={preview || submitting}
          className="
            inline-flex
            min-w-[92px]

            items-center
            justify-center
            gap-2

            border
            border-black

            bg-black

            px-5
            py-2.5

            text-[10px]
            uppercase
            tracking-[0.14em]

            text-white

            transition

            hover:bg-white
            hover:text-black

            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {submitting && <LoaderCircle size={12} className="animate-spin" />}

          {localized(
            form.settings?.submitLabel,
            locale,
            locale === "th" ? "ส่ง" : "Send",
          )}
        </button>
      </div>
    </form>
  );
}
