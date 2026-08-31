"use client";

import Image from "next/image";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Eye,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldX,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import MemberPasswordResetDialog from "@/components/admin/member/MemberPasswordResetDialog";

const EMPTY_FORM = {
  email: "",

  displayName: "",

  password: "",

  globalRole: "USER",

  accountStatus: "active",

  companyAccess: "EDITOR",

  membershipStatus: "active",
};

function getInitials(name, email) {
  const source = String(name || email || "U").trim();

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getMemberId(member) {
  return member?.userId || member?.uid || member?.id || null;
}

function getUser(member) {
  return member?.user || member || {};
}

function getAvatarUrl(user) {
  return user?.avatar?.url || user?.avatarUrl || user?.image || null;
}

function getGlobalRole(member) {
  const user = getUser(member);

  return user?.isSuperAdmin || user?.globalRole === "SUPERADMIN"
    ? "SUPERADMIN"
    : "USER";
}

function getCompanyAccess(member) {
  if (
    member?.unassigned ||
    member?.assigned === false ||
    member?.access === "NO_ACCESS" ||
    !member?.role
  ) {
    return "NO_ACCESS";
  }

  return member.access || member.role;
}

function getAccountStatus(member) {
  const user = getUser(member);

  return user?.status || "active";
}

function getMembershipStatus(member) {
  if (getCompanyAccess(member) === "NO_ACCESS") {
    return "unassigned";
  }

  return member?.status || "active";
}

function getStatusClass(status) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "suspended") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "deleted") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function Avatar({ user, size = 44 }) {
  const avatarUrl = getAvatarUrl(user);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] font-bold text-[var(--company-primary)]"
      style={{
        width: size,

        height: size,

        fontSize: Math.max(12, Math.round(size * 0.3)),
      }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={user?.displayName || ""}
          fill
          unoptimized
          sizes={`${size}px`}
          className="object-cover"
          style={
            user?.avatar?.crop?.objectPosition
              ? {
                  objectPosition: user.avatar.crop.objectPosition,
                }
              : undefined
          }
        />
      ) : (
        getInitials(user?.displayName, user?.email)
      )}
    </div>
  );
}

