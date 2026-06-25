"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { Input, Badge, Spinner, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default function AdminLogsPage() {
  const { t } = useTranslation();
  const logs = useQuery(api.activityLogs.list, { limit: 200 });
  const [filter, setFilter] = useState("");

  const rows = (logs ?? []).filter((l) =>
    filter ? l.action.toLowerCase().includes(filter.toLowerCase()) : true
  );

  return (
    <>
      <AdminPageHeader title={t("admin.logs")} description="Audit trail of administrative and member actions." />

      <div className="mb-4 max-w-xs">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`${t("common.search")} (e.g. payment.recorded)`}
        />
      </div>

      {logs === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title={t("admin.logs")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand bg-parchment/60 text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 text-start font-semibold">Action</th>
                <th className="hidden px-4 py-3 text-start font-semibold sm:table-cell">Actor</th>
                <th className="hidden px-4 py-3 text-start font-semibold md:table-cell">Entity</th>
                <th className="px-4 py-3 text-end font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/70">
              {rows.map((l) => (
                <tr key={l._id} className="transition-colors hover:bg-parchment/40">
                  <td className="px-4 py-3">
                    <Badge tone="pine">{l.action}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">{l.actorEmail ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-ink-faint md:table-cell">
                    {l.entityType ? `${l.entityType}` : "—"}
                  </td>
                  <td className="nums px-4 py-3 text-end text-ink-faint">{formatDateTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
