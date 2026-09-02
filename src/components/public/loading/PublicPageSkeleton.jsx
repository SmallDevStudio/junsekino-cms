function Pulse({
  className = "",

  style,
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`
        animate-pulse

        rounded-sm

        bg-[var(--public-border)]

        ${className}
      `}
    />
  );
}

function SkeletonContainer({
  children,

  maxWidth = "1680px",

  className = "",
}) {
  return (
    <div
      className={`
        w-full

        bg-[var(--public-background)]

        px-5
        pb-14

        text-[var(--public-foreground)]

        sm:px-8

        lg:px-12
        lg:pb-20

        xl:px-16

        ${className}
      `}
    >
      <div
        className="
          mx-auto
          w-full
        "
        style={{
          maxWidth,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function BreadcrumbSkeleton() {
  return (
    <div
      className="
        flex
        items-center
        gap-2

        pt-2

        lg:pt-4
      "
    >
      <Pulse className="h-2.5 w-12" />

      <Pulse className="h-2 w-2 rounded-full" />

      <Pulse className="h-2.5 w-20" />
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-6

        pt-2

        lg:pt-4
      "
    >
      <div className="flex items-center gap-2">
        <Pulse className="h-2.5 w-12" />

        <Pulse className="h-2 w-2 rounded-full" />

        <Pulse className="h-2.5 w-20" />
      </div>

      <Pulse className="h-8 w-8 rounded-full" />
    </div>
  );
}

function TextLines({
  count = 4,

  className = "",
}) {
  const widths = ["100%", "94%", "98%", "78%", "88%", "65%"];

  return (
    <div
      className={`
        space-y-3

        ${className}
      `}
    >
      {Array.from({
        length: count,
      }).map((_, index) => (
        <Pulse
          key={index}
          className="h-3"
          style={{
            width: widths[index % widths.length],
          }}
        />
      ))}
    </div>
  );
}

function CardGridSkeleton({
  count = 6,

  columns = "lg:grid-cols-3",
}) {
  return (
    <div
      className={`
        grid
        grid-cols-1
        gap-x-6
        gap-y-10

        sm:grid-cols-2

        ${columns}
      `}
    >
      {Array.from({
        length: count,
      }).map((_, index) => (
        <article key={index}>
          <Pulse
            className="
              aspect-[4/3]
              w-full
            "
          />

          <Pulse className="mt-4 h-3 w-2/3" />

          <Pulse className="mt-3 h-2.5 w-1/3" />
        </article>
      ))}
    </div>
  );
}

/*
 * =========================================================
 * HOME
 * =========================================================
 */

function HomeSkeleton() {
  return (
    <SkeletonContainer>
      <div
        className="
          mx-auto
          w-full
          max-w-[1200px]
        "
      >
        <Pulse
          className="
            aspect-[16/10]
            w-full

            lg:h-[min(64vh,680px)]
            lg:aspect-auto
          "
        />

        <div
          className="
            mt-4

            flex
            items-center
            justify-center
            gap-3
          "
        >
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <Pulse key={index} className="h-1.5 w-1.5 rounded-full" />
          ))}
        </div>

        <div
          className="
            mt-6

            flex
            items-center
            justify-center
            gap-3

            overflow-hidden
          "
        >
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <Pulse
              key={index}
              className="
                h-[54px]
                w-[86px]
                shrink-0

                sm:h-[62px]
                sm:w-[100px]
              "
            />
          ))}
        </div>
      </div>
    </SkeletonContainer>
  );
}

/*
 * =========================================================
 * PROJECT LIST / CATEGORY
 * =========================================================
 */

function ProjectListSkeleton() {
  return (
    <SkeletonContainer maxWidth="1440px">
      <FilterSkeleton />

      <div
        className="
          mt-10

          flex
          items-end
          justify-between
          gap-6

          lg:mt-14
        "
      >
        <div>
          <Pulse className="h-6 w-40" />

          <Pulse className="mt-3 h-2.5 w-28" />
        </div>

        <Pulse className="h-8 w-8 rounded-full" />
      </div>

      <div className="mt-10">
        <CardGridSkeleton count={6} columns="lg:grid-cols-3" />
      </div>
    </SkeletonContainer>
  );
}

/*
 * =========================================================
 * PROJECT DETAIL
 * =========================================================
 */

