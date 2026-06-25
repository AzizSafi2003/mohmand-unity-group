import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, logActivity } from "./lib/auth";

/** LAWS — public read (active, ordered); admin CRUD + reorder. */

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const laws = await ctx.db.query("laws").withIndex("by_order").collect();
    return laws.filter((l) => l.isActive).sort((a, b) => a.order - b.order);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("laws").withIndex("by_order").collect()).sort(
      (a, b) => a.order - b.order
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    titlePs: v.optional(v.string()),
    body: v.string(),
    bodyPs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const all = await ctx.db.query("laws").collect();
    const order = all.length;
    const now = Date.now();
    const id = await ctx.db.insert("laws", {
      ...args,
      order,
      isActive: true,
      createdBy: admin._id,
      createdAt: now,
      updatedAt: now,
    });
    await logActivity(ctx, { user: admin, action: "law.created", entityType: "laws", entityId: id });
    return id;
  },
});

export const update = mutation({
  args: {
    lawId: v.id("laws"),
    patch: v.object({
      title: v.optional(v.string()),
      titlePs: v.optional(v.string()),
      body: v.optional(v.string()),
      bodyPs: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { lawId, patch }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(lawId, { ...patch, updatedAt: Date.now() });
    await logActivity(ctx, { user: admin, action: "law.updated", entityType: "laws", entityId: lawId });
  },
});

export const remove = mutation({
  args: { lawId: v.id("laws") },
  handler: async (ctx, { lawId }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.delete(lawId);
    await logActivity(ctx, { user: admin, action: "law.deleted", entityType: "laws", entityId: lawId });
  },
});

/** Persist a new ordering (array of law ids in display order). */
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("laws")) },
  handler: async (ctx, { orderedIds }) => {
    const admin = await requireAdmin(ctx);
    await Promise.all(
      orderedIds.map((id, i) => ctx.db.patch(id, { order: i, updatedAt: Date.now() }))
    );
    await logActivity(ctx, { user: admin, action: "law.reordered", entityType: "laws" });
  },
});
