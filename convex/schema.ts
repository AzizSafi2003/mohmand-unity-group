import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * MOHMAND UNITY GROUP — Database schema (Convex)
 * ---------------------------------------------------------------------------
 * Design goals:
 *  - Every table is indexed on the fields it is queried by (no table scans).
 *  - References are stored as v.id("table") so relations are type-checked.
 *  - Enumerations are expressed as v.union(v.literal(...)) for validation.
 *  - Adding a new module = add a new defineTable block. Nothing else breaks.
 *
 * Shared enums are kept inline (Convex validators must be serialisable);
 * the matching TypeScript string-literal types live in src/lib/constants.ts
 * so the frontend and backend agree on the same vocabulary.
 */

// ── Reusable enum validators ───────────────────────────────────────────────
export const userRole = v.union(
  v.literal("visitor"),
  v.literal("member"),
  v.literal("admin")
);

export const approvalStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected")
);

export const maritalStatus = v.union(
  v.literal("single"),
  v.literal("married"),
  v.literal("widowed"),
  v.literal("divorced")
);

export const gender = v.union(v.literal("male"), v.literal("female"));

export const relationshipType = v.union(
  v.literal("parent"), // source is parent of target
  v.literal("spouse"), // source <-> target (stored once, treated symmetric)
  v.literal("child") //  source is child of target (inverse of parent)
);

export const paymentStatus = v.union(
  v.literal("paid"),
  v.literal("partial"),
  v.literal("unpaid")
);

// Afghan Solar Hijri month keys. Labels/translations live in i18n locales.
export const solarMonth = v.union(
  v.literal("hamal"),
  v.literal("sawr"),
  v.literal("jawza"),
  v.literal("saratan"),
  v.literal("asad"),
  v.literal("sonbola"),
  v.literal("mizan"),
  v.literal("aqrab"),
  v.literal("qaws"),
  v.literal("jadi"),
  v.literal("dalwa"),
  v.literal("hoot")
);

