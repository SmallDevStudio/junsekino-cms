import Link from "next/link";

function getLocalizedValue(
  value,

  locale = "en",
) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.[locale]?.trim() || value?.en?.trim() || value?.th?.trim() || ""
  );
}

export default function PublicProjectBreadcrumbs({
  companySlug,

  category = null,

  project = null,

  locale = "en",
}) {
  const categoryName = getLocalizedValue(
    category?.name,

    locale,
  );

  const projectTitle = getLocalizedValue(
    project?.title,

    locale,
  );

  const inactiveClassName = `
    text-[var(--public-muted-foreground)]
    transition-colors
    hover:text-[var(--public-foreground)]
  `;

  return (
    <nav
      aria-label="Breadcrumb"
      className="
        flex
        flex-wrap
        items-center
        gap-2
        text-[10px]
        uppercase
        tracking-[0.06em]
        sm:text-[11px]
      "
    >
      <Link href={`/${companySlug}`} className={inactiveClassName}>
        Home
      </Link>

      <span
        className="
          text-[var(--public-border)]
        "
      >
        /
      </span>

      {category || project ? (
        <Link href={`/${companySlug}/project`} className={inactiveClassName}>
          Project
        </Link>
      ) : (
        <span
          className="
            font-medium
            text-[var(--public-primary)]
          "
        >
          Project
        </span>
      )}

      {category && (
        <>
          <span
            className="
              text-[var(--public-border)]
            "
          >
            /
          </span>

          {project ? (
            <Link
              href={`/${companySlug}/project/${category.slug}`}
              className={inactiveClassName}
            >
              {categoryName}
            </Link>
          ) : (
            <span
              className="
                font-medium
                text-[var(--public-primary)]
              "
            >
              {categoryName}
            </span>
          )}
        </>
      )}

      {project && (
        <>
          <span
            className="
              text-[var(--public-border)]
            "
          >
            /
          </span>

          <span
            className="
              max-w-[260px]
              truncate
              font-medium
              text-[var(--public-primary)]
            "
          >
            {projectTitle}
          </span>
        </>
      )}
    </nav>
  );
}
