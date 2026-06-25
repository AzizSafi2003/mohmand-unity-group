"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LoadingScreen } from "@/components/ui";
import { ROUTES } from "@/lib/constants";

/**
 * Page-level RBAC. These are the *second* of three enforcement layers
 * (middleware → guards → Convex functions). They never expose data on their
 * own; Convex still re-checks every request. Their job is good UX: route the
 * person to the right place instead of rendering a broken page.
 */

function useResolvedAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoading } = useCurrentUser();
  // Still resolving Clerk, or signed in but Convex user not yet loaded.
  const resolving = !isLoaded || (isSignedIn && isLoading);
  return { isLoaded, isSignedIn, user, resolving };
}

export function RequireApproved({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user, resolving } = useResolvedAuth();

  useEffect(() => {
    if (resolving) return;
    if (!isSignedIn) {
      router.replace(ROUTES.home);
    } else if (user && user.status !== "approved") {
      router.replace(ROUTES.pendingApproval);
    }
  }, [resolving, isSignedIn, user, router]);

  if (resolving || !isSignedIn || !user || user.status !== "approved") {
    return <LoadingScreen />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isSignedIn, user, resolving } = useResolvedAuth();

  useEffect(() => {
    if (resolving) return;
    if (!isSignedIn) {
      router.replace(ROUTES.home);
    } else if (user && user.role !== "admin") {
      router.replace(ROUTES.unauthorized);
    }
  }, [resolving, isSignedIn, user, router]);

  if (resolving || !isSignedIn || !user || user.role !== "admin") {
    return <LoadingScreen />;
  }
  return <>{children}</>;
}
