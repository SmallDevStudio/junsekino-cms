export function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasLocalizedText(value) {
  return hasText(value?.th) || hasText(value?.en);
}

export function hasErrors(errors) {
  return Boolean(
    errors && typeof errors === "object" && Object.keys(errors).length > 0,
  );
}

export function getFieldError(errors, field) {
  return errors?.[field] || "";
}

export function clearFieldError(setErrors, field) {
  setErrors((current) => {
    if (!current?.[field]) {
      return current;
    }

    const next = {
      ...current,
    };

    delete next[field];

    return next;
  });
}

export function clearFieldErrors(setErrors, fields = []) {
  setErrors((current) => {
    if (!current) {
      return current;
    }

    const next = {
      ...current,
    };

    let changed = false;

    for (const field of fields) {
      if (next[field]) {
        delete next[field];
        changed = true;
      }
    }

    return changed ? next : current;
  });
}

export function getInvalidFieldClass(error) {
  if (!error) {
    return "";
  }

  return [
    "!border-red-500",
    "focus:!border-red-500",
    "focus:!ring-red-500/15",
  ].join(" ");
}

export function focusFirstInvalidField(errors) {
  if (
    typeof document === "undefined" ||
    !errors ||
    typeof errors !== "object"
  ) {
    return;
  }

  const firstField = Object.keys(errors)[0];

  if (!firstField) {
    return;
  }

  window.requestAnimationFrame(() => {
    const element = document.querySelector(
      `[data-form-field="${CSS.escape(firstField)}"]`,
    );

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    const focusable = element.matches("input, textarea, select, button")
      ? element
      : element.querySelector("input, textarea, select, button");

    window.setTimeout(() => {
      focusable?.focus?.({
        preventScroll: true,
      });
    }, 250);
  });
}

export function normalizeServerFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return {};
  }

  const normalized = {};

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages)) {
      const message = messages.find(Boolean);

      if (message) {
        normalized[field] = String(message);
      }

      continue;
    }

    if (messages) {
      normalized[field] = String(messages);
    }
  }

  return normalized;
}

export function validateProjectForm(form) {
  const errors = {};

  if (!hasLocalizedText(form?.title)) {
    errors.title = "Enter the project title in Thai or English.";
  }

  if (!hasText(form?.slug)) {
    errors.slug = "Project slug is required.";
  }

  return errors;
}

export function validateAwardForm(form) {
  const errors = {};

  if (!hasLocalizedText(form?.title)) {
    errors.title = "Enter the award title in Thai or English.";
  }

  if (!hasText(form?.slug)) {
    errors.slug = "Award slug is required.";
  }

  if (!hasLocalizedText(form?.awardInfo?.name)) {
    errors.awardName = "Enter the award name in Thai or English.";
  }

  const year = form?.awardInfo?.year;

  if (year !== "" && year !== null && year !== undefined) {
    const parsedYear = Number(year);

    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1900 ||
      parsedYear > 2200
    ) {
      errors.awardYear = "Award year must be between 1900 and 2200.";
    }
  }

  return errors;
}
