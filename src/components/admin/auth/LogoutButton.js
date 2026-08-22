"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { LogOut, LoaderCircle } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      router.replace("/admin/login");

      router.refresh();
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleLogout}
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        border
        border-neutral-200
        px-3
        py-2
        text-sm
        text-neutral-600
        transition
        hover:bg-neutral-50
        hover:text-neutral-950
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {loading ? (
        <LoaderCircle size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} />
      )}
      Logout
    </button>
  );
}
