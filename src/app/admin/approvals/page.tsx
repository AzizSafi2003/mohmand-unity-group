"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { Button, Modal, Input, Field, Badge, Spinner, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default function ApprovalsPage() {
  const { t } = useTranslation();
  const pending = useQuery(api.users.listByStatus, { status: "pending" });
  const approve = useMutation(api.users.approveUser);
  const reject = useMutation(api.users.rejectUser);

  const [rejecting, setRejecting] = useState<Id<"users"> | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onApprove(userId: Id<"users">) {
    setBusyId(userId);
    try {
      await approve({ userId });
      toast.success(t("admin.approve"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  async function onReject() {
    if (!rejecting) return;
    try {
      await reject({ userId: rejecting, reason: reason || undefined });
      toast.success(t("admin.reject"));
      setRejecting(null);
      setReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <>
      <AdminPageHeader title={t("admin.approvals")} description={t("admin.pendingUsers")} />

      {pending === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : pending.length === 0 ? (
        <EmptyState title={t("admin.noPending")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand bg-parchment/60 text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 text-start font-semibold">{t("members.email")}</th>
                <th className="hidden px-4 py-3 text-start font-semibold sm:table-cell">{t("members.firstName")}</th>
                <th className="hidden px-4 py-3 text-start font-semibold md:table-cell">Requested</th>
                <th className="px-4 py-3 text-end font-semibold">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/70">
              {pending.map((u) => (
                <tr key={u._id} className="transition-colors hover:bg-parchment/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{u.email}</span>
                      <Badge tone="pending">{t("auth.pendingTitle")}</Badge>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-faint md:table-cell">
                    {formatDateTime(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => onApprove(u._id)} loading={busyId === u._id}>
                        <Check className="h-4 w-4" />
                        {t("admin.approve")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejecting(u._id)}>
                        <X className="h-4 w-4" />
                        {t("admin.reject")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={rejecting !== null}
        onClose={() => {
          setRejecting(null);
          setReason("");
        }}
        title={t("admin.reject")}
        size="sm"
      >
        <div className="space-y-4">
          <Field label="Reason" hint="Optional — shown to the applicant">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRejecting(null);
                setReason("");
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={onReject}>
              {t("admin.reject")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
