"use client";

import { Minus, Plus, User } from "lucide-react";
import { useFamilyTreeStore } from "@/store/familyTreeStore";
import { useUiStore } from "@/store/uiStore";
import { localized, initials, cn } from "@/lib/utils";
import { TREE_DIMS } from "../hooks/useFamilyTree";
import type { PositionedMember } from "../types";

const genderRing: Record<string, string> = {
  male: "ring-pine/40",
  female: "ring-clay/40",
};

export function MemberNode({ node }: { node: PositionedMember }) {
  const { member, x, y, hasChildren } = node;
  const locale = useUiStore((s) => s.locale);
  const selectedId = useFamilyTreeStore((s) => s.selectedId);
  const select = useFamilyTreeStore((s) => s.select);
  const search = useFamilyTreeStore((s) => s.search);
  const collapsed = useFamilyTreeStore((s) => s.collapsed);
  const toggleCollapsed = useFamilyTreeStore((s) => s.toggleCollapsed);

  const first = localized(member, "firstName", locale);
  const last = localized(member, "lastName", locale);
  const full = `${first} ${last}`.trim();

  const q = search.trim().toLowerCase();
  const matches = q.length > 0 && full.toLowerCase().includes(q);
  const dimmed = q.length > 0 && !matches;
  const isSelected = selectedId === member._id;
  const isCollapsed = collapsed.has(member._id);

  return (
    <div
      className="absolute"
      style={{ left: x, top: y, width: TREE_DIMS.NODE_W, height: TREE_DIMS.NODE_H }}
    >
      <button
        onClick={() => select(isSelected ? null : member._id)}
        className={cn(
          "group flex h-full w-full items-center gap-3 rounded-xl border bg-surface px-3 text-start shadow-card transition-all",
          isSelected ? "border-pine ring-2 ring-pine/30" : "border-sand hover:border-pine/40",
          matches && "border-brass ring-2 ring-brass/40",
          dimmed && "opacity-40"
        )}
      >
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-pine-100 text-sm font-semibold text-pine ring-2",
            genderRing[member.gender] ?? "ring-sand"
          )}
        >
          {member.firstName ? initials(member.firstName, member.lastName) : <User className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{full || "—"}</span>
          <span className="block truncate text-xs capitalize text-ink-faint">
            {member.maritalStatus}
            {member.dateOfDeath ? " · ✝" : ""}
          </span>
        </span>
      </button>

      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapsed(member._id);
          }}
          className="absolute -bottom-3 left-1/2 z-10 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full border border-sand bg-surface text-pine shadow-sm hover:bg-pine hover:text-surface"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}
