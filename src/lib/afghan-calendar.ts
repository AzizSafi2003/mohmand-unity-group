/**
 * Afghan Solar Hijri (Jalali) calendar utilities.
 * ---------------------------------------------------------------------------
 * The Afghan calendar shares the astronomical Solar Hijri system used by the
 * Persian calendar; only the month names differ (Pashto/Dari vs. Persian).
 * The Gregorian <-> Jalali conversion below is the well-established algorithm
 * (Borkowski / jalaali-js), implemented from scratch here so the project has
 * no extra runtime dependency for date maths.
 *
 * Months run Hamal (1) .. Hoot (12). Months 1-6 have 31 days, 7-11 have 30,
 * and Hoot has 29 or 30 depending on the leap year.
 */

export type SolarMonthKey =
  | "hamal" | "sawr" | "jawza" | "saratan" | "asad" | "sonbola"
  | "mizan" | "aqrab" | "qaws" | "jadi" | "dalwa" | "hoot";

export interface SolarMonthMeta {
  key: SolarMonthKey;
  index: number; // 1-based
  en: string;
  ps: string; // Pashto
  days: number; // typical length (Hoot varies by leap year)
}

export const SOLAR_MONTHS: SolarMonthMeta[] = [
  { key: "hamal", index: 1, en: "Hamal", ps: "حمل", days: 31 },
  { key: "sawr", index: 2, en: "Sawr", ps: "ثور", days: 31 },
  { key: "jawza", index: 3, en: "Jawza", ps: "جوزا", days: 31 },
  { key: "saratan", index: 4, en: "Saratan", ps: "سرطان", days: 31 },
  { key: "asad", index: 5, en: "Asad", ps: "اسد", days: 31 },
  { key: "sonbola", index: 6, en: "Sonbola", ps: "سنبله", days: 31 },
  { key: "mizan", index: 7, en: "Mizan", ps: "میزان", days: 30 },
  { key: "aqrab", index: 8, en: "Aqrab", ps: "عقرب", days: 30 },
  { key: "qaws", index: 9, en: "Qaws", ps: "قوس", days: 30 },
  { key: "jadi", index: 10, en: "Jadi", ps: "جدی", days: 30 },
  { key: "dalwa", index: 11, en: "Dalwa", ps: "دلو", days: 30 },
  { key: "hoot", index: 12, en: "Hoot", ps: "حوت", days: 29 },
];

export const SOLAR_MONTH_KEYS: SolarMonthKey[] = SOLAR_MONTHS.map((m) => m.key);

export function getMonthMeta(key: SolarMonthKey): SolarMonthMeta {
  const m = SOLAR_MONTHS.find((x) => x.key === key);
  if (!m) throw new Error(`Unknown solar month: ${key}`);
  return m;
}

export function monthLabel(key: SolarMonthKey, locale: "en" | "ps"): string {
  const m = getMonthMeta(key);
  return locale === "ps" ? m.ps : m.en;
}

// ── Conversion core (Jalali <-> Gregorian) ─────────────────────────────────

// Both helpers truncate toward zero (the canonical jalaali-js behaviour).
// Using Math.floor here instead would break the conversion on the negative
// intermediate values that occur for months > 8.
function div(a: number, b: number) {
  return Math.trunc(a / b);
}

function mod(a: number, b: number) {
  return a - Math.trunc(a / b) * b;
}

interface JalaliCal {
  leap: number; // 0 if leap year
  gy: number;
  march: number;
}

/** Determine leap status + Gregorian anchor for a Jalali year. */
function jalCal(jy: number): JalaliCal {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error("Jalali year out of supported range");
  }

  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return (
    g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
  );
}

function d2j(jdn: number) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  const jm = 7 + div(k, 30);
  const jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

export interface SolarDate {
  year: number;
  month: number; // 1-based
  day: number;
}

/** Convert a JS Date (Gregorian) to an Afghan solar date. */
export function gregorianToSolar(date: Date): SolarDate {
  const jdn = g2d(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { jy, jm, jd } = d2j(jdn);
  return { year: jy, month: jm, day: jd };
}

/** Convert an Afghan solar date to a JS Date (Gregorian). */
export function solarToGregorian(s: SolarDate): Date {
  const jdn = j2d(s.year, s.month, s.day);
  const { gy, gm, gd } = d2g(jdn);
  return new Date(gy, gm - 1, gd);
}

/** True if the given Jalali year is a leap year (Hoot has 30 days). */
export function isSolarLeapYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

/** The current Afghan solar year (used as a sensible default). */
export function currentSolarYear(): number {
  return gregorianToSolar(new Date()).year;
}

/** Format a solar date like "12 Sawr 1404" / "۱۲ ثور ۱۴۰۴". */
export function formatSolarDate(s: SolarDate, locale: "en" | "ps" = "en"): string {
  const meta = SOLAR_MONTHS[s.month - 1];
  const name = locale === "ps" ? meta.ps : meta.en;
  return `${s.day} ${name} ${s.year}`;
}
