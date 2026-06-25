import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

/**
 * DASHBOARD — aggregated admin metrics + chart series.
 * Everything here is admin-only and computed from current data.
 */

const SOLAR_MONTHS = [
  "hamal", "sawr", "jawza", "saratan", "asad", "sonbola",
  "mizan", "aqrab", "qaws", "jadi", "dalwa", "hoot",
] as const;

export const overview = query({
  args: { solarYear: v.number() },
  handler: async (ctx, { solarYear }) => {
    await requireAdmin(ctx);

    const [families, members, pendingUsers] = await Promise.all([
      ctx.db.query("families").withIndex("by_active", (q) => q.eq("isActive", true)).collect(),
      ctx.db.query("familyMembers").collect(),
      ctx.db.query("users").withIndex("by_status", (q) => q.eq("status", "pending")).collect(),
    ]);

    const activeMembers = members.filter((m) => m.isActive);
    const married = activeMembers.filter((m) => m.maritalStatus === "married");

    const contributions = await ctx.db
      .query("contributions")
      .collect();
    const yearRows = contributions.filter((c) => c.solarYear === solarYear);

    const annualRequired = yearRows.reduce((s, r) => s + r.amountDue, 0);
    const annualPaid = yearRows.reduce((s, r) => s + r.amountPaid, 0);

    return {
      totalFamilies: families.length,
      totalMembers: activeMembers.length,
      pendingApprovals: pendingUsers.length,
      marriedMembers: married.length,
      annualRequired,
      annualCollected: annualPaid,
      outstandingBalance: Math.max(0, annualRequired - annualPaid),
      compliance:
        annualRequired > 0 ? Math.round((annualPaid / annualRequired) * 100) : 0,
    };
  },
});

/** Monthly collection trend for the collections chart. */
export const collectionsTrend = query({
  args: { solarYear: v.number() },
  handler: async (ctx, { solarYear }) => {
    await requireAdmin(ctx);
    const rows = (await ctx.db.query("contributions").collect()).filter(
      (c) => c.solarYear === solarYear
    );
    return SOLAR_MONTHS.map((month) => {
      const monthRows = rows.filter((r) => r.month === month);
      return {
        month,
        required: monthRows.reduce((s, r) => s + r.amountDue, 0),
        collected: monthRows.reduce((s, r) => s + r.amountPaid, 0),
      };
    });
  },
});

/** Member count per family for the distribution chart. */
export const familyDistribution = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const families = await ctx.db
      .query("families")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    const members = await ctx.db.query("familyMembers").collect();
    return families.map((f) => ({
      family: f.name,
      members: members.filter((m) => m.familyId === f._id && m.isActive).length,
    }));
  },
});
