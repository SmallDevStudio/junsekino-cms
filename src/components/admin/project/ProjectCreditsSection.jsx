"use client";

import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/utils/cn";

const CREDIT_GROUPS = [
  {
    key: "architecture",
    label: "Architecture",
    description: "Architects or architecture teams credited for this project.",
  },
  {
    key: "interior",
    label: "Interior",
    description: "Interior designers or interior design teams.",
  },
  {
    key: "landscape",
    label: "Landscape",
    description: "Landscape architects or landscape design teams.",
  },
  {
    key: "consultant",
    label: "Consultant",
    description: "Consultants and other professional collaborators.",
  },
];

function normalizeCredits(credits) {
  return {
    architecture: Array.isArray(credits?.architecture)
      ? credits.architecture
      : [],

    interior: Array.isArray(credits?.interior) ? credits.interior : [],

    landscape: Array.isArray(credits?.landscape) ? credits.landscape : [],

    consultant: Array.isArray(credits?.consultant) ? credits.consultant : [],
  };
}

function emptyCredit() {
  return {
    th: "",
    en: "",
  };
}

function CreditGroup({ group, items, onChange }) {
  function addCredit() {
    onChange([...items, emptyCredit()]);
  }

  function updateCredit(index, language, value) {
    const nextItems = items.map((item, itemIndex) => {
      if (itemIndex !== index) {
        return item;
      }

      return {
        ...item,
        [language]: value,
      };
    });

    onChange(nextItems);
  }

  function removeCredit(index) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <div className="flex flex-col gap-3 border-b border-[var(--admin-border)] p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold text-[var(--admin-foreground)]">
            {group.label}
          </div>

          <p className="mt-1 text-[11px] leading-5 text-[var(--admin-muted)]">
            {group.description}
          </p>
        </div>

        <button
          type="button"
          onClick={addCredit}
          className={cn(
            "inline-flex h-9 shrink-0 items-center justify-center gap-2",
            "self-start rounded-xl",
            "border border-[var(--admin-border)]",
            "bg-[var(--admin-surface)] px-3",
            "text-xs font-medium text-[var(--admin-foreground)]",
            "transition hover:bg-[var(--admin-hover)]",
          )}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-[var(--admin-muted)]">
            No {group.label.toLowerCase()} credits added.
          </p>

          <button
            type="button"
            onClick={addCredit}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--company-primary)] transition hover:opacity-70"
          >
            <Plus size={13} />
            Add {group.label}
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--admin-border)]">
          {items.map((credit, index) => (
            <div key={`${group.key}-${index}`} className="p-4">
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                  <label>
                    <span className="text-[11px] text-[var(--admin-muted)]">
                      Name — Thai
                    </span>

                    <input
                      value={credit?.th || ""}
                      onChange={(event) =>
                        updateCredit(index, "th", event.target.value)
                      }
                      placeholder="ชื่อบุคคลหรือบริษัท"
                      maxLength={250}
                      className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none transition placeholder:text-[var(--admin-muted-light)] focus:border-[var(--company-primary)] focus:ring-2 focus:ring-[var(--company-primary-soft)]"
                    />
                  </label>

                  <label>
                    <span className="text-[11px] text-[var(--admin-muted)]">
                      Name — English
                    </span>

                    <input
                      value={credit?.en || ""}
                      onChange={(event) =>
                        updateCredit(index, "en", event.target.value)
                      }
                      placeholder="Person or company name"
                      maxLength={250}
                      className="mt-2 h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none transition placeholder:text-[var(--admin-muted-light)] focus:border-[var(--company-primary)] focus:ring-2 focus:ring-[var(--company-primary-soft)]"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => removeCredit(index)}
                  aria-label={`Remove ${group.label} credit`}
                  title="Remove"
                  className="mt-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-3 text-[10px] text-[var(--admin-muted-light)]">
                Credit {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectCreditsSection({ credits, onChange }) {
  const normalized = normalizeCredits(credits);

  function updateGroup(group, items) {
    onChange?.({
      ...normalized,
      [group]: items,
    });
  }

  return (
    <section className="mt-10">
      <div>
        <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
          Project Credits
        </h3>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--admin-muted)]">
          Add architecture, interior, landscape and consultant credits. Multiple
          people or companies can be added to each group.
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        {CREDIT_GROUPS.map((group) => (
          <CreditGroup
            key={group.key}
            group={group}
            items={normalized[group.key]}
            onChange={(items) => updateGroup(group.key, items)}
          />
        ))}
      </div>
    </section>
  );
}
