import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, logActivity } from "./lib/auth";

/** SETTINGS — singleton key/value store (admin-managed). */

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return row?.value ?? null;
  },
});

export const getMany = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, { keys }) => {
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      const row = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      out[key] = row?.value ?? null;
    }
    return out;
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, { key, value }) => {
    const admin = await requireAdmin(ctx);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedBy: admin._id, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("settings", { key, value, updatedBy: admin._id, updatedAt: Date.now() });
    }
    await logActivity(ctx, { user: admin, action: "settings.updated", entityType: "settings", metadata: { key } });
  },
});
