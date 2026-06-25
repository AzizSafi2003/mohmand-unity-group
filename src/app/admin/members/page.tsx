"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ConfirmDialog } from "@/features/admin/components/ConfirmDialog";
import { MembersTable, MemberForm, type MemberDoc } from "@/features/members";
import { Button, Modal, Select, Spinner, EmptyState } from "@/components/ui";
import { localized } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";

export default function AdminMembersPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);

  const families = useQuery(api.families.list, { includeInactive: true });
  const [familyId, setFamilyId] = useState<Id<"families"> | null>(null);

  useEffect(() => {
    if (families && families.length > 0 && !familyId) setFamilyId(families[0]._id);
  }, [families, familyId]);

  const members = useQuery(
    api.members.listByFamily,
    familyId ? { familyId } : "skip"
  );
  const remove = useMutation(api.members.remove);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MemberDoc | null>(null);
  const [deleting, setDeleting] = useState<MemberDoc | null>(null);

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
        <AdminPageHeader title={t("members.title")} />
        <EmptyState title={t("families.title")} description="Create a family first to add members." />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={t("members.title")}
        action={
          <Button onClick={() => setCreating(true)} disabled={!familyId}>
            <Plus className="h-4 w-4" />
            {t("common.create")}
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-ink-soft">{t("tree.selectFamily")}</label>
        <Select
          value={familyId ?? ""}
          onChange={(e) => setFamilyId(e.target.value as Id<"families">)}
          className="h-9 w-60"
        >
          {families.map((f) => (
            <option key={f._id} value={f._id}>
              {localized(f, "name", locale)}
            </option>
          ))}
        </Select>
      </div>

      {members === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          title={t("members.title")}
          action={<Button onClick={() => setCreating(true)}>{t("common.create")}</Button>}
        />
      ) : (
        <MembersTable members={members} onEdit={setEditing} onDelete={setDeleting} />
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title={t("common.create")} size="lg">
        {familyId && <MemberForm mode="create" familyId={familyId} onDone={() => setCreating(false)} />}
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={t("common.edit")} size="lg">
        {editing && <MemberForm mode="edit" member={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={t("common.delete")}
        message={deleting ? `${deleting.firstName} ${deleting.lastName}` : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove({ memberId: deleting._id });
            toast.success(t("common.delete"));
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error");
          }
        }}
      />
    </>
  );
}
