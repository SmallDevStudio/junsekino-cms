import Link from "next/link";

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

export default function PublicProjectIndex({
  companySlug,
  sections = [],
  locale = "en",
}) {
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
          <PublicProjectBreadcrumbs companySlug={companySlug} locale={locale} />
        </div>

        {!sections.length ? (
          <div
            className="
              flex
              min-h-[50vh]
              items-center
              justify-center

              text-[11px]
              uppercase
              tracking-[0.08em]
              text-black/25
            "
          >
            No projects available
          </div>
        ) : (
          <div
            className="
              mt-10
              space-y-20

              sm:mt-12

              lg:mt-14
              lg:space-y-28
            "
          >
            {sections.map((section) => {
              const categoryName = getLocalizedValue(
                section.category?.name,
                locale,
              );

              return (
                <section key={section.category.id}>
                  {/* =====================
                        CATEGORY DIVIDER
                    ====================== */}

                  <div
                    className="
                        flex
                        items-center
                        gap-5

                        sm:gap-7
                      "
                  >
                    <h2
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
                    </h2>

                    <div
                      className="
                          h-px
                          flex-1
                          bg-black/10
                        "
                    />
                  </div>

                  {/* =====================
                        PROJECT GRID
                    ====================== */}

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
                    {section.projects.map((project) => (
                      <PublicProjectCard
                        key={project.id}
                        companySlug={companySlug}
                        project={project}
                        locale={locale}
                      />
                    ))}
                  </div>

                  {/* =====================
                        READ MORE
                    ====================== */}

                  {section.hasMore && (
                    <div
                      className="
                          mt-10
                          flex
                          justify-center

                          lg:mt-12
                        "
                    >
                      <Link
                        href={`/${companySlug}/project/${section.category.slug}`}
                        className="
                            group

                            inline-flex
                            items-center
                            gap-3

                            text-[10px]
                            font-normal
                            uppercase
                            tracking-[0.08em]

                            text-black/35

                            transition-colors
                            duration-300

                            hover:text-[var(--public-primary)]

                            sm:text-[11px]
                          "
                      >
                        <span>Read More</span>

                        <span
                          className="
                              block
                              h-px
                              w-8

                              bg-current

                              transition-all
                              duration-300

                              group-hover:w-12
                            "
                        />
                      </Link>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
