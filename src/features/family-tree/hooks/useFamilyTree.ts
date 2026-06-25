"use client";

import { useMemo } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { useFamilyTreeStore } from "@/store/familyTreeStore";
import type {
  PositionedMember,
  RelationshipDoc,
  TreeConnector,
  TreeLayout,
  TreeMemberDoc,
} from "../types";

/** Layout constants (px, in un-scaled tree space). */
const NODE_W = 168;
const NODE_H = 78;
const H_GAP = 36;
const V_GAP = 96;
const SPOUSE_GAP = 16;

type MemberId = Id<"familyMembers">;

/**
 * Pure-ish layout: assigns each member a generation (depth from the eldest
 * ancestors), lays generations out in horizontal rows, keeps spouses adjacent,
 * and honours the collapsed set from the store (a collapsed node hides all of
 * its descendants). Returns absolute coordinates the renderer positions with
 * CSS transforms. Cross-family safety is upstream (getFamilyGraph is scoped).
 */
export function useFamilyTreeLayout(
  members: TreeMemberDoc[],
  edges: RelationshipDoc[]
): TreeLayout {
  const collapsed = useFamilyTreeStore((s) => s.collapsed);

  return useMemo(() => {
    if (members.length === 0) {
      return { nodes: [], connectors: [], width: 0, height: 0 };
    }

    const byId = new Map<string, TreeMemberDoc>(members.map((m) => [m._id, m]));

    // Relationship maps.
    const childrenOf = new Map<string, MemberId[]>();
    const parentsOf = new Map<string, MemberId[]>();
    const spouseOf = new Map<string, MemberId>();

    for (const e of edges) {
      if (e.type === "parent") {
        if (!byId.has(e.sourceMemberId) || !byId.has(e.targetMemberId)) continue;
        childrenOf.set(e.sourceMemberId, [
          ...(childrenOf.get(e.sourceMemberId) ?? []),
          e.targetMemberId,
        ]);
        parentsOf.set(e.targetMemberId, [
          ...(parentsOf.get(e.targetMemberId) ?? []),
          e.sourceMemberId,
        ]);
      } else if (e.type === "spouse") {
        spouseOf.set(e.sourceMemberId, e.targetMemberId);
        spouseOf.set(e.targetMemberId, e.sourceMemberId);
      }
    }

    // Generation = longest path from any root ancestor.
    const generation = new Map<string, number>();
    const visiting = new Set<string>();
    const computeGen = (id: string): number => {
      if (generation.has(id)) return generation.get(id)!;
      if (visiting.has(id)) return 0; // guard against accidental cycles
      visiting.add(id);
      const parents = parentsOf.get(id) ?? [];
      const g = parents.length === 0 ? 0 : Math.max(...parents.map(computeGen)) + 1;
      visiting.delete(id);
      generation.set(id, g);
      return g;
    };
    members.forEach((m) => computeGen(m._id));

    // Hide descendants of collapsed nodes.
    const hidden = new Set<string>();
    const hideDescendants = (id: string) => {
      for (const child of childrenOf.get(id) ?? []) {
        if (!hidden.has(child)) {
          hidden.add(child);
          hideDescendants(child);
        }
      }
    };
    collapsed.forEach((id) => hideDescendants(id));

    // Visible members; spouses share their partner's row, so only lay out one
    // "primary" of each couple to avoid double counting (primary = lower id).
    const visible = members.filter((m) => !hidden.has(m._id));
    const placedSpouse = new Set<string>();

    const rows = new Map<number, TreeMemberDoc[]>();
    for (const m of visible) {
      const sp = spouseOf.get(m._id);
      if (sp && placedSpouse.has(m._id)) continue;
      if (sp && byId.has(sp) && !hidden.has(sp)) {
        placedSpouse.add(sp);
      }
      const g = generation.get(m._id) ?? 0;
      rows.set(g, [...(rows.get(g) ?? []), m]);
    }

    // Assign coordinates row by row, centering each row.
    const nodes: PositionedMember[] = [];
    const posById = new Map<string, { x: number; y: number; w: number }>();
    const sortedGens = [...rows.keys()].sort((a, b) => a - b);

    // First pass: compute each row's total width.
    const rowWidth = (list: TreeMemberDoc[]) =>
      list.reduce((acc, m) => {
        const couple = spouseOf.get(m._id) && byId.has(spouseOf.get(m._id)!) && !hidden.has(spouseOf.get(m._id)!);
        return acc + (couple ? NODE_W * 2 + SPOUSE_GAP : NODE_W) + H_GAP;
      }, 0) - H_GAP;

    const maxWidth = Math.max(...sortedGens.map((g) => rowWidth(rows.get(g)!)), NODE_W);

    sortedGens.forEach((g) => {
      const list = rows.get(g)!;
      const total = rowWidth(list);
      let cursor = (maxWidth - total) / 2;
      const y = g * (NODE_H + V_GAP);

      for (const m of list) {
        const spId = spouseOf.get(m._id);
        const hasSpouse = !!spId && byId.has(spId) && !hidden.has(spId);
        const x = cursor;
        nodes.push({
          member: m,
          generation: g,
          x,
          y,
          spouseId: hasSpouse ? (spId as MemberId) : null,
          hasChildren: (childrenOf.get(m._id)?.length ?? 0) > 0,
        });
        posById.set(m._id, { x, y, w: NODE_W });

        if (hasSpouse) {
          const sx = x + NODE_W + SPOUSE_GAP;
          const spouse = byId.get(spId!)!;
          nodes.push({
            member: spouse,
            generation: g,
            x: sx,
            y,
            spouseId: m._id,
            hasChildren: (childrenOf.get(spId!)?.length ?? 0) > 0,
          });
          posById.set(spId!, { x: sx, y, w: NODE_W });
          cursor += NODE_W * 2 + SPOUSE_GAP + H_GAP;
        } else {
          cursor += NODE_W + H_GAP;
        }
      }
    });

    // Connectors.
    const connectors: TreeConnector[] = [];
    // Spouse links.
    const spouseDone = new Set<string>();
    for (const [a, b] of spouseOf.entries()) {
      const key = [a, b].sort().join("-");
      if (spouseDone.has(key)) continue;
      spouseDone.add(key);
      const pa = posById.get(a);
      const pb = posById.get(b);
      if (!pa || !pb) continue;
      connectors.push({
        id: `s-${key}`,
        kind: "spouse",
        from: { x: pa.x + pa.w, y: pa.y + NODE_H / 2 },
        to: { x: pb.x, y: pb.y + NODE_H / 2 },
      });
    }
    // Parent→child links (from the midpoint between parents, if both placed).
    for (const [parent, kids] of childrenOf.entries()) {
      const pp = posById.get(parent);
      if (!pp) continue;
      const sp = spouseOf.get(parent);
      const spp = sp ? posById.get(sp) : undefined;
      const originX = spp ? (pp.x + pp.w + spp.x) / 2 : pp.x + pp.w / 2;
      const originY = pp.y + NODE_H;
      for (const child of kids) {
        const cp = posById.get(child);
        if (!cp) continue;
        connectors.push({
          id: `p-${parent}-${child}`,
          kind: "parent",
          from: { x: originX, y: originY },
          to: { x: cp.x + cp.w / 2, y: cp.y },
        });
      }
    }

    const height = (Math.max(...sortedGens) + 1) * (NODE_H + V_GAP) - V_GAP;
    return { nodes, connectors, width: maxWidth, height };
  }, [members, edges, collapsed]);
}

export const TREE_DIMS = { NODE_W, NODE_H };
