"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Button } from "@/components/ui";

/**
 * Generic confirmation modal for destructive actions. The `onConfirm` may be
 * async; the dialog shows a loading state and closes on success.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={message} size="sm">
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="danger" onClick={confirm} loading={busy}>
          {confirmLabel ?? t("common.delete")}
        </Button>
      </div>
    </Modal>
  );
}
