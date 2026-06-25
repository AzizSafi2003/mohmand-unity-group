"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import { CalendarPlus } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import {
  ContributionsTable,
  RecordPaymentModal,
  FinancialSummaryCards,
  type ContributionDoc,
} from "@/features/payments";
import { Button, Select, Spinner, EmptyState } from "@/components/ui";
import { currentSolarYear } from "@/lib/afghan-calendar";
import { localized } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";

export default function AdminContributionsPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);

  const families = useQuery(api.families.list, { includeInactive: true });
  const [familyId, setFamilyId] = useState<Id<"families"> | null>(null);
  const [year, setYear] = useState(currentSolarYear());

  useEffect(() => {
    if (families && families.length > 0 && !familyId) setFamilyId(families[0]._id);
  }, [families, familyId]);

  const members = useQuery(api.members.listByFamily, familyId ? { familyId } : "skip");
  const [memberId, setMemberId] = useState<Id<"familyMembers"> | null>(null);

  useEffect(() => {
    // Pick the first married member by default (only they have contributions).
    if (members && members.length > 0) {
      const married = members.find((m) => m.maritalStatus === "married" && m.isActive);
      setMemberId((married ?? members[0])._id);
    } else {
      setMemberId(null);
    }
  }, [members]);

  const summary = useQuery(
    api.contributions.familySummary,
    familyId ? { familyId, solarYear: year } : "skip"
  );
  const contributions = useQuery(
    api.contributions.listForMember,
    memberId ? { memberId, solarYear: year } : "skip"
  );

  const generate = useMutation(api.contributions.generateYear);
  const [generating, setGenerating] = useState(false);
  const [recording, setRecording] = useState<ContributionDoc | null>(null);

  const years = [year - 1, year, year + 1];

  async function onGenerate() {
    if (!familyId) return;
    setGenerating(true);
    try {
      await generate({ familyId, solarYear: year });
      toast.success(`${t("payments.year")} ${year}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setGenerating(false);
    }
  }

  if (families === undefined) {
    return (
      <div className="grid h-40 place-items-center">
        <Spinner />
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <>
        <AdminPageHeader title={t("payments.title")} />
        <EmptyState title={t("families.title")} description="Create a family first." />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={t("payments.title")}
        action={
          <Button onClick={onGenerate} loading={generating} disabled={!familyId}>
            <CalendarPlus className="h-4 w-4" />
            {`${t("common.create")} · ${year}`}
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <span className="font-medium">{t("tree.selectFamily")}</span>
          <Select
            value={familyId ?? ""}
            onChange={(e) => setFamilyId(e.target.value as Id<"families">)}
            className="h-9 w-56"
          >
            {families.map((f) => (
              <option key={f._id} value={f._id}>
                {localized(f, "name", locale)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <span className="font-medium">{t("payments.year")}</span>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-9 w-28">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {summary && (
        <div className="mb-6">
          <FinancialSummaryCards summary={summary} />
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-ink-soft">{t("members.title")}</label>
        <Select
          value={memberId ?? ""}
          onChange={(e) => setMemberId(e.target.value as Id<"familyMembers">)}
          className="h-9 w-60"
          disabled={!members || members.length === 0}
        >
          {(members ?? []).map((m) => (
            <option key={m._id} value={m._id}>
              {localized(m, "firstName", locale)} {localized(m, "lastName", locale)}
              {m.maritalStatus !== "married" ? " ·" : ""}
            </option>
          ))}
        </Select>
      </div>

      {contributions === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : contributions.length === 0 ? (
        <EmptyState
          title={t("payments.title")}
          description={t("payments.marriedOnlyNote")}
          action={
            <Button onClick={onGenerate} loading={generating}>
              {`${t("common.create")} · ${year}`}
            </Button>
          }
        />
      ) : (
        <ContributionsTable contributions={contributions} onRecord={setRecording} />
      )}

      <RecordPaymentModal contribution={recording} onClose={() => setRecording(null)} />
    </>
  );
}
