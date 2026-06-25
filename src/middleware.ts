import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * ROUTE PROTECTION
 * ----------------
 * NOTE ON NAMING: the master brief refers to this file as `proxy.ts`. Next.js +
 * Clerk's actual convention is `middleware.ts`, which is what the framework
 * loads, so we use that name. The behaviour is what the brief describes.
 *
 * Defense in depth (three layers):
 *   1. This middleware  — coarse gate: signed-out users can't reach app routes;
 *                         non-admins are bounced from /admin/* when their Clerk
 *                         role claim says so.
 *   2. Layout/page code — fine RBAC using the authoritative Convex `users.me`
 *                         (role + approval status) with redirects.
 *   3. Convex functions — every query/mutation re-checks via requireApproved /
 *                         requireAdmin, so data is safe even if UI is bypassed.
 *
 * Role lives in Convex (source of truth). If you mirror it into Clerk
 * publicMetadata.role (see ADMIN_MANUAL.md), this middleware can hard-block
 * /admin at the edge too; otherwise the layout-level guard handles it.
 */

const isPublicRoute = createRouteMatcher([
  "/",
  "/laws",
  "/announcements",
  "/unauthorized",
  "/pending-approval",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Not signed in → send to Clerk sign-in, returning here afterwards.
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Edge-level admin guard (only effective once role is mirrored into Clerk).
  if (isAdminRoute(req)) {
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
    if (role && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }
});

export const config = {
  // Run on everything except Next internals and static files; always on API.
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
