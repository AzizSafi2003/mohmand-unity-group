import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { relationshipType } from "./schema";
import {
  requireAdmin,
  requireApproved,
  getCurrentUser,
  logActivity,
} from "./lib/auth";

/**
 * FAMILY RELATIONSHIPS — directed edges used to build the tree.
 *
 * Stored edge types:
 *   - "parent": source is the parent of target
 *   - "spouse": source and target are spouses (stored once, read symmetric)
 * "child" is never stored; it is the reverse view of a "parent" edge.
 *
 * `getFamilyGraph` returns members + edges scoped to ONE family so the client
 * tree renderer can lay it out. Cross-family edges are impossible because we
 * filter every edge by familyId.
 */

export const getFamilyGraph = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const user = await requireApproved(ctx);

    // Scope check for non-admins.
    if (user.role !== "admin") {
      if (!user.memberId) return { members: [], edges: [] };
      const me = await ctx.db.get(user.memberId);
      if (!me || me.familyId !== familyId) return { members: [], edges: [] };
    }

    const members = await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .collect();

    const edges = await ctx.db
      .query("familyRelationships")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .collect();

    return { members, edges };
  },
});

export const addRelationship = mutation({
  args: {
    familyId: v.id("families"),
    sourceMemberId: v.id("familyMembers"),
    targetMemberId: v.id("familyMembers"),
    type: relationshipType,
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (args.sourceMemberId === args.targetMemberId) {
      throw new Error("A member cannot be related to themselves");
    }

    // Both endpoints must belong to the same family being edited.
    const [source, target] = await Promise.all([
      ctx.db.get(args.sourceMemberId),
      ctx.db.get(args.targetMemberId),
    ]);
    if (!source || !target) throw new Error("Member not found");
    if (source.familyId !== args.familyId || target.familyId !== args.familyId) {
      throw new Error("Both members must belong to the same family");
    }

    // Normalise: store "child" as a reversed "parent" edge.
    let { sourceMemberId, targetMemberId, type } = args;
    if (type === "child") {
      [sourceMemberId, targetMemberId] = [targetMemberId, sourceMemberId];
      type = "parent";
    }

    const id = await ctx.db.insert("familyRelationships", {
      familyId: args.familyId,
      sourceMemberId,
      targetMemberId,
      type,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    await logActivity(ctx, {
      user: admin,
      action: "relationship.added",
      entityType: "familyRelationships",
      entityId: id,
      metadata: { type },
    });
    return id;
  },
});

export const removeRelationship = mutation({
  args: { relationshipId: v.id("familyRelationships") },
  handler: async (ctx, { relationshipId }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.delete(relationshipId);
    await logActivity(ctx, {
      user: admin,
      action: "relationship.removed",
      entityType: "familyRelationships",
      entityId: relationshipId,
    });
  },
});
