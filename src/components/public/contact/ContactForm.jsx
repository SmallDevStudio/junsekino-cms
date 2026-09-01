"use client";

import { Check, LoaderCircle } from "lucide-react";

import { useState } from "react";

function localized(
  value,

  locale,

  fallback = "",
) {
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
      result[field.id] =
        Array.isArray(field.options) && field.options.length ? [] : false;

      continue;
    }

    if (field.type === "consent") {
      result[field.id] = false;

      continue;
    }

    result[field.id] = "";
  }

  return result;
}

function getFieldWidthClass(width) {
  if (width === "half") {
    return "col-span-12 md:col-span-6";
  }

  if (width === "third") {
    return "col-span-12 md:col-span-4";
  }

  return "col-span-12";
}

function createControlId(
  form,

  field,
) {
  return `contact-${form?.id || form?.slug || "form"}-${field.id}`.replace(
    /[^a-zA-Z0-9_-]/g,

    "-",
  );
}

function isMissingRequiredValue(
  field,

  value,
) {
  if (field.type === "consent") {
    return value !== true;
  }

  if (field.type === "checkbox") {
    return Array.isArray(value) ? value.length === 0 : value !== true;
  }

  return value === undefined || value === null || String(value).trim() === "";
}

function inputType(fieldType) {
  if (fieldType === "email") {
    return "email";
  }

  if (fieldType === "phone") {
    return "tel";
  }

  if (fieldType === "number") {
    return "number";
  }

  if (fieldType === "date") {
    return "date";
  }

  return "text";
}

function autoComplete(
  field,

  label,
) {
  if (field.type === "email") {
    return "email";
  }

  if (field.type === "phone") {
    return "tel";
  }

  if (/name|surname|ชื่อ|นามสกุล/i.test(label)) {
    return "name";
  }

  return "off";
}

