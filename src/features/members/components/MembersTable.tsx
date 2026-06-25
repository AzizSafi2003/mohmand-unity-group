"use client";

import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Crown } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { localized, initials } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import type { MemberDoc } from "../types";

/**
 * Tabular list of a family's members. Edit / delete are surfaced as callbacks
 * so the parent page owns the mutations (and confirmation flow).
 */
export function MembersTable({
  members,
  onEdit,
  onDelete,
}: {
  members: MemberDoc[];
  onEdit?: (m: MemberDoc) => void;
  onDelete?: (m: MemberDoc) => void;
}) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const showActions = !!onEdit || !!onDelete;

  return (
    <div className="overflow-x-auto rounded-2xl border border-sand bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand bg-parchment/60 text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-3 text-start font-semibold">{t("members.title")}</th>
            <th className="hidden px-4 py-3 text-start font-semibold sm:table-cell">
              {t("members.maritalStatus")}
            </th>
            <th className="hidden px-4 py-3 text-start font-semibold md:table-cell">
              {t("members.phone")}
            </th>
            <th className="hidden px-4 py-3 text-start font-semibold lg:table-cell">
              {t("members.occupation")}
            </th>
            {showActions && (
              <th className="px-4 py-3 text-end font-semibold">{t("common.actions")}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-sand/70">
          {members.map((m) => {
            const name = `${localized(m, "firstName", locale)} ${localized(m, "lastName", locale)}`.trim();
            return (
              <tr key={m._id} className="transition-colors hover:bg-parchment/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pine-100 text-xs font-semibold text-pine">
                      {initials(m.firstName, m.lastName)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-ink">{name || "—"}</span>
                        {m.isHead && <Crown className="h-3.5 w-3.5 text-brass" aria-label={t("families.head")} />}
                        {!m.isActive && <Badge tone="neutral">inactive</Badge>}
                      </div>
                      <span className="text-xs capitalize text-ink-faint">{t(`members.${m.gender}`)}</span>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 capitalize text-ink-soft sm:table-cell">
                  {t(`members.${m.maritalStatus}`)}
                </td>
                <td className="nums hidden px-4 py-3 text-ink-soft md:table-cell">{m.phone ?? "—"}</td>
                <td className="hidden px-4 py-3 text-ink-soft lg:table-cell">{m.occupation ?? "—"}</td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {onEdit && (
                        <Button size="icon" variant="ghost" onClick={() => onEdit(m)} aria-label={t("common.edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button size="icon" variant="ghost" onClick={() => onDelete(m)} aria-label={t("common.delete")}>
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
