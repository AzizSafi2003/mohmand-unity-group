"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import toast from "react-hot-toast";
import { FileDown, Mail } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { Card, CardBody, Select, Input, Field, Button, Spinner, EmptyState } from "@/components/ui";
import { FinancialSummaryCards } from "@/features/payments";
import { currentSolarYear, monthLabel } from "@/lib/afghan-calendar";
import { localized } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";

export default function AdminReportsPage() {
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
    if (members && members.length > 0) setMemberId(members[0]._id);
    else setMemberId(null);
  }, [members]);

  const summary = useQuery(
    api.contributions.memberSummary,
    memberId ? { memberId, solarYear: year } : "skip"
  );
  const contributions = useQuery(
    api.contributions.listForMember,
    memberId ? { memberId, solarYear: year } : "skip"
  );

  const member = members?.find((m) => m._id === memberId);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"pdf" | "email" | null>(null);

  function buildPayload() {
    if (!member || !summary) return null;
    return {
      year,
      organization: "Mohmand Unity Group",
      member: {
        name: `${localized(member, "firstName", locale)} ${localized(member, "lastName", locale)}`.trim(),
        maritalStatus: member.maritalStatus,
        gender: member.gender,
        phone: member.phone ?? "",
        occupation: member.occupation ?? "",
      },
      summary,
      rows: (contributions ?? []).map((c) => ({
        month: monthLabel(c.month, "en"),
        amountDue: c.amountDue,
        amountPaid: c.amountPaid,
        status: c.status,
      })),
    };
  }

  async function downloadPdf() {
    const payload = buildPayload();
    if (!payload) return;
    setBusy("pdf");
    try {
      const res = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${payload.member.name || "member"}-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function emailReport() {
    const payload = buildPayload();
    if (!payload) return;
    if (!email) {
      toast.error(t("validation.invalidEmail"));
      return;
    }
    setBusy("email");
    try {
      const res = await fetch("/api/email/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, to: email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Email failed");
      toast.success(json.message ?? "Sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
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
        <AdminPageHeader title={t("admin.reports")} />
        <EmptyState title={t("families.title")} description="Create a family and members first." />
      </>
    );
  }

  const years = [year - 1, year, year + 1];

  return (
    <>
      <AdminPageHeader title={t("admin.reports")} description="Generate and email member financial reports (PDF)." />

      <Card className="mb-6">
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <span className="font-medium">{t("tree.selectFamily")}</span>
              <Select
                value={familyId ?? ""}
                onChange={(e) => setFamilyId(e.target.value as Id<"families">)}
                className="h-9 w-52"
              >
                {families.map((f) => (
                  <option key={f._id} value={f._id}>
                    {localized(f, "name", locale)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <span className="font-medium">{t("members.title")}</span>
              <Select
                value={memberId ?? ""}
                onChange={(e) => setMemberId(e.target.value as Id<"familyMembers">)}
                className="h-9 w-52"
                disabled={!members || members.length === 0}
              >
                {(members ?? []).map((m) => (
                  <option key={m._id} value={m._id}>
                    {localized(m, "firstName", locale)} {localized(m, "lastName", locale)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <span className="font-medium">{t("payments.year")}</span>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-9 w-24">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <Button onClick={downloadPdf} loading={busy === "pdf"} disabled={!member}>
              <FileDown className="h-4 w-4" />
              {t("admin.reports")} (PDF)
            </Button>
            <Field label={t("members.email")} className="w-64">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
              />
            </Field>
            <Button variant="outline" onClick={emailReport} loading={busy === "email"} disabled={!member}>
              <Mail className="h-4 w-4" />
              {t("common.save")} → Email
            </Button>
          </div>
        </CardBody>
      </Card>

      {summary && <FinancialSummaryCards summary={summary} />}
    </>
  );
}
