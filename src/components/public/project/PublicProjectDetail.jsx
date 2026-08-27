import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import PublicProjectBreadcrumbs from "./PublicProjectBreadcrumbs";
import PublicProjectShare from "./PublicProjectShare";
import PublicProjectSlideshow from "./PublicProjectSlideshow";

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

function formatCredit(items, locale) {
  if (!Array.isArray(items)) {
    return "";
  }

  return items
    .map((item) => getLocalizedValue(item, locale))
    .filter(Boolean)
    .join(", ");
}

function formatArea(area) {
  if (area?.value === null || area?.value === undefined) {
    return "";
  }

  const unit = area.unit === "sqft" ? "sq.ft." : "sq.m.";

  return `${area.value.toLocaleString()} ${unit}`;
}

function InfoRow({ label, value }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div
      className="
        grid
        grid-cols-[118px_1fr]
        gap-3

        text-[11px]
        leading-[1.3]

        sm:grid-cols-[126px_1fr]
        sm:text-[12px]
      "
    >
      <dt className="text-black/60">{label}</dt>

      <dd className="text-black/80">{value}</dd>
    </div>
  );
}

function ProjectContent({ content }) {
  if (!content) {
    return null;
  }

  return (
    <div
      className="
        text-[12px]
        leading-[1.55]
        text-black/80

        sm:text-[13px]

        [&_a]:underline
        [&_a]:decoration-black/20
        [&_a]:underline-offset-2
        [&_a]:transition-colors
        [&_a:hover]:text-[var(--public-primary)]

        [&_blockquote]:my-5
        [&_blockquote]:border-l
        [&_blockquote]:border-black/15
        [&_blockquote]:pl-4
        [&_blockquote]:text-black/50

        [&_h2]:mb-3
        [&_h2]:mt-7
        [&_h2]:text-[14px]
        [&_h2]:font-semibold

        [&_h3]:mb-3
        [&_h3]:mt-6
        [&_h3]:text-[13px]
        [&_h3]:font-semibold

        [&_li]:mb-1

        [&_ol]:my-4
        [&_ol]:list-decimal
        [&_ol]:pl-5

        [&_p]:mb-4

        [&_strong]:font-semibold

        [&_ul]:my-4
        [&_ul]:list-disc
        [&_ul]:pl-5
      "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export default function PublicProjectDetail({
  companySlug,
  project,
  locale = "en",
}) {
  const title = getLocalizedValue(project.title, locale);

  const location = getLocalizedValue(project.projectInfo?.location, locale);

  const content = getLocalizedValue(project.content, locale);

  const client = getLocalizedValue(project.projectInfo?.client, locale);

  const architecture = formatCredit(
    project.projectInfo?.credits?.architecture,
    locale,
  );

  const interior = formatCredit(project.projectInfo?.credits?.interior, locale);

  const landscape = formatCredit(
    project.projectInfo?.credits?.landscape,
    locale,
  );

  const consultant = formatCredit(
    project.projectInfo?.credits?.consultant,
    locale,
  );

  const projectType =
    getLocalizedValue(project.subCategory?.name, locale) ||
    getLocalizedValue(project.category?.name, locale);

  return (
    <div
      className="
        w-full

        px-5
        pb-14

        sm:px-8

        lg:px-12
        lg:pb-20

        xl:px-16
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1680px]
        "
      >
        <div className="pt-2 lg:pt-4">
          <PublicProjectBreadcrumbs
            companySlug={companySlug}
            category={project.category}
            project={project}
            locale={locale}
          />
        </div>

        <div
          className="
            mt-8

            grid
            grid-cols-1
            gap-10

            lg:mt-10
            lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]
            lg:gap-[clamp(3rem,5vw,6rem)]

            xl:grid-cols-[minmax(0,1.75fr)_minmax(360px,0.75fr)]
          "
        >
          {/* LEFT — SLIDESHOW */}

          <div className="min-w-0">
            <PublicProjectSlideshow
              companySlug={companySlug}
              project={project}
              locale={locale}
            />
          </div>

          {/* RIGHT — INFORMATION */}

          <aside
            className="
              min-w-0

              lg:max-h-[calc(100svh-150px)]
              lg:overflow-y-auto
              lg:pr-2

              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-5
              "
            >
              <div
                className="
                  min-w-0
                  flex-1
                  text-center
                "
              >
                <h1
                  className="
                    text-[24px]
                    font-normal
                    leading-none
                    tracking-[0.025em]

                    sm:text-[26px]
                    lg:text-[28px]
                  "
                >
                  {title}
                </h1>

                {location && (
                  <p
                    className="
                      mt-3

                      text-[13px]
                      leading-none
                      text-black/45

                      sm:text-[14px]
                    "
                  >
                    {location}
                  </p>
                )}
              </div>

              <PublicProjectShare title={title} />
            </div>

            {content && (
              <div className="mt-7 lg:mt-8">
                <ProjectContent content={content} />
              </div>
            )}

            <dl
              className="
                mt-10
                space-y-1

                border-t
                border-black/[0.06]

                pt-6

                lg:mt-12
              "
            >
              <InfoRow label="Project" value={title} />

              <InfoRow label="Architecture" value={architecture} />

              <InfoRow label="Interior" value={interior} />

              <InfoRow label="Landscape" value={landscape} />

              <InfoRow label="Consultant" value={consultant} />

              <InfoRow label="Client" value={client} />

              <InfoRow
                label="Design Year"
                value={project.projectInfo?.designYear}
              />

              <InfoRow
                label="Completion Year"
                value={project.projectInfo?.completionYear}
              />

              <InfoRow
                label="Area"
                value={formatArea(project.projectInfo?.area)}
              />

              <InfoRow label="Project Location" value={location} />

              <InfoRow label="Project Type" value={projectType} />
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
