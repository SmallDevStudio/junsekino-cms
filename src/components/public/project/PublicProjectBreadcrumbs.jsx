import Link from "next/link";

function getLocalizedValue(value, locale = "en") {
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
  const categoryName = getLocalizedValue(category?.name, locale);

  const projectTitle = getLocalizedValue(project?.title, locale);

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
      <Link
        href={`/${companySlug}`}
        className="
          text-black/25
          transition-colors
          hover:text-black/55
        "
      >
        Home
      </Link>

      <span className="text-black/15">/</span>

      {category || project ? (
        <Link
          href={`/${companySlug}/project`}
          className="
            text-black/25
            transition-colors
            hover:text-black/55
          "
        >
          Project
        </Link>
      ) : (
        <span
          className="font-medium"
          style={{
            color: "var(--public-primary)",
          }}
        >
          Project
        </span>
      )}

      {category && (
        <>
          <span className="text-black/15">/</span>

          {project ? (
            <Link
              href={`/${companySlug}/project/${category.slug}`}
              className="
                text-black/25
                transition-colors
                hover:text-black/55
              "
            >
              {categoryName}
            </Link>
          ) : (
            <span
              className="font-medium"
              style={{
                color: "var(--public-primary)",
              }}
            >
              {categoryName}
            </span>
          )}
        </>
      )}

      {project && (
        <>
          <span className="text-black/15">/</span>

          <span
            className="
              max-w-[260px]
              truncate
              font-medium
            "
            style={{
              color: "var(--public-primary)",
            }}
          >
            {projectTitle}
          </span>
        </>
      )}
    </nav>
  );
}
