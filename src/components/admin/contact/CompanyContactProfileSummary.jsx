"use client";

import Link from "next/link";

import {
  Building2,
  Clock3,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeText(value) {
  return String(value || "").trim();
}

function localized(value, locale) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return normalizeText(value);
  }

  return normalizeText(value?.[locale] || value?.en || value?.th || "");
}

function ProfileItem({
  icon: Icon,

  label,

  value,

  href = null,

  external = false,
}) {
  if (!value) {
    return null;
  }

  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--company-primary-soft)] text-[var(--company-primary)]">
        <Icon size={14} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block admin-text-9 font-semibold uppercase tracking-[0.08em] text-[var(--admin-muted)]">
          {label}
        </span>

        <span className="mt-1 block whitespace-pre-line admin-text-11 leading-[1.6] text-[var(--admin-foreground)]">
          {value}
        </span>
      </span>

      {external ? (
        <ExternalLink
          size={13}
          className="shrink-0 text-[var(--admin-muted)]"
        />
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="
          flex
          items-start
          gap-3
          rounded-xl
          border
          border-[var(--admin-border)]
          p-3
          transition

          hover:border-[var(--company-primary-border)]
          hover:bg-[var(--admin-hover)]
        "
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--admin-border)] p-3">
      {content}
    </div>
  );
}

/*
 * =========================================================
 * SUMMARY
 * =========================================================
 */

export default function CompanyContactProfileSummary({
  company,

  locale = "en",
}) {
  const { t } = useAdminTranslation();

  const profile = company?.profile || {};

  const address = localized(
    profile.address || company?.address,

    locale,
  );

  const phone = normalizeText(profile.phone || company?.phone);

  const secondaryPhone = normalizeText(profile.secondaryPhone);

  const email = normalizeText(profile.email || company?.email);

  const website = normalizeText(profile.website || company?.website);

  const businessHours = localized(
    profile.businessHours,

    locale,
  );

  const mapUrl = normalizeText(profile.mapUrl || company?.mapUrl);

  const hasProfile =
    address || phone || secondaryPhone || email || website || businessHours;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-background)]">
      <div className="flex flex-col gap-3 border-b border-[var(--admin-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--company-primary-soft)] text-[var(--company-primary)]">
            <Building2 size={16} />
          </span>

          <div>
            <div className="admin-text-12 font-semibold text-[var(--admin-foreground)]">
              {t("contact.companyProfile.title")}
            </div>

            <p className="mt-1 admin-text-10 leading-[1.55] text-[var(--admin-muted)]">
              {t("contact.companyProfile.description")}
            </p>
          </div>
        </div>

        <Link
          href="/admin/company"
          className="
            inline-flex
            h-9
            w-fit
            shrink-0
            items-center
            gap-2
            rounded-xl

            border
            border-[var(--company-primary-border)]

            px-3

            admin-text-10
            font-semibold

            text-[var(--company-primary)]

            transition

            hover:bg-[var(--company-primary-soft)]
          "
        >
          {t("contact.companyProfile.edit")}

          <ExternalLink size={13} />
        </Link>
      </div>

      {hasProfile ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <ProfileItem
            icon={MapPin}
            label={t("contact.companyProfile.address")}
            value={address}
            href={mapUrl || null}
            external={Boolean(mapUrl)}
          />

          <ProfileItem
            icon={Phone}
            label={t("contact.companyProfile.phone")}
            value={phone}
            href={
              phone
                ? `tel:${phone.replace(
                    /[^+\d]/g,

                    "",
                  )}`
                : null
            }
          />

          <ProfileItem
            icon={Phone}
            label={t("contact.companyProfile.secondaryPhone")}
            value={secondaryPhone}
            href={
              secondaryPhone
                ? `tel:${secondaryPhone.replace(
                    /[^+\d]/g,

                    "",
                  )}`
                : null
            }
          />

          <ProfileItem
            icon={Mail}
            label={t("contact.companyProfile.email")}
            value={email}
            href={email ? `mailto:${email}` : null}
          />

          <ProfileItem
            icon={Globe2}
            label={t("contact.companyProfile.website")}
            value={website}
            href={website || null}
            external={Boolean(website)}
          />

          <ProfileItem
            icon={Clock3}
            label={t("contact.companyProfile.businessHours")}
            value={businessHours}
          />
        </div>
      ) : (
        <div className="p-5 text-center">
          <MapPin
            size={21}
            className="mx-auto text-[var(--admin-muted-light)]"
          />

          <div className="mt-3 admin-text-11 font-semibold">
            {t("contact.companyProfile.emptyTitle")}
          </div>

          <p className="mt-1 admin-text-10 text-[var(--admin-muted)]">
            {t("contact.companyProfile.emptyDescription")}
          </p>
        </div>
      )}
    </div>
  );
}
