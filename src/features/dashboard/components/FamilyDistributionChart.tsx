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
  Cell,
} from "recharts";

interface DistRow {
  family: string;
  members: number;
}

const PALETTE = ["#1E4D3B", "#3E7E63", "#B8893B", "#A6573C", "#102E23", "#C9A24B"];

/** Horizontal bar chart of active members per family. */
export function FamilyDistributionChart({ data }: { data: DistRow[] }) {
  const { t } = useTranslation();

  return (
    <div className="surface-card p-5">
      <h3 className="mb-4 font-display text-lg text-ink">{t("dashboard.familyDistribution")}</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D2" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#6B6557" }} tickLine={false} axisLine={{ stroke: "#E4E0D2" }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="family"
              tick={{ fontSize: 11, fill: "#3A352B" }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              cursor={{ fill: "rgba(30,77,59,0.06)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E4E0D2",
                fontSize: 12,
                background: "#FBFAF5",
              }}
            />
            <Bar dataKey="members" radius={[0, 4, 4, 0]} maxBarSize={26}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
