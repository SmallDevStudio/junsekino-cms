import Link from "next/link";

function normalizeText(value) {
  return String(value || "").trim();
}

function resolveSuffix(company) {
  const shortName = normalizeText(company?.shortName);

  if (shortName) {
    return shortName.replace(/^junsekino\s*/i, "").trim();
  }

  return normalizeText(company?.name)
    .replace(/^junsekino\s*/i, "")
    .trim();
}

export default function PublicBrandWordmark({
  company,
  primaryColor = "#000000",
  href = "/",
}) {
  const suffix = resolveSuffix(company);

  return (
    <Link
      href={href}
      aria-label={`${company?.name || "Junsekino"} home`}
      className="
        inline-flex
        items-baseline
        whitespace-nowrap
        text-black
        transition-opacity
        duration-200
        hover:opacity-65
      "
    >
      <span
        className="
          text-[22px]
          font-normal
          leading-none
          tracking-[0.085em]
          sm:text-[24px]
          xl:text-[27px]
        "
      >
        JUNSEKINO
      </span>

      {suffix && (
        <span
          className="
            ml-[0.28em]
            text-[22px]
            font-semibold
            leading-none
            tracking-[-0.035em]
            sm:text-[24px]
            xl:text-[27px]
          "
          style={{
            color: primaryColor,
          }}
        >
          {suffix}
        </span>
      )}
    </Link>
  );
}
