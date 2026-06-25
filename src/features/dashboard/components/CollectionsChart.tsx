"use client";

import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { monthLabel, type SolarMonthKey } from "@/lib/afghan-calendar";
import { useUiStore } from "@/store/uiStore";

interface TrendRow {
  month: SolarMonthKey;
  required: number;
  collected: number;
}

/**
 * Required-vs-collected bars for each of the twelve solar months. Data comes
 * from `dashboard.collectionsTrend`; month keys are localised here.
 */
export function CollectionsChart({ data }: { data: TrendRow[] }) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);

  const rows = data.map((r) => ({
    name: monthLabel(r.month, locale),
    [t("payments.totalRequired")]: r.required,
    [t("payments.totalPaid")]: r.collected,
  }));

  return (
    <div className="surface-card p-5">
      <h3 className="mb-4 font-display text-lg text-ink">{t("dashboard.collectionsTrend")}</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D2" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B6557" }} tickLine={false} axisLine={{ stroke: "#E4E0D2" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6B6557" }} tickLine={false} axisLine={false} width={56} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E4E0D2",
                fontSize: 12,
                background: "#FBFAF5",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey={t("payments.totalRequired")} fill="#B8893B" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey={t("payments.totalPaid")} fill="#1E4D3B" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