function ProjectDetailSkeleton() {
  return (
    <SkeletonContainer
      maxWidth="1680px"
      className="
        lg:h-[calc(100svh-129px)]
        lg:min-h-0
        lg:overflow-hidden
        lg:pb-6
      "
    >
      <div
        className="
          lg:grid
          lg:h-full
          lg:min-h-0
          lg:grid-rows-[auto_minmax(0,1fr)]
        "
      >
        <BreadcrumbSkeleton />

        <div
          className="
            mt-8

            grid
            grid-cols-1
            gap-10

            lg:mt-5
            lg:min-h-0
            lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]
            lg:gap-[clamp(3rem,5vw,6rem)]

            xl:grid-cols-[minmax(0,1.75fr)_minmax(360px,0.75fr)]
          "
        >
          <div
            className="
              lg:flex
              lg:h-full
              lg:min-h-0
              lg:flex-col
            "
          >
            <Pulse
              className="
                aspect-[4/3]
                w-full

                lg:min-h-0
                lg:flex-1
                lg:aspect-auto
              "
            />

            <div
              className="
                mt-3

                flex
                items-center
                justify-center
                gap-3
              "
            >
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <Pulse key={index} className="h-1.5 w-1.5 rounded-full" />
              ))}
            </div>

            <div
              className="
                mt-4

                flex
                shrink-0
                gap-3

                overflow-hidden
              "
            >
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <Pulse
                  key={index}
                  className="
                    h-[54px]
                    w-[86px]
                    shrink-0

                    lg:h-[64px]
                    lg:w-[104px]
                  "
                />
              ))}
            </div>
          </div>

          <aside
            className="
              min-w-0

              lg:h-full
              lg:min-h-0
              lg:overflow-hidden
            "
          >
            <Pulse className="mx-auto h-7 w-2/3" />

            <Pulse className="mx-auto mt-4 h-3 w-1/3" />

            <TextLines count={6} className="mt-10" />

            <div
              className="
                mt-12

                border-t
                border-[var(--public-border)]

                pt-6
              "
            >
              <div className="space-y-4">
                {Array.from({
                  length: 7,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="
                      grid
                      grid-cols-[118px_1fr]
                      gap-4
                    "
                  >
                    <Pulse className="h-2.5" />

                    <Pulse className="h-2.5" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SkeletonContainer>
  );
}

/*
 * =========================================================
 * ABOUT
 * =========================================================
 */

function AboutSkeleton() {
  return (
    <SkeletonContainer maxWidth="920px">
      <BreadcrumbSkeleton />

      <div className="mt-10">
        <Pulse
          className="
            aspect-[16/9]
            w-full
          "
        />

        <div
          className="
            mx-auto
            mt-12
            max-w-[680px]
          "
        >
          <Pulse className="mx-auto h-7 w-1/2" />

          <TextLines count={7} className="mt-8" />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <Pulse className="aspect-[4/3] w-full" />

          <div className="flex items-center">
            <TextLines count={6} />
          </div>
        </div>
      </div>
    </SkeletonContainer>
  );
}

/*
 * =========================================================
 * AWARD / PUBLIC LIST
 * =========================================================
 */

function ListingSkeleton({ maxWidth = "1100px" }) {
  return (
    <SkeletonContainer maxWidth={maxWidth}>
      <FilterSkeleton />

      <div
        className="
          mt-10

          flex
          items-end
          justify-between
          gap-6

          lg:mt-14
        "
      >
        <div>
          <Pulse className="h-6 w-36" />

          <Pulse className="mt-3 h-2.5 w-24" />
        </div>

        <Pulse className="h-8 w-8 rounded-full" />
      </div>

      <div className="mt-10">
        <CardGridSkeleton count={6} columns="lg:grid-cols-3" />
      </div>
    </SkeletonContainer>
  );
}

/*
 * =========================================================
 * PUBLIC CONTENT DETAIL
 * =========================================================
 */

function ContentDetailSkeleton() {
  return (
    <SkeletonContainer maxWidth="920px">
      <BreadcrumbSkeleton />

      <div className="mt-10">
        <Pulse className="mx-auto h-8 w-2/3" />

        <Pulse className="mx-auto mt-4 h-3 w-1/3" />

        <Pulse
          className="
            mt-10
            aspect-[16/9]
            w-full
          "
        />

        <div className="mx-auto mt-10 max-w-[680px]">
          <TextLines count={10} />
        </div>
      </div>
    </SkeletonContainer>
  );
}

/*
 * =========================================================
 * CONTACT
 * =========================================================
 */

function ContactSkeleton() {
  return (
    <SkeletonContainer maxWidth="1280px">
      <BreadcrumbSkeleton />

      <div
        className="
          mt-10

          grid
          grid-cols-1
          gap-10

          lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]
          lg:gap-16
        "
      >
        <div>
          <Pulse className="aspect-[4/3] w-full" />

          <Pulse className="mt-8 h-6 w-1/2" />

          <TextLines count={6} className="mt-7" />
        </div>

        <div
          className="
            space-y-5

            border-t
            border-[var(--public-border)]

            pt-8

            lg:border-l
            lg:border-t-0
            lg:pl-12
            lg:pt-0
          "
        >
          <Pulse className="h-6 w-1/2" />

          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div key={index}>
              <Pulse className="h-2.5 w-20" />

              <Pulse className="mt-3 h-10 w-full" />
            </div>
          ))}

          <Pulse className="h-11 w-32" />
        </div>
      </div>
    </SkeletonContainer>
  );
}

/*
 * =========================================================
 * EXPORT
 * =========================================================
 */

export default function PublicPageSkeleton({ variant = "home" }) {
  const content = {
    home: <HomeSkeleton />,

    about: <AboutSkeleton />,

    projectList: <ProjectListSkeleton />,

    projectDetail: <ProjectDetailSkeleton />,

    awardList: <ListingSkeleton />,

    publicList: <ListingSkeleton />,

    contentDetail: <ContentDetailSkeleton />,

    contact: <ContactSkeleton />,
  }[variant];

  return (
    <div role="status" aria-live="polite" aria-label="Loading page">
      {content || <HomeSkeleton />}

      <span className="sr-only">Loading…</span>
    </div>
  );
}
