import Image from "next/image";

import ContactForm from "./ContactForm";

function localized(
  value,

  locale,
) {
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

function resolveCompanyProfile(company = {}) {
  const profile = company.profile || {};

  return {
    address: profile.address || company.address || null,

    telephone: profile.phone || company.phone || "",

    secondaryTelephone: profile.secondaryPhone || "",

    email: profile.email || company.email || "",

    website: profile.website || company.website || "",

    mapUrl: profile.mapUrl || company.mapUrl || "",

    businessHours: profile.businessHours || null,
  };
}

function getContactLabels(locale) {
  if (locale === "th") {
    return {
      address: "ที่อยู่",

      telephone: "โทรศัพท์",

      secondaryTelephone: "โทรศัพท์สำรอง",

      email: "อีเมล",

      website: "เว็บไซต์",

      businessHours: "เวลาทำการ",

      established: "ก่อตั้ง",
    };
  }

  return {
    address: "Address",

    telephone: "Tel",

    secondaryTelephone: "Secondary tel",

    email: "Email",

    website: "Website",

    businessHours: "Business hours",

    established: "Established",
  };
}

export default function ContactPageContent({
  company,

  companySlug,

  page,

  locale = "en",

  coverUrl = null,

  preview = false,
}) {
  const contact = page?.contact || {};

  const profile = resolveCompanyProfile(company);

  const labels = getContactLabels(locale);

  const displayNameEn =
    normalizeDisplayName(contact.companyDisplayName?.en) ||
    normalizeDisplayName(company?.legalName) ||
    normalizeDisplayName(company?.name);

  const displayNameTh = normalizeDisplayName(contact.companyDisplayName?.th);

  const fallbackDisplayName = localized(
    contact.companyDisplayName,

    locale,
  );

  const displayNames = uniqueNames(
    displayNameEn,

    displayNameTh,

    fallbackDisplayName,
  );

  const primaryDisplayName = displayNames[0] || "";

  const contactHeading = displayNameTh || displayNameEn || fallbackDisplayName;

  const companyLabel = resolveCompanyLabel(company);

  const caption = localized(
    contact.coverCaption,

    locale,
  );

  const address =
    localized(
      contact.address,

      locale,
    ) ||
    localized(
      profile.address,

      locale,
    );

  const year = String(contact.establishedYear || "").trim();

  const telephone = String(contact.telephone || profile.telephone || "").trim();

  const secondaryTelephone = String(
    contact.secondaryTelephone || profile.secondaryTelephone || "",
  ).trim();

  const email = String(contact.email || profile.email || "").trim();

  const website = String(contact.website || profile.website || "").trim();

  const businessHours =
    localized(
      contact.businessHours,

      locale,
    ) ||
    localized(
      profile.businessHours,

      locale,
    );

  const form = page?.form || null;

  const resolvedCoverUrl = coverUrl || page?.featuredImage?.largeUrl || null;

  const coverAlt =
    localized(
      page?.featuredImage?.alt,

      locale,
    ) ||
    primaryDisplayName ||
    "Contact";

  const hasCompanyIntroduction =
    displayNames.length > 0 || hasText(companyLabel) || hasText(year);

  const hasContactDetails =
    hasText(address) ||
    hasText(telephone) ||
    hasText(secondaryTelephone) ||
    hasText(email) ||
    hasText(website) ||
    hasText(businessHours);

  const showForm = contact.form?.enabled !== false && Boolean(form);

  return (
    <div
      className="
        w-full
        flex-1
        bg-[var(--public-background)]
        text-[var(--public-foreground)]
      "
    >
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
        <div
          className="
            mx-auto
            w-full
            max-w-[920px]
          "
        >
          {resolvedCoverUrl && (
            <section>
              <div
                className="
                  relative
                  aspect-[17/10]
                  w-full
                  overflow-hidden
                  bg-[var(--public-surface)]
                "
              >
                <Image
                  src={resolvedCoverUrl}
                  alt={coverAlt}
                  fill
                  sizes="
                    (max-width: 968px)
                    100vw,
                    920px
                  "
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
                    text-[var(--public-muted-foreground)]
                  "
                >
                  {caption}
                </p>
              )}
            </section>
          )}

          {hasCompanyIntroduction && (
            <section className={resolvedCoverUrl ? "mt-5" : "mt-8"}>
              <div className="space-y-0.5">
                <p className="font-bold text-lg">
                  JUNSEKINO ARCHITECT AND DESIGN CO.,LTD
                </p>
                {displayNames.map((name, index) => (
                  <p
                    key={`${name}-${index}`}
                    className={
                      index === 0
                        ? "text-[16px] font-semibold leading-[1.35] tracking-[-0.025em] text-[var(--public-primary)] sm:text-[17px]"
                        : "text-[13px] font-medium leading-[1.5] text-[var(--public-primary)] sm:text-[14px]"
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
                  <p
                    className="
                      pt-1
                      text-[11px]
                      leading-[1.6]
                      text-[var(--public-muted-foreground)]
                    "
                  >
                    ({labels.established} {year})
                  </p>
                )}
              </div>
            </section>
          )}

          {hasContactDetails && (
            <>
              <div
                className="
                  my-6
                  border-t
                  border-[var(--public-border)]
                  sm:my-7
                "
              />

              <section>
                <dl
                  className="
                    grid
                    gap-x-8
                    gap-y-3.5
                    text-[13px]
                    leading-[1.65]
                    text-[var(--public-foreground)]
                    sm:grid-cols-[166px_minmax(0,1fr)]
                    sm:text-[14px]
                  "
                >
                  {hasText(address) && (
                    <>
                      <dt className="font-semibold">{labels.address}</dt>

                      <dd
                        className="
                          whitespace-pre-line
                          text-[var(--public-muted-foreground)]
                        "
                      >
                        {address}
                      </dd>
                    </>
                  )}

                  {hasText(telephone) && (
                    <>
                      <dt className="font-semibold">{labels.telephone}</dt>

                      <dd>
                        <a
                          href={`tel:${telephone.replace(
                            /[^+\d]/g,

                            "",
                          )}`}
                          className="
                            text-[var(--public-muted-foreground)]
                            transition-colors
                            hover:text-[var(--public-primary)]
                          "
                        >
                          {telephone}
                        </a>
                      </dd>
                    </>
                  )}

                  {hasText(secondaryTelephone) && (
                    <>
                      <dt className="font-semibold">
                        {labels.secondaryTelephone}
                      </dt>

                      <dd>
                        <a
                          href={`tel:${secondaryTelephone.replace(
                            /[^+\d]/g,

                            "",
                          )}`}
                          className="
                            text-[var(--public-muted-foreground)]
                            transition-colors
                            hover:text-[var(--public-primary)]
                          "
                        >
                          {secondaryTelephone}
                        </a>
                      </dd>
                    </>
                  )}

                  {hasText(email) && (
                    <>
                      <dt className="font-semibold">{labels.email}</dt>

                      <dd>
                        <a
                          href={`mailto:${email}`}
                          className="
                            break-all
                            text-[var(--public-muted-foreground)]
                            transition-colors
                            hover:text-[var(--public-primary)]
                          "
                        >
                          {email}
                        </a>
                      </dd>
                    </>
                  )}

                  {hasText(website) && (
                    <>
                      <dt className="font-semibold">{labels.website}</dt>

                      <dd>
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            break-all
                            text-[var(--public-muted-foreground)]
                            transition-colors
                            hover:text-[var(--public-primary)]
                          "
                        >
                          {website}
                        </a>
                      </dd>
                    </>
                  )}

                  {hasText(businessHours) && (
                    <>
                      <dt className="font-semibold">{labels.businessHours}</dt>

                      <dd
                        className="
                          whitespace-pre-line
                          text-[var(--public-muted-foreground)]
                        "
                      >
                        {businessHours}
                      </dd>
                    </>
                  )}
                </dl>
              </section>
            </>
          )}

          {showForm && (
            <>
              <div
                className="
                  my-6
                  border-t
                  border-[var(--public-border)]
                  sm:my-7
                "
              />

              <section aria-labelledby="contact-form-title">
                <div
                  className="
                    rounded-xl
                    border
                    border-[var(--public-border)]
                    bg-[var(--public-surface)]
                    px-3.5
                    py-4
                    shadow-sm
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
