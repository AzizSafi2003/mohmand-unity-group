import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, logActivity } from "./lib/auth";

/** ANNOUNCEMENTS — public read (active, pinned first); admin CRUD. */

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("announcements")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return all.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.publishedAt - a.publishedAt;
    });
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("announcements").collect()).sort(
      (a, b) => b.publishedAt - a.publishedAt
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    titlePs: v.optional(v.string()),
    body: v.string(),
    bodyPs: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("announcements", {
      title: args.title,
      titlePs: args.titlePs,
      body: args.body,
      bodyPs: args.bodyPs,
      isPinned: args.isPinned ?? false,
      isActive: true,
      publishedAt: now,
      createdBy: admin._id,
      createdAt: now,
      updatedAt: now,
    });
    await logActivity(ctx, { user: admin, action: "announcement.created", entityType: "announcements", entityId: id });
    return id;
  },
});

export const update = mutation({
  args: {
    announcementId: v.id("announcements"),
    patch: v.object({
      title: v.optional(v.string()),
      titlePs: v.optional(v.string()),
      body: v.optional(v.string()),
      bodyPs: v.optional(v.string()),
      isPinned: v.optional(v.boolean()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { announcementId, patch }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(announcementId, { ...patch, updatedAt: Date.now() });
    await logActivity(ctx, { user: admin, action: "announcement.updated", entityType: "announcements", entityId: announcementId });
  },
});

export const remove = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.delete(announcementId);
    await logActivity(ctx, { user: admin, action: "announcement.deleted", entityType: "announcements", entityId: announcementId });
  },
});
