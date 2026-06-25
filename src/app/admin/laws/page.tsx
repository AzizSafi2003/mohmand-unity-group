"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ConfirmDialog } from "@/features/admin/components/ConfirmDialog";
import { Button, Modal, Field, Input, Textarea, Badge, Spinner, EmptyState } from "@/components/ui";
import { localized } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";

type Law = Doc<"laws">;

export default function AdminLawsPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const laws = useQuery(api.laws.listAll, {});
  const remove = useMutation(api.laws.remove);

  const [editing, setEditing] = useState<Law | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Law | null>(null);

  return (
    <>
      <AdminPageHeader
        title={t("laws.title")}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t("laws.addLaw")}
          </Button>
        }
      />

      {laws === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : laws.length === 0 ? (
        <EmptyState title={t("laws.title")} action={<Button onClick={() => setCreating(true)}>{t("laws.addLaw")}</Button>} />
      ) : (
        <ol className="space-y-3">
          {laws.map((law, i) => (
            <li key={law._id} className="surface-card flex items-start gap-4 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pine-100 text-sm font-semibold text-pine">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink">{localized(law, "title", locale)}</h3>
                  {!law.isActive && <Badge tone="neutral">hidden</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-faint">{localized(law, "body", locale)}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button size="icon" variant="ghost" onClick={() => setEditing(law)} aria-label={t("common.edit")}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleting(law)} aria-label={t("common.delete")}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title={t("laws.addLaw")} size="lg">
        <LawForm onDone={() => setCreating(false)} />
      </Modal>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={t("common.edit")} size="lg">
        {editing && <LawForm law={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={t("common.delete")}
        message={deleting ? localized(deleting, "title", locale) : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove({ lawId: deleting._id });
            toast.success(t("common.delete"));
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error");
          }
        }}
      />
    </>
  );
}

function LawForm({ law, onDone }: { law?: Law; onDone: () => void }) {
  const { t } = useTranslation();
  const create = useMutation(api.laws.create);
  const update = useMutation(api.laws.update);

  const [title, setTitle] = useState(law?.title ?? "");
  const [titlePs, setTitlePs] = useState(law?.titlePs ?? "");
  const [body, setBody] = useState(law?.body ?? "");
  const [bodyPs, setBodyPs] = useState(law?.bodyPs ?? "");
  const [active, setActive] = useState(law?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim() || !body.trim()) {
      setError(t("validation.required"));
      return;
    }
    setSaving(true);
    try {
      if (law) {
        await update({
          lawId: law._id,
          patch: {
            title,
            titlePs: titlePs || undefined,
            body,
            bodyPs: bodyPs || undefined,
            isActive: active,
          },
        });
      } else {
        await create({ title, titlePs: titlePs || undefined, body, bodyPs: bodyPs || undefined });
      }
      toast.success(t("common.save"));
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("laws.lawTitle")} required error={error ?? undefined}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={`${t("laws.lawTitle")} (پښتو)`}>
          <Input dir="rtl" value={titlePs} onChange={(e) => setTitlePs(e.target.value)} />
        </Field>
      </div>
      <Field label={t("laws.lawBody")} required>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <Field label={`${t("laws.lawBody")} (پښتو)`}>
        <Textarea dir="rtl" value={bodyPs} onChange={(e) => setBodyPs(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-sand text-pine focus:ring-pine/30"
        />
        Active (visible publicly)
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit} loading={saving}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
