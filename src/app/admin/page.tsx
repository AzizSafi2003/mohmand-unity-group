"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import {
  Users2,
  UsersRound,
  Clock,
  HeartHandshake,
  Wallet,
  TrendingDown,
} from "lucide-react";
import { api } from "@convex/_generated/api";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import {
  StatCard,
  CollectionsChart,
  FamilyDistributionChart,
} from "@/features/dashboard/components";
import { Spinner } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { currentSolarYear } from "@/lib/afghan-calendar";
import { formatAmount } from "@/lib/financial";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const year = currentSolarYear();

  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin" && user?.status === "approved";

  const overview = useQuery(
    api.dashboard.overview,
    isAdmin ? { solarYear: year } : "skip",
  );
  const trend = useQuery(
    api.dashboard.collectionsTrend,
    isAdmin ? { solarYear: year } : "skip",
  );
  const distribution = useQuery(
    api.dashboard.familyDistribution,
    isAdmin ? {} : "skip",
  );

  return (
    <>
      <AdminPageHeader
        title={t("dashboard.title")}
        description={`${t("payments.year")} ${year}`}
      />

      {overview === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label={t("dashboard.totalFamilies")}
            value={overview.totalFamilies}
            icon={Users2}
          />
          <StatCard
            label={t("dashboard.totalMembers")}
            value={overview.totalMembers}
            icon={UsersRound}
          />
          <StatCard
            label={t("dashboard.pendingApprovals")}
            value={overview.pendingApprovals}
            icon={Clock}
            tone="brass"
          />
          <StatCard
            label={t("dashboard.marriedMembers")}
            value={overview.marriedMembers}
            icon={HeartHandshake}
          />
          <StatCard
            label={t("dashboard.annualCollections")}
            value={formatAmount(overview.annualCollected, { symbol: "AFN" })}
            icon={Wallet}
            sublabel={`${overview.compliance}% ${t("dashboard.compliance").toLowerCase()}`}
          />
          <StatCard
            label={t("dashboard.outstanding")}
            value={formatAmount(overview.outstandingBalance, { symbol: "AFN" })}
            icon={TrendingDown}
            tone="clay"
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {trend === undefined ? (
          <div className="grid h-72 place-items-center rounded-2xl border border-sand">
            <Spinner />
          </div>
        ) : (
          <CollectionsChart data={trend} />
        )}
        {distribution === undefined ? (
          <div className="grid h-72 place-items-center rounded-2xl border border-sand">
            <Spinner />
          </div>
        ) : (
          <FamilyDistributionChart data={distribution} />
        )}
      </div>
    </>
  );
}
