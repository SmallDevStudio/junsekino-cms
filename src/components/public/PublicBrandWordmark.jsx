import Link from "next/link";

import CompanyLogo from "@/components/company/CompanyLogo";

export default function PublicBrandWordmark({
  company,

  primaryColor = "#000000",

  href = "/",

  themeVariant = "light",
}) {
  const companySlug = company?.slug || "";

  const resolvedVariant = themeVariant === "dark" ? "dark" : "light";

  return (
    <Link
      href={href}
      aria-label={`${company?.name || "Junsekino"} home`}
      className="
        inline-flex
        h-9
        max-w-[280px]
        items-end
        pb-px
        transition-opacity
        duration-200
        hover:opacity-65
      "
      style={{
        "--public-primary": primaryColor,
      }}
    >
      <CompanyLogo
        company={company}
        companySlug={companySlug}
        variant={resolvedVariant}
        imageVariant="large"
        priority
        className="
          h-8
          max-w-[260px]
          sm:h-9
          sm:max-w-[280px]
        "
        textClassName="
          text-[22px]
          sm:text-[24px]
          xl:text-[27px]
        "
      />
    </Link>
  );
}
