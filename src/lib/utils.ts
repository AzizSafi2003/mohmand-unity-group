import { type Locale, RTL_LOCALES } from "./constants";

/** Tiny className combiner (avoids a clsx dependency). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Whether a locale is right-to-left. */
export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** Pick the right bilingual field given the active locale, with EN fallback. */
export function localized<T extends Record<string, unknown>>(
  obj: T,
  baseKey: string,
  locale: Locale
): string {
  if (locale === "ps") {
    const ps = obj[`${baseKey}Ps`];
    if (typeof ps === "string" && ps.trim()) return ps;
  }
  const base = obj[baseKey];
  return typeof base === "string" ? base : "";
}

/** Format an epoch-millis timestamp for display. */
export function formatDateTime(ms: number, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

export function initials(first?: string, last?: string): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}