export default defineSchema({
  // ── Users ────────────────────────────────────────────────────────────────
  // One row per Clerk identity. Bridges Clerk auth to app roles + approval.
  users: defineTable({
    clerkId: v.string(), // Clerk "sub" / user id
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: userRole,
    status: approvalStatus,
    // Optional link to a FamilyMember record (a login may map to a person).
    memberId: v.optional(v.id("familyMembers")),
    rejectionReason: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_role", ["role"]),

  // ── Families ───────────────────────────────────────────────────────────────
  families: defineTable({
    name: v.string(),
    namePs: v.optional(v.string()), // Pashto name
    description: v.optional(v.string()),
    descriptionPs: v.optional(v.string()),
    headMemberId: v.optional(v.id("familyMembers")), // family head
    photoStorageId: v.optional(v.id("_storage")),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_name", ["name"]),

  // ── Family members ──────────────────────────────────────────────────────────
  // Strict scoping: every member belongs to exactly one familyId. The family
  // tree and member lists ALWAYS filter by familyId so Family A never leaks
  // into Family B.
  familyMembers: defineTable({
    familyId: v.id("families"),
    firstName: v.string(),
    lastName: v.string(),
    firstNamePs: v.optional(v.string()),
    lastNamePs: v.optional(v.string()),
    gender: gender,
    maritalStatus: maritalStatus,
    dateOfBirth: v.optional(v.string()), // ISO date string
    dateOfDeath: v.optional(v.string()), // set => deceased
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    occupation: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    isHead: v.boolean(),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_family", ["familyId"])
    .index("by_family_and_marital", ["familyId", "maritalStatus"])
    .index("by_lastName", ["lastName"])
    .index("by_phone", ["phone"]),

  // ── Family relationships ────────────────────────────────────────────────────
  // Directed edges used to assemble the tree. `parent` and `spouse` are the
  // canonical stored types; `child` is derived by reversing a parent edge.
  familyRelationships: defineTable({
    familyId: v.id("families"), // denormalised for fast family-scoped queries
    sourceMemberId: v.id("familyMembers"),
    targetMemberId: v.id("familyMembers"),
    type: relationshipType,
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_family", ["familyId"])
    .index("by_source", ["sourceMemberId"])
    .index("by_target", ["targetMemberId"]),

  // ── Contributions (monthly dues definition) ─────────────────────────────────
  // One row per (member, solar year, solar month). Only married members get
  // rows generated for them. Tracks expected vs. paid for that month.
  contributions: defineTable({
    familyId: v.id("families"),
    memberId: v.id("familyMembers"),
    solarYear: v.number(), // e.g. 1404
    month: solarMonth,
    amountDue: v.number(),
    amountPaid: v.number(),
    status: paymentStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_member", ["memberId"])
    .index("by_member_and_year", ["memberId", "solarYear"])
    .index("by_family_and_year", ["familyId", "solarYear"])
    .index("by_status", ["status"]),

  // ── Payment history (individual transactions) ───────────────────────────────
  // An audit-friendly ledger. Each payment references the contribution month
  // it was applied to. Summing these reproduces contributions.amountPaid.
  paymentHistory: defineTable({
    contributionId: v.id("contributions"),
    memberId: v.id("familyMembers"),
    familyId: v.id("families"),
    amount: v.number(),
    paidAt: v.number(),
    method: v.optional(v.string()), // cash, transfer, ...
    reference: v.optional(v.string()),
    recordedBy: v.id("users"),
    note: v.optional(v.string()),
  })
    .index("by_contribution", ["contributionId"])
    .index("by_member", ["memberId"])
    .index("by_family", ["familyId"]),

  // ── Laws (Mohmand Group bylaws) ─────────────────────────────────────────────
  laws: defineTable({
    order: v.number(), // for manual reordering / numbered display
    title: v.string(),
    titlePs: v.optional(v.string()),
    body: v.string(),
    bodyPs: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_order", ["order"]),

  // ── Announcements ───────────────────────────────────────────────────────────
  announcements: defineTable({
    title: v.string(),
    titlePs: v.optional(v.string()),
    body: v.string(),
    bodyPs: v.optional(v.string()),
    isPinned: v.boolean(),
    isActive: v.boolean(),
    publishedAt: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_pinned", ["isPinned"]),

  // ── Homepage content (CMS) ──────────────────────────────────────────────────
  // Keyed singleton-ish rows: one row per section ("hero", "about", ...).
  // Stored as bilingual key/value blocks so admins edit copy without code.
  homepageContent: defineTable({
    section: v.string(), // hero | about | mission | vision | objectives | contact | footer
    title: v.optional(v.string()),
    titlePs: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    subtitlePs: v.optional(v.string()),
    body: v.optional(v.string()),
    bodyPs: v.optional(v.string()),
    // Flexible bag for section-specific fields (objective lists, contact info…).
    data: v.optional(v.any()),
    imageStorageId: v.optional(v.id("_storage")),
    order: v.number(),
    isActive: v.boolean(),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_section", ["section"]),

  // ── PDF reports (archive) ───────────────────────────────────────────────────
  pdfReports: defineTable({
    type: v.string(), // member-financial | family-summary | ...
    title: v.string(),
    memberId: v.optional(v.id("familyMembers")),
    familyId: v.optional(v.id("families")),
    storageId: v.id("_storage"), // the generated PDF
    generatedBy: v.id("users"),
    generatedAt: v.number(),
    // Email delivery tracking (null until emailed).
    emailedTo: v.optional(v.string()),
    emailedAt: v.optional(v.number()),
    emailStatus: v.optional(
      v.union(v.literal("sent"), v.literal("failed"), v.literal("pending"))
    ),
  })
    .index("by_member", ["memberId"])
    .index("by_family", ["familyId"])
    .index("by_type", ["type"]),

  // ── Activity logs ───────────────────────────────────────────────────────────
  activityLogs: defineTable({
    userId: v.optional(v.id("users")),
    actorEmail: v.optional(v.string()),
    action: v.string(), // e.g. "user.approved", "member.updated"
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_createdAt", ["createdAt"]),

  // ── Settings (singleton key/value) ──────────────────────────────────────────
  settings: defineTable({
    key: v.string(), // e.g. "defaultContributionAmount", "currentSolarYear"
    value: v.any(),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // ── Translations (optional DB-backed overrides) ─────────────────────────────
  // Static UI strings live in src/lib/i18n/locales/*.json. This table lets
  // admins override or add strings at runtime without a deploy.
  translations: defineTable({
    locale: v.union(v.literal("en"), v.literal("ps")),
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  })
    .index("by_locale", ["locale"])
    .index("by_locale_and_key", ["locale", "key"]),
});
