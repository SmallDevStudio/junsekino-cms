"use client";

import CoverImageField from "@/components/admin/media/CoverImageField";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

export default function MemberAvatarField({
  companyId,

  value,

  onChange,

  disabled = false,
}) {
  const { t } = useAdminTranslation();

  return (
    <CoverImageField
      companyId={companyId}
      value={value}
      onChange={onChange}
      cropPreset="avatar"
      previewClassName="aspect-square max-w-[180px] rounded-full"
      title={t("members.avatar.title")}
      description={t("members.avatar.description")}
      emptyTitle={t("members.avatar.emptyTitle")}
      emptyDescription={t("members.avatar.emptyDescription")}
      selectLabel={t("members.avatar.select")}
      pickerTitle={t("members.avatar.pickerTitle")}
      removable
      disabled={disabled}
    />
  );
}
