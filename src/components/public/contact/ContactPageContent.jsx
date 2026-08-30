import ContactForm from "./ContactForm";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function localized(value, locale) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value?.[locale] || value?.en || value?.th || "";
}

function hasText(value) {
  return Boolean(String(value || "").trim());
}

/*
 * =========================================================
 * CONTENT
 * =========================================================
 */

export default function ContactPageContent({
  companySlug,

  page,

  locale = "en",

  coverUrl = null,

  preview = false,
}) {
  const contact = page?.contact || {};

  const displayName = localized(contact.companyDisplayName, locale);

  const caption = localized(contact.coverCaption, locale);

  const address = localized(contact.address, locale);

  const year = String(contact.establishedYear || "").trim();

  const telephone = String(contact.telephone || "").trim();

  const email = String(contact.email || "").trim();

  const form = page?.form || null;

  const resolvedCoverUrl = coverUrl || page?.featuredImage?.largeUrl || null;

  const coverAlt =
    localized(page?.featuredImage?.alt, locale) || displayName || "Contact";

  const hasContactDetails =
    hasText(address) || hasText(telephone) || hasText(email);

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1320px]

        px-5
        pb-20
        pt-4

        sm:px-8

        lg:px-12
        lg:pb-28
      "
    >
      {/* =================================
          COVER
      ================================= */}

      {resolvedCoverUrl && (
        <section>
          <div
            className="
              mx-auto
              w-full
              max-w-[1040px]

              overflow-hidden
            "
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedCoverUrl}
              alt={coverAlt}
              className="
                aspect-[17/10]
                w-full

                object-cover
              "
            />
          </div>

          {hasText(caption) && (
            <div
              className="
                mx-auto
                mt-2
                w-full
                max-w-[1040px]

                text-right

                text-[9px]
                leading-[1.5]

                text-black/35
              "
            >
              {caption}
            </div>
          )}
        </section>
      )}

      {/* =================================
          INTRO
      ================================= */}

      <section
        className="
          mx-auto
          mt-14
          w-full
          max-w-[1040px]

          sm:mt-16
        "
      >
        {hasText(displayName) && (
          <div>
            <h1
              className="
                text-[13px]
                font-normal
                uppercase
                leading-[1.6]
                tracking-[0.015em]

                text-black
              "
            >
              {displayName}
            </h1>

            {year && (
              <div
                className="
                  mt-4

                  text-[10px]
                  leading-[1.6]

                  text-black/55
                "
              >
                (Established {year})
              </div>
            )}
          </div>
        )}
      </section>

      {/* =================================
          DIVIDER
      ================================= */}

      {hasContactDetails && (
        <div
          className="
            mx-auto
            my-12
            w-full
            max-w-[1040px]

            border-t
            border-black/15
          "
        />
      )}

      {/* =================================
          CONTACT INFORMATION
      ================================= */}

      {hasContactDetails && (
        <section
          className="
            mx-auto
            w-full
            max-w-[1040px]
          "
        >
          {hasText(displayName) && (
            <h2
              className="
                mb-8

                text-[11px]
                font-normal
                uppercase
                leading-[1.6]

                text-black
              "
            >
              {displayName}
            </h2>
          )}

          <div
            className="
              grid
              gap-y-4

              text-[10px]
              leading-[1.8]

              text-black/75

              sm:grid-cols-[90px_1fr]
            "
          >
            {hasText(address) && (
              <>
                <div className="text-black/45">Address</div>

                <div
                  className="
                    whitespace-pre-line
                  "
                >
                  {address}
                </div>
              </>
            )}

            {hasText(telephone) && (
              <>
                <div className="text-black/45">Tel</div>

                <div>
                  <a
                    href={`tel:${telephone.replace(/\s+/g, "")}`}
                    className="
                      transition

                      hover:text-[var(--public-primary)]
                    "
                  >
                    {telephone}
                  </a>
                </div>
              </>
            )}

            {hasText(email) && (
              <>
                <div className="text-black/45">Email</div>

                <div>
                  <a
                    href={`mailto:${email}`}
                    className="
                      transition

                      hover:text-[var(--public-primary)]
                    "
                  >
                    {email}
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* =================================
          FORM
      ================================= */}

      {contact.form?.enabled !== false && form && (
        <>
          <div
            className="
                mx-auto
                my-12
                w-full
                max-w-[1040px]

                border-t
                border-black/15
              "
          />

          <section
            className="
                mx-auto
                w-full
                max-w-[1040px]
              "
          >
            <div
              className="
                  grid
                  gap-10

                  lg:grid-cols-[1fr_1.15fr]
                "
            >
              <div />

              <div>
                <h2
                  className="
                      mb-7

                      text-[13px]
                      font-normal

                      text-black
                    "
                >
                  {localized(form.name, locale) || "Contact Us"}
                </h2>

                <ContactForm
                  companySlug={companySlug}
                  form={form}
                  locale={locale}
                  preview={preview}
                />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
