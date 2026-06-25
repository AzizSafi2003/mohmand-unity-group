"use client";

import { Languages } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

/** Compact EN / پښتو toggle. Updates the locale store, which drives i18n + RTL. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-sand bg-surface p-0.5 text-xs font-semibold",
        className
      )}
      role="group"
      aria-label="Language"
    >
      <Languages className="mx-1.5 h-3.5 w-3.5 text-ink-faint" aria-hidden />
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          locale === "en" ? "bg-pine text-surface" : "text-ink-faint hover:text-ink"
        )}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("ps")}
        className={cn(
          "rounded-full px-2.5 py-1 font-ps transition-colors",
          locale === "ps" ? "bg-pine text-surface" : "text-ink-faint hover:text-ink"
        )}
        aria-pressed={locale === "ps"}
      >
        پښتو
      </button>
    </div>
  );
}
