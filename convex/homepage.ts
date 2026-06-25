import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, logActivity } from "./lib/auth";

/**
 * HOMEPAGE CONTENT — bilingual CMS. One row per section. Editable entirely
 * from /admin/homepage so launching new copy needs no code change.
 */

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("homepageContent").collect();
    return rows.filter((r) => r.isActive).sort((a, b) => a.order - b.order);
  },
});

export const getSection = query({
  args: { section: v.string() },
  handler: async (ctx, { section }) => {
    return await ctx.db
      .query("homepageContent")
      .withIndex("by_section", (q) => q.eq("section", section))
      .unique();
  },
});

/** Upsert a section (admin). Creates it if missing. */
export const upsertSection = mutation({
  args: {
    section: v.string(),
    title: v.optional(v.string()),
    titlePs: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    subtitlePs: v.optional(v.string()),
    body: v.optional(v.string()),
    bodyPs: v.optional(v.string()),
    data: v.optional(v.any()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const existing = await ctx.db
      .query("homepageContent")
      .withIndex("by_section", (q) => q.eq("section", args.section))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        titlePs: args.titlePs,
        subtitle: args.subtitle,
        subtitlePs: args.subtitlePs,
        body: args.body,
        bodyPs: args.bodyPs,
        data: args.data,
        order: args.order ?? existing.order,
        isActive: args.isActive ?? existing.isActive,
        updatedBy: admin._id,
        updatedAt: now,
      });
      await logActivity(ctx, { user: admin, action: "homepage.updated", entityType: "homepageContent", entityId: existing._id, metadata: { section: args.section } });
      return existing._id;
    }

    const id = await ctx.db.insert("homepageContent", {
      section: args.section,
      title: args.title,
      titlePs: args.titlePs,
      subtitle: args.subtitle,
      subtitlePs: args.subtitlePs,
      body: args.body,
      bodyPs: args.bodyPs,
      data: args.data,
      order: args.order ?? 0,
      isActive: args.isActive ?? true,
      updatedBy: admin._id,
      updatedAt: now,
    });
    await logActivity(ctx, { user: admin, action: "homepage.created", entityType: "homepageContent", entityId: id, metadata: { section: args.section } });
    return id;
  },
});
