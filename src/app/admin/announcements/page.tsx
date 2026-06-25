"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Pin } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ConfirmDialog } from "@/features/admin/components/ConfirmDialog";
import { Button, Modal, Field, Input, Textarea, Badge, Spinner, EmptyState } from "@/components/ui";
import { localized, formatDateTime } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";

type Announcement = Doc<"announcements">;

export default function AdminAnnouncementsPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const items = useQuery(api.announcements.listAll, {});
  const remove = useMutation(api.announcements.remove);

  const [editing, setEditing] = useState<Announcement | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  return (
    <>
      <AdminPageHeader
        title={t("announcements.title")}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t("announcements.addAnnouncement")}
          </Button>
        }
      />

      {items === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={t("announcements.noneTitle")}
          description={t("announcements.noneBody")}
          action={<Button onClick={() => setCreating(true)}>{t("announcements.addAnnouncement")}</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a._id} className="surface-card flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-ink">{localized(a, "title", locale)}</h3>
                  {a.isPinned && (
                    <Badge tone="brass">
                      <Pin className="h-3 w-3" />
                      {t("announcements.pinned")}
                    </Badge>
                  )}
                  {!a.isActive && <Badge tone="neutral">hidden</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-faint">{localized(a, "body", locale)}</p>
                <p className="mt-1 text-xs text-ink-faint">{formatDateTime(a.publishedAt)}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button size="icon" variant="ghost" onClick={() => setEditing(a)} aria-label={t("common.edit")}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleting(a)} aria-label={t("common.delete")}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title={t("announcements.addAnnouncement")} size="lg">
        <AnnouncementForm onDone={() => setCreating(false)} />
      </Modal>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={t("common.edit")} size="lg">
        {editing && <AnnouncementForm announcement={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={t("common.delete")}
        message={deleting ? localized(deleting, "title", locale) : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove({ announcementId: deleting._id });
            toast.success(t("common.delete"));
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error");
          }
        }}
      />
    </>
  );
}

function AnnouncementForm({
  announcement,
  onDone,
}: {
  announcement?: Announcement;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const create = useMutation(api.announcements.create);
  const update = useMutation(api.announcements.update);

  const [title, setTitle] = useState(announcement?.title ?? "");
  const [titlePs, setTitlePs] = useState(announcement?.titlePs ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [bodyPs, setBodyPs] = useState(announcement?.bodyPs ?? "");
  const [pinned, setPinned] = useState(announcement?.isPinned ?? false);
  const [active, setActive] = useState(announcement?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim() || !body.trim()) {
      setError(t("validation.required"));
      return;
    }
    setSaving(true);
    try {
      if (announcement) {
        await update({
          announcementId: announcement._id,
          patch: {
            title,
            titlePs: titlePs || undefined,
            body,
            bodyPs: bodyPs || undefined,
            isPinned: pinned,
            isActive: active,
          },
        });
      } else {
        await create({
          title,
          titlePs: titlePs || undefined,
          body,
          bodyPs: bodyPs || undefined,
          isPinned: pinned,
        });
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
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="h-4 w-4 rounded border-sand text-pine focus:ring-pine/30"
          />
          {t("announcements.pinned")}
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-sand text-pine focus:ring-pine/30"
          />
          Active (visible publicly)
        </label>
      </div>
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