export default function ContactForm({
  companySlug,

  form,

  locale = "en",

  preview = false,
}) {
  const fields = Array.isArray(form?.fields) ? form.fields : [];

  const [values, setValues] = useState(() => createInitialValues(fields));

  const [website, setWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  if (!form) {
    return null;
  }

  function updateValue(
    fieldId,

    value,
  ) {
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

  function toggleCheckboxOption(
    fieldId,

    optionValue,

    checked,
  ) {
    const current = Array.isArray(values[fieldId]) ? values[fieldId] : [];

    const next = checked
      ? Array.from(new Set([...current, optionValue]))
      : current.filter((value) => value !== optionValue);

    updateValue(fieldId, next);
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
        isMissingRequiredValue(
          field,

          value,
        )
      ) {
        const booleanField = ["checkbox", "consent"].includes(field.type);

        nextErrors[field.id] =
          locale === "th"
            ? booleanField
              ? "กรุณายอมรับหรือเลือกข้อมูลในช่องนี้"
              : "กรุณากรอกข้อมูล"
            : booleanField
              ? "Please accept or select this field."
              : "This field is required.";

        continue;
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

            website,
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

      setWebsite("");
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
          py-9
          text-center
          text-[var(--public-foreground)]
        "
        role="status"
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
            bg-[var(--public-primary)]
            text-white
          "
        >
          <Check size={17} strokeWidth={1.7} />
        </div>

        <h3
          className="
            mt-4
            text-[15px]
            font-semibold
            text-[var(--public-foreground)]
          "
        >
          {localized(
            form.settings?.successTitle,

            locale,

            "Thank you",
          )}
        </h3>

        <p
          className="
            mx-auto
            mt-2
            max-w-[440px]
            text-[12px]
            leading-[1.7]
            text-[var(--public-muted-foreground)]
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

  const controlClass = `
    mt-1.5
    w-full
    rounded-md
    border
    border-[var(--public-border)]
    bg-[var(--public-background)]
    px-2.5
    text-[13px]
    text-[var(--public-foreground)]
    outline-none
    transition
    placeholder:text-[var(--public-muted-foreground)]
    hover:border-[var(--public-muted-foreground)]
    focus:border-[var(--public-primary)]
    disabled:cursor-not-allowed
    disabled:opacity-60
  `;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="
        text-[var(--public-foreground)]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -left-[10000px]
          top-auto
          h-px
          w-px
          overflow-hidden
        "
      >
        <label htmlFor="contact-website">Website</label>

        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <div
        className="
          grid
          grid-cols-12
          gap-x-4
          gap-y-3
        "
      >
        {fields.map((field) => {
          if (field.enabled === false) {
            return null;
          }

          const widthClass = getFieldWidthClass(field.width);

          if (field.type === "heading") {
            return (
              <h3
                key={field.id}
                className={`
                  ${widthClass}
                  pt-1
                  text-[14px]
                  font-semibold
                  leading-[1.5]
                  text-[var(--public-foreground)]
                `}
              >
                {localized(
                  field.label,

                  locale,
                )}
              </h3>
            );
          }

          if (field.type === "paragraph") {
            return (
              <p
                key={field.id}
                className={`
                  ${widthClass}
                  text-[12px]
                  leading-[1.7]
                  text-[var(--public-muted-foreground)]
                `}
              >
                {localized(
                  field.label,

                  locale,
                )}
              </p>
            );
          }

          const label = localized(
            field.label,

            locale,
          );

          const placeholder = localized(
            field.placeholder,

            locale,
          );

          const helpText = localized(
            field.helpText,

            locale,
          );

          const hasError = Boolean(fieldErrors[field.id]);

          const controlId = createControlId(
            form,

            field,
          );

          const errorId = `${controlId}-error`;

          const helpId = `${controlId}-help`;

          const describedBy = hasError
            ? errorId
            : helpText
              ? helpId
              : undefined;

          if (field.type === "consent") {
            return (
              <div key={field.id} className={widthClass}>
                <label
                  htmlFor={controlId}
                  className="
                    flex
                    cursor-pointer
                    items-start
                    gap-2.5
                    pt-1
                  "
                >
                  <input
                    id={controlId}
                    type="checkbox"
                    checked={values[field.id] === true}
                    disabled={preview || submitting}
                    aria-invalid={hasError}
                    aria-describedby={describedBy}
                    onChange={(event) =>
                      updateValue(
                        field.id,

                        event.target.checked,
                      )
                    }
                    className="
                      mt-0.5
                      h-4
                      w-4
                      shrink-0
                      accent-[var(--public-primary)]
                    "
                  />

                  <span
                    className="
                      text-[12px]
                      leading-[1.6]
                      text-[var(--public-foreground)]
                    "
                  >
                    {label}

                    {field.required && (
                      <span
                        className="
                          ml-1
                          text-[var(--public-primary)]
                        "
                      >
                        *
                      </span>
                    )}
                  </span>
                </label>

                {helpText && !hasError && (
                  <p
                    id={helpId}
                    className="
                        mt-1
                        text-[10px]
                        leading-[1.6]
                        text-[var(--public-muted-foreground)]
                      "
                  >
                    {helpText}
                  </p>
                )}

                {hasError && (
                  <p
                    id={errorId}
                    role="alert"
                    className="
                      mt-1
                      text-[10px]
                      text-red-500
                    "
                  >
                    {fieldErrors[field.id]}
                  </p>
                )}
              </div>
            );
          }

          if (field.type === "radio") {
            return (
              <fieldset key={field.id} className={widthClass}>
                <legend
                  className="
                    text-[13px]
                    leading-[1.4]
                    text-[var(--public-foreground)]
                  "
                >
                  {label}

                  {field.required && (
                    <span
                      className="
                        ml-1
                        text-[var(--public-primary)]
                      "
                    >
                      *
                    </span>
                  )}
                </legend>

                <div
                  className="
                    mt-2
                    flex
                    flex-wrap
                    gap-x-5
                    gap-y-2
                  "
                >
                  {(field.options || []).map((option) => (
                    <label
                      key={option.value}
                      className="
                        flex
                        cursor-pointer
                        items-center
                        gap-2
                        text-[12px]
                        text-[var(--public-foreground)]
                      "
                    >
                      <input
                        type="radio"
                        name={controlId}
                        value={option.value}
                        checked={values[field.id] === option.value}
                        disabled={preview || submitting}
                        onChange={(event) =>
                          updateValue(
                            field.id,

                            event.target.value,
                          )
                        }
                        className="
                          h-4
                          w-4
                          accent-[var(--public-primary)]
                        "
                      />

                      {localized(
                        option.label,

                        locale,

                        option.value,
                      )}
                    </label>
                  ))}
                </div>

                {hasError && (
                  <p
                    id={errorId}
                    role="alert"
                    className="
                      mt-1
                      text-[10px]
                      text-red-500
                    "
                  >
                    {fieldErrors[field.id]}
                  </p>
                )}
              </fieldset>
            );
          }

          if (field.type === "checkbox") {
            const options = Array.isArray(field.options) ? field.options : [];

            if (options.length) {
              return (
                <fieldset key={field.id} className={widthClass}>
                  <legend
                    className="
                      text-[13px]
                      leading-[1.4]
                      text-[var(--public-foreground)]
                    "
                  >
                    {label}

                    {field.required && (
                      <span
                        className="
                          ml-1
                          text-[var(--public-primary)]
                        "
                      >
                        *
                      </span>
                    )}
                  </legend>

                  <div
                    className="
                      mt-2
                      flex
                      flex-wrap
                      gap-x-5
                      gap-y-2
                    "
                  >
                    {options.map((option) => (
                      <label
                        key={option.value}
                        className="
                            flex
                            cursor-pointer
                            items-center
                            gap-2
                            text-[12px]
                            text-[var(--public-foreground)]
                          "
                      >
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={
                            Array.isArray(values[field.id]) &&
                            values[field.id].includes(option.value)
                          }
                          disabled={preview || submitting}
                          onChange={(event) =>
                            toggleCheckboxOption(
                              field.id,

                              option.value,

                              event.target.checked,
                            )
                          }
                          className="
                              h-4
                              w-4
                              accent-[var(--public-primary)]
                            "
                        />

                        {localized(
                          option.label,

                          locale,

                          option.value,
                        )}
                      </label>
                    ))}
                  </div>

                  {hasError && (
                    <p
                      id={errorId}
                      role="alert"
                      className="
                        mt-1
                        text-[10px]
                        text-red-500
                      "
                    >
                      {fieldErrors[field.id]}
                    </p>
                  )}
                </fieldset>
              );
            }

            return (
              <div key={field.id} className={widthClass}>
                <label
                  htmlFor={controlId}
                  className="
                    flex
                    cursor-pointer
                    items-center
                    gap-2.5
                    pt-1
                  "
                >
                  <input
                    id={controlId}
                    type="checkbox"
                    checked={values[field.id] === true}
                    disabled={preview || submitting}
                    onChange={(event) =>
                      updateValue(
                        field.id,

                        event.target.checked,
                      )
                    }
                    className="
                      h-4
                      w-4
                      accent-[var(--public-primary)]
                    "
                  />

                  <span
                    className="
                      text-[12px]
                      leading-[1.6]
                      text-[var(--public-foreground)]
                    "
                  >
                    {label}

                    {field.required && (
                      <span
                        className="
                          ml-1
                          text-[var(--public-primary)]
                        "
                      >
                        *
                      </span>
                    )}
                  </span>
                </label>

                {hasError && (
                  <p
                    id={errorId}
                    role="alert"
                    className="
                      mt-1
                      text-[10px]
                      text-red-500
                    "
                  >
                    {fieldErrors[field.id]}
                  </p>
                )}
              </div>
            );
          }

          return (
            <div key={field.id} className={widthClass}>
              <label
                htmlFor={controlId}
                className="
                  block
                  text-[13px]
                  leading-[1.4]
                  text-[var(--public-foreground)]
                "
              >
                {label}

                {field.required && (
                  <span
                    className="
                      ml-1
                      text-[var(--public-primary)]
                    "
                  >
                    *
                  </span>
                )}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  id={controlId}
                  rows={6}
                  value={values[field.id] || ""}
                  placeholder={placeholder}
                  disabled={preview || submitting}
                  required={field.required}
                  aria-invalid={hasError}
                  aria-describedby={describedBy}
                  onChange={(event) =>
                    updateValue(
                      field.id,

                      event.target.value,
                    )
                  }
                  className={`
                    ${controlClass}
                    min-h-[124px]
                    resize-y
                    py-2.5
                  `}
                />
              ) : field.type === "select" ? (
                <select
                  id={controlId}
                  value={values[field.id] || ""}
                  disabled={preview || submitting}
                  required={field.required}
                  aria-invalid={hasError}
                  aria-describedby={describedBy}
                  onChange={(event) =>
                    updateValue(
                      field.id,

                      event.target.value,
                    )
                  }
                  className={`
                    ${controlClass}
                    h-[38px]
                  `}
                >
                  <option value="">{placeholder || "—"}</option>

                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {localized(
                        option.label,

                        locale,

                        option.value,
                      )}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={controlId}
                  type={inputType(field.type)}
                  value={values[field.id] ?? ""}
                  placeholder={placeholder}
                  disabled={preview || submitting}
                  required={field.required}
                  autoComplete={autoComplete(
                    field,

                    label,
                  )}
                  min={field.validation?.min ?? undefined}
                  max={field.validation?.max ?? undefined}
                  minLength={field.validation?.minLength ?? undefined}
                  maxLength={field.validation?.maxLength ?? undefined}
                  pattern={field.validation?.pattern || undefined}
                  aria-invalid={hasError}
                  aria-describedby={describedBy}
                  onChange={(event) =>
                    updateValue(
                      field.id,

                      field.type === "number" && event.target.value !== ""
                        ? Number(event.target.value)
                        : event.target.value,
                    )
                  }
                  className={`
                    ${controlClass}
                    h-[38px]
                  `}
                />
              )}

              {helpText && !hasError && (
                <p
                  id={helpId}
                  className="
                      mt-1
                      text-[10px]
                      leading-[1.6]
                      text-[var(--public-muted-foreground)]
                    "
                >
                  {helpText}
                </p>
              )}

              {hasError && (
                <p
                  id={errorId}
                  role="alert"
                  className="
                    mt-1
                    text-[10px]
                    text-red-500
                  "
                >
                  {fieldErrors[field.id]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="
            mt-4
            text-center
            text-[11px]
            text-red-500
          "
        >
          {error}
        </p>
      )}

      <div
        className="
          mt-5
          flex
          justify-center
        "
      >
        <button
          type="submit"
          disabled={preview || submitting}
          className="
            inline-flex
            min-h-[37px]
            min-w-[77px]
            items-center
            justify-center
            gap-2
            rounded-md
            bg-[var(--public-primary)]
            px-5
            py-2
            text-[13px]
            font-medium
            text-white
            transition-opacity
            hover:opacity-85
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[var(--public-primary)]
            disabled:cursor-not-allowed
            disabled:opacity-45
          "
        >
          {submitting && <LoaderCircle size={14} className="animate-spin" />}

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
