"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "convex/react";
import toast from "react-hot-toast";
import { api } from "@convex/_generated/api";
import { Modal, Field, Input, Button } from "@/components/ui";
import { monthLabel } from "@/lib/afghan-calendar";
import { formatAmount } from "@/lib/financial";
import { useUiStore } from "@/store/uiStore";
import { recordPaymentSchema } from "../validation";
import type { ContributionDoc } from "../types";

/**
 * Admin-only modal to record a payment against one monthly contribution.
 * Validates locally (translated errors) then calls the Convex mutation, which
 * appends to paymentHistory and recomputes the contribution status.
 */
export function RecordPaymentModal({
  contribution,
  currency = "AFN",
  onClose,
}: {
  contribution: ContributionDoc | null;
  currency?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const recordPayment = useMutation(api.contributions.recordPayment);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const open = contribution !== null;
  const remaining = contribution
    ? Math.max(0, contribution.amountDue - contribution.amountPaid)
    : 0;

  function reset() {
    setAmount("");
    setMethod("");
    setReference("");
    setNote("");
    setError(null);
  }

  async function submit() {
    if (!contribution) return;
    const parsed = recordPaymentSchema.safeParse({
      amount: Number(amount),
      method: method || undefined,
      reference: reference || undefined,
      note: note || undefined,
    });
    if (!parsed.success) {
      setError(t(parsed.error.issues[0].message));
      return;
    }
    setSaving(true);
    try {
      await recordPayment({ contributionId: contribution._id, ...parsed.data });
      toast.success(t("payments.recordPayment"));
      reset();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={t("payments.recordPayment")}
      description={
        contribution
          ? `${monthLabel(contribution.month, locale)} · ${formatAmount(remaining, {
              symbol: currency,
            })} ${t("payments.remaining").toLowerCase()}`
          : undefined
      }
      size="sm"
    >
      <div className="space-y-4">
        <Field label={t("payments.amountPaid")} required error={error ?? undefined}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(remaining || "")}
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Method" hint="cash, bank…">
            <Input value={method} onChange={(e) => setMethod(e.target.value)} />
          </Field>
          <Field label="Reference">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
        </div>

        <Field label="Note">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} loading={saving}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
