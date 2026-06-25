import type { Doc } from "@convex/_generated/dataModel";

export type ContributionDoc = Doc<"contributions">;
export type PaymentHistoryDoc = Doc<"paymentHistory">;

/** Shape returned by `contributions.memberSummary` / `familySummary`. */
export interface ContributionSummary {
  totalRequired: number;
  totalPaid: number;
  remaining: number;
  paidMonths: number;
  partialMonths: number;
  unpaidMonths: number;
}
