/**
 * Shared string-literal vocabularies. These mirror the Convex schema enums so
 * the frontend and backend speak the same language. Importing from one place
 * means a future change (e.g. a new role) is made once.
 */

export const ROLES = ["visitor", "member", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const MARITAL_STATUSES = [
  "single", "married", "widowed", "divorced",
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export const PAYMENT_STATUSES = ["paid", "partial", "unpaid"] as const;
export type PaymentStatusLiteral = (typeof PAYMENT_STATUSES)[number];

export const RELATIONSHIP_TYPES = ["parent", "spouse", "child"] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const HOMEPAGE_SECTIONS = [
  "hero", "about", "mission", "vision", "objectives", "contact", "footer",
] as const;
export type HomepageSection = (typeof HOMEPAGE_SECTIONS)[number];

export const LOCALES = ["en", "ps"] as const;
export type Locale = (typeof LOCALES)[number];

/** RTL locales (drives `dir="rtl"` on the document). */
export const RTL_LOCALES: Locale[] = ["ps"];

/** Default settings keys (kept in the Convex `settings` table). */
export const SETTINGS_KEYS = {
  defaultContributionAmount: "defaultContributionAmount",
  currentSolarYear: "currentSolarYear",
  currencySymbol: "currencySymbol",
  organizationName: "organizationName",
} as const;

/** Route map — keep links in one place so refactors are safe. */
export const ROUTES = {
  home: "/",
  laws: "/laws",
  announcements: "/announcements",
  dashboard: "/dashboard",
  familyTree: "/family-tree",
  profile: "/profile",
  pendingApproval: "/pending-approval",
  unauthorized: "/unauthorized",
  admin: {
    root: "/admin",
    families: "/admin/families",
    members: "/admin/members",
    approvals: "/admin/approvals",
    contributions: "/admin/contributions",
    laws: "/admin/laws",
    announcements: "/admin/announcements",
    homepage: "/admin/homepage",
    reports: "/admin/reports",
    logs: "/admin/logs",
    settings: "/admin/settings",
  },
} as const;
