import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { solarMonth } from "./schema";
import {
  requireAdmin,
  requireApproved,
  logActivity,
} from "./lib/auth";
import { Doc } from "./_generated/dataModel";

/**
 * CONTRIBUTIONS — monthly dues for MARRIED members only.
 *
 *  - `generateYear` creates 12 contribution rows (one per Afghan solar month)
 *    for every married, active member of a family, using the configured
 *    default amount. Idempotent: skips months that already exist.
 *  - `recordPayment` appends to paymentHistory and recomputes the month's
 *    status (paid / partial / unpaid).
 *  - `memberSummary` / `familySummary` compute totals on the fly.
 */

const SOLAR_MONTHS = [
  "hamal", "sawr", "jawza", "saratan", "asad", "sonbola",
  "mizan", "aqrab", "qaws", "jadi", "dalwa", "hoot",
] as const;

function statusFor(amountDue: number, amountPaid: number) {
  if (amountPaid <= 0) return "unpaid" as const;
  if (amountPaid >= amountDue) return "paid" as const;
  return "partial" as const;
}

async function defaultAmount(ctx: any): Promise<number> {
  const setting = await ctx.db
    .query("settings")
    .withIndex("by_key", (q: any) => q.eq("key", "defaultContributionAmount"))
    .unique();
  return typeof setting?.value === "number" ? setting.value : 500;
}

// ── Generation ───────────────────────────────────────────────────────────

export const generateYear = mutation({
  args: { familyId: v.id("families"), solarYear: v.number() },
  handler: async (ctx, { familyId, solarYear }) => {
    const admin = await requireAdmin(ctx);
    const amount = await defaultAmount(ctx);

    const members = await ctx.db
      .query("familyMembers")
      .withIndex("by_family_and_marital", (q) =>
        q.eq("familyId", familyId).eq("maritalStatus", "married")
      )
      .collect();

    const existing = await ctx.db
      .query("contributions")
      .withIndex("by_family_and_year", (q) =>
        q.eq("familyId", familyId).eq("solarYear", solarYear)
      )
      .collect();
    const seen = new Set(existing.map((c) => `${c.memberId}:${c.month}`));

    let created = 0;
    const now = Date.now();
    for (const m of members) {
      if (!m.isActive) continue;
      for (const month of SOLAR_MONTHS) {
        if (seen.has(`${m._id}:${month}`)) continue;
        await ctx.db.insert("contributions", {
          familyId,
          memberId: m._id,
          solarYear,
          month,
          amountDue: amount,
          amountPaid: 0,
          status: "unpaid",
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    await logActivity(ctx, {
      user: admin,
      action: "contributions.generated",
      entityType: "families",
      entityId: familyId,
      metadata: { solarYear, created },
    });
    return { created };
  },
});

// ── Reads ────────────────────────────────────────────────────────────────

export const listForMember = query({
  args: { memberId: v.id("familyMembers"), solarYear: v.number() },
  handler: async (ctx, { memberId, solarYear }) => {
    const user = await requireApproved(ctx);
    if (user.role !== "admin" && user.memberId !== memberId) {
      // Members may only see their own contributions.
      return [];
    }
    return await ctx.db
      .query("contributions")
      .withIndex("by_member_and_year", (q) =>
        q.eq("memberId", memberId).eq("solarYear", solarYear)
      )
      .collect();
  },
});

function summarise(rows: Doc<"contributions">[]) {
  const totalRequired = rows.reduce((s, r) => s + r.amountDue, 0);
  const totalPaid = rows.reduce((s, r) => s + r.amountPaid, 0);
  return {
    totalRequired,
    totalPaid,
    remaining: Math.max(0, totalRequired - totalPaid),
    paidMonths: rows.filter((r) => r.status === "paid").length,
    partialMonths: rows.filter((r) => r.status === "partial").length,
    unpaidMonths: rows.filter((r) => r.status === "unpaid").length,
  };
}

export const memberSummary = query({
  args: { memberId: v.id("familyMembers"), solarYear: v.number() },
  handler: async (ctx, { memberId, solarYear }) => {
    const user = await requireApproved(ctx);
    if (user.role !== "admin" && user.memberId !== memberId) return null;
    const rows = await ctx.db
      .query("contributions")
      .withIndex("by_member_and_year", (q) =>
        q.eq("memberId", memberId).eq("solarYear", solarYear)
      )
      .collect();
    return summarise(rows);
  },
});

export const familySummary = query({
  args: { familyId: v.id("families"), solarYear: v.number() },
  handler: async (ctx, { familyId, solarYear }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("contributions")
      .withIndex("by_family_and_year", (q) =>
        q.eq("familyId", familyId).eq("solarYear", solarYear)
      )
      .collect();
    return summarise(rows);
  },
});

// ── Writes ───────────────────────────────────────────────────────────────

export const recordPayment = mutation({
  args: {
    contributionId: v.id("contributions"),
    amount: v.number(),
    method: v.optional(v.string()),
    reference: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.amount <= 0) throw new Error("Amount must be positive");

    const c = await ctx.db.get(args.contributionId);
    if (!c) throw new Error("Contribution not found");

    await ctx.db.insert("paymentHistory", {
      contributionId: c._id,
      memberId: c.memberId,
      familyId: c.familyId,
      amount: args.amount,
      paidAt: Date.now(),
      method: args.method,
      reference: args.reference,
      recordedBy: admin._id,
      note: args.note,
    });

    const newPaid = c.amountPaid + args.amount;
    await ctx.db.patch(c._id, {
      amountPaid: newPaid,
      status: statusFor(c.amountDue, newPaid),
      updatedAt: Date.now(),
    });

    await logActivity(ctx, {
      user: admin,
      action: "payment.recorded",
      entityType: "contributions",
      entityId: c._id,
      metadata: { amount: args.amount, month: c.month, year: c.solarYear },
    });
  },
});

export const paymentHistoryForMember = query({
  args: { memberId: v.id("familyMembers") },
  handler: async (ctx, { memberId }) => {
    const user = await requireApproved(ctx);
    if (user.role !== "admin" && user.memberId !== memberId) return [];
    return await ctx.db
      .query("paymentHistory")
      .withIndex("by_member", (q) => q.eq("memberId", memberId))
      .order("desc")
      .collect();
  },
});
