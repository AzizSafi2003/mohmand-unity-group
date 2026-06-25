import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { gender, maritalStatus } from "./schema";
import {
  requireAdmin,
  requireApproved,
  getCurrentUser,
  logActivity,
} from "./lib/auth";
import { Doc } from "./_generated/dataModel";

/**
 * FAMILY MEMBERS — the core people records.
 *
 * Scoping rule (enforced in every read): a non-admin user may only ever see
 * members whose familyId matches their own family. There is no query path
 * that returns cross-family members to a non-admin.
 */

/** Resolve the family a non-admin user is allowed to read, or null. */
async function memberFamilyId(
  ctx: Parameters<typeof getCurrentUser>[0],
  user: Doc<"users">
) {
  if (!user.memberId) return null;
  const m = await ctx.db.get(user.memberId);
  return m?.familyId ?? null;
}

export const listByFamily = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const user = await requireApproved(ctx);
    if (user.role !== "admin") {
      const ownFamily = await memberFamilyId(ctx, user);
      if (ownFamily !== familyId) return []; // hard scope
    }
    return await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .collect();
  },
});

export const get = query({
  args: { memberId: v.id("familyMembers") },
  handler: async (ctx, { memberId }) => {
    const user = await requireApproved(ctx);
    const member = await ctx.db.get(memberId);
    if (!member) return null;
    if (user.role !== "admin") {
      const ownFamily = await memberFamilyId(ctx, user);
      if (ownFamily !== member.familyId) return null;
    }
    return member;
  },
});

/** The signed-in member's own profile (if their login is linked). */
export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.status !== "approved" || !user.memberId) return null;
    return await ctx.db.get(user.memberId);
  },
});

export const create = mutation({
  args: {
    familyId: v.id("families"),
    firstName: v.string(),
    lastName: v.string(),
    firstNamePs: v.optional(v.string()),
    lastNamePs: v.optional(v.string()),
    gender: gender,
    maritalStatus: maritalStatus,
    dateOfBirth: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    occupation: v.optional(v.string()),
    isHead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    const { isHead, ...rest } = args;
    const id = await ctx.db.insert("familyMembers", {
      ...rest,
      isHead: isHead ?? false,
      isActive: true,
      createdBy: admin._id,
      createdAt: now,
      updatedAt: now,
    });
    if (isHead) {
      await ctx.db.patch(args.familyId, { headMemberId: id, updatedAt: now });
    }
    await logActivity(ctx, {
      user: admin,
      action: "member.created",
      entityType: "familyMembers",
      entityId: id,
      metadata: { name: `${args.firstName} ${args.lastName}` },
    });
    return id;
  },
});

export const update = mutation({
  args: {
    memberId: v.id("familyMembers"),
    patch: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      firstNamePs: v.optional(v.string()),
      lastNamePs: v.optional(v.string()),
      gender: v.optional(gender),
      maritalStatus: v.optional(maritalStatus),
      dateOfBirth: v.optional(v.string()),
      dateOfDeath: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
      occupation: v.optional(v.string()),
      notes: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { memberId, patch }) => {
    // Members may edit ONLY their own profile, and only a safe subset.
    const user = await requireApproved(ctx);
    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");

    if (user.role !== "admin") {
      if (user.memberId !== memberId) {
        throw new Error("You can only edit your own profile");
      }
      // Restrict editable fields for self-service.
      const allowed = {
        phone: patch.phone,
        email: patch.email,
        address: patch.address,
        occupation: patch.occupation,
      };
      await ctx.db.patch(memberId, { ...allowed, updatedAt: Date.now() });
    } else {
      await ctx.db.patch(memberId, { ...patch, updatedAt: Date.now() });
    }

    await logActivity(ctx, {
      user,
      action: "member.updated",
      entityType: "familyMembers",
      entityId: memberId,
    });
  },
});

export const remove = mutation({
  args: { memberId: v.id("familyMembers") },
  handler: async (ctx, { memberId }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(memberId, { isActive: false, updatedAt: Date.now() });
    await logActivity(ctx, {
      user: admin,
      action: "member.deactivated",
      entityType: "familyMembers",
      entityId: memberId,
    });
  },
});

/** Count helpers used by the dashboard (admin only). */
export const countsByMaritalStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("familyMembers").collect();
    const active = all.filter((m) => m.isActive);
    return {
      total: active.length,
      married: active.filter((m) => m.maritalStatus === "married").length,
      single: active.filter((m) => m.maritalStatus === "single").length,
      widowed: active.filter((m) => m.maritalStatus === "widowed").length,
      divorced: active.filter((m) => m.maritalStatus === "divorced").length,
    };
  },
});