export default function MemberManager() {
  const {
    activeCompanyId,

    activeCompany,

    loading: companyLoading,

    isSuperAdmin,

    currentUserId,
  } = useCompanyWorkspace();

  const { t } = useAdminTranslation();

  const activeRole = activeCompany?.membership?.role || null;

  const canManageMembers = isSuperAdmin || activeRole === "ADMIN";

  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  const [query, setQuery] = useState("");

  const [globalRoleFilter, setGlobalRoleFilter] = useState("");

  const [accessFilter, setAccessFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [selectedMember, setSelectedMember] = useState(null);

  const [passwordMember, setPasswordMember] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const editingOwnAccount = Boolean(editingId) && editingId === currentUserId;

  const loadMembers = useCallback(async () => {
    if (!activeCompanyId || !canManageMembers) {
      setMembers([]);

      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/v1/companies/${encodeURIComponent(activeCompanyId)}/members`,
        {
          method: "GET",

          cache: "no-store",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("members.errors.load"));
      }

      setMembers(Array.isArray(payload?.data) ? payload.data : []);
    } catch (loadError) {
      console.error("Load members error:", loadError);

      setMembers([]);

      setError(loadError?.message || t("members.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, canManageMembers, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadMembers();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return members.filter((member) => {
      const user = getUser(member);

      const globalRole = getGlobalRole(member);

      const companyAccess = getCompanyAccess(member);

      const accountStatus = getAccountStatus(member);

      const searchable = [
        user.displayName,

        user.email,

        user.phone,

        globalRole,

        companyAccess,

        accountStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (keyword && !searchable.includes(keyword)) {
        return false;
      }

      if (globalRoleFilter && globalRole !== globalRoleFilter) {
        return false;
      }

      if (accessFilter && companyAccess !== accessFilter) {
        return false;
      }

      if (statusFilter && accountStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [accessFilter, globalRoleFilter, members, query, statusFilter]);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,

      [field]: value,
    }));
  }

  function openCreate() {
    setEditingId(null);

    setForm(EMPTY_FORM);

    setError("");

    setEditorOpen(true);
  }

  function openDetail(member) {
    setSelectedMember(member);

    setDetailOpen(true);
  }

  function closeDetail() {
    setDetailOpen(false);

    setSelectedMember(null);
  }

  function openResetPassword(member) {
    setPasswordMember(member);
  }

  function closeResetPassword() {
    setPasswordMember(null);
  }

  function openEdit(member) {
    const uid = getMemberId(member);

    if (!uid) {
      return;
    }

    const user = getUser(member);

    setEditingId(uid);

    setForm({
      email: user.email || "",

      displayName: user.displayName || "",

      password: "",

      globalRole: getGlobalRole(member),

      accountStatus: getAccountStatus(member),

      companyAccess: getCompanyAccess(member),

      membershipStatus:
        getMembershipStatus(member) === "unassigned"
          ? "active"
          : getMembershipStatus(member),
    });

    setDetailOpen(false);

    setSelectedMember(null);

    setError("");

    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) {
      return;
    }

    setEditorOpen(false);

    setEditingId(null);

    setForm(EMPTY_FORM);
  }

  async function requestJson(url, options) {
    const response = await fetch(url, {
      credentials: "include",

      ...options,
    });

    const payload = await response.json();

    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || t("members.errors.save"));
    }

    return payload;
  }

  async function saveExistingSuperadminUser() {
    const encodedUid = encodeURIComponent(editingId);

    await requestJson(`/api/v1/users/${encodedUid}`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(
        editingOwnAccount
          ? {
              displayName: form.displayName.trim(),
            }
          : {
              displayName: form.displayName.trim(),

              status: form.accountStatus,

              isSuperAdmin: form.globalRole === "SUPERADMIN",
            },
      ),
    });

    await requestJson(
      `/api/v1/companies/${encodeURIComponent(
        activeCompanyId,
      )}/members/${encodedUid}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(
          form.companyAccess === "NO_ACCESS"
            ? {
                access: "NO_ACCESS",
              }
            : {
                access: form.companyAccess,

                permissions: [],

                groupIds: [],
              },
        ),
      },
    );
  }

  async function saveExistingCompanyMember() {
    await requestJson(
      `/api/v1/companies/${encodeURIComponent(
        activeCompanyId,
      )}/members/${encodeURIComponent(editingId)}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          displayName: form.displayName.trim(),

          role: form.companyAccess,

          status: form.membershipStatus,
        }),
      },
    );
  }

  async function createCompanyMember() {
    await requestJson(
      `/api/v1/companies/${encodeURIComponent(activeCompanyId)}/members`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),

          displayName: form.displayName.trim(),

          password: form.password,

          role: form.companyAccess,

          permissions: [],

          groupIds: [],
        }),
      },
    );
  }

  async function saveMember(event) {
    event.preventDefault();

    if (!activeCompanyId || !canManageMembers) {
      return;
    }

    if (!editingId && form.companyAccess === "NO_ACCESS") {
      setError(t("members.errors.createAccessRequired"));

      return;
    }

    setSaving(true);
    setError("");

    try {
      if (!editingId) {
        await createCompanyMember();
      } else if (isSuperAdmin) {
        await saveExistingSuperadminUser();
      } else {
        await saveExistingCompanyMember();
      }

      setEditorOpen(false);

      setEditingId(null);

      setForm(EMPTY_FORM);

      await loadMembers();
    } catch (saveError) {
      console.error("Save member error:", saveError);

      setError(saveError?.message || t("members.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(member) {
    if (!activeCompanyId || !canManageMembers) {
      return;
    }

    const uid = getMemberId(member);

    if (!uid) {
      setError(t("members.errors.delete"));

      return;
    }

    if (uid === currentUserId) {
      setError(t("members.errors.cannotDeleteSelf"));

      return;
    }

    const user = getUser(member);

    const message = isSuperAdmin
      ? t("members.confirmDeleteGlobal", {
          name: user.displayName || user.email || "",
        })
      : t("members.confirmRevoke", {
          name: user.displayName || user.email || "",
        });

    if (!window.confirm(message)) {
      return;
    }

    setDeletingId(uid);
    setError("");

    try {
      const url = isSuperAdmin
        ? `/api/v1/users/${encodeURIComponent(uid)}`
        : `/api/v1/companies/${encodeURIComponent(
            activeCompanyId,
          )}/members/${encodeURIComponent(uid)}`;

      await requestJson(url, {
        method: "DELETE",
      });

      if (selectedMember && getMemberId(selectedMember) === uid) {
        closeDetail();
      }

      await loadMembers();
    } catch (deleteError) {
      console.error("Delete member error:", deleteError);

      setError(deleteError?.message || t("members.errors.delete"));
    } finally {
      setDeletingId(null);
    }
  }

  if (companyLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle
          size={24}
          className="animate-spin text-[var(--company-primary)]"
        />
      </div>
    );
  }

  if (activeCompany && !canManageMembers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldX size={26} strokeWidth={1.5} />
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            {t("members.permission.title")}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--admin-muted-foreground)]">
            {t("members.permission.description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--company-primary)]">
            {activeCompany?.name || t("members.company")}
          </p>

          <h1 className="text-2xl font-semibold">{t("members.title")}</h1>

          <p className="mt-1 text-sm text-[var(--admin-muted-foreground)]">
            {t("members.description")}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={!activeCompanyId}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--company-primary)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />

          {t("members.actions.add")}
        </button>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm">
        <div className="grid gap-3 border-b border-[var(--admin-border)] p-4 lg:grid-cols-[minmax(260px,1fr)_160px_160px_160px_40px]">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 focus-within:border-[var(--company-primary)]">
            <Search size={16} className="text-[var(--admin-icon)]" />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("members.filters.search")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>

          {isSuperAdmin ? (
            <select
              value={globalRoleFilter}
              onChange={(event) => setGlobalRoleFilter(event.target.value)}
              className="h-10 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm outline-none"
            >
              <option value="">{t("members.filters.allGlobalRoles")}</option>

              <option value="SUPERADMIN">
                {t("members.globalRoles.superadmin")}
              </option>

              <option value="USER">{t("members.globalRoles.user")}</option>
            </select>
          ) : (
            <div />
          )}

          <select
            value={accessFilter}
            onChange={(event) => setAccessFilter(event.target.value)}
            className="h-10 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm outline-none"
          >
            <option value="">{t("members.filters.allAccess")}</option>

            <option value="ADMIN">{t("members.access.admin")}</option>

            <option value="EDITOR">{t("members.access.editor")}</option>

            {isSuperAdmin ? (
              <option value="NO_ACCESS">{t("members.access.noAccess")}</option>
            ) : null}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm outline-none"
          >
            <option value="">{t("members.filters.allStatuses")}</option>

            <option value="active">{t("members.status.active")}</option>

            <option value="inactive">{t("members.status.inactive")}</option>

            {isSuperAdmin ? (
              <option value="suspended">{t("members.status.suspended")}</option>
            ) : null}
          </select>

          <button
            type="button"
            onClick={loadMembers}
            aria-label={t("members.actions.refresh")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--admin-border)] hover:text-[var(--company-primary)]"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-4 py-3 text-xs text-[var(--admin-muted-foreground)]">
          <Users size={14} />

          {t("members.total", {
            count: filteredMembers.length,
          })}
        </div>

        {error ? (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-[var(--admin-muted-foreground)]">
            <LoaderCircle size={18} className="animate-spin" />

            {t("members.loading")}
          </div>
        ) : filteredMembers.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[minmax(260px,1fr)_150px_160px_140px_200px] gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-background)] px-4 py-3 text-xs font-medium text-[var(--admin-muted-foreground)]">
                <span>{t("members.columns.user")}</span>

                <span>{t("members.columns.globalRole")}</span>

                <span>{t("members.columns.companyAccess")}</span>

                <span>{t("members.columns.status")}</span>

                <span className="text-right">
                  {t("members.columns.actions")}
                </span>
              </div>

              <div className="divide-y divide-[var(--admin-border)]">
                {filteredMembers.map((member) => {
                  const user = getUser(member);

                  const uid = getMemberId(member);

                  const globalRole = getGlobalRole(member);

                  const companyAccess = getCompanyAccess(member);

                  const accountStatus = getAccountStatus(member);

                  const isCurrentUser = uid === currentUserId;

                  const canReset =
                    !isCurrentUser &&
                    (isSuperAdmin || globalRole !== "SUPERADMIN");

                  return (
                    <article
                      key={uid}
                      className="grid grid-cols-[minmax(260px,1fr)_150px_160px_140px_200px] items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--admin-background)]"
                    >
                      <button
                        type="button"
                        onClick={() => openDetail(member)}
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        <Avatar user={user} />

                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {user.displayName || "—"}
                          </span>

                          <span className="block truncate text-xs text-[var(--admin-muted-foreground)]">
                            {user.email || "—"}
                          </span>
                        </span>
                      </button>

                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          globalRole === "SUPERADMIN"
                            ? "bg-violet-50 text-violet-700"
                            : "border border-[var(--admin-border)] text-[var(--admin-muted-foreground)]"
                        }`}
                      >
                        {globalRole === "SUPERADMIN"
                          ? t("members.globalRoles.superadmin")
                          : t("members.globalRoles.user")}
                      </span>

                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          companyAccess === "NO_ACCESS"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                        }`}
                      >
                        {companyAccess === "ADMIN"
                          ? t("members.access.admin")
                          : companyAccess === "EDITOR"
                            ? t("members.access.editor")
                            : t("members.access.noAccess")}
                      </span>

                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                          accountStatus,
                        )}`}
                      >
                        {accountStatus === "active"
                          ? t("members.status.active")
                          : accountStatus === "suspended"
                            ? t("members.status.suspended")
                            : t("members.status.inactive")}
                      </span>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(member)}
                          aria-label={t("members.actions.view")}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] hover:text-[var(--company-primary)]"
                        >
                          <Eye size={15} />
                        </button>

                        {canReset ? (
                          <button
                            type="button"
                            onClick={() => openResetPassword(member)}
                            aria-label={t("members.actions.resetPassword")}
                            title={t("members.actions.resetPassword")}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] hover:text-[var(--company-primary)]"
                          >
                            <KeyRound size={15} />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => openEdit(member)}
                          aria-label={t("members.actions.edit")}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] hover:text-[var(--company-primary)]"
                        >
                          <Pencil size={15} />
                        </button>

                        {!isCurrentUser ? (
                          <button
                            type="button"
                            onClick={() => removeMember(member)}
                            disabled={deletingId === uid}
                            aria-label={
                              isSuperAdmin
                                ? t("members.actions.deleteAccount")
                                : t("members.actions.revokeAccess")
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === uid ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-[var(--admin-muted-foreground)]">
            <UserRound size={28} strokeWidth={1.2} />

            {t("members.empty")}
          </div>
        )}
      </section>

      {detailOpen && selectedMember ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetail();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] p-5">
              <h2 className="text-lg font-semibold">
                {t("members.detail.title")}
              </h2>

              <button
                type="button"
                onClick={closeDetail}
                aria-label={t("common.close")}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--admin-background)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar user={getUser(selectedMember)} size={88} />

                <h3 className="mt-4 text-xl font-semibold">
                  {getUser(selectedMember).displayName || "—"}
                </h3>

                <p className="mt-1 text-sm text-[var(--admin-muted-foreground)]">
                  {getUser(selectedMember).email || "—"}
                </p>
              </div>

              <dl className="mt-6 grid gap-3 rounded-xl border border-[var(--admin-border)] p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--admin-muted-foreground)]">
                    {t("members.columns.globalRole")}
                  </dt>

                  <dd className="font-medium">
                    {getGlobalRole(selectedMember) === "SUPERADMIN"
                      ? t("members.globalRoles.superadmin")
                      : t("members.globalRoles.user")}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--admin-muted-foreground)]">
                    {t("members.columns.companyAccess")}
                  </dt>

                  <dd className="font-medium">
                    {getCompanyAccess(selectedMember) === "ADMIN"
                      ? t("members.access.admin")
                      : getCompanyAccess(selectedMember) === "EDITOR"
                        ? t("members.access.editor")
                        : t("members.access.noAccess")}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--admin-muted-foreground)]">
                    {t("members.columns.status")}
                  </dt>

                  <dd className="font-medium">
                    {getAccountStatus(selectedMember) === "active"
                      ? t("members.status.active")
                      : getAccountStatus(selectedMember) === "suspended"
                        ? t("members.status.suspended")
                        : t("members.status.inactive")}
                  </dd>
                </div>

                {getUser(selectedMember).phone ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--admin-muted-foreground)]">
                      {t("members.fields.phone")}
                    </dt>

                    <dd className="font-medium">
                      {getUser(selectedMember).phone}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--admin-border)] p-5">
              <button
                type="button"
                onClick={closeDetail}
                className="h-10 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium"
              >
                {t("common.close")}
              </button>

              {getMemberId(selectedMember) !== currentUserId &&
              (isSuperAdmin ||
                getGlobalRole(selectedMember) !== "SUPERADMIN") ? (
                <button
                  type="button"
                  onClick={() => openResetPassword(selectedMember)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium hover:text-[var(--company-primary)]"
                >
                  <KeyRound size={15} />

                  {t("members.actions.resetPassword")}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => openEdit(selectedMember)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--company-primary)] px-4 text-sm font-semibold text-white"
              >
                <Pencil size={15} />

                {t("members.actions.edit")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editorOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditor();
            }
          }}
        >
          <form
            onSubmit={saveMember}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId
                    ? t("members.editor.editTitle")
                    : t("members.editor.createTitle")}
                </h2>

                {editingId ? (
                  <p className="mt-1 text-xs text-[var(--admin-muted-foreground)]">
                    {form.email}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                aria-label={t("common.close")}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--admin-background)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5 p-5">
              <section className="grid gap-4">
                <div className="flex items-center gap-2">
                  <UserRound
                    size={16}
                    className="text-[var(--company-primary)]"
                  />

                  <h3 className="text-sm font-semibold">
                    {t("members.sections.account")}
                  </h3>
                </div>

                <label className="grid gap-1.5 text-sm">
                  <span>{t("members.fields.name")}</span>

                  <input
                    required
                    minLength={2}
                    maxLength={150}
                    value={form.displayName}
                    onChange={(event) =>
                      updateForm("displayName", event.target.value)
                    }
                    className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none focus:border-[var(--company-primary)]"
                  />
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span>{t("members.fields.email")}</span>

                  <input
                    required
                    type="email"
                    disabled={Boolean(editingId)}
                    value={form.email}
                    onChange={(event) =>
                      updateForm("email", event.target.value)
                    }
                    className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none focus:border-[var(--company-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                {!editingId ? (
                  <label className="grid gap-1.5 text-sm">
                    <span>{t("members.fields.password")}</span>

                    <input
                      required
                      type="password"
                      minLength={8}
                      maxLength={128}
                      value={form.password}
                      onChange={(event) =>
                        updateForm("password", event.target.value)
                      }
                      className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none focus:border-[var(--company-primary)]"
                    />
                  </label>
                ) : null}

                {editingId && isSuperAdmin && !editingOwnAccount ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm">
                      <span>{t("members.fields.globalRole")}</span>

                      <select
                        value={form.globalRole}
                        onChange={(event) =>
                          updateForm("globalRole", event.target.value)
                        }
                        className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none"
                      >
                        <option value="USER">
                          {t("members.globalRoles.user")}
                        </option>

                        <option value="SUPERADMIN">
                          {t("members.globalRoles.superadmin")}
                        </option>
                      </select>
                    </label>

                    <label className="grid gap-1.5 text-sm">
                      <span>{t("members.fields.accountStatus")}</span>

                      <select
                        value={form.accountStatus}
                        onChange={(event) =>
                          updateForm("accountStatus", event.target.value)
                        }
                        className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none"
                      >
                        <option value="active">
                          {t("members.status.active")}
                        </option>

                        <option value="inactive">
                          {t("members.status.inactive")}
                        </option>

                        <option value="suspended">
                          {t("members.status.suspended")}
                        </option>
                      </select>
                    </label>
                  </div>
                ) : null}
              </section>

              <section className="grid gap-4 border-t border-[var(--admin-border)] pt-5">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[var(--company-primary)]" />

                  <h3 className="text-sm font-semibold">
                    {t("members.sections.companyAccess")}
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm">
                    <span>{t("members.fields.companyAccess")}</span>

                    <select
                      value={form.companyAccess}
                      onChange={(event) =>
                        updateForm("companyAccess", event.target.value)
                      }
                      disabled={editingOwnAccount && !isSuperAdmin}
                      className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="ADMIN">{t("members.access.admin")}</option>

                      <option value="EDITOR">
                        {t("members.access.editor")}
                      </option>

                      {editingId && isSuperAdmin && !editingOwnAccount ? (
                        <option value="NO_ACCESS">
                          {t("members.access.noAccess")}
                        </option>
                      ) : null}
                    </select>
                  </label>

                  {editingId &&
                  !isSuperAdmin &&
                  !editingOwnAccount &&
                  form.companyAccess !== "NO_ACCESS" ? (
                    <label className="grid gap-1.5 text-sm">
                      <span>{t("members.fields.membershipStatus")}</span>

                      <select
                        value={form.membershipStatus}
                        onChange={(event) =>
                          updateForm("membershipStatus", event.target.value)
                        }
                        className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none"
                      >
                        <option value="active">
                          {t("members.status.active")}
                        </option>

                        <option value="inactive">
                          {t("members.status.inactive")}
                        </option>
                      </select>
                    </label>
                  ) : null}
                </div>

                <p className="text-xs leading-5 text-[var(--admin-muted-foreground)]">
                  {form.companyAccess === "NO_ACCESS"
                    ? t("members.accessDescriptions.noAccess")
                    : form.companyAccess === "ADMIN"
                      ? t("members.accessDescriptions.admin")
                      : t("members.accessDescriptions.editor")}
                </p>
              </section>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="h-10 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium"
              >
                {t("common.cancel")}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--company-primary)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : null}

                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {passwordMember ? (
        <MemberPasswordResetDialog
          member={passwordMember}
          companyId={activeCompanyId}
          onClose={closeResetPassword}
          onSuccess={loadMembers}
        />
      ) : null}
    </div>
  );
}
