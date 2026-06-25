import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { userRole, approvalStatus } from "./schema";
import {
  requireAdmin,
  getCurrentUser,
  logActivity,
} from "./lib/auth";

/**
 * USERS — identity bridge + registration approval workflow.
 *
 * Flow:
 *   Clerk "user.created" webhook -> upsertFromClerk (status: pending)
 *   Admin reviews in /admin/approvals -> approveUser / rejectUser
 *   Only status === "approved" users pass requireApproved().
 */

// ── Reads ───────────────────────────────────────────────────────────────────

/** The current signed-in user's app record (or null). Safe for any caller. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

/** Admin: list users filtered by approval status. */
export const listByStatus = query({
  args: { status: approvalStatus },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .collect();
  },
});

/** Admin: every user (for the user-management table). */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("users").order("desc").collect();
  },
});

// ── Writes ────────────────────────────────────────────────────────────────

/**
 * Idempotent upsert called by the Clerk webhook. Creates a pending user the
 * first time we see a Clerk id; otherwise refreshes profile fields.
 *
 * The very first admin is bootstrapped here: if the email matches
 * BOOTSTRAP_ADMIN_EMAIL the new user is created already approved + admin.
 */
export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
    const isBootstrapAdmin =
      !!bootstrapEmail && args.email.toLowerCase() === bootstrapEmail;

    const id = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      role: isBootstrapAdmin ? "admin" : "member",
      status: isBootstrapAdmin ? "approved" : "pending",
      approvedAt: isBootstrapAdmin ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });

    await logActivity(ctx, {
      action: "user.registered",
      entityType: "users",
      entityId: id,
      metadata: { email: args.email, bootstrapAdmin: isBootstrapAdmin },
    });

    return id;
  },
});

/** Delete a user when Clerk reports "user.deleted". */
export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/** Admin: approve a pending registration. */
export const approveUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const admin = await requireAdmin(ctx);
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("User not found");

    await ctx.db.patch(userId, {
      status: "approved",
      approvedBy: admin._id,
      approvedAt: Date.now(),
      rejectionReason: undefined,
      updatedAt: Date.now(),
    });

    await logActivity(ctx, {
      user: admin,
      action: "user.approved",
      entityType: "users",
      entityId: userId,
      metadata: { email: target.email },
    });
  },
});

/** Admin: reject a pending registration with an optional reason. */
export const rejectUser = mutation({
  args: { userId: v.id("users"), reason: v.optional(v.string()) },
  handler: async (ctx, { userId, reason }) => {
    const admin = await requireAdmin(ctx);
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("User not found");

    await ctx.db.patch(userId, {
      status: "rejected",
      rejectionReason: reason,
      updatedAt: Date.now(),
    });

    await logActivity(ctx, {
      user: admin,
      action: "user.rejected",
      entityType: "users",
      entityId: userId,
      metadata: { email: target.email, reason },
    });
  },
});

/** Admin: change a user's role (e.g. promote a member to admin). */
export const setRole = mutation({
  args: { userId: v.id("users"), role: userRole },
  handler: async (ctx, { userId, role }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(userId, { role, updatedAt: Date.now() });
    await logActivity(ctx, {
      user: admin,
      action: "user.role_changed",
      entityType: "users",
      entityId: userId,
      metadata: { role },
    });
  },
});

/** Admin: link a user login to a FamilyMember person record. */
export const linkMember = mutation({
  args: { userId: v.id("users"), memberId: v.id("familyMembers") },
  handler: async (ctx, { userId, memberId }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(userId, { memberId, updatedAt: Date.now() });
    await logActivity(ctx, {
      user: admin,
      action: "user.member_linked",
      entityType: "users",
      entityId: userId,
      metadata: { memberId },
    });
  },
});
