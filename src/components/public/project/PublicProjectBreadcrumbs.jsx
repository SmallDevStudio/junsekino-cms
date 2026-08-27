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
  locale = "en",
}) {
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
          text-black/30
          transition-opacity
          hover:opacity-60
        "
      >
        Home
      </Link>

      <span className="text-black/15">/</span>

      {category ? (
        <>
          <Link
            href={`/${companySlug}/project`}
            className="
              text-black/30
              transition-opacity
              hover:opacity-60
            "
          >
            Project
          </Link>

          <span className="text-black/15">/</span>

          <span
            className="font-medium"
            style={{
              color: "var(--public-primary)",
            }}
          >
            {getLocalizedValue(category.name, locale)}
          </span>
        </>
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
    </nav>
  );
}
