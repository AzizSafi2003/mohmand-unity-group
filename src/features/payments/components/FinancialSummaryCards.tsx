"use client";

import { useTranslation } from "react-i18next";
import { Wallet, CheckCircle2, CircleDashed, Percent } from "lucide-react";
import { formatAmount } from "@/lib/financial";
import { cn } from "@/lib/utils";
import type { ContributionSummary } from "../types";

/**
 * Headline financial figures for a member (or a family). Pure presentation —
 * the numbers are computed server-side by `contributions.*Summary`.
 */
export function FinancialSummaryCards({
  summary,
  currency = "AFN",
}: {
  summary: ContributionSummary;
  currency?: string;
}) {
  const { t } = useTranslation();
  const compliance =
    summary.totalRequired > 0
      ? Math.round((summary.totalPaid / summary.totalRequired) * 100)
      : 0;

  const cards = [
    {
      label: t("payments.totalRequired"),
      value: formatAmount(summary.totalRequired, { symbol: currency }),
      icon: Wallet,
      tone: "text-pine",
    },
    {
      label: t("payments.totalPaid"),
      value: formatAmount(summary.totalPaid, { symbol: currency }),
      icon: CheckCircle2,
      tone: "text-pine-700",
    },
    {
      label: t("payments.remaining"),
      value: formatAmount(summary.remaining, { symbol: currency }),
      icon: CircleDashed,
      tone: summary.remaining > 0 ? "text-clay" : "text-pine-700",
    },
    {
      label: t("dashboard.compliance"),
      value: `${compliance}%`,
      icon: Percent,
      tone: "text-brass-dark",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="surface-card p-4">
          <div className="flex items-center gap-2 text-ink-faint">
            <c.icon className={cn("h-4 w-4", c.tone)} />
            <span className="text-xs font-medium uppercase tracking-wide">{c.label}</span>
          </div>
          <p className="nums mt-2 text-xl font-semibold text-ink">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
