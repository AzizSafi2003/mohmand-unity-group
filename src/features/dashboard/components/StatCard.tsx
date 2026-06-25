"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/**
 * A single headline metric. Used in a grid on the admin dashboard and the
 * member overview. `tone` tints the icon chip only — values stay neutral ink.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  sublabel,
  tone = "pine",
}: {
  label: string;
  value: string | number;
  icon?: ComponentType<{ className?: string }>;
  sublabel?: string;
  tone?: "pine" | "brass" | "clay";
}) {
  const chip = {
    pine: "bg-pine-100 text-pine",
    brass: "bg-brass/15 text-brass-dark",
    clay: "bg-clay/12 text-clay",
  }[tone];

  return (
    <div className="surface-card flex items-start justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
        <p className="nums mt-1.5 text-2xl font-semibold text-ink">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-ink-faint">{sublabel}</p>}
      </div>
      {Icon && (
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", chip)}>
          <Icon className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}
