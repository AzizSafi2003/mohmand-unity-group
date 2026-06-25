"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Single place the UI reads the *authoritative* current user (role + approval
 * status from Convex, not Clerk). Returns coarse flags so components don't
 * re-derive them. `isLoading` is true until the first result arrives.
 *
 * NOTE: `@convex/_generated/*` is created by `npx convex dev`; before that runs
 * the import is unresolved — this is expected for a fresh clone.
 */
export function useCurrentUser() {
  const user = useQuery(api.users.me);
  return {
    user: user ?? null,
    isLoading: user === undefined,
    isSignedInRecord: !!user,
    isAdmin: user?.role === "admin",
    isApproved: user?.status === "approved",
    isPending: user?.status === "pending",
    isRejected: user?.status === "rejected",
  };
}
