"use client";

import {
  Bell,
  FileText,
  Globe2,
  Mail,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";

import { cn } from "@/utils/cn";

import EmailSettings from "./EmailSettings";
import LegalSettings from "./LegalSettings";
import LocalizationSettings from "./LocalizationSettings";
import NotificationSettings from "./NotificationSettings";
import PrivacySettings from "./PrivacySettings";

const TABS = [
  {
    id: "localization",
    label: "Localization",
    description: "Languages and public website locale.",
    icon: Globe2,
  },
  {
    id: "email",
    label: "Email",
    description: "Email sender and notification recipients.",
    icon: Mail,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Choose how website activity is delivered.",
    icon: Bell,
  },
  {
    id: "privacy",
    label: "Privacy",
    description: "Consent, cookies, data rights and retention.",
    icon: ShieldCheck,
  },
  {
    id: "legal",
    label: "Legal Documents",
    description: "Privacy notice, cookie policy and terms.",
    icon: FileText,
  },
];

export default function SettingsWorkspace() {
  const [activeTab, setActiveTab] = useState("localization");

  return (
    <div>
      <div>
        <div className="flex items-center gap-2 admin-text-10 font-semibold uppercase tracking-[0.14em] text-[var(--company-primary)]">
          <Settings2 size={14} />
          System Settings
        </div>

        <h1 className="mt-2 admin-text-28 font-semibold tracking-[-0.03em] text-[var(--admin-foreground)]">
          Settings
        </h1>

        <p className="mt-2 max-w-[720px] admin-text-12 leading-[1.65] text-[var(--admin-muted)]">
          Configure language, communication, privacy and legal settings for the
          selected company.
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside>
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;

              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition",

                    active
                      ? "bg-[var(--company-primary-soft)]"
                      : "hover:bg-[var(--admin-hover)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",

                      active
                        ? "bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
                        : "bg-[var(--admin-background)] text-[var(--admin-muted)]",
                    )}
                  >
                    <Icon size={15} strokeWidth={1.8} />
                  </span>

                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block admin-text-11 font-semibold",

                        active
                          ? "text-[var(--company-primary)]"
                          : "text-[var(--admin-foreground)]",
                      )}
                    >
                      {tab.label}
                    </span>

                    <span className="mt-1 block admin-text-9 leading-[1.5] text-[var(--admin-muted)]">
                      {tab.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0">
          {activeTab === "localization" && <LocalizationSettings />}

          {activeTab === "email" && <EmailSettings />}

          {activeTab === "notifications" && <NotificationSettings />}

          {activeTab === "privacy" && <PrivacySettings />}

          {activeTab === "legal" && <LegalSettings />}
        </main>
      </div>
    </div>
  );
}
