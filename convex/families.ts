import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireAdmin,
  requireApproved,
  getCurrentUser,
  logActivity,
} from "./lib/auth";

/**
 * FAMILIES — admin CRUD + member-scoped reads.
 * Members only ever see their own family; admins see everything.
 */

export const list = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, { includeInactive }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    if (user.role === "admin") {
      if (includeInactive) return await ctx.db.query("families").collect();
      return await ctx.db
        .query("families")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }

    // Members: resolve their own family via their linked member record.
    if (user.status !== "approved" || !user.memberId) return [];
    const member = await ctx.db.get(user.memberId);
    if (!member) return [];
    const family = await ctx.db.get(member.familyId);
    return family ? [family] : [];
  },
});

export const get = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const user = await requireApproved(ctx);
    const family = await ctx.db.get(familyId);
    if (!family) return null;

    if (user.role !== "admin") {
      // Members may only read their own family.
      if (!user.memberId) return null;
      const member = await ctx.db.get(user.memberId);
      if (!member || member.familyId !== familyId) return null;
    }
    return family;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    namePs: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionPs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("families", {
      ...args,
      isActive: true,
      createdBy: admin._id,
      createdAt: now,
      updatedAt: now,
    });
    await logActivity(ctx, {
      user: admin,
      action: "family.created",
      entityType: "families",
      entityId: id,
      metadata: { name: args.name },
    });
    return id;
  },
});

export const update = mutation({
  args: {
    familyId: v.id("families"),
    patch: v.object({
      name: v.optional(v.string()),
      namePs: v.optional(v.string()),
      description: v.optional(v.string()),
      descriptionPs: v.optional(v.string()),
      headMemberId: v.optional(v.id("familyMembers")),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { familyId, patch }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(familyId, { ...patch, updatedAt: Date.now() });
    await logActivity(ctx, {
      user: admin,
      action: "family.updated",
      entityType: "families",
      entityId: familyId,
      metadata: patch,
    });
  },
});

export const remove = mutation({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const admin = await requireAdmin(ctx);
    // Soft delete to preserve historical references (payments, logs).
    await ctx.db.patch(familyId, { isActive: false, updatedAt: Date.now() });
    await logActivity(ctx, {
      user: admin,
      action: "family.deactivated",
      entityType: "families",
      entityId: familyId,
    });
  },
});
