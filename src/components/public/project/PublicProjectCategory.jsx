import PublicProjectBreadcrumbs from "./PublicProjectBreadcrumbs";
import PublicProjectCard from "./PublicProjectCard";

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

export default function PublicProjectCategory({
  companySlug,
  category,
  projects = [],
  locale = "en",
}) {
  const categoryName = getLocalizedValue(category?.name, locale);

  return (
    <div
      className="
        w-full

        px-6
        pb-16

        sm:px-8

        lg:px-12
        lg:pb-24

        xl:px-16
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1440px]
        "
      >
        <div className="pt-2 lg:pt-4">
          <PublicProjectBreadcrumbs
            companySlug={companySlug}
            category={category}
            locale={locale}
          />
        </div>

        <div
          className="
            mt-10
            flex
            items-center
            gap-5

            sm:mt-12
            sm:gap-7

            lg:mt-14
          "
        >
          <h1
            className="
              shrink-0

              text-[12px]
              font-medium
              uppercase
              tracking-[0.06em]

              text-[var(--public-primary)]

              sm:text-[13px]
            "
          >
            {categoryName}
          </h1>

          <div
            className="
              h-px
              flex-1
              bg-black/10
            "
          />
        </div>

        <div
          className="
            mt-8

            grid
            grid-cols-1

            gap-x-[clamp(2rem,6vw,6.5rem)]
            gap-y-12

            sm:grid-cols-2

            lg:mt-10
            lg:grid-cols-3
            lg:gap-y-16
          "
        >
          {projects.map((project) => (
            <PublicProjectCard
              key={project.id}
              companySlug={companySlug}
              project={project}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
