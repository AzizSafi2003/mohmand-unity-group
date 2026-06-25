import type { Doc, Id } from "@convex/_generated/dataModel";

/** A member as stored in Convex (familyMembers row). */
export type TreeMemberDoc = Doc<"familyMembers">;
export type RelationshipDoc = Doc<"familyRelationships">;

/** A member plus its computed layout position. */
export interface PositionedMember {
  member: TreeMemberDoc;
  generation: number;
  x: number;
  y: number;
  spouseId: Id<"familyMembers"> | null;
  hasChildren: boolean;
}

/** A drawn connector between two positioned points. */
export interface TreeConnector {
  id: string;
  kind: "parent" | "spouse";
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export interface TreeLayout {
  nodes: PositionedMember[];
  connectors: TreeConnector[];
  width: number;
  height: number;
}
