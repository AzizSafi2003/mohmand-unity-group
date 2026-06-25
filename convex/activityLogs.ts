import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

/** ACTIVITY LOGS — admin-only read of the audit trail. */

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("activityLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit ?? 100);
  },
});

export const listByAction = query({
  args: { action: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { action, limit }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("activityLogs")
      .withIndex("by_action", (q) => q.eq("action", action))
      .order("desc")
      .take(limit ?? 100);
  },
});
