"use client";

import { useTranslation } from "react-i18next";
import { Badge, Button } from "@/components/ui";
import { monthLabel, SOLAR_MONTH_KEYS, type SolarMonthKey } from "@/lib/afghan-calendar";
import { formatAmount } from "@/lib/financial";
import { useUiStore } from "@/store/uiStore";
import type { ContributionDoc } from "../types";

const statusTone = {
  paid: "paid",
  partial: "partial",
  unpaid: "unpaid",
} as const;

/**
 * Renders the twelve solar-month contributions for a member in calendar order.
 * `onRecord` is only passed by admins; members see a read-only ledger.
 */
export function ContributionsTable({
  contributions,
  currency = "AFN",
  onRecord,
}: {
  contributions: ContributionDoc[];
  currency?: string;
  onRecord?: (c: ContributionDoc) => void;
}) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);

  // Index by month so we can render all twelve in calendar order.
  const byMonth = new Map<SolarMonthKey, ContributionDoc>();
  for (const c of contributions) byMonth.set(c.month, c);

  return (
    <div className="overflow-hidden rounded-2xl border border-sand bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand bg-parchment/60 text-start text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-3 text-start font-semibold">{t("payments.month")}</th>
            <th className="px-4 py-3 text-end font-semibold">{t("payments.amountDue")}</th>
            <th className="px-4 py-3 text-end font-semibold">{t("payments.amountPaid")}</th>
            <th className="px-4 py-3 text-start font-semibold">{t("payments.status")}</th>
            {onRecord && <th className="px-4 py-3 text-end font-semibold">{t("common.actions")}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-sand/70">
          {SOLAR_MONTH_KEYS.map((month) => {
            const c = byMonth.get(month);
            const due = c?.amountDue ?? 0;
            const paid = c?.amountPaid ?? 0;
            const status = c?.status ?? "unpaid";
            return (
              <tr key={month} className="transition-colors hover:bg-parchment/40">
                <td className="px-4 py-3 font-medium text-ink">{monthLabel(month, locale)}</td>
                <td className="nums px-4 py-3 text-end text-ink-soft">
                  {formatAmount(due, { symbol: currency })}
                </td>
                <td className="nums px-4 py-3 text-end text-ink-soft">
                  {formatAmount(paid, { symbol: currency })}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[status]}>{t(`payments.${status}`)}</Badge>
                </td>
                {onRecord && (
                  <td className="px-4 py-3 text-end">
                    {c && status !== "paid" ? (
                      <Button size="sm" variant="outline" onClick={() => onRecord(c)}>
                        {t("payments.recordPayment")}
                      </Button>
                    ) : (
                      <span className="text-xs text-ink-faint">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
