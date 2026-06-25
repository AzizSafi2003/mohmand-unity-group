"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ConfirmDialog } from "@/features/admin/components/ConfirmDialog";
import { FamiliesTable, FamilyForm, type FamilyDoc } from "@/features/families";
import { Button, Modal, Spinner, EmptyState } from "@/components/ui";

export default function AdminFamiliesPage() {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin" && user?.status === "approved";

  const families = useQuery(api.families.list, { includeInactive: true });
  const distribution = useQuery(
    api.dashboard.familyDistribution,
    isAdmin ? {} : "skip",
  );
  const remove = useMutation(api.families.remove);

  const [editing, setEditing] = useState<FamilyDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<FamilyDoc | null>(null);

  // Active-member counts come from the distribution query, keyed by name.
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    if (!families || !distribution) return map;
    const byName = new Map(distribution.map((d) => [d.family, d.members]));
    for (const f of families) map[f._id] = byName.get(f.name) ?? 0;
    return map;
  }, [families, distribution]);

  return (
    <>
      <AdminPageHeader
        title={t("families.title")}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t("common.create")}
          </Button>
        }
      />

      {families === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : families.length === 0 ? (
        <EmptyState
          title={t("families.title")}
          action={
            <Button onClick={() => setCreating(true)}>
              {t("common.create")}
            </Button>
          }
        />
      ) : (
        <FamiliesTable
          families={families}
          counts={counts}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={t("common.create")}
      >
        <FamilyForm mode="create" onDone={() => setCreating(false)} />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t("common.edit")}
      >
        {editing && (
          <FamilyForm
            mode="edit"
            family={editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={t("common.delete")}
        message={deleting ? deleting.name : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove({ familyId: deleting._id });
            toast.success(t("common.delete"));
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error");
          }
        }}
      />
    </>
  );
}
