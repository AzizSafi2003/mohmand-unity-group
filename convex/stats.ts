import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * PUBLIC STATS — counts only, no personally identifiable information, so this
 * is intentionally unauthenticated for the marketing homepage. Anything that
 * exposes member detail lives behind requireApproved/requireAdmin elsewhere.
 */
export const publicStats = query({
  args: { solarYear: v.optional(v.number()) },
  handler: async (ctx, { solarYear }) => {
    const [families, members] = await Promise.all([
      ctx.db.query("families").withIndex("by_active", (q) => q.eq("isActive", true)).collect(),
      ctx.db.query("familyMembers").collect(),
    ]);

    let collectedThisYear = 0;
    if (solarYear !== undefined) {
      const rows = (await ctx.db.query("contributions").collect()).filter(
        (c) => c.solarYear === solarYear
      );
      collectedThisYear = rows.reduce((s, r) => s + r.amountPaid, 0);
    }

    return {
      families: families.length,
      members: members.filter((m) => m.isActive).length,
      collectedThisYear,
    };
  },
});
