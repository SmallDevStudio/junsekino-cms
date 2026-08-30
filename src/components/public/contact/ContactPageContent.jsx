import Image from "next/image";

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

function normalizeDisplayName(value) {
  return String(value || "").trim();
}

function resolveCompanyLabel(company) {
  const shortName = normalizeDisplayName(company?.shortName);

  if (shortName) {
    if (/^junsekino\b/i.test(shortName)) {
      return shortName.toUpperCase();
    }

    return `JUNSEKINO ${shortName}`.toUpperCase();
  }

  return normalizeDisplayName(company?.name).toUpperCase();
}

function uniqueNames(...values) {
  const names = [];

  for (const value of values) {
    const name = normalizeDisplayName(value);

    if (!name) {
      continue;
    }

    const duplicate = names.some(
      (current) => current.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );

    if (!duplicate) {
      names.push(name);
    }
  }

  return names;
}

/*
 * =========================================================
 * CONTENT
 * =========================================================
 */

export default function ContactPageContent({
  company,

  companySlug,

  page,

  locale = "en",

  coverUrl = null,

  preview = false,
}) {
  const contact = page?.contact || {};

  const displayNameEn = normalizeDisplayName(contact.companyDisplayName?.en);

  const displayNameTh = normalizeDisplayName(contact.companyDisplayName?.th);

  const fallbackDisplayName = localized(contact.companyDisplayName, locale);

  const displayNames = uniqueNames(
    displayNameEn,
    displayNameTh,
    fallbackDisplayName,
  );

  const primaryDisplayName = displayNames[0] || "";

  const contactHeading = displayNameTh || displayNameEn || fallbackDisplayName;

  const companyLabel = resolveCompanyLabel(company);

  const caption = localized(contact.coverCaption, locale);

  const address = localized(contact.address, locale);

  const year = String(contact.establishedYear || "").trim();

  const telephone = String(contact.telephone || "").trim();

  const email = String(contact.email || "").trim();

  const form = page?.form || null;

  const resolvedCoverUrl = coverUrl || page?.featuredImage?.largeUrl || null;

  const coverAlt =
    localized(page?.featuredImage?.alt, locale) ||
    primaryDisplayName ||
    "Contact";

  const hasCompanyIntroduction =
    displayNames.length > 0 || hasText(companyLabel) || hasText(year);

  const hasContactDetails =
    hasText(address) || hasText(telephone) || hasText(email);

  const showForm = contact.form?.enabled !== false && Boolean(form);

  return (
    <div className="w-full flex-1">
      <div
        className="
          mx-auto
          w-full
          max-w-[968px]

          px-5
          pb-16
          pt-2

          sm:px-6
          sm:pb-20
        "
      >
        <div className="mx-auto w-full max-w-[920px]">
          {/* =================================
              COVER
          ================================= */}

          {resolvedCoverUrl && (
            <section>
              <div className="relative aspect-[17/10] w-full overflow-hidden bg-black/[0.04]">
                <Image
                  src={resolvedCoverUrl}
                  alt={coverAlt}
                  fill
                  sizes="(max-width: 968px) 100vw, 920px"
                  className="object-cover"
                  unoptimized
                  priority={!preview}
                />
              </div>

              {hasText(caption) && (
                <p
                  className="
                    mt-2
                    text-right
                    text-[10px]
                    leading-[1.5]
                    text-black/45
                  "
                >
                  {caption}
                </p>
              )}
            </section>
          )}

          {/* =================================
              COMPANY INTRODUCTION
          ================================= */}

          {hasCompanyIntroduction && (
            <section className={resolvedCoverUrl ? "mt-5" : "mt-8"}>
              <div className="space-y-0.5">
                <p
                  className="
                    text-[16px]
                    font-semibold
                    leading-[1.35]
                    tracking-[-0.025em]
                    sm:text-[17px]
                  "
                >
                  JUNSEKINO ARCHITECT AND DESIGN CO.,LTD
                </p>
                {displayNames.map((name, index) => (
                  <p
                    key={`${name}-${index}`}
                    className={
                      index === 0
                        ? "text-[16px] font-semibold leading-[1.35] tracking-[-0.025em] sm:text-[17px]"
                        : "text-[13px] font-medium leading-[1.5] sm:text-[14px]"
                    }
                  >
                    {index === 0 ? name.toUpperCase() : name}
                  </p>
                ))}

                {hasText(companyLabel) && (
                  <p
                    className="
                      pt-0.5
                      text-[13px]
                      font-medium
                      leading-[1.5]
                      text-[var(--public-primary)]

                      sm:text-[14px]
                    "
                  >
                    ({companyLabel})
                  </p>
                )}

                {hasText(year) && (
                  <p className="pt-1 text-[11px] leading-[1.6] text-black/55">
                    (Established {year})
                  </p>
                )}
              </div>
            </section>
          )}

          {/* =================================
              CONTACT INFORMATION
          ================================= */}

          {hasContactDetails && (
            <>
              <div className="my-6 border-t border-black/15 sm:my-7" />

              <section>
                {hasText(contactHeading) && (
                  <h1
                    className="
                      mb-5
                      text-[14px]
                      font-semibold
                      leading-[1.55]

                      sm:text-[15px]
                    "
                  >
                    {contactHeading}
                  </h1>
                )}

                <dl
                  className="
                    grid
                    gap-x-8
                    gap-y-3.5
                    text-[13px]
                    leading-[1.65]

                    sm:grid-cols-[166px_minmax(0,1fr)]
                    sm:text-[14px]
                  "
                >
                  {hasText(address) && (
                    <>
                      <dt className="font-semibold">Address</dt>

                      <dd className="whitespace-pre-line">{address}</dd>
                    </>
                  )}

                  {hasText(telephone) && (
                    <>
                      <dt className="font-semibold">Tel</dt>

                      <dd>
                        <a
                          href={`tel:${telephone.replace(/[^+\d]/g, "")}`}
                          className="transition-colors hover:text-[var(--public-primary)]"
                        >
                          {telephone}
                        </a>
                      </dd>
                    </>
                  )}

                  {hasText(email) && (
                    <>
                      <dt className="font-semibold">Email</dt>

                      <dd>
                        <a
                          href={`mailto:${email}`}
                          className="break-all transition-colors hover:text-[var(--public-primary)]"
                        >
                          {email}
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
              </section>
            </>
          )}

          {/* =================================
              FORM
          ================================= */}

          {showForm && (
            <>
              <div className="my-6 border-t border-black/15 sm:my-7" />

              <section aria-labelledby="contact-form-title">
                <h2
                  id="contact-form-title"
                  className="
                    mb-2.5
                    text-center
                    text-[15px]
                    font-semibold
                    leading-[1.5]

                    sm:text-[16px]
                  "
                >
                  {localized(form.name, locale) || "Contact Us"}
                </h2>

                <div
                  className="
                    rounded-xl
                    border
                    border-black/[0.08]
                    bg-white

                    px-3.5
                    py-4

                    shadow-[0_1px_3px_rgba(0,0,0,0.08)]

                    sm:px-4
                    sm:py-4
                  "
                >
                  <ContactForm
                    companySlug={companySlug}
                    form={form}
                    locale={locale}
                    preview={preview}
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
