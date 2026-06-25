/**
 * Pure financial calculation helpers (no I/O, fully unit-testable).
 * The Convex layer persists data; these functions derive summaries from it so
 * the same logic is reusable on the server, in PDF generation, and in the UI.
 */

export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface ContributionLike {
  amountDue: number;
  amountPaid: number;
  status?: PaymentStatus;
}

export interface FinancialSummary {
  totalRequired: number;
  totalPaid: number;
  remaining: number;
  paidMonths: number;
  partialMonths: number;
  unpaidMonths: number;
  compliancePercent: number; // 0..100
}

/** Derive a payment status from amounts (source of truth for status). */
export function deriveStatus(amountDue: number, amountPaid: number): PaymentStatus {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid >= amountDue) return "paid";
  return "partial";
}

/** Summarise a set of contribution rows into the headline financial figures. */
export function summarizeContributions(
  rows: ContributionLike[]
): FinancialSummary {
  const totalRequired = rows.reduce((s, r) => s + r.amountDue, 0);
  const totalPaid = rows.reduce((s, r) => s + r.amountPaid, 0);
  const status = (r: ContributionLike) =>
    r.status ?? deriveStatus(r.amountDue, r.amountPaid);

  return {
    totalRequired,
    totalPaid,
    remaining: Math.max(0, totalRequired - totalPaid),
    paidMonths: rows.filter((r) => status(r) === "paid").length,
    partialMonths: rows.filter((r) => status(r) === "partial").length,
    unpaidMonths: rows.filter((r) => status(r) === "unpaid").length,
    compliancePercent:
      totalRequired > 0 ? Math.round((totalPaid / totalRequired) * 100) : 0,
  };
}

/** Format a number as a currency-ish amount. Currency symbol is configurable. */
export function formatAmount(
  amount: number,
  opts: { symbol?: string; locale?: string } = {}
): string {
  const { symbol = "AFN", locale = "en-US" } = opts;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${symbol}`;
}
