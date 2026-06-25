"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { Network, UserCircle2, ShieldCheck } from "lucide-react";
import { api } from "@convex/_generated/api";
import { RequireApproved } from "@/components/shared/Guards";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { FinancialSummaryCards, ContributionsTable } from "@/features/payments";
import { Spinner, SectionHeading, Button, EmptyState } from "@/components/ui";
import { currentSolarYear } from "@/lib/afghan-calendar";
import { ROUTES } from "@/lib/constants";
import { useUiStore } from "@/store/uiStore";
import { localized } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <RequireApproved>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <MemberDashboard />
        </main>
        <Footer />
      </div>
    </RequireApproved>
  );
}

function MemberDashboard() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const { user, isAdmin } = useCurrentUser();
  const year = currentSolarYear();

  const profile = useQuery(api.members.myProfile, {});
  const memberId = user?.memberId;
  const summary = useQuery(
    api.contributions.memberSummary,
    memberId ? { memberId, solarYear: year } : "skip"
  );
  const contributions = useQuery(
    api.contributions.listForMember,
    memberId ? { memberId, solarYear: year } : "skip"
  );

  if (user === undefined) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  const name = profile
    ? `${localized(profile, "firstName", locale)} ${localized(profile, "lastName", locale)}`.trim()
    : user?.firstName ?? "";

  return (
    <div className="container-page space-y-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow={`${t("payments.year")} ${year}`}
          title={`${t("dashboard.title")}${name ? ` · ${name}` : ""}`}
        />
        <div className="flex gap-2">
          <Link href={ROUTES.familyTree}>
            <Button variant="outline">
              <Network className="h-4 w-4" />
              {t("nav.familyTree")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Admins may not be linked to a family member record. */}
      {!memberId ? (
        <EmptyState
          icon={isAdmin ? <ShieldCheck className="h-8 w-8" /> : <UserCircle2 className="h-8 w-8" />}
          title={isAdmin ? t("nav.admin") : t("auth.pendingTitle")}
          description={
            isAdmin
              ? "Your account is an administrator and isn't linked to a family member profile."
              : t("auth.pendingBody")
          }
          action={
            isAdmin ? (
              <Link href={ROUTES.admin.root}>
                <Button>{t("nav.admin")}</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          {summary && <FinancialSummaryCards summary={summary} />}
          <div>
            <h3 className="mb-3 font-display text-xl text-ink">{t("payments.title")}</h3>
            {contributions === undefined ? (
              <div className="grid h-40 place-items-center rounded-2xl border border-sand">
                <Spinner />
              </div>
            ) : (
              <ContributionsTable contributions={contributions} />
            )}
            <p className="mt-2 text-xs text-ink-faint">{t("payments.marriedOnlyNote")}</p>
          </div>
        </>
      )}
    </div>
  );
}
