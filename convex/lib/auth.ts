import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Authorization helpers shared by all Convex queries/mutations.
 * ---------------------------------------------------------------------------
 * These centralise every access decision so business logic never re-implements
 * "is this person allowed?". Keeping them here is the single source of truth
 * for RBAC on the backend (the Next.js middleware enforces it again at the
 * edge; defence in depth).
 */

export class AuthError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do this") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Return the Clerk identity or throw if the request is anonymous. */
export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new AuthError();
  return identity;
}

/** Look up the application `users` row for the current Clerk identity. */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

/** Require an authenticated, *existing* application user. */
export async function requireUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new AuthError("No matching user record");
  return user;
}

/** Require an approved member or admin (i.e. allowed past the gate). */
export async function requireApproved(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.status !== "approved") {
    throw new ForbiddenError("Your account is awaiting administrator approval.");
  }
  return user;
}

/** Require an administrator. Throws ForbiddenError otherwise. */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new ForbiddenError();
  if (user.status !== "approved") throw new ForbiddenError();
  return user;
}

/** True if the user may read a given family's data. */
export function canReadFamily(
  user: Doc<"users">,
  familyId: Id<"families">,
  memberFamilyId?: Id<"families">
): boolean {
  if (user.role === "admin") return true;
  // Approved members can read their own family only.
  return user.status === "approved" && memberFamilyId === familyId;
}

/**
 * Write an entry to the activity log. Call from mutations after a change.
 * Never throws — logging must not break the underlying operation.
 */
export async function logActivity(
  ctx: MutationCtx,
  args: {
    user?: Doc<"users"> | null;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: unknown;
  }
): Promise<void> {
  try {
    await ctx.db.insert("activityLogs", {
      userId: args.user?._id,
      actorEmail: args.user?.email,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  } catch {
    // swallow — logging is best-effort
  }
}
