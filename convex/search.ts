import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireApproved } from "./lib/auth";

/**
 * SEARCH — global member search across name / phone / address.
 *
 * NOTE: This is a straightforward filtered scan suitable for the expected
 * data volume (a community group, not millions of rows). For larger datasets,
 * migrate to a Convex search index:
 *   .searchIndex("search_name", { searchField: "fullName" })
 * See DATABASE_GUIDE.md -> "Scaling search".
 *
 * Non-admins are hard-scoped to their own family.
 */
export const members = query({
  args: {
    term: v.string(),
    familyId: v.optional(v.id("families")),
    maritalStatus: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireApproved(ctx);
    const term = args.term.trim().toLowerCase();

    let scopeFamilyId = args.familyId;
    if (user.role !== "admin") {
      if (!user.memberId) return [];
      const me = await ctx.db.get(user.memberId);
      if (!me) return [];
      scopeFamilyId = me.familyId; // force own family
    }

    let rows = scopeFamilyId
      ? await ctx.db
          .query("familyMembers")
          .withIndex("by_family", (q) => q.eq("familyId", scopeFamilyId!))
          .collect()
      : await ctx.db.query("familyMembers").collect();

    rows = rows.filter((m) => m.isActive);

    if (term) {
      rows = rows.filter((m) => {
        const haystack = [
          m.firstName, m.lastName, m.firstNamePs, m.lastNamePs,
          m.phone, m.address,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });
    }

    if (args.maritalStatus) {
      rows = rows.filter((m) => m.maritalStatus === args.maritalStatus);
    }

    return rows.slice(0, 50);
  },
});
