"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Pencil, Trash2, Users, Network } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { localized } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useUiStore } from "@/store/uiStore";
import type { FamilyDoc } from "../types";

/**
 * Lists families with their active-member counts. Counts are passed in (the
 * page resolves them) to keep this component a pure view.
 */
export function FamiliesTable({
  families,
  counts,
  onEdit,
  onDelete,
}: {
  families: FamilyDoc[];
  counts?: Record<string, number>;
  onEdit?: (f: FamilyDoc) => void;
  onDelete?: (f: FamilyDoc) => void;
}) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const showActions = !!onEdit || !!onDelete;

  return (
    <div className="overflow-x-auto rounded-2xl border border-sand bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand bg-parchment/60 text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-3 text-start font-semibold">{t("families.name")}</th>
            <th className="hidden px-4 py-3 text-start font-semibold md:table-cell">
              {t("families.description")}
            </th>
            <th className="px-4 py-3 text-end font-semibold">{t("families.memberCount")}</th>
            {showActions && <th className="px-4 py-3 text-end font-semibold">{t("common.actions")}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-sand/70">
          {families.map((f) => {
            const name = localized(f, "name", locale);
            const description = localized(f, "description", locale);
            return (
              <tr key={f._id} className="transition-colors hover:bg-parchment/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-ink">{name || "—"}</span>
                    {!f.isActive && <Badge tone="neutral">inactive</Badge>}
                  </div>
                </td>
                <td className="hidden max-w-md px-4 py-3 text-ink-faint md:table-cell">
                  <span className="line-clamp-1">{description || "—"}</span>
                </td>
                <td className="px-4 py-3 text-end">
                  <span className="nums inline-flex items-center gap-1 text-ink-soft">
                    <Users className="h-3.5 w-3.5 text-pine-300" />
                    {counts?.[f._id] ?? 0}
                  </span>
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={ROUTES.familyTree}
                        aria-label={t("nav.familyTree")}
                        className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-parchment-deep hover:text-pine"
                      >
                        <Network className="h-4 w-4" />
                      </Link>
                      {onEdit && (
                        <Button size="icon" variant="ghost" onClick={() => onEdit(f)} aria-label={t("common.edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button size="icon" variant="ghost" onClick={() => onDelete(f)} aria-label={t("common.delete")}>
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
